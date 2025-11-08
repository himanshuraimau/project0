import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, unlink, rmdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const uploadDir = join(process.cwd(), 'storage', 'uploads');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const folder = searchParams.get('folder');

    switch (action) {
      case 'list':
        // List all extraction folders
        if (!existsSync(uploadDir)) {
          return NextResponse.json({ folders: [] });
        }
        
        const items = await readdir(uploadDir, { withFileTypes: true });
        const folders = items
          .filter(item => item.isDirectory())
          .map(item => item.name)
          .filter(name => name.includes('_')); // Filter extraction folders
        
        return NextResponse.json({ folders });

      case 'content':
        // Get content of a specific folder
        if (!folder) {
          return NextResponse.json(
            { error: 'Folder parameter is required' },
            { status: 400 }
          );
        }

        const folderPath = join(uploadDir, folder);
        if (!existsSync(folderPath)) {
          return NextResponse.json(
            { error: 'Folder not found' },
            { status: 404 }
          );
        }

        const contents = await readdir(folderPath, { withFileTypes: true });
        const files = contents
          .filter(item => item.isFile())
          .map(item => item.name);
        
        const subfolders = contents
          .filter(item => item.isDirectory())
          .map(item => item.name);

        return NextResponse.json({ files, subfolders });

      case 'text':
        // Get text file content
        if (!folder) {
          return NextResponse.json(
            { error: 'Folder parameter is required' },
            { status: 400 }
          );
        }

        const textFile = join(uploadDir, folder, 'extracted_text.txt');
        if (!existsSync(textFile)) {
          return NextResponse.json(
            { error: 'Text file not found' },
            { status: 404 }
          );
        }

        const textContent = await readFile(textFile, 'utf-8');
        return NextResponse.json({ content: textContent });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: list, content, or text' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('File management error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to manage files',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder parameter is required' },
        { status: 400 }
      );
    }

    const folderPath = join(uploadDir, folder);
    if (!existsSync(folderPath)) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Delete all files in folder recursively
    const deleteRecursive = async (path: string) => {
      const items = await readdir(path, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = join(path, item.name);
        if (item.isDirectory()) {
          await deleteRecursive(fullPath);
          await rmdir(fullPath);
        } else {
          await unlink(fullPath);
        }
      }
    };

    await deleteRecursive(folderPath);
    await rmdir(folderPath);

    return NextResponse.json({
      success: true,
      message: `Folder ${folder} deleted successfully`,
    });

  } catch (error) {
    console.error('Delete error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete folder',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
