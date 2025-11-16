import { NextRequest, NextResponse } from "next/server";
import { FolderService } from "@/lib/folder-service";
import { auth } from "@clerk/nextjs/server";

const folderService = new FolderService();

// DELETE /api/folders/[id]/notes/[noteId] - Remove note from folder
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; noteId: string }> }
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
    await folderService.removeNoteFromFolder(params.noteId, userId);

    return NextResponse.json({
      success: true,
      message: "Note removed from folder successfully",
    });
  } catch (error) {
    console.error("Error removing note from folder:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove note from folder",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
