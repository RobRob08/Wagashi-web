"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Yuji_Boku } from "next/font/google";
import {
  CheckCircle,
  Download,
  Printer,
  Mail,
  Calendar,
  CreditCard,
  MapPin,
  User,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client"; 
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
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) return;

      // Fetch order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber)
        .single();

      if (orderError || !order) {
        console.error("Order fetch error:", orderError);
        return;
      }

      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      if (itemsError) {
        console.error("Order items fetch error:", itemsError);
        return;
      }

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
        items: items.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_jp: item.product_jp,
          product_price: Number(item.product_price),
          product_img: item.product_img,
          quantity: item.quantity,
        })),
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping),
        total: Number(order.total),
      });
    };

    fetchOrder();
  }, [orderNumber]);

  const handlePrint = () => window.print();
  const handleDownload = () => alert("PDF download feature coming soon!");

  if (!orderData) {
    return (
      <div className="text-center py-20">
        <p className="text-xl mb-4">Loading receipt...</p>
        <p className="text-sm text-base-content/60">
          If this persists, please check your order confirmation email.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="card bg-base-100 shadow-lg print:shadow-none">
        <div className="card-body text-center">
          <CheckCircle className="h-24 w-24 mx-auto text-success mb-4" />
          <h1 className="text-4xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-lg text-base-content/60">
            Thank you for your purchase
          </p>
          <p className="text-sm text-base-content/40 mt-2">
            A confirmation email has been sent to{" "}
            <span className="font-semibold">{orderData.customerInfo.email}</span>
          </p>
        </div>
      </div>

      {/* Receipt */}
      <div className="card bg-base-100 shadow-lg print:shadow-none">
        <div className="card-body">
          {/* Receipt Header */}
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-base-200">
            <div>
              <h2 className="text-3xl font-bold mb-2">Wagashi</h2>
              <p className="text-sm text-base-content/60">
                Traditional Japanese Confections
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-base-content/60 mb-1">Order Number</p>
              <p className="text-2xl font-bold text-primary">
                #{orderData.orderNumber}
              </p>
              <div className="flex items-center gap-2 mt-2 justify-end text-sm text-base-content/60">
                <Calendar className="h-4 w-4" />
                {orderData.date}
              </div>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-base-200">
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Name:</span> {orderData.customerInfo.name}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {orderData.customerInfo.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {orderData.customerInfo.phone}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </h3>
              <p className="text-sm mb-4">{orderData.customerInfo.address}</p>

              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">Payment Method:</span>
                <span className="capitalize">{orderData.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-4">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="text-left">Item</th>
                    <th className="text-center">Quantity</th>
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
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={`/prod/${item.product_img}`}
                                alt={item.product_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className={`${yuji.className} text-xs text-base-content/60`}>
                              {item.product_jp}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">₱{item.product_price.toFixed(2)}</td>
                      <td className="text-right font-semibold">
                        ₱{(item.product_price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">Subtotal:</span>
                <span>₱{orderData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-base-content/60">Shipping:</span>
                <span>{orderData.shipping === 0 ? "FREE" : `₱${orderData.shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-base-200">
                <span>Total:</span>
                <span className="text-primary">₱{orderData.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-base-200 print:hidden">
            <button className="btn btn-outline gap-2" onClick={handlePrint}>
              <Printer className="h-5 w-5" /> Print Receipt
            </button>
            <button className="btn btn-outline gap-2" onClick={handleDownload}>
              <Download className="h-5 w-5" /> Download PDF
            </button>
            <Link href="/products" className="btn btn-primary gap-2 ml-auto">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderReceipt() {
  return (
    <Suspense fallback={<div>Loading receipt...</div>}>
      <OrderReceiptContent />
    </Suspense>
  );
}
