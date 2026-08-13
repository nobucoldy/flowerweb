import React from 'react'
import { Plus } from 'lucide-react'
import { useCartStore } from '../store/useCartStore'
import type { Product } from '../store/useCartStore'

interface ProductCardProps {
  product: Product
  onImageClick: (imageUrl: string) => void
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onImageClick }) => {
  const addToCart = useCartStore((state) => state.addToCart)

  return (
    <div className="group flex flex-col bg-white overflow-hidden rounded-md border border-stone-100/80 transition-all duration-300 hover:shadow-xs hover:border-stone-200">
      {/* Container Ảnh sản phẩm */}
      <div 
        className="relative aspect-[3/4] overflow-hidden bg-stone-50 cursor-zoom-in"
        onClick={() => onImageClick(product.image_url)}
      >
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover select-none transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {/* Hiệu ứng làm mờ nhẹ ảnh khi hover */}
        <div className="absolute inset-0 bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Thông tin chi tiết */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-serif text-base font-medium text-stone-950 line-clamp-1 mb-1 tracking-wide">
          {product.name}
        </h3>
        
        <p className="text-stone-500 text-sm font-medium mb-4">
          {product.price.toLocaleString('vi-VN')}đ
        </p>

        {/* Nút thêm vào giỏ hàng */}
        <button
          onClick={() => addToCart(product)}
          className="mt-auto w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-stone-950 hover:bg-stone-800 text-stone-50 rounded-sm text-xs font-semibold tracking-wider uppercase transition-colors duration-200 cursor-pointer"
        >
          <Plus size={14} />
          Thêm vào giỏ
        </button>
      </div>
    </div>
  )
}
