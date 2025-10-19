import Navbar from "@/components/navbar";
import CheckoutForm from "@/components/checkout-form";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen min-w-screen flex flex-col items-center bg-base-200">
      <div className="flex-1 w-full flex flex-col items-center">
        <Navbar />
        <div className="flex justify-center w-full px-4 py-8">
          <div className="w-full max-w-6xl">
            <CheckoutForm />
          </div>
        </div>
      </div>
    </main>
  );
}
