**Guiding Principle:** Build the **simplest, fastest, most reliable** quoting tool imaginable for small construction contractors, ensuring **absolute consistency and correctness** at every step.

**Objective:** Create a web app for generating quotes based on **Tasks** (Labor) + **Materials** (Lump Sum OR Itemized). Core goals are ease of use, speed, **strict consistency**, robust security, and **error-free implementation**.

**Core Workflow (Quote Management - Hybrid Flow):**

1.  **List & Creation:**
    - Quotes list is displayed on `/admin/quotes`.
    - Creation can be initiated via:
        - A **standardized modal** (`CreateQuoteModal`) launched from the list page (`/admin/quotes`) using a "Create" button and `useDisclosure`.
            - This modal collects essential header info: Title, Customer, optional Notes.
            - **On success, it currently redirects to the dedicated edit page (`/admin/quotes/[id]/edit`).**
        - Navigating directly to the dedicated `/admin/quotes/new` page.
            - This page allows creating a quote with full details (tasks, materials, etc.) using a different form setup (potentially Zustand-based).
2.  **Detailed Configuration / Editing:**
    - Editing/Adding full details can be done via:
        - A **standardized detail/edit modal** (`QuoteDetailModal`) launched from the list page (`/admin/quotes`) using an "Edit" action.
            - This modal uses TanStack Form for managing the full quote details.
            - **Add Tasks:** Uses the `TaskList` component, which renders fields internally using TanStack Form helpers.
                - `description` (`Textarea`).
                - `Task Price` (Currency `NumberInput`).
                - Materials Choice (Radio): Lump Sum (`estimatedMaterialsCostLumpSum`) OR Itemized (using nested fields for quantity, unitPrice, `ProductSelector`, notes).
            - **Review Totals:** Displays calculated totals via `QuoteSummary`.
            - **Adjustments:** `markupCharge` (%).
            - **Final Total:** Display `grandTotal`.
        - Navigating to the dedicated edit page (`/admin/quotes/[id]/edit`), linked from the view page (`/admin/quotes/[id]`) and reached after modal creation.
            - This page seems to use a `useReducer` pattern for state management and includes components like `MaterialInputRow`.
    - **Prefetching:** Data prefetching for the `QuoteDetailModal` (when opened from the list) is recommended.
3.  **Save/Output:**
    - Saving occurs via buttons within `QuoteDetailModal`, `/admin/quotes/new`, or `/admin/quotes/[id]/edit`, using appropriate backend calls (`api.quote.create` or `api.quote.update`).
    - "View" (`QuoteViewModal` from list) and "Print" (`/admin/quotes/[id]/print`) actions are available.

**Standard Workflow for Core Entities (Quotes, Customers, Products):**
Unless explicitly stated otherwise, Customers and Products follow the **List Page -> Create Modal -> Detail/Edit Modal** pattern. Dedicated `/edit` pages for these entities are generally avoided. **Quotes currently use a hybrid approach, employing both modals and dedicated `/new` and `/edit` pages.**

**Mandatory Tech Stack (Strictly Enforced - No Deviations):**

- **Frontend:** Next.js (Pages Router), TypeScript, React
- **API:** tRPC
- **UI:** `@heroui/react` V2, `@heroui/toast` (**Exclusive use for prescribed patterns**)
- **Styling:** Tailwind CSS v4 (**Utilities only**. No CSS files except globals/print, no inline `style` prop)
- **Auth:** `next-auth`
- **DB:** PostgreSQL
- **ORM:** Drizzle ORM

**Data Model & Schema (Drizzle/Postgres - Foundational Rules):**

- **Tables:** `users`, `quotes`, `tasks`, `quoteMaterials`, `products`, `customers`, `settings`. (Implement schema exactly as previously detailed).
- **Types & Keys:** Use UUID `id`s, **`NUMERIC(10, 2)` for ALL currency**, `timestamptz` for dates. Enforce `NOT NULL`, Defaults, Foreign Keys precisely.
- **User-Friendly IDs:** **Universal UI Display Format:** `"#<sequentialId> (<short_uuid>)"` (e.g., `#123 (ae42b8...)`) for Quotes, Products, Customers. Internal logic **MUST** use full UUID (`id`). `sequentialId` is `SERIAL`.
- **Ownership:** Link `quotes`, `customers`, `products` to `userId` via Foreign Key. **Crucial for data scoping.**

**Backend Logic & Validation (tRPC & Service Layer - Authoritative & Secure Core):**

- **Architecture:** The backend follows a strict **Router -> Service -> Database** pattern.
- **6.1. Service Layer Implementation (Mandatory):**
  - All core business logic (data fetching, complex calculations, data manipulation, interactions between entities, enforcing business rules beyond simple input format) **MUST** be encapsulated within dedicated Service classes located in `/server/services/` (e.g., `QuoteService`, `CustomerService`, `DashboardService`).
  - Services **MUST** extend `BaseService` or follow a similar pattern for consistent dependency injection (like the database instance `DB`) and user context handling.
  - Services are responsible for direct database interactions via the Drizzle ORM client.
  - Services **MUST** perform necessary checks (e.g., existence checks, ownership verification) before performing mutations.
  - Services should contain reusable, testable functions for calculations (e.g., `recalculateQuoteTotals`).
  - Services **MUST** handle internal errors gracefully and throw appropriate, specific errors (often `TRPCError` instances with relevant codes like `NOT_FOUND`, `FORBIDDEN`, `INTERNAL_SERVER_ERROR`) when operations fail or constraints are violated.
- **6.2. tRPC Router Responsibilities (`/server/api/routers/`):**
  - Routers define the API endpoints (`.query()`, `.mutation()`).
  - Routers **MUST** be kept thin and delegate all business logic to the appropriate Service method.
  - **MANDATORY ZOD VALIDATION:** Routers are responsible for **rigorous input validation using Zod schemas (`.input()`)** for _every_ procedure. This validation checks types, required fields, constraints (min/max, length), formats (UUID), etc., _before_ any service method is called. Throw `BAD_REQUEST` on Zod validation failure. This is the **first line of defense**.
  - Routers extract necessary context (like `ctx.session.user.id` - see User Scoping below).
  - Routers call the corresponding Service method, passing validated input and context.
  - Routers catch errors thrown by the Service Layer and map them to appropriate `TRPCError`s for the client, adding context if necessary but avoiding exposure of sensitive details. **No business logic resides in the router beyond input validation and service delegation.**
- **Zero Trust Client:** Treat ALL client input as untrusted. Rely *solely* on backend validation (Zod in Router, checks in Service).
- **CALCULATIONS:** Implemented precisely per formulas in **reusable, testable Service functions**.
- **Rounding:** Backend services **MUST** round final monetary values to 2 decimal places before storage/return.
- **User Scoping & Ownership:** All DB queries/mutations within Services **MUST** filter/check results based on the authenticated `userId` (obtained from the context passed by the Router). For the current single-user focus, services will consistently use a placeholder user ID (e.g., `'system-user'`) where user ownership is required by the schema, ensuring consistency until multi-user functionality is implemented. Routers pass this context to services.

**UI/UX Principles & Defined Consistency (Strictly Enforced):**

- **Consistency Above All:** Uniform layout, spacing, typography, colors, interactions across the _entire_ app. Aim for an intuitive, error-free experience.
- **Responsive Design:** Consistent mobile-first implementation across all pages using Tailwind modifiers.

- **7.1. Defining Strict UI Consistency (Mandatory Rules):**
  The following rules **MUST** be applied universally across all relevant pages and components within the `/admin/*` section:
  1.  **Master Layout:** All authenticated pages (`/admin/*`) **MUST** use the primary `Layout.tsx` component rendering standard `NavBar.tsx` and `SidebarComponent.tsx`.
  2.  **Component Standardization:**
      - **Exclusive Use:** Only `@heroui/react` V2 components (or explicitly defined reusable components matching HeroUI style) are permitted. No one-off styled divs where a standard equivalent exists.
      - **Purposeful Usage:** Use the _same_ HeroUI component for the _same_ function everywhere (e.g., `<Button color="primary">` for primary actions, `<Button color="danger">` for delete, consistent Table structure, consistent Modal usage). Inputs **MUST** strictly follow Section 8 rules.
      - **Use Official Components First:** Always check if an official `@heroui/react` component exists before creating a custom implementation. Official HeroUI components like Table, Spinner, Pagination, etc. **MUST** be used instead of custom implementations when available.
      - **Defined Reusable Components:** Specific reusable application components (e.g., `CustomerSelector`, `TaskList`, `QuoteSummary`, `QuoteStatusSelector`, `CreateQuoteModal`, shared `FormField`, shared `EntityModal`) have been defined. These **MUST** be used consistently where appropriate and **MUST** strictly adhere to the visual style and interaction patterns of `@heroui/react` components and overall application consistency rules.
  3.  **Styling Uniformity (Tailwind & Theme):**
      - **Theme Colors:** Use _only_ colors from the configured Tailwind theme. No arbitrary values.
      - **Spacing & Sizing:** Use Tailwind's scale consistently (`p-2`, `m-4`, `w-full`). No arbitrary pixels.
      - **Typography:** Use theme-defined fonts/sizes/weights consistently.
      - **Borders & Shadows:** Use consistent theme-defined Tailwind utilities.
  4.  **Interaction Pattern Consistency:**
      - **Forms:** Validate inline below input (consistent style). Provide feedback via **standardized** `@heroui/toast`. Use consistent loading indicators (e.g., button spinner). Forms **MUST** submit data to backend tRPC mutations/services for processing and validation.
      - **Loading States:** **MUST** use `@heroui/react` Skeleton components matching content shape, or Spinners for actions.
      - **Notifications:** **MUST** use `@heroui/toast` with standard appearance for all feedback (success, error, info).
      - **Standard CRUD Flow (Modal-Based):** Core entities (Quotes, Customers, Products) **MUST** follow the **List Page -> Create Modal -> Detail/Edit Modal** workflow. List pages (`/admin/<entity>`) display items. A "Create" button opens an initial creation modal (`Create<Entity>Modal`). Editing an item (via list action) or completing initial creation opens a comprehensive detail/edit modal (`<Entity>DetailModal`). Prefetching **SHOULD** be used to load data for detail/edit modals proactively. Dedicated `/edit` pages are generally avoided for these entities.
      - **Modal Interaction:** All modals **MUST** use `@heroui/react` Modal components and the `useDisclosure` hook for state management. Modals handle specific parts of the creation/editing process as defined in the standard workflow.
  5.  **Data Presentation Consistency:** All currency, dates, percentages, User-Friendly IDs (`#123 (abc...)`) **MUST** be formatted using the **exact same** centralized utility functions/hooks.

**7.2. HeroUI Component Reference:**
  The following is a comprehensive list of official HeroUI components available in the library. **Always consult this list before creating custom implementations**:

  1. **Layout Components:**
     - Card, CardHeader, CardBody, CardFooter
     - Divider
     - Spacer
     - Navbar
     - Container
     - Layout

  2. **Form Components:**
     - Input
     - Textarea
     - Select
     - Checkbox, CheckboxGroup
     - Radio, RadioGroup
     - Switch
     - NumberInput
     - DateInput
     - DatePicker, DateRangePicker
     - TimeInput
     - Form
     - InputOTP

  3. **Data Display Components:**
     - Table, TableHeader, TableColumn, TableBody, TableRow, TableCell
     - Tabs, Tab
     - Badge
     - Chip
     - Avatar
     - Tooltip
     - User
     - Progress (linear)
     - CircularProgress
     - Skeleton
     - Kbd
     - Code, Snippet

  4. **Navigation Components:**
     - Pagination, PaginationItem, PaginationCursor
     - Breadcrumbs
     - Link
     - Dropdown (DropdownTrigger, DropdownMenu, DropdownItem)
     - Listbox

  5. **Feedback Components:**
     - Modal (ModalContent, ModalHeader, ModalBody, ModalFooter)
     - Drawer
     - Alert
     - Toast
     - Spinner
     - Popover

  6. **Media Components:**
     - Image
     - ScrollShadow

  7. **Utility Hooks:**
     - useDisclosure
     - useMediaQuery
     - useInfiniteScroll

**Component Usage Standards (Linked to UI Consistency):**

- **HeroUI Exclusivity & Precision:** Use `@heroui/react` components **only**.
- **`NumberInput` Configuration (Mandatory & Consistent):**
  - **Currency:** `min=0, step=0.01, formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}, startContent="$"` (or dynamic symbol).
  - **Percentage:** `min=0, step={0.1 or 1}, formatOptions={{ style: 'decimal', minimumFractionDigits: 1, maximumFractionDigits: 1 }}, endContent="%"`.
  - **Integer Quantity:** `min=1, step=1, formatOptions={{ style: 'decimal', maximumFractionDigits: 0 }}`.
- **Other Inputs:** Use `Input`, `Textarea`, `DateInput`, `Select` appropriately per data type.
- **Labels:** **MUST** use `label` prop or (rarely, with justification) `aria-label` consistently for all inputs.

**Development Guidelines & Constraints (Process, Quality & Correctness)**

- **Code Quality & Correctness:**
  - **MUST Generate Type-Safe Code:** Output **MUST** strictly adhere to TypeScript rules and defined types.
  - **NO KNOWN ERRORS Rule:** Generated code **MUST NOT** contain obvious `TypeErrors`, null reference errors (where nullability defined), or logical inconsistencies.
  - **Internal Validation REQUIRED:** AI **MUST** internally check generated code for type safety and rule adherence _before_ finalizing output for a unit/file/task. **Do not output code known to be flawed.**
  - Strict TypeScript; Pass Linters (ESLint/Prettier); TSDoc Clarity.
- **UI Consistency Enforcement:** Generated UI code **MUST strictly adhere to ALL rules defined in Section 7.1.** Internal check required before output.
- **Structure & Naming:** Adhere strictly to defined structure and consistent naming.
- **Reusability:** **Aggressively reuse** components/hooks/functions (frontend & backend). DRY principle.
- **Backend Focus:** Prioritize correct, **secure**, robust backend implementation following the **Service Layer pattern (Sec 6.1)**.
- **Caching:** Implement correct tRPC cache invalidation (`utils.invalidate()`) after successful mutations.
- **Service Layer Adherence:** Generated backend code **MUST** strictly follow the Service Layer pattern defined in Section 6.1. Routers delegate to services; services contain business logic and database interactions.
- **Process & Workflow:**
  - **MANDATORY DOCUMENTATION LOOKUP (New Packages):** Recognize knowledge gap for `@heroui/react` V2, Tailwind v4, Drizzle, tRPC. **MUST** consult current official docs via web search during planning. Plan **MUST** show how findings (APIs, patterns) will be applied _contextually_ within these project rules.
  - **Acknowledge Documentation Request:** Fulfill documentation/planning requests directly _first_.
- **AI Role & Constraints:**
  - **Correctness & Consistency Prerequisite:** Treat generation as complete _only when_ validated as type-safe, logically consistent, adhering to the plan (incl. doc lookup findings), **AND strictly conforming to UI consistency rules (Sec 7.1).** **Do not move on if known errors or inconsistencies exist.**
  - **Strictly Context-Bound:** Generate based **strictly and solely** on these rules/plan.
  - **Understand Service Layer:** AI **MUST** understand the separation of concerns between Routers and Services (as defined in Sec 6) and generate code accordingly, placing business logic exclusively in services and validation/delegation in routers.
  - **No Execution Environment:** **Do not** run code, install packages, build. Validation is static analysis against these rules.
  - **Flag Blocking Issues:** Clearly state if rules conflict or prevent correct generation/planning.

**How to Use This Document (For AI Assistant):**

- **Mandatory Reading & Adherence:** Every detail is strict. **UI Consistency (Sec 7.1)**, correctness, secure backend, and adherence to **Process (Sec 13)** are paramount.
- **Follow the Process:** Explicitly follow planning, documentation lookup, UI consistency checks, and internal validation _before_ outputting code.
- **Prioritize Correctness & Consistency:** Ensure generated code is type-safe, follows the plan/docs, _and_ matches UI patterns exactly. **Do not proceed if known flaws exist.**
- **Ask for Clarification:** State ambiguities preventing correct implementation.
- **Reference Sections:** Refer to sections explicitly (e.g., "Following UI rules in Sec 7.1...", "Implementing backend validation per Sec 6...") to demonstrate adherence.
