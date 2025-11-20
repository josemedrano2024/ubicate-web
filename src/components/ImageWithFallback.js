import React from "react";

const ImageWithFallback = ({ src, fallbackSrc, alt, className, ...props }) => {
  const handleError = (e) => {
    if (fallbackSrc) {
      e.target.src = fallbackSrc;
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
};

export default ImageWithFallback;
