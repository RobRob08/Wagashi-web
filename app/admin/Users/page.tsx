"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  role: "user" | "admin";
  status: "active" | "inactive" | "banned" | "pending";
  created_at: string;
  updated_at: string;
}

const roles = ["user", "admin"];
const statuses = ["active", "inactive", "banned", "pending"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<{ [key: string]: { role: string; status: string } }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [, setCurrentUser] = useState<UserProfile | null>(null);

  // Editable user information
  const [editedUser, setEditedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const updateUser = async (userId: string, field: "role" | "status", value: string) => {
    setSelectedUsers((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
  };

  const saveChanges = async () => {
    for (const userId in selectedUsers) {
      const { role, status } = selectedUsers[userId];
      const { error } = await supabase
        .from("user_profiles")
        .update({ role, status })
        .eq("id", userId);

      if (error) {
        alert(`Failed to update user ${userId}: ${error.message}`);
      }
    }

    // Fetch the updated user list
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching updated users:", error);
    } else {
      setUsers(data);
    }
  };

  const openModal = (user: UserProfile) => {
    setCurrentUser(user);
    setEditedUser({ ...user }); // Initialize editable user with the current user's details
    setModalOpen(true); // Open the modal
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentUser(null);  // Reset the current user
    setEditedUser(null);   // Reset the edited user
  };

  // Handle input changes in the modal
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    if (editedUser) {
      setEditedUser({ ...editedUser, [field]: e.target.value });
    }
  };

  // Save the edited user details to the database
  const saveUserInfo = async () => {
    if (editedUser) {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: editedUser.full_name,
          phone: editedUser.phone,
          address: editedUser.address,
          city: editedUser.city,
          postal_code: editedUser.postal_code,
        })
        .eq("id", editedUser.id);

      if (error) {
        alert(`Failed to save user info: ${error.message}`);
      } else {
        // After saving, update the user list
        const { data, error: fetchError } = await supabase
          .from("user_profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("Error fetching updated users:", fetchError);
        } else {
          setUsers(data);
        }
        closeModal();  // Close the modal after saving
      }
    }
  };

  if (loading) return <p className="p-10 text-center">Loading users...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <table className="table w-full">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.full_name || "-"}</td>
              <td>{user.phone || "-"}</td>
              <td>
                <select
                  className="select select-bordered w-full"
                  value={selectedUsers[user.id]?.role || user.role}
                  onChange={(e) => updateUser(user.id, "role", e.target.value)}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  className="select select-bordered w-full"
                  value={selectedUsers[user.id]?.status || user.status}
                  onChange={(e) => updateUser(user.id, "status", e.target.value)}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </td>
              <td>{new Date(user.created_at).toLocaleString()}</td>
              <td>
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => openModal(user)} // Trigger modal to show/edit user
                >
                  Show Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4">
        <button onClick={saveChanges} className="btn btn-success">
          Save Changes
        </button>
      </div>

      {/* Modal for editing user info */}
      {modalOpen && editedUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h2 className="text-xl font-semibold mb-4">Edit User Information</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={editedUser.full_name || ""}
                onChange={(e) => handleInputChange(e, "full_name")}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={editedUser.phone || ""}
                onChange={(e) => handleInputChange(e, "phone")}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={editedUser.address || ""}
                onChange={(e) => handleInputChange(e, "address")}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={editedUser.city || ""}
                onChange={(e) => handleInputChange(e, "city")}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Postal Code</label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={editedUser.postal_code || ""}
                onChange={(e) => handleInputChange(e, "postal_code")}
              />
            </div>

            <div className="modal-action">
              <button onClick={saveUserInfo} className="btn btn-success">
                Save
              </button>
              <button onClick={closeModal} className="btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
