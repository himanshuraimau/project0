import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/document-service';
import { auth } from '@clerk/nextjs/server';

const documentService = new DocumentService();

// GET /api/documents - Get user's documents
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const documents = await documentService.getDocumentsByUser(userId);

    return NextResponse.json({
      success: true,
      data: documents,
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/documents - Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const documentId = url.searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // First check if document belongs to user
    const document = await documentService.getDocument(documentId);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this document' },
        { status: 403 }
      );
    }

    await documentService.deleteDocument(documentId);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete document',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
