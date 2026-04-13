"use client";

import React, { useState, useEffect } from "react";

interface ProfileImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  src,
  alt,
  className = "w-full h-full object-cover",
}) => {
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(() => {
    if (!src) return null;
    return src.replace(/^assets\/\d{4}\/photos\//, '/candidate/2026/photos/');
  });

  useEffect(() => {
    let normalizedSrc = src || null;
    if (normalizedSrc) {
      normalizedSrc = normalizedSrc.replace(/^assets\/\d{4}\/photos\//, '/candidate/2026/photos');
    }
    setImgSrc(normalizedSrc);
    setHasError(false);
  }, [src]);

  const getInitials = (name: string) => {
    const parts = name.split(/[\s.]+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (!imgSrc || hasError) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter ${className}`}>
        {getInitials(alt)}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
};

export default ProfileImage;
