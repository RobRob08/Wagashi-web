"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import jsPDF from "jspdf";

const supabase = createClient();

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  total: number;
  status: string;
}

const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
      } else {
        setOrders(data);
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      alert("Failed to update status");
      console.error(error);
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    }
  };

  // PDF generator
  const generatePDF = (order: Order) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Order Receipt", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Order Number: ${order.order_number}`, 20, 40);
    doc.text(`Customer Name: ${order.customer_name}`, 20, 50);
    doc.text(`Email: ${order.customer_email}`, 20, 60);
    doc.text(
      `Date: ${new Date(order.created_at).toLocaleString()}`,
      20,
      70
    );
    doc.text(`Total: ₱${Number(order.total).toFixed(2)}`, 20, 80);
    doc.text(`Status: ${order.status}`, 20, 90);

    doc.save(`Receipt-${order.order_number}.pdf`);
  };

  if (loading) return <p className="p-10 text-center">Loading orders...</p>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Orders</h1>
        <Link href="/admin" className="btn btn-outline">
          ← Back
        </Link>
      </div>

      <table className="table w-full">
        <thead>
          <tr>
            <th>Order Number</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>#{order.order_number}</td>
              <td>{order.customer_name}</td>
              <td>{order.customer_email}</td>
              <td>{new Date(order.created_at).toLocaleString()}</td>
              <td>₱{Number(order.total).toFixed(2)}</td>
              <td>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="select select-sm"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="flex gap-2">
                <Link
                  href={`/admin/Orders/receipt?orderNumber=${order.order_number}`}
                  className="btn btn-sm btn-primary"
                >
                  View
                </Link>

                <button
                  onClick={() => generatePDF(order)}
                  className="btn btn-sm btn-secondary"
                >
                  PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
