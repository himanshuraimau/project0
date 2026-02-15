import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helper";
import { UserService } from "@/lib/user-service";

/**
 * DELETE /api/admin/users/[userId]
 * Permanently delete a user and all their data. Admin only.
 * 
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminId = await requireAdmin(request);
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent admin from deleting their own account
    if (adminId === userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    await UserService.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: "User account and all associated data deleted successfully",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    const status = message === "Admin access required" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
