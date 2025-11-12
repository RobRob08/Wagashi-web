"use client";

import Image from "next/image";
import { useWishlist, WishlistItem } from "@/app/context/wishlistcontext";
import { useCart } from "@/app/context/cartcontext";
import { Yuji_Boku } from "next/font/google";
import { Trash2, ShoppingBag, Heart } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";

const yuji = Yuji_Boku({
  weight: "400",
  subsets: ["latin"],
});

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState<Set<number>>(new Set());

  const handleAddToCart = (item: WishlistItem) => {
    addToCart({
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price,
      product_img: item.product_img,
      product_jp: item.product_jp,
    });

    setAddedToCart((prev) => new Set(prev).add(item.product_id));
    setTimeout(() => {
      setAddedToCart((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.product_id);
        return newSet;
      });
    }, 2000);
  };

  const handleMoveToCart = (item: WishlistItem) => {
    handleAddToCart(item);
    removeFromWishlist(item.product_id);
  };

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-base-100 py-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            My Wishlist
          </h1>
          <p className="text-base-content/60">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} in your wishlist
          </p>
        </div>

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-24 h-24 mx-auto mb-6 text-base-content/20" />
            <h2 className="text-3xl font-bold mb-4">Your wishlist is empty</h2>
            <p className="text-base-content/60 mb-8">
              Add items you love to your wishlist and they will show up here
            </p>
            <Link href="/products">
              <button className="btn btn-primary">
                Browse Products
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <motion.div
                key={item.product_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <figure className="relative w-full h-64 overflow-hidden">
                  <Image
                    src={`/prod/${item.product_img}`}
                    alt={item.product_name}
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-300"
                  />
                  {/* Remove from Wishlist Button */}
                  <motion.button
                    className="absolute top-3 right-3 btn btn-circle btn-sm bg-red-500 hover:bg-red-600 border-none text-white"
                    onClick={() => removeFromWishlist(item.product_id)}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </figure>

                <div className="card-body">
                  <h2 className="card-title text-lg">
                    {item.product_name}
                    <p className={`${yuji.className} text-sm font-normal`}>
                      {item.product_jp}
                    </p>
                  </h2>

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-2xl font-bold text-primary">
                      ₱{item.product_price}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  
                  <div className="card-actions justify-between mt-4 gap-2">
                    <div className="flex grid grid-rows-2 justify-between my-2 gap-2 justify-center items-center">
                    <motion.button
                      className={`btn flex-1 ${
                        addedToCart.has(item.product_id)
                          ? "btn-success"
                          : "btn-primary"
                      }`}
                      onClick={() => handleAddToCart(item)}
                      whileTap={{ scale: 0.95 }}
                      disabled={addedToCart.has(item.product_id)}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {addedToCart.has(item.product_id) ? "Added!" : "Add to Cart"}
                    </motion.button>

                    <motion.button
                      className="btn btn-outline btn-error flex-1"
                      onClick={() => handleMoveToCart(item)}
                      whileTap={{ scale: 0.95 }}
                    >
                      Move to Cart
                    </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Wishlist Actions */}
        {wishlist.length > 0 && (
          <div className="mt-12 flex justify-center gap-4">
            <Link href="/products">
              <button className="btn btn-outline">
                Continue Shopping
              </button>
            </Link>
            <button
              className="btn btn-primary"
              onClick={() => {
                wishlist.forEach((item) => handleAddToCart(item));
              }}
            >
              <ShoppingBag className="w-5 h-5" />
              Add All to Cart
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
