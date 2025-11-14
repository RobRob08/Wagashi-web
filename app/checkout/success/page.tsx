"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuccessRedirect() {
  const router = useRouter();

  useEffect(() => {
    const lastOrder = localStorage.getItem("lastOrder");
    if (lastOrder) {
      try {
        const order = JSON.parse(lastOrder);
        // Try both order_number and orderNumber properties
        const orderNumber = order.order_number || order.orderNumber;
        if (orderNumber) {
          router.replace(`/receipt?orderNumber=${orderNumber}`);
        } else {
          router.replace("/receipt");
        }
      } catch (error) {
        console.error("Error parsing last order:", error);
        router.replace("/receipt");
      }
    } else {
      router.replace("/orders"); // fallback
    }
  }, [router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <span className="loading loading-spinner loading-lg"></span>
      <p className="ml-4 text-base-content/60">Loading your receipt...</p>
    </div>
  );
}