# PDF Storage with NeonDB and Prisma

This document explains the new database-backed PDF storage system that replaces the previous file-based storage.

## Overview

The application now stores extracted PDF content in NeonDB using Prisma ORM instead of saving to the local filesystem. This provides better scalability, data management, and user association.

## Database Schema

The `Document` model stores:
- `id`: Unique identifier (CUID)
- `fileName`: Generated filename with timestamp
- `originalName`: Original uploaded filename
- `content`: Raw extracted text
- `cleanContent`: Cleaned and formatted text
- `pages`: Number of pages in the PDF
- `metadata`: JSON metadata from PDF
- `userId`: Associated user ID (optional)
- `createdAt` & `updatedAt`: Timestamps

## API Endpoints

### PDF Parsing
- **POST** `/api/pdf/parse`
  - Upload and parse PDF files
  - Parameters:
    - `file`: PDF file (required)
    - `saveToDatabase`: Save to database (default: true)
    - `saveToFiles`: Save to files (legacy, default: false)
    - `extractImages`: Extract images (default: false)
    - `maxPages`: Limit pages to process (optional)

### Document Management
- **GET** `/api/documents` - Get user's documents
- **GET** `/api/documents/[id]` - Get specific document with full content
- **DELETE** `/api/documents?id=[id]` - Delete a document

## Components

### PDFUploader
Updated to use database storage by default. Shows document ID and success status after upload.

### DocumentsList
New component that:
- Lists all user documents
- Shows document metadata (pages, upload date)
- Allows viewing full document content in modal
- Enables document deletion

### useDocuments Hook
Custom hook for document management:
- `fetchDocuments()` - Get user documents
- `getDocument(id)` - Get document with full content
- `deleteDocument(id)` - Delete document

## Usage Example

```tsx
import { PDFUploader, DocumentsList } from '@/components/pdf';

export default function PDFPage() {
  return (
    <div className="space-y-8">
      <PDFUploader />
      <DocumentsList />
    </div>
  );
}
```

## Migration from File Storage

The system now defaults to database storage. To use the legacy file storage:

```javascript
// When uploading
formData.append('saveToDatabase', 'false');
formData.append('saveToFiles', 'true');
```

## Environment Setup

Ensure your `.env` file contains:
```
DATABASE_URL="your_neondb_connection_string"
```

## Database Operations

Initialize the database:
```bash
bunx prisma generate
bunx prisma db push
```

View data with Prisma Studio:
```bash
bunx prisma studio
```

## Benefits

1. **Scalability**: No local storage limitations
2. **User Association**: Documents linked to specific users
3. **Better Search**: Database queries for document retrieval
4. **Persistence**: Data survives server restarts/deployments
5. **Backup**: Database-level backup and recovery
6. **Analytics**: Query document usage patterns

## File Structure

```
src/
├── lib/
│   ├── prisma.ts              # Prisma client setup
│   ├── document-service.ts    # Document operations
│   └── pdf-parser/
│       └── index.ts           # Updated with database methods
├── hooks/
│   └── use-documents.ts       # Document management hook
├── components/pdf/
│   ├── pdf-uploader.tsx       # Updated uploader
│   ├── documents-list.tsx     # New document list
│   └── index.ts
└── app/api/
    ├── pdf/parse/route.ts     # Updated parse endpoint
    └── documents/
        ├── route.ts           # Document CRUD
        └── [id]/route.ts      # Individual document
```
