
"use client";// wishlistContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Notification Type
export type NotificationType = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  productName?: string;
  productImage?: string;
};

// Wishlist Item Type
export interface WishlistItem {
  product_id: number;
  product_name: string;
  product_price: number;
  product_img: string | null;
  product_jp: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (itemId: number) => void;
  isInWishlist: (itemId: number) => boolean;
  notifications: NotificationType[];
  addNotification: (notification: Omit<NotificationType, "id">) => void;
  removeNotification: (id: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Custom hook for using wishlist
export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

// Wishlist provider component
export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  useEffect(() => {
    // Load wishlist from localStorage if available
    const storedWishlist = localStorage.getItem('wishlist');
    if (storedWishlist) {
      try {
        setWishlist(JSON.parse(storedWishlist));
      } catch {
        localStorage.removeItem('wishlist');
      }
    }
  }, []);

  useEffect(() => {
    // Sync wishlist to localStorage when it changes
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addNotification = (notification: Omit<NotificationType, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications((prev) => [...prev, { ...notification, id }]);
    setTimeout(() => removeNotification(id), 4000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const isInWishlist = (itemId: number): boolean => {
    return wishlist.some((item) => item.product_id === itemId);
  };

  const addToWishlist = (item: WishlistItem) => {
    setWishlist((prev) => {
      // Check if the item already exists in the wishlist
      const exists = prev.find((wishlistItem) => wishlistItem.product_id === item.product_id);
      if (!exists) {
        // Add item to wishlist if not already present
        addNotification({
          type: 'success',
          message: `Added to wishlist`,
          productName: item.product_name,
          productImage: item.product_img || undefined,
        });
        return [...prev, item];
      }
      // Item already exists
      addNotification({
        type: 'info',
        message: `Already in wishlist`,
        productName: item.product_name,
        productImage: item.product_img || undefined,
      });
      return prev;
    });
  };

  const removeFromWishlist = (itemId: number) => {
    const item = wishlist.find((item) => item.product_id === itemId);
    setWishlist((prev) => prev.filter((item) => item.product_id !== itemId));

    if (item) {
      addNotification({
        type: 'error',
        message: `Removed from wishlist`,
        productName: item.product_name,
        productImage: item.product_img || undefined,
      });
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        notifications,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};