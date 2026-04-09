import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "djmeupzot",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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
            { quality: "auto:good" },
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
      { quality: "auto:good" },
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
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
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
    ...options,
  });
}

export { cloudinary };
