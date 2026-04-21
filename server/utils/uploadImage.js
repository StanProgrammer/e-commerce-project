const cloudinary = require("cloudinary").v2;

// Validate env variables early
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error("Missing Cloudinary environment variables");
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Default upload options
const DEFAULT_OPTIONS = {
  overwrite: true,
  resource_type: "auto",
  invalidate: true,
  folder: "uploads", // optional but recommended
};

/**
 * Upload image to Cloudinary
 * @param {string} file - local path, base64, or URL
 * @param {object} customOptions - optional overrides
 * @returns {Promise<string>} secure_url
 */
const uploadToCloudinary = async (file, customOptions = {}) => {
  try {
    // Input validation
    if (!file) {
      throw new Error("No file provided for upload");
    }

    const options = { ...DEFAULT_OPTIONS, ...customOptions };

    const result = await cloudinary.uploader.upload(file, options);

    if (!result?.secure_url) {
      throw new Error("Upload failed: No secure URL returned");
    }

    return result.secure_url;
  } catch (error) {
    // Better logging (can replace with Winston later)
    console.error("Cloudinary Upload Error:", error.message);

    // Normalize error
    throw new Error(
      error?.message || "Something went wrong while uploading to Cloudinary"
    );
  }
};

module.exports = uploadToCloudinary;