import { NextRequest, NextResponse } from "next/server";
import { FolderService } from "@/lib/folder-service";
import { auth } from "@clerk/nextjs/server";

const folderService = new FolderService();

// GET /api/folders - Get all folders for the authenticated user
export async function GET(request: NextRequest) {
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

    const folders = await folderService.getFoldersByUser(userId);

    return NextResponse.json({
      success: true,
      data: folders,
    });
  } catch (error) {
    console.error("Error retrieving folders:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve folders",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/folders - Create a new folder
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, color, icon } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Folder name is required",
        },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length > 50) {
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

    const folder = await folderService.createFolder({
      name: name.trim(),
      description: description?.trim(),
      color,
      icon,
      userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: folder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating folder:", error);

    const statusCode =
      error instanceof Error && error.message.includes("already exists")
        ? 409
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create folder",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode }
    );
  }
}
