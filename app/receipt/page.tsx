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
  id?: string;
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

interface SupabaseOrder {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  customer_address?: string | null;
  payment_method: string;
  subtotal: number;
  shipping: number;
  total: number;
  user_id: string;
}

// Payment method display helper
function getPaymentMethodDisplay(method: string): string {
  const methods: { [key: string]: string } = {
    cash: "Cash on Delivery",
    card: "Credit/Debit Card", 
    gcash: "GCash",
    grabpay: "GrabPay"
  };
  return methods[method] || method;
}

export default function ReceiptPage() {
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoadingItems(true);
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        const orderNumber = searchParams.get("orderNumber");

        let order: SupabaseOrder | null = null;
        let items: OrderItem[] = [];

        // Fetch from Supabase
        if (orderNumber && user) {
          const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("order_number", orderNumber)
            .eq("user_id", user.id)
            .single();

          if (!error && data) order = data;

          if (order) {
            const { data: itemsData, error: itemsError } = await supabase
              .from("order_items")
              .select("*")
              .eq("order_id", order.id);

            if (!itemsError && itemsData) items = itemsData;
          }
        }

        // Fallback to localStorage
        if (!order) {
          const stored = localStorage.getItem("lastOrder");
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as SupabaseOrder & { items?: OrderItem[] };
              
              // Validate required fields
              if (!parsed.order_number || !parsed.customer_name) {
                console.error("Invalid order data in localStorage");
                setError("Order data is incomplete.");
                return;
              }
              
              order = parsed;
              items = parsed.items ?? [];
            } catch (parseError) {
              console.error("Error parsing localStorage data:", parseError);
              setError("Failed to load order data.");
              return;
            }
          } else {
            setError("Order not found.");
            return;
          }
        }

        // Set state
        if (order) {
          setOrderData({
            id: order.id,
            orderNumber: order.order_number,
            date: new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            customerInfo: {
              name: order.customer_name,
              email: order.customer_email,
              phone: order.customer_phone ?? "",
              address: order.customer_address ?? "",
            },
            paymentMethod: order.payment_method,
            items: items,
            subtotal: Number(order.subtotal),
            shipping: Number(order.shipping),
            total: Number(order.total),
          });
        }
      } catch (err) {
        console.error("Receipt error:", err);
        const stored = localStorage.getItem("lastOrder");
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as SupabaseOrder & { items?: OrderItem[] };
            setOrderData({
              id: parsed.id,
              orderNumber: parsed.order_number,
              date: new Date(parsed.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              customerInfo: {
                name: parsed.customer_name,
                email: parsed.customer_email,
                phone: parsed.customer_phone ?? "",
                address: parsed.customer_address ?? "",
              },
              paymentMethod: parsed.payment_method,
              items: parsed.items ?? [],
              subtotal: Number(parsed.subtotal),
              shipping: Number(parsed.shipping),
              total: Number(parsed.total),
            });
          } catch {
            setError("Something went wrong fetching your receipt.");
          }
        } else {
          setError("Something went wrong fetching your receipt.");
        }
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchOrder();
  }, [searchParams, retryCount]);

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-error mb-4">{error}</p>
        <div className="space-x-4">
          <Link href="/orders" className="btn btn-primary">
            Back to Orders
          </Link>
          {retryCount < 3 && (
            <button 
              className="btn btn-outline"
              onClick={() => {
                setError("");
                setRetryCount(prev => prev + 1);
              }}
            >
              Try Again
            </button>
          )}
        </div>
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
    <Suspense fallback={<div>Loading receipt...</div>}>
      <main className="min-h-screen min-w-screen flex flex-col items-center bg-base-200">
        <div className="flex-1 w-full flex flex-col items-center">
          <Navbar />
          <div className="flex justify-center w-full px-4 py-8">
            <div className="w-full max-w-4xl space-y-6">
              <OrderReceiptContent 
                orderData={orderData} 
                isLoadingItems={isLoadingItems}
              />
            </div>
          </div>
        </div>
      </main>
    </Suspense>
  );
}

function OrderReceiptContent({ 
  orderData, 
  isLoadingItems 
}: { 
  orderData: OrderData;
  isLoadingItems: boolean;
}) {
  const handlePrint = () => window.print();
  
  const handleDownload = () => {
    // Simple PDF download simulation
    const receiptContent = document.getElementById('receipt-content');
    if (receiptContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt #${orderData.orderNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; font-size: 1.2em; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Wagashi</h1>
                <p>Traditional Japanese Confections</p>
                <h2>Order Confirmation</h2>
              </div>
              <div class="section">
                <p><strong>Order Number:</strong> #${orderData.orderNumber}</p>
                <p><strong>Date:</strong> ${orderData.date}</p>
              </div>
              <div class="section">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${orderData.customerInfo.name}</p>
                <p><strong>Email:</strong> ${orderData.customerInfo.email}</p>
                <p><strong>Phone:</strong> ${orderData.customerInfo.phone}</p>
                <p><strong>Address:</strong> ${orderData.customerInfo.address}</p>
                <p><strong>Payment Method:</strong> ${getPaymentMethodDisplay(orderData.paymentMethod)}</p>
              </div>
              <div class="section">
                <h3>Order Items</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderData.items.map(item => `
                      <tr>
                        <td>${item.product_name}</td>
                        <td>${item.quantity}</td>
                        <td>₱${item.product_price.toFixed(2)}</td>
                        <td>₱${(item.product_price * item.quantity).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              <div class="section">
                <p><strong>Subtotal:</strong> ₱${orderData.subtotal.toFixed(2)}</p>
                <p><strong>Shipping:</strong> ${orderData.shipping === 0 ? 'FREE' : `₱${orderData.shipping.toFixed(2)}`}</p>
                <p class="total"><strong>Total:</strong> ₱${orderData.total.toFixed(2)}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="space-y-6" id="receipt-content">
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
              <p className="text-sm text-base-content/60">Traditional Japanese Confections</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-base-content/60">Order Number</p>
              <p className="text-2xl font-bold text-primary">#{orderData.orderNumber}</p>
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
              <p className="text-sm text-base-content/60">{orderData.customerInfo.phone}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Shipping
              </h3>
              <p className="text-sm">{orderData.customerInfo.address}</p>
              <p className="flex items-center gap-2 text-sm mt-2">
                <CreditCard className="h-4 w-4" />
                <span>{getPaymentMethodDisplay(orderData.paymentMethod)}</span>
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
                  {isLoadingItems ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8">
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="ml-2">Loading items...</span>
                      </td>
                    </tr>
                  ) : orderData.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-base-content/60">
                        No items found in this order.
                      </td>
                    </tr>
                  ) : (
                    orderData.items.map((item, index) => (
                      <tr key={item.id ?? `${item.product_id}-${index}`}>
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
                              <p className="font-medium">{item.product_name}</p>
                              <p className={`${yuji.className} text-xs text-base-content/60`}>
                                {item.product_jp}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">{item.quantity ?? 0}</td>
                        <td className="text-right">₱{(item.product_price ?? 0).toFixed(2)}</td>
                        <td className="text-right font-semibold">
                          ₱{((item.product_price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
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
                <span>{orderData.shipping === 0 ? "FREE" : `₱${orderData.shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-primary">₱{orderData.total.toFixed(2)}</span>
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