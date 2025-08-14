# Project0 - AI-Powered Study App

Transform learning with AI-powered study tools. Convert lectures, videos, and PDFs into organized notes, flashcards, quizzes, and podcasts.

![Project0 Banner](https://via.placeholder.com/1200x400/6366f1/ffffff?text=Project0+-+AI-Powered+Study+Revolution)

## ✨ Features

### 🎤 One-Tap Recording
- Record lectures with a single tap
- Automatic transcription and note generation
- Multi-language support (100+ languages)

### 📄 Smart Content Conversion
- Transform audio files into structured notes
- Process video content and extract key information
- Convert PDF documents into study materials
- YouTube video transcript processing

### 🧠 AI-Powered Study Tools
- **Smart Notes**: AI-generated comprehensive notes from any content
- **Flashcards**: Automated flashcard generation for active recall learning
- **Quizzes**: Interactive quizzes created from your study materials
- **Podcasts**: Convert notes into audio podcasts for on-the-go learning

### 🔍 Advanced Features
- Vector-based semantic search across all your notes
- Intelligent content chunking and organization
- Credit-based usage system with rate limiting
- Real-time chat with your study materials

### 🌐 Cross-Platform
- Responsive web application
- Mobile-optimized interface
- Seamless synchronization across devices

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI components
- **shadcn/ui** - Modern UI component library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Primary database with vector extensions
- **Pinecone** - Vector database for semantic search

### AI & ML
- **Google Gemini API** - Advanced language model
- **AI SDK** - AI integration toolkit
- **Vector Embeddings** - Semantic search capabilities

### Authentication & Security
- **Clerk** - Complete authentication solution
- **Rate Limiting** - API usage protection
- **CORS** - Cross-origin request security

### File Processing
- **PDF Parse** - PDF text extraction
- **Canvas** - PDF rendering and processing
- **Multer** - File upload handling
- **YouTube Transcript API** - Video content extraction

## 📋 Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Clerk account for authentication
- Google Gemini API key
- Pinecone account for vector search

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd web
```

2. **Install dependencies**
```bash
# Using npm
npm install

# Using bun (recommended)
bun install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Fill in your environment variables:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/project0

# Google Gemini API
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Pinecone Vector Database
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name

# Optional: Additional configurations
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Set up the database**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Optional: Seed the database
npx prisma db seed
```

5. **Set up vector search (Pinecone)**
- Create a Pinecone index with dimension 768
- Configure the index name in your environment variables

## 🚀 Development

Start the development server:

```bash
# Using npm
npm run dev

# Using bun (with Turbopack)
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (home)/            # Landing page routes
│   │   ├── api/               # API endpoints
│   │   ├── dashboard/         # Dashboard pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable components
│   │   ├── dashboard/         # Dashboard-specific components
│   │   ├── landing/           # Landing page components
│   │   └── ui/               # UI components (shadcn/ui)
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions and configurations
│   └── middleware.ts         # Next.js middleware
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
└── package.json             # Dependencies and scripts
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm run test-pdf     # Test PDF processing functionality
npm run test-workflow # Test PDF workflow
```

## 📊 Database Schema

The app uses PostgreSQL with the following main entities:

- **Transcripts** - Processed documents and recordings
- **Notes** - AI-generated notes from transcripts
- **Flashcards** - Study flashcards linked to notes
- **Quizzes** - Generated quizzes for testing knowledge
- **NoteChunks** - Vector embeddings for semantic search
- **Usage** - Credit tracking and rate limiting

## 🔐 Authentication

Project0 uses Clerk for authentication, supporting:
- Email/password authentication
- Social login providers
- User management and profiles
- Session management

## 💳 Credit System

The app includes a credit-based usage system:
- Different features consume different amounts of credits
- Rate limiting to prevent abuse
- Usage tracking per user
- Credit renewal and management

## 🌐 API Endpoints

### Core Features
- `POST /api/pdf` - Upload and process PDF files
- `POST /api/transcripts` - Create transcripts from audio/video
- `GET /api/notes` - Retrieve user notes
- `POST /api/chatbot` - Chat with study materials

### Study Tools
- `POST /api/notes/[id]/flashcards` - Generate flashcards
- `POST /api/notes/[id]/quiz` - Create quiz
- `GET /api/search` - Semantic search across notes

### User Management
- `GET /api/credits` - Check credit balance
- `POST /api/subscription` - Manage subscriptions

## 🎯 Usage

1. **Sign up** for an account using Clerk authentication
2. **Upload content** - PDFs, audio files, or paste YouTube URLs
3. **Generate notes** - AI automatically processes your content
4. **Create study materials** - Generate flashcards, quizzes, or podcasts
5. **Search and organize** - Use semantic search to find information
6. **Study on-the-go** - Access your materials from any device

## 🔒 Privacy & Security

- All user data is encrypted and securely stored
- API rate limiting prevents abuse
- Honor code compliant - designed to support learning
- GDPR compliant data handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

- 📧 Email: support@project0.ai
- 📚 Documentation: [docs.project0.ai](https://docs.project0.ai)
- 🐛 Issues: [GitHub Issues](https://github.com/project0/issues)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Authentication by [Clerk](https://clerk.dev)
- AI powered by [Google Gemini](https://ai.google.dev)
- Vector search by [Pinecone](https://pinecone.io)

---

**Made with ❤️ by the Project0 team**

*Transform your learning experience with AI-powered study tools.*