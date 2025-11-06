"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle,
  Calendar,
  CreditCard,
  MapPin,
  Mail,
  Printer,
  Download,
  User,
} from "lucide-react";
import { Yuji_Boku } from "next/font/google";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/navbar";

const supabase = createClient();

const yuji = Yuji_Boku({
  weight: "400",
  subsets: ["latin"],
});

interface OrderItem {
  id: string;
  product_id: number;
  product_name: string;
  product_jp: string;
  product_price: number;
  product_img: string | null;
  quantity: number;
}

interface OrderData {
  id: string;
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

function OrderReceiptContent() {
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (!orderNumber && !user) {
          // Try fallback
          const stored = localStorage.getItem("lastOrder");
          if (stored) setOrderData(JSON.parse(stored));
          return;
        }

        // Fetch order owned by this user
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("order_number", orderNumber)
          .eq("user_id", user?.id)
          .single();

        if (orderError || !order) {
          console.error("Order fetch error:", orderError);
          setError("Order not found or access denied.");
          return;
        }

        const { data: items, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id);

        if (itemsError) throw itemsError;

        setOrderData({
          id: order.id,
          orderNumber: order.order_number,
          date: new Date(order.created_at).toLocaleString(),
          customerInfo: {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone || "",
            address: order.customer_address || "",
          },
          paymentMethod: order.payment_method,
          items: items.map((i) => ({
            id: i.id,
            product_id: i.product_id,
            product_name: i.product_name,
            product_jp: i.product_jp,
            product_price: Number(i.product_price),
            product_img: i.product_img,
            quantity: i.quantity,
          })),
          subtotal: Number(order.subtotal),
          shipping: Number(order.shipping),
          total: Number(order.total),
        });
      } catch (err) {
        console.error("Receipt error:", err);
        setError("Something went wrong fetching your receipt.");
      }
    };

    fetchOrder();
  }, [orderNumber]);

  const handlePrint = () => window.print();
  const handleDownload = () => alert("PDF download coming soon!");

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-error">{error}</p>
        <Link href="/orders" className="btn btn-primary mt-6">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="text-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="mt-4 text-base-content/60">Loading your receipt...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-base-100 shadow-lg text-center">
        <div className="card-body">
          <CheckCircle className="h-24 w-24 mx-auto text-success mb-4" />
          <h1 className="text-3xl font-bold">Order Confirmed!</h1>
          <p className="text-base-content/60">
            A confirmation email was sent to{" "}
            <span className="font-semibold">{orderData.customerInfo.email}</span>
          </p>
        </div>
      </div>

      {/* Receipt Details */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          {/* Header */}
          <div className="flex justify-between border-b pb-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Wagashi</h2>
              <p className="text-sm text-base-content/60">
                Traditional Japanese Confections
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-base-content/60">Order Number</p>
              <p className="text-2xl font-bold text-primary">
                #{orderData.orderNumber}
              </p>
              <div className="flex items-center justify-end gap-2 text-sm text-base-content/60 mt-1">
                <Calendar className="h-4 w-4" />
                {orderData.date}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid md:grid-cols-2 gap-6 border-b pb-6 mb-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <User className="h-5 w-5" /> Customer
              </h3>
              <p>{orderData.customerInfo.name}</p>
              <p className="flex items-center gap-2 text-sm text-base-content/60">
                <Mail className="h-4 w-4" /> {orderData.customerInfo.email}
              </p>
              <p className="text-sm text-base-content/60">
                {orderData.customerInfo.phone}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Shipping
              </h3>
              <p className="text-sm">{orderData.customerInfo.address}</p>
              <p className="flex items-center gap-2 text-sm mt-2">
                <CreditCard className="h-4 w-4" />
                <span className="capitalize">
                  {orderData.paymentMethod}
                </span>
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {item.product_img && (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                              <Image
                                src={`/prod/${item.product_img}`}
                                alt={item.product_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">
                              {item.product_name}
                            </p>
                            <p
                              className={`${yuji.className} text-xs text-base-content/60`}
                            >
                              {item.product_jp}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">
                        ₱{item.product_price.toFixed(2)}
                      </td>
                      <td className="text-right font-semibold">
                        ₱{(item.product_price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₱{orderData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping:</span>
                <span>
                  {orderData.shipping === 0
                    ? "FREE"
                    : `₱${orderData.shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-primary">
                  ₱{orderData.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
            <button className="btn btn-outline gap-2" onClick={handlePrint}>
              <Printer className="h-5 w-5" /> Print
            </button>
            <button className="btn btn-outline gap-2" onClick={handleDownload}>
              <Download className="h-5 w-5" /> Download PDF
            </button>
            <Link href="/products" className="btn btn-primary ml-auto">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div>Loading receipt...</div>}>
      <main className="min-h-screen min-w-screen flex flex-col items-center bg-base-200">
      <div className="flex-1 w-full flex flex-col items-center">
        <Navbar />
        <div className="flex justify-center w-full px-4 py-8">
          <div className="w-full max-w-4xl">
            <OrderReceiptContent />
          </div>
        </div>
      </div>
    </main>
    </Suspense>
  );
}

 