"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Calendar, CreditCard, MapPin, Mail, User } from "lucide-react";

const supabase = createClient();

interface OrderItem {
  id: string;
  product_id: number;
  product_name: string;
  product_jp: string;
  product_price: number;
  product_img: string | null;
  quantity: number;
}

interface OrderDetail {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  payment_method: string;
  created_at: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  items: OrderItem[];
}

function AdminOrderReceiptContent() {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) return;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber)
        .single();

      if (orderError || !orderData) {
        console.error("Error fetching order:", orderError);
        setError("Order not found.");
        return;
      }

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderData.id);

      if (itemsError) console.error("Error fetching items:", itemsError);

      setOrder({
        ...orderData,
        items: items || [],
      });
    };

    fetchOrder();
  }, [orderNumber]);

  if (error) {
    return (
      <div className="p-10 text-center text-red-500">
        <p>{error}</p>
        <Link href="/admin/Orders" className="btn btn-primary mt-6">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) return <p className="p-10 text-center">Loading order...</p>;

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Order Receipt</h1>
        <Link href="/admin/Orders" className="btn btn-outline">
          ← Back to Orders
        </Link>
      </div>

      <div className="border p-6 rounded-lg bg-base-100 shadow-md">
        <div className="flex justify-between border-b pb-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Order #{order.order_number}</h2>
            <p className="text-sm text-gray-500">
              <Calendar className="inline-block w-4 h-4 mr-1" />
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <span className="badge badge-primary text-lg capitalize p-2">
            {order.status}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <User className="w-4 h-4" /> Customer
            </h3>
            <p>{order.customer_name}</p>
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Mail className="w-4 h-4" /> {order.customer_email}
            </p>
            <p className="text-sm text-gray-500">{order.customer_phone}</p>
          </div>
          <div>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Shipping
            </h3>
            <p>{order.customer_address}</p>
            <p className="flex items-center gap-2 text-sm text-gray-500 mt-2">
              <CreditCard className="w-4 h-4" /> {order.payment_method}
            </p>
          </div>
        </div>

        <table className="table w-full">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="flex items-center gap-2">
                  {item.product_img && (
                    <Image
                      src={`/prod/${item.product_img}`}
                      alt={item.product_name}
                      width={40}
                      height={40}
                      className="rounded"
                    />
                  )}
                  <span>{item.product_name}</span>
                </td>
                <td>{item.quantity}</td>
                <td>₱{item.product_price.toFixed(2)}</td>
                <td>₱{(item.product_price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right mt-6 space-y-1">
          <p>Subtotal: ₱{Number(order.subtotal).toFixed(2)}</p>
          <p>Shipping: ₱{Number(order.shipping).toFixed(2)}</p>
          <p className="font-bold text-lg">Total: ₱{Number(order.total).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrderReceiptPage() {
  return (
    <Suspense fallback={<div>Loading receipt...</div>}>
      <AdminOrderReceiptContent />
    </Suspense>
  );
}
