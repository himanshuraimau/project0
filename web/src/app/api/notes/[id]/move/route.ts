import { NextRequest, NextResponse } from "next/server";
import { FolderService } from "@/lib/folder-service";
import { auth } from "@clerk/nextjs/server";

const folderService = new FolderService();

// PUT /api/notes/[id]/move - Move note to different folder
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

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
    const { folderId } = body;

    // folderId can be null (move to uncategorized)
    if (folderId !== null && typeof folderId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "folderId must be a string or null",
        },
        { status: 400 }
      );
    }

    await folderService.moveNoteToFolder(params.id, folderId, userId);

    return NextResponse.json({
      success: true,
      message: folderId
        ? "Note moved to folder successfully"
        : "Note moved to uncategorized successfully",
    });
  } catch (error) {
    console.error("Error moving note:", error);

    const statusCode =
      error instanceof Error && error.message === "Folder not found"
        ? 404
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to move note",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode }
    );
  }
}
