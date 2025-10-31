"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleAuth = async () => {
      try {

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Auth error:", sessionError.message);
          router.push("/auth/login");
          return;
        }

        let session = sessionData?.session;

       
        if (!session) {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(window.location.href);

          if (exchangeError) {
            console.error("Exchange error:", exchangeError.message);
            router.push("/auth/login");
            return;
          }

          session = exchangeData.session;
        }

       
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError.message);
            router.push("/protected");
            return;
          }

          
          if (profile?.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/");
          }
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        router.push("/auth/login");
      }
    };

    handleAuth();
  }, [router, supabase]);

  return <p>Finishing login, please wait...</p>;
}
