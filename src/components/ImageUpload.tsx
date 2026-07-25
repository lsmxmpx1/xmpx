"use client";

import { useState, useRef, useCallback, useMemo } from "react";

interface ImageUploadProps {
  // Single mode: value is a string URL, multiple mode: value is comma-separated URLs
  value: string;
  onChange: (value: string) => void;
  multiple?: boolean;
  maxImages?: number;
  label?: string;
  aspectRatio?: "square" | "video" | "wide";
  disabled?: boolean;
}

const ASPECT_CLASSES: Record<string, string> = {
  square: "aspect-square",
  video: "aspect-video",
  wide: "aspect-[3/1]",
};

export default function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxImages = 6,
  label = "上传图片",
  aspectRatio = "square",
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const images = useMemo(() => (value ? value.split(",").filter(Boolean) : []), [value]);

  const handleFiles = useCallback(async (files: FileList) => {
    setError("");
    const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));

    if (fileArr.length === 0) {
      setError("请选择图片文件");
      return;
    }

    // Check max images
    if (multiple && images.length + fileArr.length > maxImages) {
      setError(`最多上传 ${maxImages} 张图片`);
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of fileArr) {
        // Check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} 超过 5MB 限制`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.url) uploadedUrls.push(data.url);
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "上传失败");
        }
      }

      if (uploadedUrls.length > 0) {
        if (multiple) {
          const newImages = [...images, ...uploadedUrls];
          onChange(newImages.join(","));
        } else {
          onChange(uploadedUrls[0]);
        }
      }
    } catch {
      setError("网络错误，上传失败");
    }
    setUploading(false);
  }, [images, multiple, maxImages, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    // Reset input value so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    if (multiple) {
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages.join(","));
    } else {
      onChange("");
    }
  };

  const showUploadButton = multiple ? images.length < maxImages : images.length === 0;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm mb-2">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {/* Preview existing images */}
        {images.map((img, index) => (
          <div
            key={index}
            className={`relative ${ASPECT_CLASSES[aspectRatio]} w-24 rounded-xl overflow-hidden border group`}
          >
            <img src={img} alt={`图片 ${index + 1}`} className="w-full h-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-500 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {/* Upload zone */}
        {showUploadButton && !disabled && (
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`${ASPECT_CLASSES[aspectRatio]} w-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragOver ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
            }`}
          >
            {uploading ? (
              <span className="text-xs text-gray-400">上传中...</span>
            ) : (
              <>
                <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-xs text-gray-400">点击上传</span>
              </>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />
      {multiple && (
        <p className="text-xs text-gray-400 mt-1">
          最多 {maxImages} 张，每张不超过 5MB，支持 JPG/PNG/WebP/GIF
        </p>
      )}
      {!multiple && (
        <p className="text-xs text-gray-400 mt-1">
          建议尺寸 600×400，不超过 5MB，支持 JPG/PNG/WebP
        </p>
      )}
    </div>
  );
}
