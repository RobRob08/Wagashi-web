"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={logout}
      className="flex items-center gap-3 px-4 py-3 w-full hover:bg-error/10 hover:text-error transition-colors rounded-lg"
    >
      <LogOut className="h-5 w-5" />
      <span className="font-medium">Logout</span>
    </button>
  );
}
