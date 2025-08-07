import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/document-service';
import { auth } from '@clerk/nextjs/server';

const documentService = new DocumentService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const documentId = params.id;
    const document = await documentService.getDocument(documentId);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if user owns this document
    if (document.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to access this document' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document,
    });

  } catch (error) {
    console.error('Error fetching document:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch document',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
