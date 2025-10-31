"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; 

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
  status: string; // added status
  items: OrderItem[];
}

const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (orderError || !orderData) {
        console.error("Error fetching order:", orderError);
        return;
      }

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);

      if (itemsError) console.error("Error fetching items:", itemsError);

      setOrder({
        ...orderData,
        items: items || [],
      });
    };

    fetchOrder();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!order) return;

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id);

    if (error) {
      alert("Failed to update status");
      console.error(error);
    } else {
      setOrder({ ...order, status: newStatus });
    }
  };

  if (!order) return <p className="p-10 text-center">Loading order...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Order #{order.order_number}</h1>
      <p>Customer: {order.customer_name}</p>
      <p>Email: {order.customer_email}</p>
      <p>Phone: {order.customer_phone}</p>
      <p>Address: {order.customer_address}</p>
      <p>Payment: {order.payment_method}</p>
      <p>Date: {new Date(order.created_at).toLocaleString()}</p>

      {/* Status dropdown */}
      <p className="mt-2">
        Status:{" "}
        <select
          value={order.status}
          onChange={(e) => updateStatus(e.target.value)}
          className="select select-sm"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">Items</h2>
      <table className="table w-full">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
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
                  />
                )}
                {item.product_name}
              </td>
              <td>{item.quantity}</td>
              <td>₱{item.product_price.toFixed(2)}</td>
              <td>₱{(item.product_price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right space-y-1 mt-4">
        <p>Subtotal: ₱{order.subtotal.toFixed(2)}</p>
        <p>Shipping: ₱{order.shipping.toFixed(2)}</p>
        <p className="font-bold">Total: ₱{order.total.toFixed(2)}</p>
      </div>
    </div>
  );
}
