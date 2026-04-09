import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "djmeupzot",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function getOptimizedUrl(publicId, options = {}) {
  const defaults = {
    fetch_format: "auto",
    quality: "auto",
  };
  return cloudinary.url(publicId, { ...defaults, ...options });
}

export function getResponsiveUrls(publicId) {
  return {
    thumbnail: cloudinary.url(publicId, {
      width: 200,
      height: 200,
      crop: "fill",
      fetch_format: "auto",
      quality: "auto",
    }),
    small: cloudinary.url(publicId, {
      width: 400,
      crop: "limit",
      fetch_format: "auto",
      quality: "auto",
    }),
    medium: cloudinary.url(publicId, {
      width: 800,
      crop: "limit",
      fetch_format: "auto",
      quality: "auto",
    }),
    large: cloudinary.url(publicId, {
      width: 1400,
      crop: "limit",
      fetch_format: "auto",
      quality: "auto",
    }),
    original: cloudinary.url(publicId, {
      fetch_format: "auto",
      quality: "auto",
    }),
  };
}

export function getVideoUrl(publicId, options = {}) {
  const defaults = {
    fetch_format: "auto",
    quality: "auto",
  };
  return cloudinary.url(publicId, { resource_type: "video", ...defaults, ...options });
}

export function getVideoStreamingUrl(publicId) {
  return cloudinary.url(publicId, {
    resource_type: "video",
    fetch_format: "auto",
    streaming_attachment: "inline",
  });
}

export async function uploadImage(buffer, folder = "products", options = {}) {
  return new Promise((resolve, reject) => {
    const filename = `${folder}/${crypto.randomUUID()}.jpg`;
    
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "auto",
          public_id: filename.split("/").pop().replace(".jpg", ""),
          transformation: [
            { width: 1400, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
          ...options,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              responsiveUrls: getResponsiveUrls(result.public_id),
            });
          }
        }
      )
      .end(buffer);
  });
}

export async function uploadGalleryImage(buffer, folder = "products/gallery") {
  return uploadImage(buffer, folder, {
    transformation: [
      { width: 1400, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  });
}

export async function uploadVideo(buffer, folder = "products/videos") {
  return new Promise((resolve, reject) => {
    const publicId = `${folder}/${crypto.randomUUID()}`;
    
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "video",
          public_id: publicId.split("/").pop(),
          chunk_size: 6000000,
          eager: [
            { quality: "auto", fetch_format: "mp4" },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: getVideoStreamingUrl(result.public_id),
              publicId: result.public_id,
              thumbnail: cloudinary.url(result.public_id, {
                resource_type: "video",
                width: 400,
                height: 300,
                crop: "fill",
                format: "jpg",
              }),
            });
          }
        }
      )
      .end(buffer);
  });
}

export async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

export async function getImageUrl(publicId, options = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: "auto",
    quality: "auto",
    ...options,
  });
}

export { cloudinary };
