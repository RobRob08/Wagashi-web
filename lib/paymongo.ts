// PayMongo API Utilities
// Documentation: https://developers.paymongo.com/docs

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY;
const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

// Encode secret key to base64 for authorization
const getAuthHeader = () => {
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error("PayMongo secret key not configured");
  }
  const encoded = Buffer.from(PAYMONGO_SECRET_KEY).toString("base64");
  return `Basic ${encoded}`;
};

export interface PayMongoPaymentIntent {
  data: {
    id: string;
    type: string;
    attributes: {
      amount: number;
      currency: string;
      status: string;
      client_key: string;
      payment_method_allowed: string[];
    };
  };
}

export interface PayMongoSource {
  data: {
    id: string;
    type: string;
    attributes: {
      amount: number;
      currency: string;
      type: string;
      redirect: {
        checkout_url: string;
        success: string;
        failed: string;
      };
      status: string;
    };
  };
}

// Create Payment Intent for Card Payments
export async function createPaymentIntent(
  amount: number,
  description: string
): Promise<PayMongoPaymentIntent> {
  const response = await fetch(`${PAYMONGO_API_URL}/payment_intents`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100), // Convert to centavos
          payment_method_allowed: ["card"],
          currency: "PHP",
          description: description,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.errors?.[0]?.detail || "Failed to create payment intent"
    );
  }

  return response.json();
}

// Attach Payment Method to Payment Intent
export async function attachPaymentIntent(
  paymentIntentId: string,
  paymentMethodId: string
): Promise<PayMongoPaymentIntent> {
  const response = await fetch(
    `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}/attach`,
    {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethodId,
            return_url: `${
              process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
            }/checkout/success`,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.errors?.[0]?.detail || "Failed to attach payment method"
    );
  }

  return response.json();
}

// Create Payment Method (Card)
export async function createPaymentMethod(cardDetails: {
  number: string;
  exp_month: number;
  exp_year: number;
  cvc: string;
  name: string;
}): Promise<{ data: { id: string } }> {
  const response = await fetch(`${PAYMONGO_API_URL}/payment_methods`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          type: "card",
          details: {
            card_number: cardDetails.number.replace(/\s/g, ""),
            exp_month: cardDetails.exp_month,
            exp_year: cardDetails.exp_year,
            cvc: cardDetails.cvc,
          },
          billing: {
            name: cardDetails.name,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.detail || "Invalid card details");
  }

  return response.json();
}

// Create Source for GCash/GrabPay
// Note: PayMongo supports gcash and grab_pay as source types
export async function createSource(
  amount: number,
  type: "gcash" | "grab_pay",
  description: string
): Promise<PayMongoSource> {
  const response = await fetch(`${PAYMONGO_API_URL}/sources`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100), // Convert to centavos
          redirect: {
            success: `${
              process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
            }/checkout/success`,
            failed: `${
              process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
            }/checkout/failed`,
          },
          type: type,
          currency: "PHP",
          description: description,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.errors?.[0]?.detail || "Failed to create payment source"
    );
  }

  return response.json();
}

// Retrieve Payment Intent Status
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<PayMongoPaymentIntent> {
  const response = await fetch(
    `${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`,
    {
      headers: {
        Authorization: getAuthHeader(),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to retrieve payment intent");
  }

  return response.json();
}

// Retrieve Source Status
export async function getSource(sourceId: string): Promise<PayMongoSource> {
  const response = await fetch(`${PAYMONGO_API_URL}/sources/${sourceId}`, {
    headers: {
      Authorization: getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve payment source");
  }

  return response.json();
}
