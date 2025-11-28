import { NextRequest, NextResponse } from "next/server";
import { FolderService } from "@/lib/folder-service";
import { auth } from "@clerk/nextjs/server";
import { getUserFromAuth } from "@/lib/auth-helper";

const folderService = new FolderService();

// GET /api/folders/[id] - Get a specific folder with its notes
export async function GET(
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
    const { searchParams } = new URL(request.url);
    const includeNotes = searchParams.get("includeNotes") !== "false";

    const folder = await folderService.getFolderById(
      params.id,
      userId,
      includeNotes
    );

    return NextResponse.json({
      success: true,
      data: folder,
    });
  } catch (error) {
    console.error("Error retrieving folder:", error);

    const statusCode =
      error instanceof Error && error.message === "Folder not found"
        ? 404
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve folder",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode }
    );
  }
}

// PUT /api/folders/[id] - Update folder details
export async function PUT(
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
    const { name, description, color, icon } = body;

    // Validate name length if provided
    if (name && name.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Folder name must be 50 characters or less",
        },
        { status: 400 }
      );
    }

    // Validate description length if provided
    if (description && description.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: "Folder description must be 200 characters or less",
        },
        { status: 400 }
      );
    }

    const folder = await folderService.updateFolder(params.id, userId, {
      name: name?.trim(),
      description: description?.trim(),
      color,
      icon,
    });

    return NextResponse.json({
      success: true,
      data: folder,
    });
  } catch (error) {
    console.error("Error updating folder:", error);

    let statusCode = 500;
    if (error instanceof Error) {
      if (error.message === "Folder not found") {
        statusCode = 404;
      } else if (error.message.includes("already exists")) {
        statusCode = 409;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update folder",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode }
    );
  }
}

// DELETE /api/folders/[id] - Delete folder (notes moved to uncategorized)
export async function DELETE(
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
    await folderService.deleteFolder(params.id, userId);

    return NextResponse.json({
      success: true,
      message: "Folder deleted successfully. Notes moved to uncategorized.",
    });
  } catch (error) {
    console.error("Error deleting folder:", error);

    const statusCode =
      error instanceof Error && error.message === "Folder not found"
        ? 404
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete folder",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode }
    );
  }
}
