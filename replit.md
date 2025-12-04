# Vocalize AI - Voice Assistant Application

## Overview

Vocalize AI is a full-stack voice assistant application that enables users to interact with an AI through voice input. The application captures voice input, transcribes it using browser speech recognition, processes it through Google's Gemini AI, and provides intelligent conversational responses. Users can view their interaction history and the system optionally integrates with Firebase for data persistence.

**Tech Stack:**
- **Frontend:** React with TypeScript, Vite, TailwindCSS, shadcn/ui components
- **Backend:** Node.js with Express
- **Database:** PostgreSQL with Drizzle ORM
- **AI Integration:** Google Gemini AI
- **Optional Storage:** Firebase Firestore
- **Styling:** TailwindCSS with custom theme system

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Component-Based React Application**
- Single-page application (SPA) using Wouter for client-side routing
- Component library built on Radix UI primitives with shadcn/ui styling system
- State management through React Query (@tanstack/react-query) for server state
- Form handling with React Hook Form and Zod validation

**Speech Recognition Integration**
- Custom `useSpeechRecognition` hook wrapping browser Web Speech API
- Real-time voice visualization component showing audio input levels
- Continuous speech recognition with interim and final transcript handling
- Browser compatibility detection for speech recognition support

**UI/UX Design Decisions**
- Deep tech dark theme as default with CSS custom properties for theming
- Responsive design with mobile-first approach
- Framer Motion for smooth animations and transitions
- Custom fonts: Space Grotesk for headings, Outfit and Inter for body text
- Toast notifications for user feedback

### Backend Architecture

**Express.js Server**
- RESTful API architecture with route-based organization
- Middleware stack: JSON parsing, URL encoding, request logging
- Development mode with Vite integration for HMR
- Production build served as static files

**API Endpoints**
- `POST /api/voice-interactions` - Create new voice interaction record
- `GET /api/voice-interactions` - Retrieve interaction history (with optional userId filter and limit)
- `GET /api/voice-interactions/:id` - Retrieve specific interaction by ID
- Additional configuration endpoints for Firebase and Gemini status checks

**Storage Abstraction Layer**
- Interface-based storage pattern (IStorage) allowing multiple implementations
- In-memory storage (MemStorage) for development/testing
- Designed to support database storage implementations (PostgreSQL via Drizzle)
- Separation of concerns between business logic and data persistence

### Data Storage Solutions

**PostgreSQL with Drizzle ORM**
- Type-safe database schema definitions in shared/schema.ts
- Two main tables:
  - `users` - User authentication and profile data
  - `voice_interactions` - Voice interaction records with transcript, AI response, and metadata
- Zod schema validation integrated with Drizzle schemas
- Migration management through Drizzle Kit

**Schema Design**
- Voice interactions include userId (defaults to "anonymous"), transcript, AI response, optional Firebase document ID, and JSON metadata field
- Timestamps automatically managed by database
- UUID-based user IDs

**Optional Firebase Integration**
- Firebase Firestore as supplementary cloud storage
- Lazy initialization pattern - only initialized when configuration is provided
- Dual persistence strategy: local database + optional cloud backup
- Firebase document IDs stored in PostgreSQL for reference

### External Dependencies

**Google Gemini AI**
- Primary AI engine for processing voice input and generating responses
- Uses `gemini-2.5-flash` model for fast, conversational responses
- Configured via `GEMINI_API_KEY` environment variable
- Error handling with fallback messages
- Configuration check endpoint to verify API availability

**Firebase (Optional)**
- Firestore for cloud-based data persistence
- Requires full configuration object (apiKey, authDomain, projectId, etc.)
- Used for backup/sync of voice interactions
- Client-side Firebase SDK integration

**Database Configuration**
- PostgreSQL database required for production
- Connection via `DATABASE_URL` environment variable
- Drizzle ORM for type-safe database operations
- Connection pooling through pg library

**Build and Development Tools**
- Vite for frontend bundling and development server
- ESBuild for backend bundling (selective dependency bundling for cold start optimization)
- TypeScript for full-stack type safety
- Custom Vite plugins for meta image updates and Replit-specific features

**UI Component Libraries**
- Radix UI primitives for accessible, unstyled components
- Custom styling via class-variance-authority
- Lucide icons for consistent iconography
- Framer Motion for animations

**Session Management**
- Express sessions with connect-pg-simple for PostgreSQL-backed sessions
- Designed to support user authentication (passport infrastructure present)

### Key Architectural Decisions

**Monorepo Structure**
- Unified TypeScript configuration across client, server, and shared code
- Path aliases for clean imports (@/, @shared/, @assets/)
- Shared schema definitions between frontend and backend
- Single build process producing both client and server bundles

**Environment-Based Configuration**
- Development mode runs Vite dev server with HMR
- Production mode serves pre-built static files
- Environment variables for API keys and database connections
- Graceful degradation when optional services unavailable

**Type Safety**
- End-to-end TypeScript coverage
- Zod schemas for runtime validation
- Drizzle Zod for database schema validation
- Shared types between client and server

**Error Handling Strategy**
- Zod validation errors converted to user-friendly messages
- API errors caught and returned with appropriate HTTP status codes
- Frontend toast notifications for user feedback
- Console logging for debugging in development

**Performance Optimizations**
- Selective server dependency bundling to reduce cold start times
- Static asset serving in production
- Client-side query caching with React Query
- CSS-in-JS avoided in favor of TailwindCSS for smaller bundles