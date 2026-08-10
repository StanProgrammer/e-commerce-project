import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

const UploadImage = ({
  label,
  setImage,
  error,
  resetTrigger,
  existingImages = [], 
  onRemoveExisting, 
}) => {
  
  const [newPreviews, setNewPreviews] = useState([]);
  const fileInputRef = useRef(null);
  // Keep the latest preview list in a ref so effects that revoke blob URLs
  // (reset / unmount) do not need to re-run whenever preview changes.
  const newPreviewsRef = useRef(newPreviews);

  useEffect(() => {
    newPreviewsRef.current = newPreviews;
  }, [newPreviews]);

  const MAX_SIZE = 10 * 1024 * 1024;
  const MAX_FILES = 5;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  // Display order: existing images first, then newly added previews.
  const displayedImages = [...existingImages, ...newPreviews];

  // Reset from parent
  useEffect(() => {
    if (resetTrigger) {
      newPreviewsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      newPreviewsRef.current = [];

      setNewPreviews([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [resetTrigger]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      newPreviewsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (displayedImages.length + files.length > MAX_FILES) {
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

    setNewPreviews((prev) => [...prev, ...previewUrls]);
    setImage((prev) => [...prev, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index) => {
    // The index is into the combined preview (existing + new). Existing
    // images live at the front of the list; report those removals to the
    // parent so they are not re-submitted.
    if (index < existingImages.length) {
      onRemoveExisting?.(existingImages[index]);
      return;
    }

    const newIndex = index - existingImages.length;

    setNewPreviews((prev) => {
      const updated = [...prev];
      if (updated[newIndex]?.startsWith("blob:")) {
        URL.revokeObjectURL(updated[newIndex]);
      }
      updated.splice(newIndex, 1);
      return updated;
    });

    // Only removes newly added images (safe) — same index space as newPreviews.
    setImage((prev) => prev.filter((_, i) => i !== newIndex));

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

      {/* Preview (existing images + new uploads) */}
      {displayedImages.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-4">
          {displayedImages.map((img, index) => (
            <div key={img} className="relative w-fit">
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
      {displayedImages.length < MAX_FILES && (
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
