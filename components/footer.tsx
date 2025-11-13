"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export function Footer() {
  const supabase = useMemo(() => createSupabaseClient(), []);

  // Auth user state
  const [user, setUser] = useState<User | null>(null);

  // Feedback form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch authenticated user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Auth error:", error.message);
        return;
      }
      if (data.user) {
        setUser(data.user);
        if (data.user.email) setEmail(data.user.email);
        if (data.user.user_metadata?.full_name) {
          setName(data.user.user_metadata.full_name);
        }
      }
    };
    getUser();
  }, [supabase]);

  // Handle feedback submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("feedback").insert([
      {
        user_id: user?.id || null,
        name,
        email,
        message,
      },
    ]);

    setLoading(false);

    if (insertError) {
      console.error(insertError);
      setError("Failed to send feedback. Please try again.");
    } else {
      setSubmitted(true);
      setMessage("");
      setName(user?.user_metadata?.full_name || "");
    }
  };

  return (
    <footer id="contact" className="py-10 lg:py-24 bg-base-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl tracking-[0.3em]">WAGASHI</div>
              <div className="w-px h-6 bg-border"></div>
              <div className="text-sm text-muted-foreground">
                <img
                  src="/image/logo.png"
                  width={60}
                  height={60}
                  alt="Wagashi Logo"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Preserving the sacred art of Japanese confectionery. Each piece
              handcrafted with devotion to capture the essence of the seasons.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <div className="text-sm mb-6">Navigation</div>
            <div className="space-y-3">
              <a
                href="#products"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Products
              </a>
              <a
                href="#about"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                About
              </a>
              <a
                href="#gallery"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Gallery
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <div className="text-sm mb-6">Contact</div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>Gion District</div>
              <div>Quezon City, Philippines</div>
              <div className="pt-2">info@wagashi.jp</div>
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        <div className="border-t border-border pt-8 mt-12">
          <h3 className="text-lg font-semibold mb-4">Send us your Feedback</h3>

          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start"
            >
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input input-bordered w-full"
                required
              />
              <input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full"
                required
              />
              <textarea
                placeholder="Your Feedback"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="textarea textarea-bordered md:col-span-3 w-full"
                required
              />
              <button
                type="submit"
                className="btn btn-primary md:col-span-3"
                disabled={loading}
              >
                {loading ? "Sending..." : "Submit Feedback"}
              </button>
              {error && (
                <p className="text-error text-sm md:col-span-3">{error}</p>
              )}
            </form>
          ) : (
            <div className="text-success text-sm">
              🎉 Thank you for your feedback!
            </div>
          )}
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
          <div className="text-sm text-muted-foreground">
            © 2025 Wagashi. All rights reserved.
          </div>
          <div className="text-xs text-muted-foreground">
            十二代目 • 12th Generation Master Artisan
          </div>
        </div>
      </div>
    </footer>
  );
}
