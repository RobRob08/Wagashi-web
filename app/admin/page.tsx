"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/navbar";
import { Users, ShoppingCart, Box, TrendingUp } from "lucide-react";

// --- Types ---
type Product = {
  product_id: number;
  product_name: string;
  stock_level: number;
  product_price: number;
};

type TopCustomer = {
  customer_name: string;
  customer_email: string;
  total_spent: number;
};

type TopProduct = {
  product_name: string;
  quantity_sold: number;
};

export default function Dashboard() {
  const supabase = createClient();

  const [totalSales, setTotalSales] = useState<number>(0);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // --- Total Sales ---
      const { data: totalData } = await supabase.from("orders").select("total");
      const total = (totalData ?? []).reduce(
        (sum, o) => sum + Number(o.total),
        0
      );
      setTotalSales(total);

      // --- Top Customers ---
      const { data: customersData } = await supabase
        .from("orders")
        .select("customer_name, customer_email, total");

      const map: Record<string, TopCustomer> = {};
      (customersData ?? []).forEach((order) => {
        const key = order.customer_email;
        if (!map[key]) {
          map[key] = {
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            total_spent: Number(order.total),
          };
        } else {
          map[key].total_spent += Number(order.total);
        }
      });
      setTopCustomers(
        Object.values(map).sort((a, b) => b.total_spent - a.total_spent).slice(0, 5)
      );

      // --- Low Stock Products ---
      const { data: lowStockData } = await supabase
        .from("products")
        .select("*")
        .order("stock_level", { ascending: true })
        .limit(5);
      setLowStockProducts(lowStockData ?? []);

      // --- Top Selling Products ---
      const { data: topProductsData } = await supabase
        .from("order_items")
        .select("product_name, quantity");

      const productMap: Record<string, number> = {};
      (topProductsData ?? []).forEach((item) => {
        if (!productMap[item.product_name]) productMap[item.product_name] = item.quantity;
        else productMap[item.product_name] += item.quantity;
      });

      const sortedProducts = Object.entries(productMap)
        .map(([product_name, quantity_sold]) => ({ product_name, quantity_sold }))
        .sort((a, b) => b.quantity_sold - a.quantity_sold);
      setTopProducts(sortedProducts.slice(0, 5));
    };

    fetchDashboardData();
  }, [supabase]);

  return (
    <main className="p-6">
      <Navbar />

      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg rounded-xl p-6 flex items-center gap-4">
          <TrendingUp className="w-10 h-10" />
          <div>
            <p className="text-sm font-semibold">Total Sales</p>
            <p className="text-2xl font-bold">₱ {totalSales.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg rounded-xl p-6 flex items-center gap-4">
          <Users className="w-10 h-10" />
          <div>
            <p className="text-sm font-semibold">Top Customer</p>
            <p className="text-lg font-bold">
              {topCustomers[0]?.customer_name ?? "None"}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg rounded-xl p-6 flex items-center gap-4">
          <Box className="w-10 h-10" />
          <div>
            <p className="text-sm font-semibold">Lowest Stock</p>
            <p className="text-lg font-bold">
              {lowStockProducts[0]?.product_name ?? "All stocked"}{" "}
              {lowStockProducts[0] && `(${lowStockProducts[0].stock_level})`}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-lg rounded-xl p-6 flex items-center gap-4">
          <ShoppingCart className="w-10 h-10" />
          <div>
            <p className="text-sm font-semibold">Top Product</p>
            <p className="text-lg font-bold">
              {topProducts[0]?.product_name ?? "No sales yet"}{" "}
              {topProducts[0] && `(${topProducts[0].quantity_sold})`}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-4">Top Customers</h2>
          <ul className="divide-y divide-gray-200">
            {topCustomers.map((c) => (
              <li key={c.customer_email} className="py-2 flex justify-between items-center">
                <span>{c.customer_name} ({c.customer_email})</span>
                <span className="font-semibold">₱ {c.total_spent.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-4">Low Stock Products</h2>
          <ul className="divide-y divide-gray-200">
            {lowStockProducts.map((p) => (
              <li key={p.product_id} className="py-2 flex justify-between items-center">
                <span>{p.product_name}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    p.stock_level === 0
                      ? "bg-red-500 text-white"
                      : p.stock_level <= 5
                      ? "bg-yellow-400 text-black"
                      : "bg-green-200 text-black"
                  }`}
                >
                  {p.stock_level === 0
                    ? "Out of Stock"
                    : p.stock_level <= 5
                    ? `Low Stock (${p.stock_level})`
                    : `In Stock (${p.stock_level})`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Products */}
        <div className="bg-white shadow-lg rounded-xl p-6 md:col-span-2">
          <h2 className="font-semibold text-lg mb-4">Top Products</h2>
          <ul className="divide-y divide-gray-200">
            {topProducts.map((p) => (
              <li key={p.product_name} className="py-2 flex justify-between items-center">
                <span>{p.product_name}</span>
                <span className="font-semibold">{p.quantity_sold} sold</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
