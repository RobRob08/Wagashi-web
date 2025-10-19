"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Loader2,
} from "lucide-react";

interface UserData {
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  created_at?: string;
}

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData>({
    email: "",
    full_name: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        // Try to load additional user data from localStorage or user metadata
        const savedProfile = localStorage.getItem(`profile_${user.id}`);
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          setUserData({
            email: user.email || "",
            ...profile,
          });
        } else {
          setUserData({
            email: user.email || "",
            full_name: user.user_metadata?.full_name || "",
            phone: user.user_metadata?.phone || "",
            address: user.user_metadata?.address || "",
            city: user.user_metadata?.city || "",
            postal_code: user.user_metadata?.postal_code || "",
            created_at: user.created_at,
          });
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setMessage({ type: "error", text: "Failed to load user data" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // Save to localStorage
      if (user) {
        const profileData = {
          full_name: userData.full_name,
          phone: userData.phone,
          address: userData.address,
          city: userData.city,
          postal_code: userData.postal_code,
        };
        localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData));
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ type: "error", text: "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadUserData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <User className="h-32 w-32 mx-auto text-base-300 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Not Logged In</h2>
        <p className="text-base-content/60 mb-8">
          Please log in to view your profile
        </p>
        <a href="/auth/login" className="btn btn-primary">
          Login
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-base-content/60">
            Manage your account information
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-primary gap-2"
          >
            <Edit2 className="h-5 w-5" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="btn btn-ghost gap-2"
              disabled={saving}
            >
              <X className="h-5 w-5" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary gap-2"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Success/Error Message */}
      {message.text && (
        <div
          className={`alert ${
            message.type === "success" ? "alert-success" : "alert-error"
          }`}
        >
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="card bg-base-100 shadow-lg border border-base-200">
        <div className="card-body">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 pb-6 border-b border-base-200">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-24 h-24">
                <span className="text-4xl">
                  {userData.full_name
                    ? userData.full_name.charAt(0).toUpperCase()
                    : userData.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {userData.full_name || "User"}
              </h2>
              <p className="text-base-content/60">{userData.email}</p>
              {user.created_at && (
                <p className="text-sm text-base-content/40 mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member since{" "}
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="mt-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Full Name</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="full_name"
                      value={userData.full_name || ""}
                      onChange={handleInputChange}
                      className="input input-bordered"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="p-3 bg-base-200 rounded-lg">
                      {userData.full_name || "Not set"}
                    </div>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Email</span>
                  </label>
                  <div className="p-3 bg-base-200 rounded-lg flex items-center gap-2">
                    <Mail className="h-4 w-4 text-base-content/60" />
                    {userData.email}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Phone</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={userData.phone || ""}
                      onChange={handleInputChange}
                      className="input input-bordered"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="p-3 bg-base-200 rounded-lg flex items-center gap-2">
                      <Phone className="h-4 w-4 text-base-content/60" />
                      {userData.phone || "Not set"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="pt-6 border-t border-base-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-medium">
                      Street Address
                    </span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={userData.address || ""}
                      onChange={handleInputChange}
                      className="input input-bordered"
                      placeholder="Enter your street address"
                    />
                  ) : (
                    <div className="p-3 bg-base-200 rounded-lg">
                      {userData.address || "Not set"}
                    </div>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">City</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="city"
                      value={userData.city || ""}
                      onChange={handleInputChange}
                      className="input input-bordered"
                      placeholder="Enter your city"
                    />
                  ) : (
                    <div className="p-3 bg-base-200 rounded-lg">
                      {userData.city || "Not set"}
                    </div>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Postal Code</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="postal_code"
                      value={userData.postal_code || ""}
                      onChange={handleInputChange}
                      className="input input-bordered"
                      placeholder="Enter your postal code"
                    />
                  ) : (
                    <div className="p-3 bg-base-200 rounded-lg">
                      {userData.postal_code || "Not set"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Statistics */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h3 className="text-sm text-base-content/60">Total Orders</h3>
            <p className="text-3xl font-bold">
              {(() => {
                const orders = localStorage.getItem("orderHistory");
                return orders ? JSON.parse(orders).length : 0;
              })()}
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h3 className="text-sm text-base-content/60">Total Spent</h3>
            <p className="text-3xl font-bold">
              ₱
              {(() => {
                const orders = localStorage.getItem("orderHistory");
                if (!orders) return "0.00";
                const total = JSON.parse(orders).reduce(
                  (sum: number, order: any) => sum + order.total,
                  0
                );
                return total.toFixed(2);
              })()}
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h3 className="text-sm text-base-content/60">Account Status</h3>
            <p className="text-2xl font-bold text-success">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
