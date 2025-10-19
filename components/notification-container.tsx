"use client";

import { useCart } from "@/app/context/cartcontext";
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
