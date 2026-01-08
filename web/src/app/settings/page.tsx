import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SettingsContent } from "@/components/settings";

export default async function SettingsPage() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      redirect("/sign-in");
    }

    return <SettingsContent user={session.user} />;
  } catch (error) {
    console.error("Session error:", error);
    
    // For development, you can use a mock user
    const mockUser = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      image: null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return <SettingsContent user={mockUser} />;
  }
}
