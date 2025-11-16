import { NextRequest, NextResponse } from "next/server";
import { FolderService } from "@/lib/folder-service";
import { auth } from "@clerk/nextjs/server";

const folderService = new FolderService();

// POST /api/folders/[id]/notes - Add notes to folder
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const params = await context.params;
    const body = await request.json();
    const { noteIds } = body;

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "noteIds array is required and must not be empty",
        },
        { status: 400 }
      );
    }

    await folderService.addNotesToFolder(params.id, noteIds, userId);

    return NextResponse.json({
      success: true,
      message: `${noteIds.length} note(s) added to folder successfully`,
    });
  } catch (error) {
    console.error("Error adding notes to folder:", error);

    const statusCode =
      error instanceof Error && error.message === "Folder not found"
        ? 404
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to add notes to folder",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode }
    );
  }
}
