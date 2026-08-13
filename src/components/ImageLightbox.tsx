import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ImageLightboxProps {
  imageUrl: string | null
  onClose: () => void
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    if (!imageUrl) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Khóa cuộn trang khi mở lightbox
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [imageUrl, onClose])

  if (!imageUrl) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <button 
        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
        onClick={onClose}
        aria-label="Đóng"
      >
        <X size={24} />
      </button>
      
      <div 
        className="max-w-[90vw] max-h-[85vh] overflow-hidden rounded-lg shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt="Product Zoom" 
          className="max-w-full max-h-[85vh] object-contain select-none"
        />
      </div>
    </div>
  )
}
