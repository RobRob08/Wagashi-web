"use client";
import {
  ShoppingBagIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCart } from "@/app/context/cartcontext";
import Image from "next/image";
import { Yuji_Boku } from "next/font/google";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const yuji = Yuji_Boku({
  weight: "400",
  subsets: ["latin"],
});

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const itemsPerPage = 5;

  // Total for selected items
  const total = cart
    .filter((item) => selectedItems.includes(Number(item.product_id)))
    .reduce((sum, item) => sum + item.product_price * item.quantity, 0);

  const totalQuantity = cart
    .filter((item) => selectedItems.includes(Number(item.product_id)))
    .reduce((sum, item) => sum + item.quantity, 0);

  // Pagination
  const totalPages = Math.ceil(cart.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = cart.slice(startIndex, endIndex);

  // Reset page or deselect removed items
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
    setSelectedItems((prev) =>
      prev.filter((id) => cart.some((item) => Number(item.product_id) === id))
    );
  }, [cart.length, currentPage, totalPages]);

  // Toggle selection for a single item
  const toggleItem = (id: number | string) => {
    const numId = Number(id);
    setSelectedItems((prev) =>
      prev.includes(numId) ? prev.filter((item) => item !== numId) : [...prev, numId]
    );
  };

  // Select / deselect all items on current page
  const toggleSelectAll = () => {
    const allSelected = currentItems.every((item) =>
      selectedItems.includes(Number(item.product_id))
    );
    if (allSelected) {
      setSelectedItems((prev) =>
        prev.filter((id) => !currentItems.some((item) => Number(item.product_id) === id))
      );
    } else {
      setSelectedItems((prev) => [
        ...new Set([...prev, ...currentItems.map((item) => Number(item.product_id))]),
      ]);
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (selectedItems.length === 0) return;

    // Save only selected items to localStorage
    const selectedCartItems = cart.filter(item =>
      selectedItems.includes(Number(item.product_id))
    );
    localStorage.setItem("checkout_items", JSON.stringify(selectedCartItems));

    // Close the modal first
    (document.getElementById("my_modal_3") as HTMLDialogElement)?.close();
    
    // Clear selected items
    setSelectedItems([]);
    
    // Then navigate to checkout page
    router.push("/checkout");
  };

  return (
    <>
      <div className="indicator">
        <button
          className="btn btn-ghost btn-circle btn-sm"
          onClick={() => {
            setCurrentPage(1);
            (document.getElementById("my_modal_3") as HTMLDialogElement)?.showModal();
          }}
          aria-label="Shopping cart"
        >
          <ShoppingBagIcon className="h-5 w-5" />
        </button>
        {cart.length > 0 && (
          <span className="badge badge-sm indicator-item bg-transparent border-0 text-primary font-bold">
            {cart.length}
          </span>
        )}
      </div>

      <dialog id="my_modal_3" className="modal">
        <div className="modal-box w-full max-w-5xl flex flex-col p-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-base-200 bg-base-100">
            <form method="dialog">
              <button 
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={() => setSelectedItems([])} // Clear selection when closing
              >
                ✕
              </button>
            </form>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-2xl flex items-center gap-2">
                <ShoppingBagIcon className="h-6 w-6" />
                Your Cart
                {cart.length > 0 && (
                  <span className="text-sm font-normal text-base-content/60">
                    ({cart.length} {cart.length === 1 ? "item" : "items"})
                  </span>
                )}
              </h3>
              {cart.length > 0 && (
                <button
                  className="btn btn-sm btn-ghost text-error hover:bg-error/10"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear your cart?")) {
                      clearCart();
                      setSelectedItems([]);
                    }
                  }}
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-6 py-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBagIcon className="h-24 w-24 mx-auto text-base-300 mb-4" />
                <p className="text-xl font-medium text-base-content/60 mb-2">
                  Your cart is empty
                </p>
                <p className="text-sm text-base-content/40 mb-6">
                  Add some delicious wagashi to get started!
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    (document.getElementById("my_modal_3") as HTMLDialogElement).close();
                    setSelectedItems([]);
                  }}
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div>
                {/* Select All Checkbox */}
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary mr-2"
                    checked={currentItems.every((item) =>
                      selectedItems.includes(Number(item.product_id))
                    )}
                    onChange={toggleSelectAll}
                  />
                  <span>Select All on this page</span>
                </div>

                {/* Product List */}
                <div className="space-y-3 min-h-[400px]">
                  {currentItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="grid grid-cols-[auto_2fr_1fr] items-center gap-4 p-2 rounded-lg hover:bg-base-200/50 transition-colors"
                    >
                      {/* Checkbox */}
                      <div>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={selectedItems.includes(Number(item.product_id))}
                          onChange={() => toggleItem(item.product_id)}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex items-center gap-3">
                        {item.product_img && (
                          <Image
                            src={`/prod/${item.product_img}`}
                            alt={item.product_name}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h2 className="text-lg font-medium">
                            {item.product_name}
                            <span className={`${yuji.className} block text-sm opacity-70`}>
                              {item.product_jp}
                            </span>
                          </h2>
                          <p className="text-xl font-bold mt-1">₱{item.product_price}</p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-end gap-3">
                        <div className="join">
                          <button
                            className="btn btn-xs join-item hover:btn-primary"
                            onClick={() =>
                              updateQuantity(Number(item.product_id), item.quantity - 1)
                            }
                          >
                            -
                          </button>
                          <span className="btn btn-xs join-item no-animation pointer-events-none">
                            {item.quantity}
                          </span>
                          <button
                            className="btn btn-xs join-item hover:btn-primary"
                            onClick={() =>
                              updateQuantity(Number(item.product_id), item.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="btn btn-ghost btn-xs btn-square text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeFromCart(Number(item.product_id))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center gap-3 mt-6 pt-4 border-t border-base-200">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        className="btn btn-sm btn-circle hover:btn-primary"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <div className="flex gap-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNum = index + 1;
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            Math.abs(pageNum - currentPage) <= 1
                          ) {
                            return (
                              <button
                                key={pageNum}
                                className={`btn btn-sm min-w-[2.5rem] ${
                                  currentPage === pageNum
                                    ? "btn-primary"
                                    : "btn-ghost hover:btn-primary"
                                }`}
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (
                            pageNum === currentPage - 2 ||
                            pageNum === currentPage + 2
                          ) {
                            return (
                              <span
                                key={pageNum}
                                className="px-2 flex items-center text-base-content/40"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>

                      <button
                        className="btn btn-sm btn-circle hover:btn-primary"
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="text-center text-sm text-base-content/60">
                      Showing {startIndex + 1}-{Math.min(endIndex, cart.length)} of{" "}
                      {cart.length} items
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="px-6 py-5 border-t-2 border-base-200 bg-base-100 shadow-lg">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-base-200">
                <div>
                  <p className="font-bold text-lg">Total Quantity</p>
                  <p className="text-sm text-base-content/60">
                    {totalQuantity} item{totalQuantity !== 1 && "s"}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-lg">Total Price</p>
                  <p className="text-xl font-bold">₱{total}</p>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                className="btn btn-primary w-full"
                disabled={selectedItems.length === 0}
                onClick={handleCheckout}
              >
                Checkout Selected Items ({selectedItems.length})
              </button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}