"use client";

import Image from "next/image";
import { X, ShoppingBag, Check } from "lucide-react";
import { Yuji_Boku } from "next/font/google";
import { useCart } from "@/app/context/cartcontext";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

const yuji = Yuji_Boku({
  weight: "400",
  subsets: ["latin"],
});

type Product = {
  product_id: number;
  product_name: string;
  product_price: number;
  product_img: string | null;
  product_desc: string | null;
  product_category: string | null;
  product_subcategory: string | null;
  product_jp: string;
};

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailsModal({
  product,
  isOpen,
  onClose,
}: ProductDetailsModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Reset quantity when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setIsAdded(false);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        product_id: product.product_id,
        product_name: product.product_name,
        product_price: product.product_price,
        product_img: product.product_img,
        product_jp: product.product_jp,
      });
    }
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <dialog
      id="product_details_modal"
      className={`modal ${isOpen ? "modal-open" : ""}`}
    >
      <div className="modal-box max-w-4xl p-0 overflow-hidden">
        {/* Close Button */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 z-10 bg-base-100/80 hover:bg-base-100"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-0 relative">
          {/* Product Image */}
          <div className="relative h-[400px] md:h-[600px] bg-base-200">
            {product.product_img && (
              <Image
                src={`/prod/${product.product_img}`}
                alt={product.product_name}
                fill
                className="object-cover"
                priority
              />
            )}
          </div>

          {/* Product Details */}
          <div className="p-8 flex flex-col">
            {/* Category Badge */}
            {product.product_category && (
              <div className="badge badge-primary badge-outline mb-4">
                {product.product_category}
              </div>
            )}

            {/* Product Name */}
            <h1 className="text-3xl font-bold mb-2">{product.product_name}</h1>
            <p
              className={`${yuji.className} text-xl text-base-content/60 mb-6`}
            >
              {product.product_jp}
            </p>

            {/* Price */}
            <div className="mb-6">
              <span className="text-4xl font-bold text-primary">
                ₱{product.product_price}
              </span>
              <span className="text-sm text-base-content/60 ml-2">
                per piece
              </span>
            </div>

            {/* Description */}
            <div className="mb-6 flex-1">
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-base-content/80 leading-relaxed">
                {product.product_desc ||
                  "A delicious traditional Japanese confection."}
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Quantity</label>
              <div className="join shadow-sm">
                <button
                  className="btn btn-md join-item hover:btn-primary"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span className="btn btn-md join-item no-animation pointer-events-none min-w-[4rem] font-semibold">
                  {quantity}
                </span>
                <button
                  className="btn btn-md join-item hover:btn-primary"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Total Price */}
            <div className="mb-6 p-4 bg-base-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-base-content/60">Subtotal</span>
                <span className="text-2xl font-bold text-primary">
                  ₱{(product.product_price * quantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <motion.button
              className={`btn btn-lg w-full ${
                isAdded ? "btn-success" : "btn-primary"
              } transition-colors shadow-lg`}
              onClick={handleAddToCart}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
            >
              {isAdded ? (
                <>
                  <Check className="w-6 h-6" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-6 h-6" />
                  Add {quantity} to Cart
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
