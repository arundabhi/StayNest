import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new Error("No file buffer provided"));
    }

    // ✅ Validate buffer is Buffer type
    if (!Buffer.isBuffer(buffer)) {
      return reject(new Error("Invalid buffer type"));
    }

    const uploadOptions = {
      folder: options.folder || "hotels",
      resource_type: options.resourceType || "image",
      transformation: options.transformation || [
        { quality: "auto" }, // ✅ Auto optimize
        { fetch_format: "auto" } // ✅ Auto format (WebP support)
      ],
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(new Error(`Upload failed: ${error.message}`));
        }
        
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// ✅ Add delete function
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};

export default uploadCloudinary;