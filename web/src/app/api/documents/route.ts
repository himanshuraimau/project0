import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/document-service';
import { getUserFromAuth } from '@/lib/auth-helper';
import { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from '@/lib/types';

const documentService = new DocumentService();

// GET /api/documents - Get user's documents
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);
    
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const documents = await documentService.getDocumentsByUser(userId);

    const response: ApiSuccessResponse = {
      success: true,
      data: documents,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching documents:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to fetch documents',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/documents - Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);
    
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const url = new URL(request.url);
    const documentId = url.searchParams.get('id');

    if (!documentId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Document ID is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // First check if document belongs to user
    const document = await documentService.getDocument(documentId);
    
    if (!document) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Document not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (document.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized to delete this document'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    await documentService.deleteDocument(documentId);

    const response: ApiResponse = {
      success: true,
      message: 'Document deleted successfully',
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error deleting document:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to delete document',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
