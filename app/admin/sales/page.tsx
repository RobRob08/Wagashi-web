"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  Printer,
  Package,
  Award,
} from "lucide-react";
import Link from "next/link";

// Types
interface Order {
  id: string;
  order_number: string;
  date: string;
  customer_name: string;
  customer_email: string;
  payment_method: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
}

interface ProductPerformance {
  product_id: number;
  product_name: string;
  product_jp: string;
  product_price: number;
  quantity_sold: number;
  total_revenue: number;
}

interface CustomerData {
  customer_name: string;
  customer_email: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  avgOrderValue: number;
  revenueGrowth: number;
}

type TimePeriod = "weekly" | "monthly" | "yearly";

export default function SalesAnalytics() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly");
  const [metrics, setMetrics] = useState<SalesMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    revenueGrowth: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "customers">("overview");

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report - ${timePeriod}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            h1 {
              color: #111827;
              margin-bottom: 8px;
            }
            h2 {
              color: #374151;
              margin-top: 30px;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
              margin: 20px 0;
            }
            .metric-card {
              border: 1px solid #e5e7eb;
              padding: 16px;
              border-radius: 8px;
            }
            .metric-title {
              color: #6b7280;
              font-size: 14px;
              margin-bottom: 8px;
            }
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #111827;
            }
            .metric-desc {
              color: #9ca3af;
              font-size: 12px;
              margin-top: 4px;
            }
            .badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            .badge-success {
              background-color: #d1fae5;
              color: #065f46;
            }
            .badge-warning {
              background-color: #fef3c7;
              color: #92400e;
            }
            .badge-error {
              background-color: #fee2e2;
              color: #991b1b;
            }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Calculate date range based on time period
  const getDateRange = (period: TimePeriod) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case "weekly":
        startDate.setDate(now.getDate() - 7);
        break;
      case "monthly":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "yearly":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { startDate: startDate.toISOString(), endDate: now.toISOString() };
  };

  // Fetch sales data
  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      const supabase = createClient();
      const { startDate, endDate } = getDateRange(timePeriod);

      try {
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false });

        if (ordersError) throw ordersError;

        // Fetch order items
        const { data: orderItemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*");

        if (itemsError) throw itemsError;

        // Calculate metrics
        const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
        const totalOrders = ordersData?.length || 0;
        const uniqueCustomers = new Set(ordersData?.map(o => o.customer_email)).size;

        // Calculate previous period for growth
        const prevPeriodEnd = startDate;
        const prevPeriodStart = new Date(startDate);
        if (timePeriod === "weekly") prevPeriodStart.setDate(prevPeriodStart.getDate() - 7);
        else if (timePeriod === "monthly") prevPeriodStart.setMonth(prevPeriodStart.getMonth() - 1);
        else prevPeriodStart.setFullYear(prevPeriodStart.getFullYear() - 1);

        const { data: prevOrders } = await supabase
          .from("orders")
          .select("total")
          .gte("date", prevPeriodStart.toISOString())
          .lt("date", prevPeriodEnd);

        const prevRevenue = prevOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
        const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

        // Calculate product performance
        const productMap = new Map<number, ProductPerformance>();
        
        orderItemsData?.forEach(item => {
          const orderDate = ordersData?.find(o => o.id === item.order_id)?.date;
          if (orderDate && orderDate >= startDate && orderDate <= endDate) {
            const existing = productMap.get(item.product_id);
            if (existing) {
              existing.quantity_sold += item.quantity;
              existing.total_revenue += item.quantity * Number(item.product_price);
            } else {
              productMap.set(item.product_id, {
                product_id: item.product_id,
                product_name: item.product_name,
                product_jp: item.product_jp,
                product_price: Number(item.product_price),
                quantity_sold: item.quantity,
                total_revenue: item.quantity * Number(item.product_price),
              });
            }
          }
        });

        const sortedProducts = Array.from(productMap.values())
          .sort((a, b) => b.total_revenue - a.total_revenue);

        // Calculate customer data
        const customerMap = new Map<string, CustomerData>();
        
        ordersData?.forEach(order => {
          const existing = customerMap.get(order.customer_email);
          if (existing) {
            existing.total_orders += 1;
            existing.total_spent += Number(order.total);
            if (order.date > existing.last_order_date) {
              existing.last_order_date = order.date;
            }
          } else {
            customerMap.set(order.customer_email, {
              customer_name: order.customer_name,
              customer_email: order.customer_email,
              total_orders: 1,
              total_spent: Number(order.total),
              last_order_date: order.date,
            });
          }
        });

        const sortedCustomers = Array.from(customerMap.values())
          .sort((a, b) => b.total_spent - a.total_spent);

        // Update state
        setMetrics({
          totalRevenue,
          totalOrders,
          totalProducts: productMap.size,
          totalCustomers: uniqueCustomers,
          avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          revenueGrowth,
        });
        setOrders(ordersData || []);
        setProductPerformance(sortedProducts);
        setCustomerData(sortedCustomers);
      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [timePeriod]);

  // Export to CSV
  const exportToCSV = () => {
    let csvContent = "";
    
    if (activeTab === "overview") {
      csvContent = "Order Number,Date,Customer,Email,Payment Method,Total,Status\n";
      orders.forEach(order => {
        csvContent += `${order.order_number},${new Date(order.date).toLocaleDateString()},${order.customer_name},${order.customer_email},${order.payment_method},₱${order.total.toFixed(2)},${order.status}\n`;
      });
    } else if (activeTab === "products") {
      csvContent = "Product Name,Japanese Name,Price,Units Sold,Total Revenue\n";
      productPerformance.forEach(product => {
        csvContent += `${product.product_name},${product.product_jp},₱${product.product_price.toFixed(2)},${product.quantity_sold},₱${product.total_revenue.toFixed(2)}\n`;
      });
    } else {
      csvContent = "Customer Name,Email,Total Orders,Total Spent,Last Order Date\n";
      customerData.forEach(customer => {
        csvContent += `${customer.customer_name},${customer.customer_email},${customer.total_orders},₱${customer.total_spent.toFixed(2)},${new Date(customer.last_order_date).toLocaleDateString()}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${timePeriod}_${activeTab}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Sales Analytics</h1>
          <Link href="/admin" className="btn btn-outline">
                    ← Back
                  </Link>
          <p className="text-base-content/60">
            Comprehensive sales reports and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToCSV} className="btn btn-outline gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button onClick={handlePrint} className="btn btn-primary gap-2">
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Time Period Filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTimePeriod("weekly")}
          className={`btn ${timePeriod === "weekly" ? "btn-primary" : "btn-outline"}`}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Weekly
        </button>
        <button
          onClick={() => setTimePeriod("monthly")}
          className={`btn ${timePeriod === "monthly" ? "btn-primary" : "btn-outline"}`}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Monthly
        </button>
        <button
          onClick={() => setTimePeriod("yearly")}
          className={`btn ${timePeriod === "yearly" ? "btn-primary" : "btn-outline"}`}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Yearly
        </button>
      </div>

      {/* Printable Content */}
      <div ref={printRef} className="print:p-8">
        {/* Print Header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold mb-2">Sales Report</h1>
          <p className="text-gray-600">
            Period: {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} |
            Generated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-figure text-primary">
                <DollarSign className="h-8 w-8" />
              </div>
              <div className="stat-title">Total Revenue</div>
              <div className="stat-value text-primary">
                ₱{metrics.totalRevenue.toFixed(2)}
              </div>
              <div className="stat-desc">
                {metrics.revenueGrowth >= 0 ? "↗︎" : "↘︎"}{" "}
                {Math.abs(metrics.revenueGrowth).toFixed(1)}% from last period
              </div>
            </div>
          </div>

          <div className="stats shadow">
            <div className="stat">
              <div className="stat-figure text-secondary">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div className="stat-title">Total Orders</div>
              <div className="stat-value text-secondary">{metrics.totalOrders}</div>
              <div className="stat-desc">Average: ₱{metrics.avgOrderValue.toFixed(2)}</div>
            </div>
          </div>

          <div className="stats shadow">
            <div className="stat">
              <div className="stat-figure text-accent">
                <Package className="h-8 w-8" />
              </div>
              <div className="stat-title">Products Sold</div>
              <div className="stat-value text-accent">{metrics.totalProducts}</div>
              <div className="stat-desc">Unique products</div>
            </div>
          </div>

          <div className="stats shadow">
            <div className="stat">
              <div className="stat-figure text-info">
                <Users className="h-8 w-8" />
              </div>
              <div className="stat-title">Customers</div>
              <div className="stat-value text-info">{metrics.totalCustomers}</div>
              <div className="stat-desc">Unique buyers</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6 print:hidden">
          <a
            className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Orders Overview
          </a>
          <a
            className={`tab ${activeTab === "products" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            <Award className="h-4 w-4 mr-2" />
            Product Performance
          </a>
          <a
            className={`tab ${activeTab === "customers" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("customers")}
          >
            <Users className="h-4 w-4 mr-2" />
            Customer Insights
          </a>
        </div>

        {/* Orders Overview */}
        {activeTab === "overview" && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Payment</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="font-mono text-sm">{order.order_number}</td>
                        <td>{new Date(order.date).toLocaleDateString()}</td>
                        <td>
                          <div>
                            <div className="font-semibold">{order.customer_name}</div>
                            <div className="text-xs text-base-content/60">
                              {order.customer_email}
                            </div>
                          </div>
                        </td>
                        <td className="capitalize">{order.payment_method}</td>
                        <td className="font-semibold">₱{order.total.toFixed(2)}</td>
                        <td>
                          <span
                            className={`badge ${
                              order.status === "completed"
                                ? "badge-success"
                                : order.status === "pending"
                                ? "badge-warning"
                                : "badge-error"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Product Performance */}
        {activeTab === "products" && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title mb-4">Top Performing Products</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productPerformance.map((product, index) => (
                      <tr key={product.product_id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">#{index + 1}</span>
                            {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="font-semibold">{product.product_name}</div>
                            <div className="text-xs text-base-content/60">
                              {product.product_jp}
                            </div>
                          </div>
                        </td>
                        <td>₱{product.product_price.toFixed(2)}</td>
                        <td className="font-semibold">{product.quantity_sold} units</td>
                        <td className="font-bold text-primary">
                          ₱{product.total_revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Customer Insights */}
        {activeTab === "customers" && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title mb-4">Top Customers</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Customer</th>
                      <th>Orders</th>
                      <th>Total Spent</th>
                      <th>Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerData.map((customer, index) => (
                      <tr key={customer.customer_email}>
                        <td className="font-bold text-lg">#{index + 1}</td>
                        <td>
                          <div>
                            <div className="font-semibold">{customer.customer_name}</div>
                            <div className="text-xs text-base-content/60">
                              {customer.customer_email}
                            </div>
                          </div>
                        </td>
                        <td>{customer.total_orders} orders</td>
                        <td className="font-bold text-primary">
                          ₱{customer.total_spent.toFixed(2)}
                        </td>
                        <td>{new Date(customer.last_order_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}