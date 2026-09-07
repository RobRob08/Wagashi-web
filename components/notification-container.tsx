"use client";

import { useCart } from "@/components/providers/cart-context";
import { Notification } from "./notification";

export function NotificationContainer() {
  const { notifications, removeNotification } = useCart();

  return (
    <Notification
      notifications={notifications}
      removeNotification={removeNotification}
    />
  );
}
