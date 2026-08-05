import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

const UploadImage = ({
  label,
  setImage,
  error,
  resetTrigger,
  existingImages = [], // NEW
}) => {
  const [preview, setPreview] = useState([]);
  const fileInputRef = useRef(null);
  // Keep the latest preview list in a ref so effects that revoke blob URLs
  // (reset / unmount) do not need to re-run whenever preview changes.
  const previewRef = useRef(preview);

  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  const MAX_SIZE = 10 * 1024 * 1024;
  const MAX_FILES = 5;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  // Load existing images into preview
  useEffect(() => {
    if (existingImages.length > 0) {
      setPreview(existingImages); // URLs from backend
    }
  }, [existingImages]);

  // Reset from parent
  useEffect(() => {
    if (resetTrigger) {
      previewRef.current.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
      previewRef.current = [];

      setPreview([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [resetTrigger]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      previewRef.current.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (preview.length + files.length > MAX_FILES) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const validFiles = [];
    const previewUrls = [];

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image`);
        return;
      }

      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return;
      }

      validFiles.push(file);
      previewUrls.push(URL.createObjectURL(file));
    });

    if (!validFiles.length) return;

    setPreview((prev) => [...prev, ...previewUrls]);
    setImage((prev) => [...prev, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index) => {
    setPreview((prev) => {
      const updated = [...prev];

      // Only revoke blob URLs
      if (updated[index].startsWith("blob:")) {
        URL.revokeObjectURL(updated[index]);
      }

      updated.splice(index, 1);
      return updated;
    });

    // Only removes newly added images (safe)
    setImage((prev) => prev.filter((_, i) => i !== index));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Hidden Input */}
      <input
        type="file"
        id="fileUpload"
        multiple
        accept="image/png, image/jpeg, image/webp"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 🔥 Preview FIRST */}
      {preview.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-4">
          {preview.map((img, index) => (
            <div key={index} className="relative w-fit">
              <img
                src={img}
                alt="preview"
                className="w-32 h-32 object-cover rounded-lg shadow"
              />

              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Box */}
      {preview.length < MAX_FILES && (
        <label
          htmlFor="fileUpload"
          className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
        >
          <span className="text-gray-600">
            Click to upload or drag & drop
          </span>
          <span className="text-xs text-gray-400 mt-1">
            PNG, JPG up to 10MB each (max 5 images)
          </span>
        </label>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default UploadImage;