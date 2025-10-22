# Project0 - AI-Powered Study App

Transform learning with AI-powered study tools. Convert lectures, videos, and PDFs into organized notes, flashcards, and quizzes.

[![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.13.0-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat-square&logo=postgresql)](https://postgresql.org/)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Development](#-development)
- [Docker Deployment](#-docker-deployment)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Authentication](#-authentication)
- [Subscription System](#-subscription-system)
- [Usage Guide](#-usage-guide)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Support](#-support)

## ✨ Features

### 🎤 Audio & Video Processing
- **One-Tap Recording**: Record lectures with automatic transcription
- **YouTube Integration**: Process YouTube videos and extract transcripts
- **Multi-language Support**: Support for 100+ languages
- **Audio Transcription**: Convert audio files to structured notes

### 📄 Document Processing
- **PDF Processing**: Extract and process PDF documents
- **Web Page Crawling**: Convert web pages into study materials
- **Smart Content Extraction**: Intelligent text extraction and organization
- **Batch Processing**: Process multiple documents simultaneously

### 🧠 AI-Powered Study Tools
- **Smart Notes**: AI-generated comprehensive notes from any content
- **Flashcards**: Automated flashcard generation for active recall learning
- **Quizzes**: Interactive quizzes created from your study materials
- **Mind Maps**: Visual knowledge representation using Mermaid diagrams
- **Podcasts**: Convert notes into AI-generated podcast episodes

### 🔍 Advanced Features
- **Semantic Search**: Vector-based search across all your notes
- **Intelligent Chunking**: Smart content organization and chunking
- **Real-time Chat**: Chat with your study materials using AI
- **Translation Support**: Multi-language note translation
- **Course Generation**: Create structured courses from content

### 🌐 Cross-Platform
- **Responsive Design**: Optimized for desktop and mobile
- **Progressive Web App**: Offline capabilities
- **Real-time Sync**: Seamless synchronization across devices
- **Dark/Light Mode**: Theme switching support

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router and Turbopack
- **React 19** - Latest React features with concurrent rendering
- **TypeScript** - Type-safe development with strict mode
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled UI components
- **shadcn/ui** - Modern, customizable component library
- **Framer Motion** - Animation and gesture library
- **Lexical** - Rich text editor framework

### Backend & Database
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database client with migrations
- **PostgreSQL** - Primary database with vector extensions
- **Pinecone** - Vector database for semantic search
- **Neon Database** - Serverless PostgreSQL hosting

### AI & Machine Learning
- **Google Gemini API** - Advanced language model for content generation
- **OpenAI API** - GPT models for chat and content processing
- **AI SDK** - Unified AI integration toolkit
- **Vector Embeddings** - Semantic search and similarity matching
- **ElevenLabs** - AI voice synthesis for podcasts

### Authentication & Security
- **Clerk** - Complete authentication and user management
- **Rate Limiting** - API usage protection and abuse prevention
- **CORS** - Cross-origin request security
- **Content Security Policy** - XSS and injection attack prevention

### File Processing & Storage
- **UploadThing** - File upload and management service
- **PDF Parse** - PDF text extraction and processing
- **Canvas** - PDF rendering and image processing
- **Multer** - File upload handling
- **YouTube Transcript API** - Video content extraction
- **Cheerio** - Web scraping and HTML parsing

### Payment & Subscriptions
- **Dodo Payments** - Payment processing and subscription management
- **Webhook Integration** - Real-time payment status updates
- **Subscription Lifecycle** - Complete subscription management

## 📋 Prerequisites

- **Node.js 18+** or **Bun 1.0+** (recommended)
- **PostgreSQL 15+** database
- **Clerk** account for authentication
- **Google Gemini API** key
- **Pinecone** account for vector search
- **UploadThing** account for file storage
- **Dodo Payments** account for subscriptions
- **ElevenLabs** account for AI voice synthesis

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd web
```

### 2. Install Dependencies
```bash
# Using Bun (recommended)
bun install

# Using npm
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

### 4. Database Setup
```bash
# Generate Prisma client
bun prisma generate

# Run database migrations
bun prisma db push

# Optional: Open Prisma Studio
bun prisma studio
```

### 5. Start Development Server
```bash
# Using Bun with Turbopack
bun run dev

# Using npm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/project0"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/dashboard"
CLERK_WEBHOOK_SECRET="whsec_..."

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
GEMINI_API_KEY="AIza..."
OPENAI_API_KEY="sk-..."
EMBEDDING_MODEL="text-embedding-3-small"
EMBEDDING_DIM="1536"
CHAT_MODEL="gpt-4o-mini"

# Vector Database
PINECONE_API_KEY="..."
PINECONE_INDEX_NAME="project0-notes"

# File Storage
UPLOADTHING_TOKEN="sk_live_..."

# Payment Processing
DODO_PAYMENTS_API_KEY="..."
DODO_PAYMENTS_WEBHOOK_KEY="..."
DODO_PAYMENTS_RETURN_URL="https://yourdomain.com/success"
DODO_PAYMENTS_ENVIRONMENT="sandbox"
NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID="..."
NEXT_PUBLIC_DODO_PRODUCT_ID_PRO="..."
NEXT_PUBLIC_DODO_PRODUCT_ID_ENTERPRISE="..."
NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION="..."
NEXT_PUBLIC_DODO_PRODUCT_ID_ENTERPRISE_SUBSCRIPTION="..."

# AI Voice Synthesis
ELEVENLABS_API_KEY="..."
ELEVENLABS_BASE_URL="https://api.elevenlabs.io/v1"
ELEVEN_LABS_WEBHOOK_SECRET="..."

# External APIs
UNSPLASH_API_KEY="..."
YOUTUBE_API_KEY="..."
SCRAPPER_API_KEY="..."
SCRAPE_DO_API_TOKEN="..."
PDFCO_API_KEY="..."

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
WEBSITE_URL="https://yourdomain.com"
```

### Optional Variables

```env
# Development
NODE_ENV="development"
NEXT_TELEMETRY_DISABLED="1"

# Additional AI Models
ANTHROPIC_API_KEY="..."
COHERE_API_KEY="..."
```

## 🗄️ Database Setup

### 1. PostgreSQL Setup
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb project0

# Install vector extension
sudo -u postgres psql project0 -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 2. Prisma Configuration
```bash
# Generate Prisma client
bun prisma generate

# Run migrations
bun prisma db push

# Optional: Reset database
bun prisma migrate reset
```

### 3. Pinecone Setup
1. Create a Pinecone account
2. Create an index with dimension 1536
3. Configure the index name in environment variables

## 🚀 Development

### Available Scripts

```bash
# Development
bun run dev          # Start development server with Turbopack
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint

# Database
bun run db:studio    # Open Prisma Studio
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Run database migrations
bun run db:push      # Push schema changes
bun run db:reset     # Reset database
```

### Development Workflow

1. **Start the development server**
   ```bash
   bun run dev
   ```

2. **Open Prisma Studio** (in another terminal)
   ```bash
   bun run db:studio
   ```

3. **Make changes** to your code
4. **Test your changes** in the browser
5. **Run linting** before committing
   ```bash
   bun run lint
   ```

## 🐳 Docker Deployment

### Quick Start
```bash
# Make script executable
chmod +x docker.sh

# Build and run
./docker.sh build
./docker.sh run
```

### Available Commands
```bash
./docker.sh build    # Build Docker image
./docker.sh run      # Run container
./docker.sh stop     # Stop container
./docker.sh logs     # View logs
./docker.sh restart  # Restart container
```

### Manual Docker Commands
```bash
# Build image
docker build -t project0-web .

# Run container
docker run -p 3000:3000 --env-file .env project0-web

# Run with volume mounting for development
docker run -p 3000:3000 -v $(pwd):/app --env-file .env project0-web
```

## 📁 Project Structure

```
web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (home)/                   # Landing page routes
│   │   │   ├── layout.tsx           # Home layout
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── sign-in/             # Sign-in page
│   │   │   └── sign-up/             # Sign-up page
│   │   ├── api/                      # API endpoints
│   │   │   ├── audio/               # Audio processing
│   │   │   ├── chapter/             # Course chapters
│   │   │   ├── chatbot/             # AI chat
│   │   │   ├── course/              # Course management
│   │   │   ├── documents/           # Document handling
│   │   │   ├── mindmap/             # Mind map generation
│   │   │   ├── notes/               # Note management
│   │   │   ├── pdf/                 # PDF processing
│   │   │   ├── podcast/              # Podcast generation
│   │   │   ├── search/               # Semantic search
│   │   │   ├── subscription/         # Subscription management
│   │   │   ├── transcripts/         # Transcript processing
│   │   │   ├── uploadthing/         # File upload
│   │   │   ├── user/                # User management
│   │   │   ├── webhook/             # Webhook handlers
│   │   │   └── webpage/              # Web page processing
│   │   ├── dashboard/               # Dashboard pages
│   │   ├── notes/                   # Notes pages
│   │   ├── pricing/                 # Pricing page
│   │   ├── checkout/                # Payment checkout
│   │   ├── success/                 # Payment success
│   │   ├── customer-portal/         # Customer portal
│   │   ├── credits/                 # Credits page
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles
│   │   └── middleware.ts            # Next.js middleware
│   ├── components/                   # Reusable components
│   │   ├── auth/                    # Authentication components
│   │   ├── audio/                   # Audio components
│   │   ├── chatbot/                 # Chat components
│   │   ├── course/                  # Course components
│   │   ├── dashboard/               # Dashboard components
│   │   ├── flashcards/              # Flashcard components
│   │   ├── landing/                 # Landing page components
│   │   ├── mindmap/                 # Mind map components
│   │   ├── notes/                   # Note components
│   │   ├── pdf/                     # PDF components
│   │   ├── podcast/                 # Podcast components
│   │   ├── quiz/                    # Quiz components
│   │   ├── shared/                  # Shared components
│   │   ├── subscription/            # Subscription components
│   │   ├── transcript/              # Transcript components
│   │   ├── ui/                      # UI components (shadcn/ui)
│   │   ├── user-control.tsx         # User control component
│   │   └── theme-provider.tsx       # Theme provider
│   ├── contexts/                     # React contexts
│   │   ├── course-progress-context.tsx
│   │   └── dashboard-refresh-context.tsx
│   ├── hooks/                       # Custom React hooks
│   │   ├── use-chapter-progress.ts
│   │   ├── use-course-progress.ts
│   │   ├── use-credits.ts
│   │   ├── use-current-theme.ts
│   │   ├── use-delete-course.ts
│   │   ├── use-documents.ts
│   │   ├── use-flashcards.ts
│   │   ├── use-mindmap.ts
│   │   ├── use-mobile.ts
│   │   ├── use-notes.ts
│   │   ├── use-podcast.ts
│   │   ├── use-quiz.ts
│   │   ├── use-semantic-search.ts
│   │   ├── use-subscription.ts
│   │   └── use-translations.tsx
│   ├── lib/                         # Utility functions and configurations
│   │   ├── client/                  # Client-side utilities
│   │   ├── config/                  # Configuration files
│   │   ├── course/                  # Course utilities
│   │   ├── hooks/                   # Custom hooks
│   │   ├── services/                # Service layer
│   │   ├── stores/                  # State management
│   │   ├── types/                   # TypeScript type definitions
│   │   ├── utils/                   # Utility functions
│   │   ├── prisma.ts                # Prisma client
│   │   ├── utils.ts                 # Common utilities
│   │   └── uploadthing/             # UploadThing configuration
│   └── middleware.ts                # Next.js middleware
├── prisma/                          # Database schema and migrations
│   ├── migrations/                  # Database migrations
│   └── schema.prisma                # Database schema
├── public/                          # Static assets
├── components.json                   # shadcn/ui configuration
├── next.config.ts                   # Next.js configuration
├── postcss.config.mjs               # PostCSS configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── eslint.config.mjs                # ESLint configuration
├── Dockerfile                       # Docker configuration
├── docker.sh                        # Docker helper script
├── DOCKER.md                        # Docker documentation
├── package.json                     # Dependencies and scripts
└── README.md                        # This file
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/webhooks/clerk` - Clerk webhook handler
- `GET /api/user/profile` - Get user profile
- `DELETE /api/user/delete` - Delete user account

### Document Processing
- `POST /api/pdf/parse` - Parse PDF documents
- `POST /api/pdf/process` - Process PDF files
- `POST /api/pdf/ai` - AI-powered PDF processing
- `GET /api/pdf/files` - Get PDF files
- `POST /api/webpage/process` - Process web pages
- `POST /api/transcripts` - Create transcripts
- `GET /api/transcripts/[id]` - Get transcript by ID

### Note Management
- `GET /api/notes` - Get user notes
- `POST /api/notes/generate` - Generate notes from content
- `POST /api/notes/generate-focused` - Generate focused notes
- `POST /api/notes/generate-from-text` - Generate notes from text
- `GET /api/notes/[id]` - Get note by ID
- `POST /api/notes/[id]/flashcards` - Generate flashcards
- `POST /api/notes/[id]/quiz` - Generate quiz
- `POST /api/notes/[id]/translate` - Translate note

### Study Tools
- `POST /api/mindmap/generate` - Generate mind map
- `GET /api/mindmap/[noteId]` - Get mind map
- `POST /api/podcast/generate` - Generate podcast
- `GET /api/podcast/[id]` - Get podcast
- `POST /api/podcast/note/[noteId]` - Generate podcast from note
- `POST /api/podcast/webhook` - ElevenLabs webhook

### Course Management
- `POST /api/course/create-course` - Create course
- `POST /api/course/generate-units` - Generate course units
- `POST /api/course/generate-chapters` - Generate chapters
- `POST /api/course/generate-chapters-batch` - Batch generate chapters
- `POST /api/course/generate-chapter-content-batch` - Generate chapter content
- `GET /api/course/[courseId]` - Get course
- `POST /api/course/[courseId]/progress` - Update course progress

### Chapter Management
- `GET /api/chapter/[chapterId]` - Get chapter
- `POST /api/chapter/[chapterId]/transcript` - Generate transcript
- `POST /api/chapter/[chapterId]/flashcards` - Generate flashcards
- `POST /api/chapter/[chapterId]/quiz` - Generate quiz
- `POST /api/chapter/[chapterId]/chat` - Chat with chapter
- `POST /api/chapter/[chapterId]/progress` - Update progress

### Search & AI
- `POST /api/search/semantic` - Semantic search
- `POST /api/chatbot` - AI chatbot
- `POST /api/audio/transcribe` - Audio transcription

### Subscription & Payments
- `POST /api/subscription/create` - Create subscription
- `GET /api/subscription/status` - Get subscription status
- `POST /api/subscription/cancel` - Cancel subscription
- `GET /api/subscription/portal` - Customer portal
- `POST /api/webhook/dodo-payments` - Dodo Payments webhook
- `POST /api/webhook/dodo-subscription` - Dodo subscription webhook

### File Management
- `POST /api/uploadthing` - File upload
- `GET /api/documents` - Get documents
- `GET /api/documents/[id]` - Get document by ID

## 🗃️ Database Schema

### Core Models

#### User
```prisma
model User {
  id           String        @id
  email        String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  subscription Subscription?
}
```

#### Transcript
```prisma
model Transcript {
  id           String   @id @default(cuid())
  fileName     String
  originalName String
  content      String
  cleanContent String
  pages        Int?
  metadata     Json?
  userId       String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  type         String   @default("pdf")
  notes        Note[]
}
```

#### Note
```prisma
model Note {
  id           String             @id @default(cuid())
  title        String
  content      String
  transcriptId String
  userId       String?
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  flashcard    Flashcard?
  chunks       NoteChunk[]        @relation("NoteToChunks")
  transcript   Transcript         @relation(fields: [transcriptId], references: [id], onDelete: Cascade)
  quiz         Quiz?
  mindmap      MindMap?
  translations NoteTranslation[]
  podcasts     Podcast[]
}
```

#### Subscription
```prisma
model Subscription {
  id                 String             @id @default(cuid())
  userId             String             @unique
  dodoSubscriptionId String             @unique
  productId          String
  status             SubscriptionStatus @default(PENDING)
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  nextBillingDate    DateTime?
  cancelAtPeriodEnd  Boolean            @default(false)
  cancelledAt        DateTime?
  trialEnd           DateTime?
  metadata           Json?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  user               User               @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Study Tools Models

#### Flashcard
```prisma
model Flashcard {
  id        String   @id @default(cuid())
  noteId    String   @unique
  userId    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  content   Json
  note      Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)
}
```

#### Quiz
```prisma
model Quiz {
  id        String   @id @default(cuid())
  noteId    String   @unique
  content   Json
  userId    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  note      Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)
}
```

#### MindMap
```prisma
model MindMap {
  id          String   @id @default(cuid())
  title       String
  mermaidCode String
  noteId      String   @unique
  userId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  note        Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)
}
```

#### Podcast
```prisma
model Podcast {
  id                  String        @id @default(cuid())
  noteId              String
  userId              String?
  elevenLabsProjectId String?       @unique
  mode                PodcastMode
  hostVoiceId         String
  guestVoiceId        String?
  qualityPreset       QualityPreset @default(STANDARD)
  durationScale       DurationScale @default(DEFAULT)
  language            String?
  intro               String?
  outro               String?
  status              PodcastStatus @default(GENERATING)
  progress            Float?        @default(0)
  errorMessage        String?
  audioUrl            String?
  audioFileKey        String?
  duration            Int?
  fileSize            Int?
  title               String
  description         String?
  metadata            Json?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  completedAt         DateTime?
  note                Note          @relation(fields: [noteId], references: [id], onDelete: Cascade)
}
```

### Course Management Models

#### Course
```prisma
model Course {
  id           String               @id @default(cuid())
  name         String
  image        String
  userId       String?
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt
  units        Unit[]
  userProgress UserCourseProgress[]
}
```

#### Unit
```prisma
model Unit {
  id        String    @id @default(cuid())
  courseId  String
  name      String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  chapters  Chapter[]
  course    Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
}
```

#### Chapter
```prisma
model Chapter {
  id                 String                @id @default(cuid())
  unitId             String
  name               String
  youtubeSearchQuery String
  videoId            String?
  notes              String?
  transcript         String?
  flashcards         Json?
  createdAt          DateTime              @default(now())
  updatedAt          DateTime              @updatedAt
  chunks             ChapterChunk[]        @relation("ChapterToChunks")
  unit               Unit                  @relation(fields: [unitId], references: [id], onDelete: Cascade)
  questions          Question[]
  userProgress       UserChapterProgress[]
}
```

### Vector Search Models

#### NoteChunk
```prisma
model NoteChunk {
  id         Int                   @id @default(autoincrement())
  note_id    String
  chunk_text String
  embedding  Unsupported("vector")
  note       Note                  @relation("NoteToChunks", fields: [note_id], references: [id], onDelete: Cascade)
}
```

#### ChapterChunk
```prisma
model ChapterChunk {
  id         Int                   @id @default(autoincrement())
  chapter_id String
  chunk_text String
  embedding  Unsupported("vector")
  source     String                @default("notes")
  chapter    Chapter               @relation("ChapterToChunks", fields: [chapter_id], references: [id], onDelete: Cascade)
}
```

## 🔐 Authentication

Project0 uses **Clerk** for authentication, providing:

### Features
- **Email/Password Authentication** - Traditional login
- **Social Login** - Google, GitHub, Apple, etc.
- **Multi-factor Authentication** - Enhanced security
- **User Management** - Profile management and settings
- **Session Management** - Secure session handling
- **Webhook Integration** - Real-time user events

### Configuration
```typescript
// Clerk configuration in layout.tsx
<ClerkProvider
  publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
  signInFallbackRedirectUrl="/dashboard"
  signUpFallbackRedirectUrl="/dashboard"
>
```

### Middleware Protection
```typescript
// middleware.ts
export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up", "/pricing"],
  ignoredRoutes: ["/api/webhooks/clerk"]
});
```

## 💳 Subscription System

Project0 uses **Dodo Payments** for subscription management:

### Subscription Tiers
- **Free Tier** - Limited features and usage
- **Pro Tier** - Enhanced features and higher limits
- **Enterprise Tier** - Full access and priority support

### Features
- **Recurring Billing** - Automatic subscription renewals
- **Trial Periods** - Free trial for new users
- **Cancellation** - Easy subscription cancellation
- **Webhook Integration** - Real-time payment status updates
- **Customer Portal** - Self-service subscription management

### Webhook Handlers
- `POST /api/webhook/dodo-payments` - Payment status updates
- `POST /api/webhook/dodo-subscription` - Subscription lifecycle events

## 🎯 Usage Guide

### Getting Started

1. **Sign Up** - Create an account using Clerk authentication
2. **Choose Plan** - Select a subscription plan that fits your needs
3. **Upload Content** - Upload PDFs, audio files, or paste YouTube URLs
4. **Generate Notes** - AI automatically processes your content into structured notes
5. **Create Study Materials** - Generate flashcards, quizzes, or mind maps
6. **Study & Review** - Use semantic search to find information quickly

### Content Processing

#### PDF Processing
1. Upload PDF files through the dashboard
2. AI extracts and processes text content
3. Generate structured notes automatically
4. Create study materials from the content

#### Audio Processing
1. Record lectures or upload audio files
2. Automatic transcription using AI
3. Generate notes from transcriptions
4. Create study materials for review

#### YouTube Integration
1. Paste YouTube video URLs
2. Extract transcripts automatically
3. Process content into study materials
4. Generate notes, flashcards, and quizzes

### Study Tools

#### Flashcards
- AI-generated flashcards from your notes
- Spaced repetition algorithm
- Multiple choice and open-ended questions
- Progress tracking

#### Quizzes
- Interactive quizzes from your content
- Multiple question types
- Instant feedback
- Performance analytics

#### Mind Maps
- Visual knowledge representation
- Mermaid diagram generation
- Interactive exploration
- Export capabilities

#### Podcasts
- Convert notes into AI-generated podcasts
- Multiple voice options
- Customizable intro/outro
- High-quality audio output

### Advanced Features

#### Semantic Search
- Vector-based search across all notes
- Natural language queries
- Contextual results
- Cross-document search

#### Translation
- Multi-language note translation
- Support for 100+ languages
- Preserve formatting and structure
- Batch translation capabilities

#### Course Generation
- Create structured courses from content
- Automatic unit and chapter generation
- YouTube video integration
- Progress tracking

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connection
bun prisma db push

# Reset database
bun prisma migrate reset

# Check Prisma client
bun prisma generate
```

#### Environment Variables
```bash
# Check environment variables
echo $DATABASE_URL
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Verify .env file
cat .env
```

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
bun install

# Rebuild
bun run build
```

#### Docker Issues
```bash
# Check Docker logs
./docker.sh logs

# Rebuild Docker image
./docker.sh build

# Check environment variables in container
docker exec -it <container-id> env
```

### Performance Issues

#### Database Optimization
- Use database indexes for frequently queried fields
- Implement connection pooling
- Monitor query performance with Prisma Studio

#### API Rate Limiting
- Implement proper rate limiting
- Use caching for frequently accessed data
- Optimize AI API calls

#### File Upload Issues
- Check UploadThing configuration
- Verify file size limits
- Monitor storage usage

### Debug Mode

Enable debug mode for development:
```env
NODE_ENV=development
DEBUG=*
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork the Repository
```bash
git clone <your-fork-url>
cd web
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/amazing-feature
```

### 3. Make Changes
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 4. Test Your Changes
```bash
bun run lint
bun run build
bun run dev
```

### 5. Commit and Push
```bash
git add .
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

### 6. Create Pull Request
- Provide a clear description of changes
- Include screenshots if applicable
- Reference any related issues

### Development Guidelines

#### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

#### Testing
- Test all new features
- Maintain test coverage
- Use proper error handling
- Test edge cases

#### Documentation
- Update README for new features
- Add JSDoc comments for functions
- Document API changes
- Update type definitions

## 📞 Support

### Getting Help

- **📧 Email**: support@project0.ai
- **📚 Documentation**: [docs.project0.ai](https://docs.project0.ai)
- **🐛 Issues**: [GitHub Issues](https://github.com/project0/issues)
- **💬 Discord**: [Join our community](https://discord.gg/project0)

### Reporting Bugs

When reporting bugs, please include:
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser/device information
- Error messages or logs
- Screenshots if applicable

### Feature Requests

For feature requests:
- Describe the feature clearly
- Explain the use case
- Provide mockups if possible
- Consider implementation complexity

## 🙏 Acknowledgments

- **Next.js** - React framework for production
- **shadcn/ui** - Beautiful, accessible UI components
- **Clerk** - Complete authentication solution
- **Google Gemini** - Advanced AI capabilities
- **Pinecone** - Vector database for semantic search
- **Prisma** - Type-safe database client
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **ElevenLabs** - AI voice synthesis
- **Dodo Payments** - Payment processing

---

**Made with ❤️ by the Project0 team**

*Transform your learning experience with AI-powered study tools.*

---

## 📄 License

This project is proprietary software. All rights reserved.

© 2024 Project0. All rights reserved.