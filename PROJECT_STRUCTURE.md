# Project Structure Overview

This document provides a high-level overview of the key directories and files within the project, intended as a quick reference.

**Note:** This is a manually maintained file and may not always reflect the absolute latest changes.

## `/src/` - Source Code Root

### `/src/server/` - Backend (tRPC, Services, DB)

-   **`/db/`**: Contains database-related files.
    -   `schema.ts`: Defines the Drizzle ORM database schema (tables, columns, relations).
    -   `index.ts`: (Potentially) Drizzle client initialization or re-export.
-   **`/api/`**: Contains tRPC API definitions.
    -   `root.ts`: The main AppRouter merging all sub-routers.
    -   `trpc.ts`: tRPC initialization (`initTRPC`, context creation, procedure helpers).
    -   **`/routers/`**: Individual tRPC routers for different concerns.
        -   `quote.ts`: Defines tRPC procedures (queries/mutations) related to quotes. Delegates logic to `QuoteService`.
        -   `customer.ts`: Defines tRPC procedures for customers. Delegates logic to `CustomerService`.
        -   `product.ts`: Defines tRPC procedures for products. Delegates logic to `ProductService`.
        -   `task.ts`: Defines tRPC procedures for quote tasks. Delegates logic primarily through `QuoteService`.
        -   `material.ts`: Defines tRPC procedures for quote materials. Delegates logic primarily through `QuoteService`.
        -   `dashboard.ts`: Defines tRPC procedures for dashboard data. Delegates logic to `DashboardService`.
-   **`/services/`**: Contains the business logic layer.
    -   `index.ts`: Initializes and exports service instances (e.g., `createServices`, `DB` type). Also contains shared helpers like `toNumber`.
    -   `baseService.ts`: Base class for services, potentially handling common dependencies (like `DB` or `userId`).
    -   `quoteService.ts`: Core business logic for creating, reading, updating, deleting quotes, tasks, materials, and performing calculations.
    -   `customerService.ts`: Business logic related to customers.
    -   `productService.ts`: Business logic related to products.
    -   `dashboardService.ts`: Business logic for aggregating and retrieving dashboard statistics.

### `/src/pages/` - Frontend (Next.js Pages Router)

-   **`/admin/`**: Contains pages requiring authentication.
    -   **`/quotes/`**: Pages related to quote management.
        -   `index.tsx`: The main quote list page. Displays quotes in a table, handles pagination/search, and includes the button to launch `CreateQuoteModal`.
        -   `new.tsx`: (Likely deprecated/unused now) Previously the dedicated page for creating new quotes.
        -   `[id]/index.tsx`: Quote detail view page.
        -   `[id]/edit.tsx`: Page for editing the full details of an existing quote (tasks, materials, charges).
    -   **`/customers/`**: Pages for customer management (List, Detail, Edit, New).
    -   **`/products/`**: Pages for product management.
    -   **`/dashboard/`**: Dashboard overview page.
    -   `(other entity pages...)`
-   `_app.tsx`: Main application component, wraps pages, sets up providers (tRPC, NextAuth, Theme, etc.).
-   `_document.tsx`: Customizes the server-rendered document shell (html, head, body).
-   `index.tsx`: Public landing page.
-   `/api/auth/[...nextauth].ts`: NextAuth.js API route for authentication handling.

### `/src/components/` - Reusable UI Components

-   **`/quotes/`**: Components specifically for quote features.
    -   `CreateQuoteModal.tsx`: Modal component for the initial creation of a quote (title, customer, notes). Launched from `pages/admin/quotes/index.tsx`.
    -   `QuoteList.tsx`: (Potentially used) Component to display the list/table of quotes.
    -   `QuoteDetail.tsx`: (Potentially used) Component displaying details of a single quote.
    -   `TaskList.tsx`: Component for displaying and managing the list of tasks within a quote (used on `edit.tsx`).
    -   `MaterialInputRow.tsx`: Component for inputting details of a single material within a task.
    -   `QuoteSummary.tsx`: Component displaying calculated totals (subtotals, charges, grand total).
    -   `QuoteStatusSelector.tsx`: Component for selecting the quote status.
    -   `(other quote-specific components...)`
-   **`/customers/`**: Components related to customers.
    -   `CustomerSelect.tsx`: Reusable dropdown/autocomplete for selecting an existing customer.
-   **`/shared/`**: General reusable components across features.
    -   `EntityList.tsx`: (Potentially used) Generic component for displaying lists of entities (though may be superseded by direct HeroUI Table usage).
    -   `EntityModal.tsx`: (Potentially used) Generic base modal for entity forms.
    -   `GenericDeleteModal.tsx`: Standardized modal for confirming deletions.
-   **`/ui/`**: Base UI elements, possibly wrappers around HeroUI or custom primitives.
    -   `FormField.tsx`: Consistent wrapper for form fields, handling labels/errors.
-   **`/providers/`**: React Context providers (e.g., `ToastProvider`, `UIProvider`).

### `/src/hooks/` - Reusable React Hooks

-   `useQuoteCalculations.ts`: Hook potentially containing frontend logic for calculating quote totals (should ideally mirror backend logic or be used cautiously).
-   `useQuoteForm.ts`: Hook for managing the state and logic of the quote form (likely used on `edit.tsx`).
-   `useTaskManagement.ts`: Hook specifically for managing the task list state within the quote form.
-   `useTranslation.ts`: Hook for handling internationalization/localization.

### `/src/store/` - State Management (e.g., Zustand)

-   `index.ts`: Main store setup or re-export.
-   `quoteStore.ts`: Zustand store potentially managing state for the quote creation/editing process.
-   `uiStore.ts`: Store for general UI state (e.g., theme, component settings).
-   `entityStore.ts`: Store potentially related to managing generic entity operations or settings.
-   `toastStore.ts`: Store for managing application-wide toast notifications.

### `/src/utils/` - Utility Functions

-   `api.ts`: tRPC client setup and typed hooks (`api.quote.create.useMutation`, etc.).
-   `currency.ts`: Utilities for formatting and potentially rounding currency values (e.g., `formatCurrency`, `roundCurrency`).
-   `formatters.ts`: Utilities for formatting dates, user-friendly IDs, etc. (`formatDate`, `formatUserFriendlyId`).
-   `(other utility files...)`

### `/src/lib/` - Library-specific code or configurations

-   **(Potential) `/db/`**: Might contain Drizzle configuration or migration files if not in root `/drizzle`.

### `/src/styles/`

-   `globals.css`: Global CSS styles, Tailwind base/components/utilities imports.

## Root Directory

-   `drizzle.config.ts`: Configuration for Drizzle Kit (migrations).
-   `tailwind.config.ts`: Tailwind CSS configuration.
-   `tsconfig.json`: TypeScript configuration.
-   `next.config.mjs`: Next.js configuration.
-   `package.json`: Project dependencies and scripts.
-   `.env`: Environment variables (should be in `.gitignore`).
-   `CONTEXT.md`: The primary guiding principles and rules for the project.
-   `PROJECT_STRUCTURE.md`: (This file) A high-level overview of the project structure.
-   `README.md`: General project README.
-   `/drizzle/`: (Typically) Contains generated Drizzle migration files.
