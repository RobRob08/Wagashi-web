"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, ShoppingBag, X } from "lucide-react";
import Image from "next/image";

export type NotificationType = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  productName?: string;
  productImage?: string;
};

interface NotificationProps {
  notifications: NotificationType[];
  removeNotification: (id: string) => void;
}

export function Notification({
  notifications,
  removeNotification,
}: NotificationProps) {
  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            className="pointer-events-auto mb-3"
          >
            <div
              className={`
              flex items-center gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm
              min-w-[320px] max-w-[420px] border
              ${
                notification.type === "success"
                  ? "bg-green-50/95 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : notification.type === "error"
                  ? "bg-red-50/95 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : "bg-blue-50/95 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              }
            `}
            >
              {/* Icon */}
              <div
                className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                ${
                  notification.type === "success"
                    ? "bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-400"
                    : notification.type === "error"
                    ? "bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-400"
                    : "bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400"
                }
              `}
              >
                {notification.type === "success" ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Check className="w-5 h-5" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <ShoppingBag className="w-5 h-5" />
                )}
              </div>

              {/* Product Image if available */}
              {notification.productImage && (
                <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-white dark:bg-gray-800 relative">
                  <Image
                    src={`/prod/${notification.productImage}`}
                    alt={notification.productName || "Product"}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1">
                <p
                  className={`
                  text-sm font-medium
                  ${
                    notification.type === "success"
                      ? "text-green-800 dark:text-green-200"
                      : notification.type === "error"
                      ? "text-red-800 dark:text-red-200"
                      : "text-blue-800 dark:text-blue-200"
                  }
                `}
                >
                  {notification.message}
                </p>
                {notification.productName && (
                  <p className="text-xs mt-1 opacity-75">
                    {notification.productName}
                  </p>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => removeNotification(notification.id)}
                className={`
                  flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                  transition-colors hover:bg-black/10 dark:hover:bg-white/10
                  ${
                    notification.type === "success"
                      ? "text-green-600 dark:text-green-400"
                      : notification.type === "error"
                      ? "text-red-600 dark:text-red-400"
                      : "text-blue-600 dark:text-blue-400"
                  }
                `}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
