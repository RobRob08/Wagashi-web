"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import {
  User,
  ChevronDown,
  UserCircle,
  LogIn,
  UserPlus,
  ShoppingBag,
} from "lucide-react";

interface User {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: Record<string, string>;
}

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        setUser(data.user);

        // Try to get user's name from localStorage profile
        const savedProfile = localStorage.getItem(`profile_${data.user.id}`);
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          setUserName(profile.full_name || data.user.email || "");
        } else {
          setUserName(
            data.user.user_metadata?.full_name || data.user.email || ""
          );
        }
      }
    };

    loadUser();
  }, []);

  return user ? (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle hover:bg-base-200 transition-colors"
      >
        <User className="h-5 w-5" />
      </div>
      <div
        tabIndex={0}
        className="dropdown-content bg-base-100 rounded-box z-[100] w-64 shadow-xl border border-base-200 mt-3"
      >
        {/* User Info Header */}
        <div className="px-4 py-3 border-b border-base-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
               <User className="h-5 w-5" />
                <span className="hidden sm:inline">Account</span>
                <ChevronDown className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-base-content/50 font-normal">Hey,</p>
              <p className="font-semibold text-sm truncate">{userName}</p>
              {userName !== user.email && (
                <p className="text-xs text-base-content/40 truncate">
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-2">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors rounded-lg w-full"
          >
            <UserCircle className="h-5 w-5" />
            <span>User Profile</span>
          </Link>

          <Link
            href="/orders"
            className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors rounded-lg w-full"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>My Orders</span>
          </Link>

          {/* Logout Button */}
          <div className="mt-1 pt-2 border-t border-base-200">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost gap-2 hover:bg-base-200 transition-colors"
      >
        <User className="h-5 w-5" />
        <span className="hidden sm:inline">Account</span>
        <ChevronDown className="h-4 w-4" />
      </div>
      <div
        tabIndex={0}
        className="dropdown-content bg-base-100 rounded-box z-[100] w-52 p-2 shadow-xl border border-base-200 mt-3"
      >
        <Link
          href="/auth/login"
          className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors rounded-lg w-full"
        >
          <LogIn className="h-5 w-5" />
          <span>Login</span>
        </Link>
        <Link
          href="/auth/sign-up"
          className="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors rounded-lg w-full"
        >
          <UserPlus className="h-5 w-5" />
          <span>Sign Up</span>
        </Link>
      </div>
    </div>
  );
}
