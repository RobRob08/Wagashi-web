"use client";

import { useState, useEffect } from "react";
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
import { createClient } from "@/lib/supabase/client"; 

const yuji = Yuji_Boku({
  weight: "400",
  subsets: ["latin"],
});

// Define the cart item type
interface CartItem {
  product_id: string | number;
  product_name: string;
  product_jp: string;
  product_price: number;
  product_img: string;
  quantity: number;
}

// Define user profile type
interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function CheckoutForm() {
  const { clearCart } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [error, setError] = useState("");
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Load user profile and selected items from localStorage
  useEffect(() => {
    const loadUserDataAndCartItems = async () => {
      setIsLoading(true);
      const supabase = createClient();

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Fetch user profile from user_profiles table
          const { data: profile, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profileError) {
            console.error("Error fetching user profile:", profileError);
          } else if (profile) {
            setUserProfile(profile);
            
            // Parse full name into first and last name
            let firstName = "";
            let lastName = "";
            if (profile.full_name) {
              const nameParts = profile.full_name.split(" ");
              firstName = nameParts[0] || "";
              lastName = nameParts.slice(1).join(" ") || "";
            }

            // Auto-fill form with user profile data
            setFormData(prev => ({
              ...prev,
              firstName,
              lastName,
              email: profile.email || user.email || "",
              phone: profile.phone || "",
              address: profile.address || "",
              city: profile.city || "",
              postalCode: profile.postal_code || "",
            }));
          }
        }

        // Load selected items from localStorage
        const storedItems = localStorage.getItem("checkout_items");
        if (storedItems) {
          try {
            const parsedItems = JSON.parse(storedItems);
            setCheckoutItems(parsedItems);
          } catch (error) {
            console.error("Error parsing checkout items:", error);
            setError("Failed to load cart items");
          }
        } else {
          setError("No items selected for checkout. Please go back to cart and select items.");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("Failed to load user information");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserDataAndCartItems();
  }, []);

  // Use checkoutItems for calculations
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.product_price * item.quantity,
    0
  );
  const shipping = subtotal > 1000 ? 0 : 100;
  const total = subtotal + shipping;
  const totalQuantity = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🧾 Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (checkoutItems.length === 0) {
      setError("No items selected for checkout!");
      return;
    }

    setIsProcessing(true);

    try {
      const orderDescription = `Order for ${formData.firstName} ${formData.lastName}`;

      // Card details if needed
      let cardDetails = null;
      if (formData.paymentMethod === "card") {
        const [expMonth, expYear] = formData.cardExpiry.split("/");
        cardDetails = {
          number: formData.cardNumber,
          exp_month: parseInt(expMonth),
          exp_year: parseInt(`20${expYear}`),
          cvc: formData.cardCVV,
          name: formData.cardName,
          email: formData.email,
        };
      }

      // PayMongo API
      const response = await fetch("/api/paymongo/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          paymentMethod: formData.paymentMethod,
          cardDetails,
          description: orderDescription,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Payment failed");

      // Supabase integration
      const supabase = createClient();

      // Get logged-in user
      const { data: { user } } = await supabase.auth.getUser();

      const orderData = {
        orderNumber: `WG${Date.now().toString().slice(-8)}`,
        date: new Date().toISOString(),
        customerInfo: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
        },
        paymentMethod: formData.paymentMethod,
        items: checkoutItems,
        subtotal,
        shipping,
        total,
      };

      // Insert main order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: user?.id || null,
            order_number: orderData.orderNumber,
            date: orderData.date,
            customer_name: orderData.customerInfo.name,
            customer_email: orderData.customerInfo.email,
            customer_phone: orderData.customerInfo.phone,
            customer_address: orderData.customerInfo.address,
            payment_method: orderData.paymentMethod,
            subtotal: orderData.subtotal,
            shipping: orderData.shipping,
            total: orderData.total,
          },
        ])
        .select()
        .single();

      if (orderError) throw new Error("Failed to save order");

      // Insert order items
      const orderItems = checkoutItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_jp: item.product_jp,
        product_price: item.product_price,
        product_img: item.product_img,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw new Error("Failed to save order items");

      // Optionally update user profile with latest information
      if (user) {
        await supabase
          .from("user_profiles")
          .update({
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postal_code: formData.postalCode,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }

      // Save for receipt
      localStorage.setItem("lastOrder", JSON.stringify(orderData));

      // Clear the checkout items from localStorage after successful order
      localStorage.removeItem("checkout_items");

      // Redirects for GCash / GrabPay
      if (
        formData.paymentMethod === "gcash" ||
        formData.paymentMethod === "grabpay"
      ) {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
      }

      // Success flow
      setIsProcessing(false);
      setOrderComplete(true);
      clearCart();

      setTimeout(() => {
        router.push("/checkout/success");
      }, 2000);
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg =
        err instanceof Error
          ? err.message
          : "Payment processing failed. Please try again.";
      setError(msg);
      console.error("Checkout error:", err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
        <span className="ml-2">Loading your information...</span>
      </div>
    );
  }

  // Empty cart
  if (checkoutItems.length === 0 && !orderComplete) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="h-24 w-24 mx-auto text-base-300 mb-4" />
        <h2 className="text-3xl font-bold mb-4">No items selected</h2>
        <p className="text-base-content/60 mb-6">
          {error || "Please go back to cart and select items to checkout."}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/products")}
        >
          Browse Products
        </button>
        <button
          className="btn btn-ghost ml-2"
          onClick={() => router.back()}
        >
          Back to Cart
        </button>
      </div>
    );
  }

  // Success screen
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
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-4xl font-bold">Checkout</h1>
        {userProfile && (
          <div>
          </div>
        )}
      </div>
      <p className="text-base-content/60 mb-8">
        Complete your order ({checkoutItems.length} selected items)
        {userProfile && ""}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title text-xl flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </h2>
                  {userProfile && (
                    <div className="text-sm text-success flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Auto-filled from your profile
                    </div>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">First Name *</span>
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
                      <span className="label-text font-medium">Last Name *</span>
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

            {/* Shipping */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Street Address *</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="textarea textarea-bordered w-full"
                      rows={3}
                      required
                      placeholder="Enter your complete street address"
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
                        placeholder="City"
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">Postal Code *</span>
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="Postal Code"
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {["cash", "card", "gcash", "grabpay"].map((method) => (
                      <label
                        key={method}
                        className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:border-primary transition-colors"
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={formData.paymentMethod === method}
                          onChange={handleInputChange}
                          className="radio radio-primary"
                        />
                        <span className="capitalize">
                          {method === "cash"
                            ? "Cash on Delivery"
                            : method === "gcash"
                            ? "GCash"
                            : method === "grabpay"
                            ? "GrabPay"
                            : "Credit/Debit Card"}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Card Fields */}
                  {formData.paymentMethod === "card" && (
                    <div className="space-y-4 pt-4 border-t">
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="Card Number"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className="input input-bordered w-full"
                        required
                      />
                      <input
                        type="text"
                        name="cardName"
                        placeholder="Cardholder Name"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        className="input input-bordered w-full"
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="cardExpiry"
                          placeholder="MM/YY"
                          value={formData.cardExpiry}
                          onChange={handleInputChange}
                          className="input input-bordered w-full"
                          required
                        />
                        <input
                          type="text"
                          name="cardCVV"
                          placeholder="CVV"
                          value={formData.cardCVV}
                          onChange={handleInputChange}
                          className="input input-bordered w-full"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-md sticky top-4">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Order Summary</h2>

                <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                  {checkoutItems.map((item) => (
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