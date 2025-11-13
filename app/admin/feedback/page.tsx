"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Feedback {
  id: number;
  user_id: string | null;
  name: string | null;
  email: string | null;
  message: string | null;
  created_at: string;
  user_email?: string | null; // join to auth.users
}

export default function AdminFeedbackDashboard() {
  const supabase = createClient();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);

      // Fetch feedback and join with auth.users to get user email
      const { data, error } = await supabase
        .from("feedback")
        .select(`
          id,
          user_id,
          name,
          email,
          message,
          created_at,
          user:user_id (
            email
          )
        `)
        .order("created_at", { ascending: false });

      setLoading(false);

      if (error) {
        console.error(error);
        setError("Failed to fetch feedbacks.");
        return;
      }

      if (data) {
        // Flatten user email
        const formatted = data.map((f) => ({
          id: f.id,
          user_id: f.user_id,
          name: f.name,
          email: f.email,
          message: f.message,
          created_at: f.created_at,
          user_email: f.user?.[0]?.email ?? null,
        }));
        setFeedbacks(formatted);
      }
    };

    fetchFeedbacks();
  }, [supabase]);

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Feedback Dashboard</h1>

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
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Message</th>
              <th className="px-4 py-2 border">Created At</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{f.id}</td>
                <td className="px-4 py-2 border">{f.user_email ?? "Guest"}</td>
                <td className="px-4 py-2 border">{f.name ?? "-"}</td>
                <td className="px-4 py-2 border">{f.email ?? "-"}</td>
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
