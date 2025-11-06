"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuccessRedirect() {
  const router = useRouter();

  useEffect(() => {
    const lastOrder = localStorage.getItem("lastOrder");
    if (lastOrder) {
      const order = JSON.parse(lastOrder);
      router.replace(`/receipt?orderNumber=${order.order_number}`);
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
