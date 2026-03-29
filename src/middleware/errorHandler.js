/**
 * Async route handler wrapper - catches errors and passes them to Express error handler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Custom API Error class for structured error handling
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = "ApiError";
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = "Too many requests") {
    return new ApiError(429, message);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }

  static serviceUnavailable(message = "Service temporarily unavailable") {
    return new ApiError(503, message);
  }
}

/**
 * Global error handler middleware for Express
 */
export function errorHandler(err, req, res, _next) {
  // Log error details
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userId = req.user?.id || "anonymous";

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Log based on severity
  if (statusCode >= 500) {
    console.error(
      `[ERROR] ${timestamp} ${method} ${url} | User: ${userId} | Status: ${statusCode} | ${err.message}`
    );
    if (err.stack) {
      console.error(err.stack);
    }
  } else if (statusCode >= 400) {
    console.warn(
      `[WARN] ${timestamp} ${method} ${url} | User: ${userId} | Status: ${statusCode} | ${err.message}`
    );
  }

  // Build error response
  const errorResponse = {
    error: statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error",
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * Not found handler - catches unmatched routes
 */
export function notFoundHandler(req, res, next) {
  const error = ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
}

/**
 * Request validation middleware factory
 */
export function validateRequest(schema) {
  return (req, res, next) => {
    const errors = [];

    if (schema.body) {
      for (const field of schema.body) {
        if (field.required && (req.body[field.name] === undefined || req.body[field.name] === null || req.body[field.name] === "")) {
          errors.push(`${field.name} is required`);
        }
        if (field.type && req.body[field.name] !== undefined) {
          const actualType = typeof req.body[field.name];
          if (field.type === "number" && actualType !== "number") {
            errors.push(`${field.name} must be a number`);
          }
          if (field.type === "string" && actualType !== "string") {
            errors.push(`${field.name} must be a string`);
          }
        }
      }
    }

    if (errors.length > 0) {
      throw ApiError.badRequest("Validation failed", errors);
    }

    next();
  };
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 */
const rateLimitStore = new Map();

export function rateLimit({ windowMs = 60000, max = 100, message = "Too many requests" } = {}) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < windowStart) {
        rateLimitStore.delete(k);
      }
    }

    const entry = rateLimitStore.get(key);

    if (!entry) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (entry.resetTime < now) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    entry.count++;

    if (entry.count > max) {
      res.set("Retry-After", Math.ceil((entry.resetTime - now) / 1000));
      throw ApiError.tooManyRequests(message);
    }

    next();
  };
}

/**
 * Supabase error handler - translates Supabase errors to API errors
 */
export function handleSupabaseError(error, resourceName = "Resource") {
  if (!error) return;

  const message = error.message || "Database error";
  const code = error.code;

  // Unique constraint violation
  if (code === "23505") {
    throw ApiError.conflict(`${resourceName} already exists`);
  }

  // Foreign key violation
  if (code === "23503") {
    throw ApiError.badRequest(`Referenced ${resourceName.toLowerCase()} not found`);
  }

  // Not null violation
  if (code === "23502") {
    throw ApiError.badRequest(`Missing required field for ${resourceName.toLowerCase()}`);
  }

  // Row not found
  if (code === "PGRST116") {
    throw ApiError.notFound(`${resourceName} not found`);
  }

  // Generic database error
  console.error(`[DB] Supabase error for ${resourceName}:`, error);
  throw ApiError.internal(`Failed to process ${resourceName.toLowerCase()}`);
}

/**
 * Retry wrapper for database operations
 */
export async function withRetry(fn, maxRetries = 3, baseDelay = 500) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) or validation errors
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
