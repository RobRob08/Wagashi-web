import Navbar from "@/components/navbar";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutFailed() {
  return (
    <main className="min-h-screen min-w-screen flex flex-col items-center bg-base-200">
      <div className="flex-1 w-full flex flex-col items-center">
        <Navbar />
        <div className="flex justify-center items-center w-full px-4 py-20">
          <div className="text-center max-w-2xl">
            <XCircle className="h-32 w-32 mx-auto text-error mb-6" />
            <h1 className="text-5xl font-bold mb-4">Payment Failed</h1>
            <p className="text-xl text-base-content/60 mb-2">
              Something went wrong with your payment
            </p>
            <p className="text-base-content/40 mb-8">
              Please try again or contact support if the problem persists
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/checkout" className="btn btn-primary btn-lg">
                Try Again
              </Link>
              <Link href="/" className="btn btn-outline btn-lg">
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
