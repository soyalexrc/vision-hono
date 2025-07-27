# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
```bash
npm install                   # Install dependencies
npm run dev                  # Start local development server
npm run dev:remote          # Start development with remote Cloudflare environment
```

### Database Management
```bash
npm run db:generate         # Generate Drizzle migrations for PostgreSQL
npm run db:migrate          # Run database migrations
npm run db:generate-sqlite  # Generate migrations for SQLite (local dev)
npm run db:up              # Apply database updates
```

### Deployment
```bash
npm run deploy             # Deploy to Cloudflare Workers
npm run cf-typegen        # Generate TypeScript types from Cloudflare bindings
```

## Architecture Overview

### Technology Stack
- **Runtime**: Cloudflare Workers with Hono framework
- **Database**: Neon PostgreSQL (production), SQLite (local development)
- **ORM**: Drizzle ORM
- **Authentication**: JWT-based authentication using jose library
- **Storage**: Cloudflare R2 for object storage
- **Validation**: Zod for runtime validation

### Project Structure
- `/src/index.ts` - Main application entry point with route registration and CORS configuration
- `/src/routes/` - API route handlers organized by domain (auth, cashflow, properties, etc.)
- `/src/db/` - Database schemas and migration utilities
  - `schema.ts` - PostgreSQL schema definitions
  - `schema-sqlite.ts` - SQLite schema for local development
- `/src/middleware/` - Express-style middleware (auth, debug)
- `/src/services/` - Business logic and external service integrations
- `/src/dto/` - Data Transfer Objects and validation schemas
- `/src/utils/` - Utility functions for JWT, error handling, etc.

### Key Patterns

1. **Route Organization**: Routes are modular and imported into main app at `/api/v1` prefix
2. **Authentication**: JWT middleware protects specific routes (owner, client, ally, cashflow, config, external-adviser, user)
3. **CORS**: Configured for specific origins including localhost and production domains
4. **Error Handling**: Global error handler with Zod validation error support
5. **Scheduled Tasks**: Cron jobs for cash flow operations (weekdays at specific times)

### Environment Variables
Required in `.dev.vars` or Cloudflare environment:
- `NEON_DB` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token verification
- `VISION_BUCKET` - R2 bucket binding for file storage

### Database Considerations
- Uses Drizzle ORM with both PostgreSQL (production) and SQLite (development) schemas
- Schemas include entities for properties, cash flow, users, and various lookup tables
- Foreign key relationships and indexes are properly defined