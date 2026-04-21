import { useState } from "react";

const ImageWithSkeleton = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-64 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
      {/* Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}

      {/* Image */}
      {!error && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(true);
            setError(true);
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Fallback icon (Remix Icon) */}
      {error && (
        <i className="ri-image-line text-gray-400 text-4xl"></i>
      )}
    </div>
  );
};

export default ImageWithSkeleton;
