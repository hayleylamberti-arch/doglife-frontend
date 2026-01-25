# DogLife Frontend

## Overview

DogLife is a React/TypeScript frontend application for a dog services marketplace platform targeting South Africa. The platform connects dog owners with trusted service providers offering services like walking, grooming, boarding, daycare, training, and more. Built with Vite and designed for deployment on Vercel, it communicates with a separate backend API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom CSS variables for theming (DogLife brand colors)
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack React Query for server state and caching
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios for API communication
- **Routing**: React Router DOM v6 with protected route patterns

### Project Structure
- `src/components/` - Reusable UI components (booking forms, profile management, service cards)
- `src/pages/` - Route-level page components
- `src/hooks/` - Custom React hooks (authentication, mobile detection, toast notifications)
- `src/lib/` - Utility functions, API client, query client configuration
- `src/assets/` - Static assets like images

### Authentication Pattern
- Token-based authentication stored in localStorage
- AuthProvider context wrapping the application
- Protected routes using React Router v6 Outlet pattern
- Automatic token injection via Axios interceptors

### API Communication
- Base URL configured via `VITE_API_BASE` environment variable
- Automatic detection for Replit development environment
- Centralized API client in `src/lib/api.ts` with auth token handling
- Query client configured for caching and refetching strategies

### Path Aliases
Configured in both `tsconfig.json` and `vite.config.ts`:
- `@/*` → `./src/*`
- `@components/*` → `./src/components/*`
- `@pages/*` → `./src/pages/*`
- `@hooks/*` → `./src/hooks/*`
- `@lib/*` → `./src/lib/*`

### Build Configuration
- TypeScript strict mode enabled
- Output directory: `dist/`
- SPA routing handled via Vercel rewrites in `vercel.json`
- Build command: `tsc && vite build`

## External Dependencies

### Backend API
- Separate backend service (not in this repository)
- Expected at URL defined by `VITE_API_BASE` environment variable
- Uses Prisma ORM with PostgreSQL (referenced in validation schemas and scripts)
- Service types: BOARDING, GROOMING, DAYCARE, WALKING, TRAINING, PET_SITTING, PET_TRANSPORT, MOBILE_VET

### Third-Party Services
- **Google Maps API**: Address autocomplete and geocoding (`VITE_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_BROWSER_KEY`)
- **Zoho CRM**: Supplier profile integration (referenced in `zoho-supplier-profile.tsx`)

### Deployment
- **Vercel**: Primary deployment platform
- Configuration in `vercel.json` with SPA rewrites
- Environment variables managed through Vercel dashboard

### Key npm Dependencies
- `@tanstack/react-query` - Server state management
- `axios` - HTTP client
- `react-router-dom` - Client-side routing
- `react-hook-form` + `zod` - Form validation
- `date-fns` - Date formatting
- `lucide-react` - Icon library
- Full Radix UI component suite for accessible primitives