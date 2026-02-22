import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ImagePreviewOverlayProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function ImagePreviewOverlay({ imageUrl, onClose }: ImagePreviewOverlayProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (imageUrl) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [imageUrl, onClose]);

  if (!imageUrl || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out"
      onClick={onClose}
    >
      <img
        src={imageUrl}
        alt="Preview"
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer transition-colors"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>
    </div>,
    document.body
  );
}
