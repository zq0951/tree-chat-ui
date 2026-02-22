import React from 'react';
import { X } from 'lucide-react';

interface ImageGalleryProps {
  imageUrls: string[];
  onRemove: (index: number) => void;
  onPreview: (url: string) => void;
}

export function ImageGallery({ imageUrls, onRemove, onPreview }: ImageGalleryProps) {
  if (!imageUrls || imageUrls.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 shrink-0">
      {imageUrls.map((url, index) => (
        <div key={index} className="relative group/image rounded-lg overflow-hidden border border-white/10 shadow-sm bg-black/40 backdrop-blur-sm self-start">
          <img
            src={url}
            alt={`Uploaded ${index + 1}`}
            className="object-cover w-20 h-20 cursor-zoom-in transition-transform hover:scale-105"
            onClick={() => onPreview(url)}
          />
          <button
            onClick={() => onRemove(index)}
            className="absolute top-1 right-1 p-1 bg-black/60 backdrop-blur-md rounded-md opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-red-500/80 z-20 cursor-pointer"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
}
