import { create } from 'zustand'

export interface Product {
  id: string
  name: string
  price: number
  image_url: string
}

export interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartState>((set, get) => {
  const getInitialCart = (): CartItem[] => {
    try {
      const saved = localStorage.getItem('que_anh_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  }

  const saveCart = (items: CartItem[]) => {
    try {
      localStorage.setItem('que_anh_cart', JSON.stringify(items))
    } catch (e) {
      console.error('Failed to save cart to localStorage', e)
    }
  }

  return {
    items: getInitialCart(),
    isOpen: false,
    setIsOpen: (isOpen) => set({ isOpen }),
    addToCart: (product) => {
      const currentItems = get().items
      const existing = currentItems.find((item) => item.product.id === product.id)
      let newItems: CartItem[] = []

      if (existing) {
        newItems = currentItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        newItems = [...currentItems, { product, quantity: 1 }]
      }

      set({ items: newItems })
      saveCart(newItems)
    },
    removeFromCart: (productId) => {
      const newItems = get().items.filter((item) => item.product.id !== productId)
      set({ items: newItems })
      saveCart(newItems)
    },
    updateQuantity: (productId, quantity) => {
      if (quantity <= 0) {
        get().removeFromCart(productId)
        return
      }
      const newItems = get().items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
      set({ items: newItems })
      saveCart(newItems)
    },
    clearCart: () => {
      set({ items: [] })
      saveCart([])
    },
    getTotalPrice: () => {
      return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0)
    },
    getTotalItems: () => {
      return get().items.reduce((total, item) => total + item.quantity, 0)
    }
  }
})
