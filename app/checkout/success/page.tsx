import Navbar from "@/components/navbar";
import OrderReceipt from "@/components/order-receipt";

export default function CheckoutSuccess() {
  return (
    <main className="min-h-screen min-w-screen flex flex-col items-center bg-base-200">
      <div className="flex-1 w-full flex flex-col items-center">
        <Navbar />
        <div className="flex justify-center w-full px-4 py-8">
          <div className="w-full max-w-4xl">
            <OrderReceipt />
          </div>
        </div>
      </div>
    </main>
  );
}
