import { createClient } from "@/lib/supabase/server";
import { Yuji_Boku } from "next/font/google";

const yuji = Yuji_Boku({
  weight: "400",
  subsets: ["latin"],
});

export async function Hero() {
  const supabase = await createClient();

  // Fetch full user instead of claims
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  return user ? (
    <div className="grid grid-cols-2 flex flex-col gap-20 p-5 items-center">
      <div className="grid grid-rows-3 flex gap-8 justify-center items-center">
        <h1 className={`${yuji.className} welcome-jp p-0 text-7xl lg:text-8xl`}>
          ようこそ
        </h1>
        <p className=" welcome-eng text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
          Welcome to Wagashi
        </p>
        <p className="welcome-desc text-base lg:text-lg text-base-content/70 mx-auto max-w-lg text-center px-4">
          Discover the exquisite art of traditional Japanese confections.
          Handcrafted with care, each wagashi tells a story of seasons, nature,
          and centuries-old craftsmanship.
        </p>
      </div>
      <div className="aspect-[3/4] bg-card relative gap-8 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=736"
          alt="Wagashi"
          
          className="object-cover"
        />

        {/* Overlay accent */}
        <div className="absolute top-6 right-6 bg-white px-6 py-4 shadow-sm">
          <div className={`${yuji.className} text-3xl text-black`}>生菓子</div>
          <div className="text-xs text-muted-foreground mt-1 text-black">
            Namagashi
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="grid grid-cols-2 flex flex-col gap-20 p-5 items-center">
      <div className="grid grid-rows-3 flex gap-8 justify-center items-center">
        <h1 className={`${yuji.className} welcome-jp p-0 text-7xl lg:text-8xl`}>
          ようこそ
        </h1>
        <p className=" welcome-eng text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
          Welcome to Wagashi
        </p>
        <p className="welcome-desc text-base lg:text-lg text-base-content/70 mx-auto max-w-lg text-center px-4">
          Discover the exquisite art of traditional Japanese confections.
          Handcrafted with care, each wagashi tells a story of seasons, nature,
          and centuries-old craftsmanship.
        </p>
      </div>
      <div className="welcome-img aspect-[3/4] bg-card relative gap-8 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=736"
          alt="Wagashi"
          
          className="object-cover"
        />

        {/* Overlay accent */}
        <div className="absolute top-6 right-6 bg-white px-6 py-4 shadow-sm">
          <div className={`${yuji.className} text-3xl text-black`}>生菓子</div>
          <div className="text-xs text-muted-foreground mt-1 text-black">
            Namagashi
          </div>
        </div>
      </div>
    </div>
  );
}
