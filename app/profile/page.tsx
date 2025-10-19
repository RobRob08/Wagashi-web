import Navbar from "@/components/navbar";
import UserProfile from "@/components/user-profile";

export default function ProfilePage() {
  return (
    <main className="min-h-screen min-w-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 w-full">
          <UserProfile />
        </div>
      </div>
    </main>
  );
}
