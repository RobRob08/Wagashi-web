import { NextRequest, NextResponse } from "next/server";
import {
  createPaymentIntent,
  createPaymentMethod,
  attachPaymentIntent,
  createSource,
} from "@/lib/paymongo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, paymentMethod, cardDetails, description } = body;

    if (!amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Cash on Delivery - No payment processing needed
    if (paymentMethod === "cash") {
      return NextResponse.json({
        success: true,
        paymentMethod: "cash",
        message: "Order placed successfully",
      });
    }

    // Card Payment
    if (paymentMethod === "card") {
      if (!cardDetails) {
        return NextResponse.json(
          { error: "Card details required" },
          { status: 400 }
        );
      }

      // Create Payment Intent
      const paymentIntent = await createPaymentIntent(
        amount,
        description || "Wagashi Order"
      );

      // Create Payment Method
      const paymentMethodData = await createPaymentMethod(cardDetails);

      // Attach Payment Method to Payment Intent
      const result = await attachPaymentIntent(
        paymentIntent.data.id,
        paymentMethodData.data.id
      );

      return NextResponse.json({
        success: true,
        paymentIntent: result,
        status: result.data.attributes.status,
      });
    }

    // GCash or GrabPay
    if (paymentMethod === "gcash" || paymentMethod === "grabpay") {
      const sourceType = paymentMethod === "grabpay" ? "grab_pay" : "gcash";
      const source = await createSource(
        amount,
        sourceType as "gcash" | "grab_pay",
        description || "Wagashi Order"
      );

      return NextResponse.json({
        success: true,
        source: source,
        checkoutUrl: source.data.attributes.redirect.checkout_url,
      });
    }

    return NextResponse.json(
      { error: "Invalid payment method" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("PayMongo API Error:", error);
    return NextResponse.json(
      { error: error.message || "Payment processing failed" },
      { status: 500 }
    );
  }
}
