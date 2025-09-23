# Overview

CaféArt POS is a comprehensive point-of-sale platform designed specifically for coffee shops that also serve as art galleries and marketplaces for local artists. The system combines traditional café operations (beverages, food, inventory management) with art commerce features including artist collaboration, artwork submissions, commission tracking, and customer loyalty programs.

The application serves multiple user types: cashiers for daily transactions, managers for oversight and reporting, and administrators for complete system management. It includes features for product customization, Stripe payment integration, real-time inventory tracking, and detailed analytics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing without the complexity of React Router
- **State Management**: TanStack Query (React Query) for server state management, local React state for UI state
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with TypeScript for consistent language across the stack
- **Framework**: Express.js for RESTful API endpoints with session-based authentication
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **Authentication**: Replit Auth integration with OpenID Connect for seamless user management
- **Session Management**: Express sessions with PostgreSQL storage for scalable session persistence

## Data Storage
- **Primary Database**: PostgreSQL via Neon Database for production-ready hosted database
- **ORM Configuration**: Drizzle with schema-first approach, migrations stored in `/migrations` directory
- **Schema Organization**: Shared schema definitions in `/shared/schema.ts` for type consistency between client and server
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple for user authentication

## Payment Processing
- **Payment Provider**: Stripe integration for secure payment processing
- **Frontend**: Stripe React components for payment forms and checkout flows
- **Backend**: Stripe Node.js SDK for server-side payment handling and webhook processing
- **Configuration**: Environment-based API key management for development and production environments

## Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect for secure, hosted authentication
- **Session Management**: Express sessions with PostgreSQL persistence for scalable user sessions
- **Authorization**: Role-based access control (admin, manager, cashier) with middleware protection
- **User Management**: Automatic user creation and profile management through Replit Auth integration

## API Architecture
- **Design Pattern**: RESTful API with resource-based endpoints
- **Route Organization**: Centralized route registration in `/server/routes.ts`
- **Middleware**: Request logging, authentication verification, and error handling
- **Data Layer**: Storage abstraction in `/server/storage.ts` for clean separation of business logic

## Development Workflow
- **Development**: Vite dev server with HMR, TypeScript checking, and Express API server
- **Build Process**: Vite for client bundling, esbuild for server compilation
- **Deployment**: Production build outputs to `/dist` directory for static hosting
- **Environment**: Environment variable configuration for database URLs, API keys, and feature flags

# External Dependencies

## Database Services
- **Neon Database**: Managed PostgreSQL hosting with connection pooling and automatic backups
- **Connection**: @neondatabase/serverless for optimized serverless database connections
- **WebSocket**: ws library for Neon's WebSocket-based database connections

## Authentication Services
- **Replit Auth**: Hosted authentication service with OpenID Connect support
- **Passport Integration**: passport and openid-client for authentication middleware
- **Session Storage**: connect-pg-simple for PostgreSQL-backed session persistence

## Payment Processing
- **Stripe**: Complete payment processing platform
- **Client SDK**: @stripe/stripe-js and @stripe/react-stripe-js for frontend integration
- **Server SDK**: stripe Node.js library for backend payment processing and webhook handling

## UI Component Libraries
- **Radix UI**: Accessible, unstyled component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Lucide React**: Consistent icon library with React components
- **Shadcn/ui**: Pre-built component library combining Radix UI with Tailwind styling

## Development Tools
- **Replit Platform**: Integrated development environment with live reloading and debugging
- **TypeScript**: Static type checking for both client and server code
- **Vite**: Fast build tool with hot module replacement and optimized bundling
- **Drizzle Kit**: Database migration and introspection tools for schema management