**Project Context Document (v8r Streamlined)**

**Guiding Principle:** Build the **fastest, most reliable** quoting tool imaginable for small construction contractors, ensuring **absolute consistency and correctness** at every step, with **maximal use of the standard UI component library**.

**Objective:** Create a web app for generating quotes based on **Tasks** (Labor) + **Materials** (Lump Sum OR Itemized). Core goals are ease of use, speed, **strict consistency**, robust security, and **error-free implementation**.

**Core Workflow (Quote & Customer & Product Management - Direct-to-Page Flow):**

- **Strict Adherence:** Quote, Customer, and Product management **MUST** follow the **Standard Workflow for Core Entities** defined below (Direct-to-Page CRUD). Modal-based workflows are **NOT USED** for primary creation, editing, or viewing of these entities.
- **1. List & Creation:**
  - Quotes list is displayed on `/admin/quotes`.
  - Customers list is displayed on `/admin/customers`.
  - Products list is displayed on `/admin/products`.
  - Creation **MUST** be initiated via a "Create" button that navigates to:
    - `/admin/quotes/new` for quotes
    - `/admin/customers/new` for customers
    - `/admin/products/new` for products
  - These pages use React Hook Form for managing the entire entity state.
- **2. Detailed Configuration / Editing:**
  - Adding/Editing full details **MUST** be done via dedicated pages:
    - **Quotes:**
      - **Creation:** `/admin/quotes/new`
      - **Editing:** `/admin/quotes/[id]/edit`
    - **Customers:**
      - **Creation:** `/admin/customers/new`
      - **Editing:** `/admin/customers/[id]/edit`
    - **Products:**
      - **Creation:** `/admin/products/new`
      - **Editing:** `/admin/products/[id]/edit`
  - **Prefetching:** Data prefetching for edit pages is highly recommended.
- **3. Viewing:**
  - **Quotes:**
    - View action navigates to `/admin/quotes/[id]/view`
    - Print action available via `/admin/quotes/[id]/print`
  - **Customers:**
    - View action navigates to `/admin/customers/[id]/view`
    - Includes space for displaying customer history and interactions
  - **Products:**
    - View action navigates to `/admin/products/[id]/view`
    - Displays product details in a read-only format
- **4. Delete Confirmation:**
  - The "Delete" action on list pages uses the `DeleteEntityDialog` modal for confirmation.
  - This is the only modal used in the core workflow for these entities.

**Standard Workflow for Core Entities:**

- **Quotes, Customers & Products:** Follow the **List Page -> New Page / Edit Page / View Page** pattern.
- **Delete Confirmation:** Always use `DeleteEntityDialog` modal for confirmation.

**Mandatory Tech Stack (Strictly Enforced - No Deviations):**

- **Frontend:** Next.js (Pages Router), TypeScript, React
- **API:** tRPC
- **UI:** `@heroui/react` V2, `@heroui/toast` (**Exclusive use for prescribed patterns**)
- **Styling:** Tailwind CSS v4 (**Utilities only**. No CSS files except globals/print, no inline `style` prop)
- **Auth:** `next-auth`
- **DB:** PostgreSQL
- **ORM:** Drizzle ORM

**Data Model & Schema (Drizzle/Postgres - Foundational Rules):**

- **Schema Location (Strict):** All Drizzle schema definitions (tables via `pgTable`, enums via `pgEnum`, and relations via `relations`) **MUST** reside exclusively within the `src/server/db/schema.ts` file. The `/lib` directory **MUST NOT** contain schema definitions. This enforces that only server-side code imports and interacts with the database schema.
- **Tables:** `users`, `sessions`, `accounts`, `verificationTokens`, `quotes`, `tasks`, `products`, `productCategories`, `materials`, `customers`, `settings`, `transactions`. (Implement schema exactly as previously detailed within `src/server/db/schema.ts`).
- **Types & Keys:** Use UUID `id`s, **`NUMERIC(10, 2)` for ALL currency**, `timestamptz` for dates. Enforce `NOT NULL`, Defaults, Foreign Keys precisely.
- **Ownership:** Link `quotes`, `customers`, `products` to `userId` via Foreign Key. **Can be used for tracking/auditing, but data access is generally open within the single company.**

**Backend Logic & Validation (tRPC & Service Layer - Authoritative & Secure Core):**

- **Architecture:** The backend follows a strict **Router -> Service -> Database** pattern.
- **6.1. Service Layer Implementation (Mandatory):**
  - All core business logic **MUST** be encapsulated within dedicated Service classes in `/server/services/` (e.g., `QuoteService`, `CustomerService`, `ProductService`, `SettingService`).
  - Services **MUST** extend `BaseService` or similar for dependency injection (DB) and user context.
  - Services handle direct DB interactions via Drizzle ORM.
  - **`SettingService` Specifics:** Handles fetching/creating/updating settings, including necessary data type conversions (e.g., number to string for DB storage of currency fields) before database operations and converting back (string to number/boolean) before returning data to the client router.
  - Services **MUST** perform checks for data existence and appropriate authorization (e.g., user authentication) before mutations. Strict creator ownership checks are not required for general access.
  - Services contain reusable, testable functions.
  - Services **MUST** handle internal errors and throw specific `TRPCError`s (`NOT_FOUND`, `FORBIDDEN`, etc.).
- **6.2. tRPC Router Responsibilities (`/server/api/routers/`):**
  - Routers define API endpoints (`.query()`, `.mutation()`).
  - Routers **MUST** be thin; delegate ALL business logic to Services.
  - **MANDATORY ZOD VALIDATION:** Routers use Zod schemas (`.input()`) for **rigorous** validation of _every_ procedure input _before_ calling services.
  - Routers extract context (e.g., `ctx.session.user.id`).
  - Routers call corresponding Service methods with validated input and context.
  - Routers catch Service errors and map them to appropriate client-safe `TRPCError`s. **No business logic in routers.**
- **Zero Trust Client:** Treat ALL client input as untrusted. Rely _solely_ on backend validation (Zod in Router, checks in Service).
- **Rounding:** Backend services **MUST** round final monetary values to 2 decimal places before storage/return.
- **User Scoping & Ownership:** **(Simplified)** In this single-company app, all authenticated users can generally view all core data (quotes, customers, products). Mutations (create/update/delete) require user authentication (via `protectedProcedure`) but typically do not need strict creator ownership checks. The `creatorId` field serves primarily for tracking/informational purposes.

**Frontend State Management (Zustand):**

- **Global State (`useConfigStore` - Zustand):**
  - **Single Source of Truth:** Manages global application settings (theme, locale, default charges, company info, etc.).
  - **Hydration:** Initialized on app load by the `ConfigLoader` component, which fetches data via `api.settings.get`.
  - **Persistence:** Store updates _do not_ automatically persist to the backend. Persistence **MUST** happen explicitly via the Settings page save action.
  - **Structure:** The store structure mirrors the database schema for settings, often storing currency/charge values as **strings**, consistent with the DB.

**UI/UX Principles & Defined Consistency (Strictly Enforced):**

- **Consistency Above All:** Uniform layout, spacing, typography, colors, interactions across the _entire_ app. Aim for intuitive, error-free experience.
- **Responsive Design:** Consistent mobile-first implementation using Tailwind modifiers.
- **List Pages Design:** See @LIST_PAGES_CONCEPT.md for detailed guidelines on implementing list pages (Quotes, Customers, Products) with hybrid view system, styling principles, and implementation details.
- **7.1. Defining Strict UI Consistency (Mandatory Rules):**
  - **1. Master Layout:** All `/admin/*` pages **MUST** use `Layout.tsx` with standard `NavBar.tsx` and `SidebarComponent.tsx`.
  - **2. Component Standardization (HeroUI Prioritization):**
    - **Exclusive Use & Prioritization:** Only `@heroui/react` V2 components (or reusable components _precisely matching_ HeroUI style/interaction) are permitted. **Strongly prioritize official HeroUI components** over custom implementations. Avoid custom styled elements replicating component functionality if a suitable HeroUI component exists.
    - **Purposeful Usage:** Use the _same_ HeroUI component for the _same_ function everywhere (e.g., standard Buttons, Table, Modal). Inputs **MUST** follow Section 8.
    - **Maximize HeroUI Adoption:** Actively seek opportunities to use official `@heroui/react` V2 components. Custom implementations are exceptions _only_ when no functionally equivalent HeroUI component is available. Standard library components (`Table`, `Spinner`, `Pagination`, `Modal`, `Card`, `Input`, `Button`, `Select`, `Textarea`, etc.) **MUST** be used instead of custom alternatives.
    - **Defined Reusable Components:** Use defined components (`CustomerSelector`, `TaskList`, `QuoteSummary`, `QuoteStatusSelector`, Modals, `FormField`, etc.) consistently; they **MUST** adhere to HeroUI style and consistency rules.
  - **3. Styling Uniformity (Tailwind & Theme):**
    - Use _only_ theme colors. Use Tailwind scale consistently for spacing/sizing. Use theme typography consistently. Use theme borders/shadows consistently.
  - **4. Interaction Pattern Consistency:**
    - **Forms:** Inline validation below input. Feedback via **standardized** `@heroui/toast`. Consistent loading indicators. Submit data to tRPC backend. **React Hook Form is standard** for complex forms (Quotes, Products, Customers, Settings).
    - **Loading States:** **MUST** use `@heroui/react` Skeleton or Spinners. tRPC query loading states (`isLoading`) should be used where applicable (e.g., initial page loads). Local states (`isUpdating`) can manage button/mutation loading.
    - **Notifications:** **MUST** use `@heroui/toast` (standard appearance via `useAppToast`) for all feedback (success, error, validation).
    - **Settings Management:**
      - Global settings (theme, locale) can be changed via UI elements (e.g., `ThemeToggle`, `LocaleSwitch`) which update `useConfigStore` directly for immediate UI feedback.
      - **Persistence** of ALL settings (including theme/locale changes made via toggles) **ONLY** occurs when the user explicitly clicks "Save Changes" on the `/admin/settings` page.
      - The `/admin/settings` page handles fetching current settings, managing edits via **React Hook Form**, validating input against Zod schema, and triggering the `api.settings.update` mutation. On successful mutation, it updates `useConfigStore` to reflect the persisted state.
  - **5. Data Presentation Consistency:** All currency, dates, percentages **MUST** be formatted using the **exact same** centralized utility functions/hooks.
  - **6. Internationalization (i18n):**
    - **Implementation Note:** This project uses a custom `useTranslation` hook and a flat, prefixed key structure (e.g., `'common.save'`) defined in `src/types/i18n/keys.ts`. It does **not** use the standard nested structure often associated with `i18next`.
    - **Type Safety:** All translation keys **MUST** be defined in the `TranslationKey` union type in `src/types/i18n/keys.ts`.
    - **Synchronization Required:** Adding a new translation key **REQUIRES a two-step process**:
      1. Add the key string literal to the `TranslationKey` union type in `src/types/i18n/keys.ts`.
      2. Add the corresponding key and translated string to **ALL** language implementation files (e.g., `src/utils/locales/en.ts`, `src/utils/locales/vi.ts`).
    - **Failure to synchronize** the implementation files after updating the type will result in TypeScript errors when using the `t()` function with the new key.
  - **7. Quote Form Task/Material UI (Master-Detail Pattern):**
    - **Mandatory Pattern:** The UI for adding, viewing, and editing Tasks and their associated Materials within the Quote Form (`/admin/quotes/new`, `/admin/quotes/[id]/edit`) **MUST** implement the **Master-Detail pattern**.
    - **Mobile Adaptation:** On narrower viewports (typical mobile screens), the pattern **MUST** be adapted to show *either* the Master list (Tasks) *or* the Detail view (selected Task's details, including its Materials if itemized) at one time. Navigation between the list and detail views (e.g., tapping a task item, using "Back" or "Done" buttons) **MUST** be clear and intuitive.
    - **Desktop Adaptation:** On wider viewports, the Master list (Tasks) and the Detail view (Selected Task) **MAY** be displayed side-by-side.
    - **Master View (Task List):** Displays a condensed list of tasks (e.g., description, price). Provides controls for adding new tasks and selecting a task to view/edit in the Detail panel. Includes controls for deleting/reordering tasks directly from the list.
    - **Detail View (Selected Task):** Contains all input fields for the *currently selected* task (description, price, material type toggle). Conditionally displays inputs for Lump Sum cost or the Itemized Material list based on the toggle. The Itemized Material list within the Detail view **MUST** allow inline adding/editing/deleting of materials for *that specific task*.
    - **State Management:** This pattern **MUST** be implemented using React Hook Form (`useFieldArray`) to manage the overall task and nested material state. Local component state (e.g., `useState`) **MUST** be used to track the currently selected task index for the Detail view.

**Component Usage Standards (Linked to UI Consistency):**

- **HeroUI Exclusivity & Precision:** Use `@heroui/react` components **only** (as per Rule 7.1.2).
- **Specialized Number Inputs (Mandatory & Consistent):**
  - **Usage:** **MUST** use the custom wrapper components `CurrencyInput`, `PercentageInput`, and `IntegerInput` (located in `src/components/ui/`) for all number inputs.
  - **Encapsulation:** These components automatically apply consistent formatting, minimum/maximum values, step increments, and appearance (steppers hidden, wheel disabled) based on the input type (`currency`, `percentage`, `integer`) and global settings (`locale`, `currency`) from `useConfigStore`.
  - **Base `NumberInput`:** Direct usage of `@heroui/react` `NumberInput` **MUST** be avoided for currency, percentage, or standard integer quantity inputs. Use the specialized wrappers instead.
- **Labels:** **MUST** use `label` prop or (rarely, with justification) `aria-label` consistently.

**Development Guidelines & Constraints (Process, Quality & Correctness)**

- **Code Quality & Correctness:**
  - **MUST Generate Type-Safe Code:** Output **MUST** strictly adhere to TypeScript rules and defined types, including careful handling of types between React Hook Form state (e.g., numbers), Zod schemas (numbers), the global store (strings for currency), and the database (strings/numeric).
  - **Strive for Correctness / Prioritize Known Issue Resolution:** Code **MUST** strive for correctness. Known complex integration issues (like potential TS/Zod/Form type mismatches) **MUST** be treated as high-priority blockers requiring diligent resolution before dependent features are considered stable/complete.
  - **Internal Validation REQUIRED:** AI **MUST** internally check generated code for type safety and rule adherence _before_ finalizing output. **Do not output code known to contain easily avoidable flaws.**
  - Strict TypeScript; Pass Linters (ESLint/Prettier); TSDoc Clarity.
- **UI Consistency Enforcement:** Generated UI code **MUST strictly adhere to ALL rules defined in Section 7.1.** Internal check required before output.
- **Structure & Naming:** Adhere strictly to defined structure and consistent naming.
- **Reusability:** **Aggressively reuse** components/hooks/functions (frontend & backend). DRY principle.
- **Backend Focus:** Prioritize correct, **secure**, robust backend implementation following the **Service Layer pattern (Sec 6.1)**.
- **Service Layer Adherence:** Generated backend code **MUST** strictly follow the Service Layer pattern defined in Section 6.1.
- **Process & Workflow:**
  - **MANDATORY DOCUMENTATION CONSULTATION (Mandated Libraries):** Recognize potential knowledge gaps for mandated library versions (`@heroui/react` V2, Tailwind v4, Drizzle, tRPC). **MUST** consult current official documentation via web search during planning to verify usage. Plan **MUST** show how findings (APIs, patterns) will be applied _contextually_.
  - **Acknowledge Documentation Request:** Fulfill documentation/planning requests directly _first_.
- **AI Role & Constraints:**
  - **Correctness & Consistency Prerequisite:** Treat generation as complete _only when_ validated as type-safe, logically consistent, adhering to plan/docs, **AND strictly conforming to UI consistency rules (Sec 7.1).** **Persistence is required to resolve known errors/inconsistencies (esp. TS/Zod/Form issues) before considering a task complete.**
  - **Strictly Context-Bound:** Generate based **strictly and solely** on these rules/plan.
  - **Understand Service Layer:** AI **MUST** understand Router vs. Service separation (Sec 6) and generate code accordingly.
  - **No Execution Environment:** **Do not** run code, install packages, build. Validation is static analysis.
  - **Flag Blocking Issues:** Clearly state if rules conflict or prevent correct generation/planning.

**How to Use This Document (AI Alignment Rules):**

- This document is the **primary alignment guide**. All generated code/plans **MUST** strictly adhere to every rule herein. Treat as **ground truth**.
- **Mandatory Adherence (Alignment):** Act as a pair programmer aligned with these rules.
- **Understand Your Role & Constraints:** Assist implementation _according to these rules_. Understand separation of concerns. Static analysis only.
- **Follow the Process:** Plan, consult docs (per rule), internally validate (type-safe, rule adherence, UI consistency) _before_ output. Reference specific sections to show adherence.
- **Prioritize Correctness & Consistency:** Ensure type-safe, logical code matching defined patterns. Persist in resolving known flaws.
- **Be Direct and Concise:** Provide responses directly addressing the request. Avoid unnecessary introductory phrases, summaries (like TLDRs), or overly conversational filler, especially for straightforward answers. Focus on clear, actionable information.
- **Flag Blocking Issues & Ask for Clarification:** State ambiguities or conflicts preventing correct implementation.
