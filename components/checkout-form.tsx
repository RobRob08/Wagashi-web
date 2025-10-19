"use client";

import { useState } from "react";
import { useCart } from "@/app/context/cartcontext";
import Image from "next/image";
import { Yuji_Boku } from "next/font/google";
import {
  ShoppingBag,
  CreditCard,
  MapPin,
  User,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

const yuji = Yuji_Boku({
  weight: "400",
  subsets: ["latin"],
});

export default function CheckoutForm() {
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "cash",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCVV: "",
  });

  const [error, setError] = useState("");

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product_price * item.quantity,
    0
  );
  const shipping = subtotal > 1000 ? 0 : 100; // Free shipping over ₱1000
  const total = subtotal + shipping;
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty!");
      return;
    }

    setIsProcessing(true);

    try {
      const orderDescription = `Order for ${formData.firstName} ${formData.lastName}`;

      // Prepare card details if card payment
      let cardDetails = null;
      if (formData.paymentMethod === "card") {
        const [expMonth, expYear] = formData.cardExpiry.split("/");
        cardDetails = {
          number: formData.cardNumber,
          exp_month: parseInt(expMonth),
          exp_year: parseInt(`20${expYear}`),
          cvc: formData.cardCVV,
          name: formData.cardName,
        };
      }

      // Call PayMongo API
      const response = await fetch("/api/paymongo/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: total,
          paymentMethod: formData.paymentMethod,
          cardDetails: cardDetails,
          description: orderDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment failed");
      }

      // Save order data for receipt (before any redirects)
      const orderData = {
        orderNumber: `WG${Date.now().toString().slice(-8)}`,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        customerInfo: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
        },
        paymentMethod: formData.paymentMethod,
        items: cart,
        subtotal: subtotal,
        shipping: shipping,
        total: total,
      };

      localStorage.setItem("lastOrder", JSON.stringify(orderData));

      // Save to order history
      const existingOrders = localStorage.getItem("orderHistory");
      const orderHistory = existingOrders ? JSON.parse(existingOrders) : [];
      orderHistory.push(orderData);
      localStorage.setItem("orderHistory", JSON.stringify(orderHistory));

      // Handle different payment methods
      if (
        formData.paymentMethod === "gcash" ||
        formData.paymentMethod === "grabpay"
      ) {
        // Redirect to GCash/GrabPay checkout page
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
      }

      // For card and cash on delivery, show success
      setIsProcessing(false);
      setOrderComplete(true);
      clearCart();

      // Redirect to success page after 2 seconds
      setTimeout(() => {
        router.push("/checkout/success");
      }, 2000);
    } catch (err: unknown) {
      setIsProcessing(false);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Payment processing failed. Please try again.";
      setError(errorMessage);
      console.error("Payment error:", err);
    }
  };

  if (cart.length === 0 && !orderComplete) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="h-24 w-24 mx-auto text-base-300 mb-4" />
        <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-base-content/60 mb-6">
          Add some delicious wagashi to get started!
        </p>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/products")}
        >
          Browse Products
        </button>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="text-center py-20">
        <CheckCircle className="h-32 w-32 mx-auto text-success mb-6 animate-bounce" />
        <h2 className="text-4xl font-bold mb-4">Order Placed Successfully!</h2>
        <p className="text-xl text-base-content/60 mb-2">
          Thank you for your order
        </p>
        <p className="text-base-content/40 mb-6">
          You will receive a confirmation email shortly
        </p>
        <p className="text-sm text-base-content/40">
          Redirecting to home page...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-4xl font-bold mb-2">Checkout</h1>
      <p className="text-base-content/60 mb-8">Complete your order</p>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">
                        First Name *
                      </span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">
                        Last Name *
                      </span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Email *</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Phone *</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">
                        Street Address *
                      </span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="textarea textarea-bordered w-full"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">City *</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">
                          Postal Code *
                        </span>
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:border-primary transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={formData.paymentMethod === "cash"}
                        onChange={handleInputChange}
                        className="radio radio-primary"
                      />
                      <span>Cash on Delivery</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:border-primary transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === "card"}
                        onChange={handleInputChange}
                        className="radio radio-primary"
                      />
                      <span>Credit/Debit Card</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:border-primary transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="gcash"
                        checked={formData.paymentMethod === "gcash"}
                        onChange={handleInputChange}
                        className="radio radio-primary"
                      />
                      <span>GCash</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:border-primary transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="grabpay"
                        checked={formData.paymentMethod === "grabpay"}
                        onChange={handleInputChange}
                        className="radio radio-primary"
                      />
                      <span>GrabPay</span>
                    </label>
                  </div>

                  {formData.paymentMethod === "card" && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">
                            Card Number *
                          </span>
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          placeholder="1234 5678 9012 3456"
                          className="input input-bordered w-full"
                          required={formData.paymentMethod === "card"}
                        />
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">
                            Cardholder Name *
                          </span>
                        </label>
                        <input
                          type="text"
                          name="cardName"
                          value={formData.cardName}
                          onChange={handleInputChange}
                          className="input input-bordered w-full"
                          required={formData.paymentMethod === "card"}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">
                            <span className="label-text font-medium">
                              Expiry Date *
                            </span>
                          </label>
                          <input
                            type="text"
                            name="cardExpiry"
                            value={formData.cardExpiry}
                            onChange={handleInputChange}
                            placeholder="MM/YY"
                            className="input input-bordered w-full"
                            required={formData.paymentMethod === "card"}
                          />
                        </div>
                        <div>
                          <label className="label">
                            <span className="label-text font-medium">
                              CVV *
                            </span>
                          </label>
                          <input
                            type="text"
                            name="cardCVV"
                            value={formData.cardCVV}
                            onChange={handleInputChange}
                            placeholder="123"
                            className="input input-bordered w-full"
                            maxLength={4}
                            required={formData.paymentMethod === "card"}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-md sticky top-4">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                  {cart.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex gap-3 pb-3 border-b border-base-200"
                    >
                      {item.product_img && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={`/prod/${item.product_img}`}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {item.product_name}
                        </h3>
                        <p
                          className={`${yuji.className} text-xs text-base-content/60`}
                        >
                          {item.product_jp}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-base-content/60">
                            Qty: {item.quantity}
                          </span>
                          <span className="font-semibold">
                            ₱{(item.product_price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t border-base-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60">
                      Subtotal ({totalQuantity} items)
                    </span>
                    <span>₱{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60">Shipping</span>
                    <span>
                      {shipping === 0 ? "FREE" : `₱${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {shipping === 0 && (
                    <p className="text-xs text-success">
                      🎉 You got free shipping!
                    </p>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-base-200">
                    <span>Total</span>
                    <span className="text-primary">₱{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="alert alert-error mt-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="stroke-current shrink-0 h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Place Order Button */}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full mt-6"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    `Place Order - ₱${total.toFixed(2)}`
                  )}
                </button>

                <p className="text-xs text-center text-base-content/40 mt-2">
                  By placing your order, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
