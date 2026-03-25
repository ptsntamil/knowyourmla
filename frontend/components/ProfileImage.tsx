"use client";

import React, { useState } from "react";

interface ProfileImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  src,
  alt,
  className = "w-full h-full object-cover",
  fallbackSrc = "/profile_pic.png"
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

export default ProfileImage;
