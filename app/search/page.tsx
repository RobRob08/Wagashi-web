import AIChatbot from "@/components/ai-chatbot";
import Navbar from "@/components/navbar";
import SearchProducts from "@/components/search-products";

export default function SearchPage() {
  return (
    <main className="min-h-screen min-w-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Navbar />
        <div className="flex justify-center min-h-screen w-full px-4 py-6 overflow-x-hidden">
          <div className="w-full max-w-7xl">
            <SearchProducts />
            <AIChatbot/>
          </div>
        </div>
      </div>
    </main>
  );
}
