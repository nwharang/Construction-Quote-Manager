# Construction Quoting Tool Documentation

## Project Overview

A web application designed for small construction contractors to create, manage, and output professional quotes. The core principle is to build the **simplest, fastest, most reliable** quoting tool imaginable, ensuring **absolute consistency and correctness** at every step.

## Business Goals

- Create accurate, professional quotes for construction projects
- Track labor and material costs separately
- Support both lump sum and itemized material pricing
- Generate printable quote documents
- Maintain a database of customers and products

## Features

### Core Features

1. **User Authentication & Authorization**
   - Secure login/registration
   - Role-based access control

2. **Quote Management**
   - Create, view, edit, and delete quotes
   - Add tasks (labor) with pricing
   - Add materials (lump sum or itemized)
   - Real-time calculation of totals
   - Complexity and markup adjustments

3. **Customer Management**
   - Add and manage customer information
   - Associate customers with quotes

4. **Product/Inventory Management**
   - Catalog of materials and products
   - Categories, pricing, and metadata

5. **Dashboard**
   - Overview of recent quotes and activities

6. **Settings & Preferences**
   - Currency and locale settings
   - Date and number format preferences

### Quote Creation Workflow

1. **Quote Header:** Project Name, Address, Customer information
2. **Task Management:** Add labor tasks with descriptions and pricing
3. **Material Handling:** Choose between lump sum or itemized materials per task
4. **Pricing Adjustments:** Apply complexity and markup percentages
5. **Review & Output:** Save, view, or print the completed quote

## Technical Architecture

### Tech Stack

#### Frontend
- **Framework:** Next.js (Pages Router)
- **Language:** TypeScript
- **UI Components:** @heroui/react V2, @heroui/toast
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand, React Hook Form
- **API Client:** tRPC client, TanStack Query

#### Backend
- **Framework:** Next.js (API Routes)
- **API Layer:** tRPC
- **Authentication:** next-auth (v4)
- **Validation:** Zod

#### Database
- **RDBMS:** PostgreSQL
- **ORM:** Drizzle ORM
- **Schema Migration:** Drizzle Kit

### Data Model

1. **Users**
   - Authentication and basic user information
   - Role-based permissions

2. **Quotes**
   - Core quote metadata
   - Pricing calculations and totals
   - Status tracking (draft, sent, accepted, rejected)

3. **Tasks** (Labor)
   - Description and pricing
   - Associated with quotes

4. **Materials**
   - Can be added to tasks
   - Either as lump sum or itemized

5. **Products**
   - Product catalog
   - Categories and pricing information

6. **Customers**
   - Customer information
   - Associated with quotes

7. **Settings**
   - User preferences
   - Currency, locale, and format settings

8. **Transactions**
   - Financial transactions
   - Income and expense tracking

### API Structure

The application uses tRPC for end-to-end type-safe API calls between client and server.

**Main API Routers:**
- auth.ts - Authentication and user management
- quote.ts - Quote CRUD and calculations
- task.ts - Task management
- material.ts - Material management
- product.ts - Product catalog operations
- customer.ts - Customer management
- settings.ts - User preferences
- transaction.ts - Financial transaction tracking
- dashboard.ts - Dashboard data aggregation

### Security Approach

- Backend authority: All business logic and calculations reside in tRPC resolvers
- Zero-trust client: All client input is validated before processing
- Strict data validation with Zod schemas
- User scoping: Data is filtered by user ID to ensure isolation
- Secure authentication via next-auth

## UI/UX Principles

1. **Consistency**
   - Uniform layout, spacing, typography, and colors
   - Standardized component usage

2. **Component Standards**
   - Exclusive use of @heroui/react V2 components
   - Consistent patterns for modals, forms, tables, etc.

3. **Styling Rules**
   - Theme colors only (no arbitrary values)
   - Consistent spacing and sizing via Tailwind
   - Standardized typography, borders, and shadows

4. **Interaction Patterns**
   - Inline form validation
   - Standardized loading states
   - Consistent notification system via @heroui/toast

## Development Tools & Workflow

1. **Development Environment**
   - TypeScript with strict mode
   - ESLint, Prettier for code quality
   - Type-safe code generation

2. **Build & Deployment**
   - Next.js build system
   - Docker containerization

3. **Database Tools**
   - Drizzle Kit for migrations
   - Drizzle Studio for database inspection

4. **Testing**
   - Playwright for E2E testing

## Package Dependencies

### Core Dependencies
- next.js 15.2.4
- react 19.0.0
- typescript 5.3.3
- @heroui/react 2.7.6-beta.2
- @heroui/toast 2.0.6
- tailwindcss 4.0.17
- @trpc/server, @trpc/client (v11 beta)
- @tanstack/react-query 5.18.1
- next-auth 4.24.5
- drizzle-orm 0.41.0
- postgres 3.4.5
- zod 3.24.2
- react-hook-form 7.54.2
- zustand 5.0.3

### Development Dependencies
- drizzle-kit 0.30.6
- eslint 8.56.0
- prettier 3.5.3
- @playwright/test 1.51.1

## Repository Structure

```
├── drizzle/            # Database migrations
├── public/             # Static assets
├── scripts/            # Utility scripts
├── src/
│   ├── components/     # Reusable UI components
│   ├── config/         # Application configuration
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom React hooks
│   ├── i18n/           # Internationalization
│   ├── layouts/        # Page layouts
│   ├── lib/            # Utility libraries
│   ├── pages/          # Next.js pages
│   │   ├── admin/      # Admin dashboard pages
│   │   │   ├── customers/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── quotes/
│   │   │   └── settings/
│   │   ├── api/        # API routes
│   │   └── auth/       # Authentication pages
│   ├── server/         # Server-side code
│   │   ├── api/        # tRPC API definitions
│   │   │   └── routers/# API route handlers
│   │   ├── auth/       # Authentication logic
│   │   ├── db/         # Database schema and utilities
│   │   └── utils/      # Server utilities
│   ├── store/          # State management
│   ├── styles/         # Global styles
│   ├── trpc/           # tRPC client configuration
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
└── various config files
```

## Key Principles

1. **Simplicity & Reliability**
   - Focus on core requirements
   - Avoid unnecessary complexity

2. **Consistency**
   - Uniform UI/UX across the application
   - Standardized component usage

3. **Correctness**
   - Robust validation
   - Strong typing
   - Secure implementation

4. **Performance**
   - Fast page loads
   - Optimized data fetching

5. **Security**
   - Strict authorization
   - Input validation
   - Data isolation 