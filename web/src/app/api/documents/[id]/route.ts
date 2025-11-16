import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/document-service';
import { getUserFromAuth } from '@/lib/auth-helper';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/types';

const documentService = new DocumentService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserFromAuth(request);
    
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const { id: documentId } = await params;
    const document = await documentService.getDocument(documentId);

    if (!document) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Document not found'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if user owns this document
    if (document.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized to access this document'
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    const response: ApiSuccessResponse = {
      success: true,
      data: document,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching document:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to fetch document',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
