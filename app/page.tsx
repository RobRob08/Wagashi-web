import { Hero } from "@/components/hero";
import Navbar from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Gallery } from "@/components/gallery";
import { Category } from "@/components/category";
import { About } from "@/components/about-us";
export default function Home() {
  

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
         <Navbar/>
        <div className="flex-1 flex flex-col max-w-6xl">
          <Hero />
          </div>
        <Category/>
        <About/>
        <Gallery/>
        <Footer/>
      </div>
    </main>
  );
}
