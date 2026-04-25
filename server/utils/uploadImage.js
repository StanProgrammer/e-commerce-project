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

const uploadToCloudinaryResult = async (file, customOptions = {}) => {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  const options = { ...DEFAULT_OPTIONS, ...customOptions };
  const result = await cloudinary.uploader.upload(file, options);

  if (!result?.secure_url || !result?.public_id) {
    throw new Error("Upload failed: Cloudinary did not return image details");
  }

  return result;
};

const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return "";
  }

  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) {
    return "";
  }

  const path = url.slice(uploadIndex + "/upload/".length);
  const pathWithoutVersion = path.replace(/^v\d+\//, "");
  const pathWithoutQuery = pathWithoutVersion.split("?")[0];
  const publicId = pathWithoutQuery.replace(/\.[^/.]+$/, "");

  return decodeURIComponent(publicId);
};

const deleteFromCloudinary = async (urlOrPublicId) => {
  if (typeof urlOrPublicId === "string" && /^https?:\/\//.test(urlOrPublicId)) {
    const publicIdFromUrl = getPublicIdFromUrl(urlOrPublicId);

    if (!publicIdFromUrl) {
      return null;
    }

    return cloudinary.uploader.destroy(publicIdFromUrl, { invalidate: true });
  }

  const publicId = getPublicIdFromUrl(urlOrPublicId) || urlOrPublicId;

  if (!publicId) {
    return null;
  }

  return cloudinary.uploader.destroy(publicId, { invalidate: true });
};

uploadToCloudinary.uploadResult = uploadToCloudinaryResult;
uploadToCloudinary.delete = deleteFromCloudinary;
uploadToCloudinary.getPublicIdFromUrl = getPublicIdFromUrl;

module.exports = uploadToCloudinary;
