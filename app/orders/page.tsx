import Navbar from "@/components/navbar";
import OrdersHistory from "../../components/orders-history";
import AIChatbot from "@/components/ai-chatbot";

export default function OrdersPage() {
  return (
    <main className="min-h-screen min-w-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 w-full">
          <OrdersHistory />
          <AIChatbot/>
        </div>
      </div>
    </main>
  );
}
