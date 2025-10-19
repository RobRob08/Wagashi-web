"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Yuji_Boku } from "next/font/google";
import {
  ShoppingBag,
  Calendar,
  CreditCard,
  Package,
  ChevronRight,
  Receipt,
} from "lucide-react";

const yuji = Yuji_Boku({
  weight: "400",
  subsets: ["latin"],
});

interface OrderItem {
  product_id: number;
  product_name: string;
  product_jp: string;
  product_price: number;
  product_img: string | null;
  quantity: number;
}

interface Order {
  orderNumber: string;
  date: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

export default function OrdersHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load orders from localStorage
    const loadOrders = () => {
      try {
        const ordersData = localStorage.getItem("orderHistory");
        if (ordersData) {
          const parsedOrders = JSON.parse(ordersData);
          // Sort by date (newest first)
          const sortedOrders = parsedOrders.sort(
            (a: Order, b: Order) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setOrders(sortedOrders);
        }
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4 text-base-content/60">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="h-32 w-32 mx-auto text-base-300 mb-6" />
        <h2 className="text-3xl font-bold mb-4">No Orders Yet</h2>
        <p className="text-base-content/60 mb-8">
          Start shopping to see your order history here!
        </p>
        <Link href="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Order History</h1>
        <p className="text-base-content/60">
          View and track all your orders in one place
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.orderNumber}
            className="card bg-base-100 shadow-lg border border-base-200 hover:shadow-xl transition-shadow"
          >
            <div className="card-body">
              {/* Order Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-base-200">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      Order #{order.orderNumber}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-base-content/60">
                      <Calendar className="h-4 w-4" />
                      {order.date}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2">
                  <div className="badge badge-primary badge-lg">
                    ₱{order.total.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4" />
                    <span className="capitalize">{order.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="py-4">
                <h4 className="font-semibold mb-3">Items Ordered</h4>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center gap-4 p-3 bg-base-200/50 rounded-lg"
                    >
                      {item.product_img && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={`/prod/${item.product_img}`}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {item.product_name}
                        </p>
                        <p
                          className={`${yuji.className} text-xs text-base-content/60`}
                        >
                          {item.product_jp}
                        </p>
                        <p className="text-sm text-base-content/60">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">
                          ₱{(item.product_price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-base-content/60">
                          ₱{item.product_price.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="pt-4 border-t border-base-200">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-base-content/60">Subtotal:</span>
                  <span>₱{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-base-content/60">Shipping:</span>
                  <span>
                    {order.shipping === 0
                      ? "FREE"
                      : `₱${order.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg pt-2 border-t border-base-200">
                  <span>Total:</span>
                  <span className="text-primary">
                    ₱{order.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* View Receipt Button */}
              <div className="pt-4 border-t border-base-200 mt-2">
                <button
                  onClick={() => {
                    // Save this order as the last order and navigate to receipt
                    localStorage.setItem("lastOrder", JSON.stringify(order));
                    window.location.href = "/checkout/success";
                  }}
                  className="btn btn-outline btn-sm gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  View Receipt
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
