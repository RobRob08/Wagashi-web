import { NextResponse, NextRequest } from "next/server";

const BASE = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
const CLIENT = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_CLIENT_SECRET;

async function getAccessToken() {
  const creds = `${CLIENT}:${SECRET}`;
  const auth = Buffer.from(creds).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || "PayPal auth failed");
  return json.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { amount = "1.00", currency = "USD" } =
      (await req.json().catch(() => ({}))) || {};

    if (!CLIENT || !SECRET) throw new Error("Missing PayPal credentials");

    const accessToken = await getAccessToken();

    const res = await fetch(`${BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: currency, value: String(amount) },
          },
        ],
        application_context: {
          shipping_preference: "NO_SHIPPING",
        },
      }),
      cache: "no-store",
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Create order failed");

    return NextResponse.json({ id: json.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
