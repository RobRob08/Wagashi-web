"use client";

import { useEffect, useState } from "react";
import { hasEnvVars } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Search, Heart } from "lucide-react";
import Cart from "./cart-modal";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { createClient } from "@/lib/supabase/client";
import { useWishlist } from "@/app/context/wishlistcontext";

export default function Navbar() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { wishlist } = useWishlist();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error.message);
          setRole(null);
        } else {
          setRole(profile?.role ?? "user");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [supabase]);

  const userLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/about", label: "About Us" },
  ];

  const adminLinks = [
    { href: "/admin/Products", label: "Product Management" },
    { href: "/admin/Users", label: "User Management" },
    { href: "/admin/Orders", label: "Order Management" },
    { href: "/admin/Inventory", label: "Inventory Management" },
    { href: "/admin/CMS", label: "CMS" },
  ];

  const linksToRender = role === "admin" ? adminLinks : userLinks;

  return (
    <nav className="sticky top-0 w-full backdrop-blur-md bg-base-100/70 border-b border-white/10 z-[1000]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo or placeholder for spacing */}
          <div className="flex items-center gap-3 w-[60px]">
            {role !== "admin" && (
              <Link href={"/"}>
                <Image
                  src="/image/logo.png"
                  width={60}
                  height={60}
                  alt="Wagashi Logo"
                />
              </Link>
            )}
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-12">
            {!loading &&
              linksToRender.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-rose-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-6">
            {role !== "admin" && (
              <>
                {/* Search Icon */}
                <Link href="/search" className="btn btn-ghost btn-circle btn-sm">
                  <Search className="h-5 w-5" />
                </Link>

                {/* Wishlist Icon with DaisyUI Indicator */}
                <div className="indicator">
                  <Link
                    href="/wishlist"
                    className="btn btn-ghost btn-circle btn-sm"
                  >
                    <Heart
                      className={`h-5 w-5 ${wishlist.length > 0 ? 'fill-red-500 text-red-500' : ''}`}
                    />
                  </Link>
                  {wishlist.length > 0 && (
                    <span className="badge badge-sm indicator-item bg-transparent border-0 text-primary font-bold">
                      {wishlist.length}
                    </span>
                  )}
                </div>
              </>
            )}

            {role !== "admin" && <Cart />}
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </div>
      </div>
    </nav>
  );
}
