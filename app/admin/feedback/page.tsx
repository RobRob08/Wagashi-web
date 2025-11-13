"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Feedback {
  id: number;
  user_id: string | null;
  name: string | null;
  email: string | null;
  message: string | null;
  created_at: string;
  user_full_name?: string | null;
  user_phone?: string | null;
  user_address?: string | null;
}

export default function AdminFeedbackDashboard() {
  const supabase = createClient();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);

      // Fetch feedback and join with user_profiles
      const { data, error } = await supabase
        .from("feedback")
        .select(`
          id,
          user_id,
          name,
          email,
          message,
          created_at,
          user_profile:user_profiles(full_name, phone, address, city, postal_code)
        `)
        .order("created_at", { ascending: false });

      setLoading(false);

      if (error) {
        console.error("Error fetching feedbacks:", error.message);
        setError("Failed to fetch feedbacks.");
        return;
      }

      if (data) {
        // Flatten the user profile (assume it's an array and take the first element)
        const formatted = data.map((f) => ({
          id: f.id,
          user_id: f.user_id,
          name: f.name,
          email: f.email,
          message: f.message,
          created_at: f.created_at,
          user_full_name: f.user_profile?.[0]?.full_name ?? "N/A", // Get the first profile or N/A
          user_phone: f.user_profile?.[0]?.phone ?? "N/A", // Handle multiple profiles if any
          user_address: f.user_profile?.[0]?.address ?? "N/A", // Handle multiple profiles if any
        }));
        setFeedbacks(formatted);
      }
    };

    fetchFeedbacks();
  }, [supabase]);

  return (
    <div className="max-w-5xl mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Feedback Management</h1>

        <Link href="/admin" className="btn btn-outline">
          ← Back
        </Link>
      </div>
      {loading && <p>Loading feedbacks...</p>}
      {error && <p className="text-error">{error}</p>}

      {!loading && !error && feedbacks.length === 0 && (
        <p>No feedback submitted yet.</p>
      )}

      {!loading && !error && feedbacks.length > 0 && (
        <table className="table-auto w-full border border-border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">User Email</th>
              <th className="px-4 py-2 border">Full Name</th>
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">Address</th>
              <th className="px-4 py-2 border">Message</th>
              <th className="px-4 py-2 border">Created At</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{f.id}</td>
                <td className="px-4 py-2 border">{f.email ?? "Guest"}</td>
                <td className="px-4 py-2 border">{f.user_full_name}</td>
                <td className="px-4 py-2 border">{f.user_phone}</td>
                <td className="px-4 py-2 border">{f.user_address}</td>
                <td className="px-4 py-2 border">{f.message}</td>
                <td className="px-4 py-2 border">
                  {new Date(f.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
