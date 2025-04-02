**Project Context Document (v8)**

**Guiding Principle:** Build the **simplest, fastest, most reliable** quoting tool imaginable for small construction contractors, ensuring **absolute consistency and correctness** at every step, with **maximal use of the standard UI component library**.

**Objective:** Create a web app for generating quotes based on **Tasks** (Labor) + **Materials** (Lump Sum OR Itemized). Core goals are ease of use, speed, **strict consistency**, robust security, and **error-free implementation**.

**Core Workflow (Quote Management - Standard Modal Flow):**

- **Strict Adherence:** Quote management **MUST** follow the **Standard Workflow for Core Entities** defined below (Modal-based CRUD). Dedicated `/admin/quotes/new` and `/admin/quotes/[id]/edit` pages **ARE NOT USED** for primary creation or editing.
- **1. List & Creation:**
  - Quotes list is displayed on `/admin/quotes`.
  - Creation **MUST** be initiated via a **standardized modal** (`CreateQuoteModal`) launched from the list page (`/admin/quotes`) using a "Create" button and `useDisclosure`.
  - This modal collects essential header info: Title, Customer, optional Notes. Uses TanStack Form.
  - **On success, it typically closes, returning the user to the updated list.** Optionally, logic could open `QuoteDetailModal` immediately, but **MUST NOT redirect to a dedicated page.**
- **2. Detailed Configuration / Editing:**
  - Adding/Editing full details **MUST** be done via the **standardized detail/edit modal** (`QuoteDetailModal`), launched from the list page (`/admin/quotes`) using "Edit" (or chained after `CreateQuoteModal`).
  - This modal uses TanStack Form for managing the _entire_ quote details state.
  - **Add Tasks:** Uses `TaskList` component with TanStack Form helpers (`description`, `Task Price`, Materials Choice [Lump Sum/Itemized]).
  - **Review Totals:** Displays calculated totals via `QuoteSummary`.
  - **Adjustments:** `markupCharge` (%).
  - **Final Total:** Display `grandTotal`.
  - **Prefetching:** Data prefetching for `QuoteDetailModal` is highly recommended.
- **3. Save/Output:**
  - Saving occurs via buttons within `QuoteDetailModal` using `api.quote.create` or `api.quote.update`.
  - "View" (`QuoteViewModal` from list) and "Print" (`/admin/quotes/[id]/print`) actions remain available.

**Standard Workflow for Core Entities (Quotes, Customers, Products):**
Unless explicitly stated otherwise, **ALL** core entities (Quotes, Customers, Products) **MUST** follow the **List Page -> Create Modal -> Detail/Edit Modal** pattern. Dedicated `/new` or `/edit` pages for these entities **ARE NOT USED**.
**Note:** Key modal components like `ProductFormModal` require correct implementation using TanStack Form according to this standard flow.
Correct integration of TanStack Form with Zod validation is critical for modal functionality and requires ongoing attention, particularly for components like `ProductFormModal`.

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
  - All core business logic **MUST** be encapsulated within dedicated Service classes in `/server/services/` (e.g., `QuoteService`, `CustomerService`, `ProductService`, `SettingService`).
  - Services **MUST** extend `BaseService` or similar for dependency injection (DB) and user context.
  - Services handle direct DB interactions via Drizzle ORM.
  - **`SettingService` Specifics:** Handles fetching/creating/updating settings, including necessary data type conversions (e.g., number to string for DB storage of currency fields) before database operations and converting back (string to number/boolean) before returning data to the client router (`processSettingsForClient`, `processSettingsForDb`).
  - Services **MUST** perform checks (existence, ownership) before mutations.
  - Services contain reusable, testable functions (e.g., calculations).
  - Services **MUST** handle internal errors and throw specific `TRPCError`s (`NOT_FOUND`, `FORBIDDEN`, etc.).
- **6.2. tRPC Router Responsibilities (`/server/api/routers/`):**
  - Routers define API endpoints (`.query()`, `.mutation()`).
  - Routers **MUST** be thin; delegate ALL business logic to Services.
  - **MANDATORY ZOD VALIDATION:** Routers use Zod schemas (`.input()`) for **rigorous** validation of _every_ procedure input _before_ calling services. Throw `BAD_REQUEST` on failure. **The `settings.update` router uses `updateSettingsInputSchema` which expects numeric types for currency/charge fields.**
  - Routers extract context (e.g., `ctx.session.user.id`).
  - Routers call corresponding Service methods with validated input and context.
  - Routers catch Service errors and map them to appropriate client-safe `TRPCError`s. **No business logic in routers.**
- **Zero Trust Client:** Treat ALL client input as untrusted. Rely _solely_ on backend validation (Zod in Router, checks in Service).
- **CALCULATIONS:** Implemented precisely per formulas in **reusable, testable Service functions**.
- **Rounding:** Backend services **MUST** round final monetary values to 2 decimal places before storage/return.
- **User Scoping & Ownership:** All DB operations within Services **MUST** filter/check based on authenticated `userId` (from context). Use placeholder `'system-user'` ID consistently for single-user phase where schema requires `userId`.

**Frontend State Management (Zustand & React State):**

- **Global State (`useConfigStore` - Zustand):**
  - **Single Source of Truth:** Manages global application settings (theme, locale, default charges, company info, etc.).
  - **Hydration:** Initialized on app load by the `ConfigLoader` component, which fetches data via `api.settings.get`.
  - **Persistence:** Store updates _do not_ automatically persist to the backend. Persistence **MUST** happen explicitly via the Settings page save action.
  - **Structure:** The store structure mirrors the database schema for settings, often storing currency/charge values as **strings**, consistent with the DB.
- **Local Component State (`useState`):**
  - Used for managing UI state within components (e.g., modal open/close, loading indicators specific to a component action).
  - **Settings Page:** Uses local state (`formState`) to manage user edits _before_ they are saved. This `formState` typically holds values matching the Zod input schema (e.g., **numbers** for currency/charges).

**UI/UX Principles & Defined Consistency (Strictly Enforced):**

- **Consistency Above All:** Uniform layout, spacing, typography, colors, interactions across the _entire_ app. Aim for intuitive, error-free experience.
- **Responsive Design:** Consistent mobile-first implementation using Tailwind modifiers.
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
    - **Forms:** Inline validation below input. Feedback via **standardized** `@heroui/toast`. Consistent loading indicators. Submit data to tRPC backend. **TanStack Form is standard** for complex modal forms (Quotes, Products, Customers). The Settings page uses local React state (`formState`) and Zod validation on submit.
    - **Loading States:** **MUST** use `@heroui/react` Skeleton or Spinners. tRPC query loading states (`isLoading`) should be used where applicable (e.g., initial page loads). Local states (`isUpdating`) can manage button/mutation loading.
    - **Notifications:** **MUST** use `@heroui/toast` (standard appearance via `useAppToast`) for all feedback (success, error, validation).
    - **Standard CRUD Flow (Modal-Based):** **ALL** core entities (Quotes, Products, Customers) **MUST** strictly follow **List Page -> Create Modal -> Detail/Edit Modal** workflow. Dedicated `/new`, `/edit` pages **ARE NOT USED**. Prefetching **SHOULD** be used for detail/edit modals.
    - **Modal Interaction:** All modals **MUST** use `@heroui/react` Modal and `useDisclosure`.
    - **Settings Management:**
      - Global settings (theme, locale) can be changed via UI elements (e.g., `ThemeToggle`, `LocaleSwitch`) which update `useConfigStore` directly for immediate UI feedback.
      - **Persistence** of ALL settings (including theme/locale changes made via toggles) **ONLY** occurs when the user explicitly clicks "Save Changes" on the `/admin/settings` page.
      - The `/admin/settings` page handles fetching current settings, managing local edits (`formState`), validating input against Zod schema, and triggering the `api.settings.update` mutation. On successful mutation, it updates `useConfigStore` to reflect the persisted state.
  - **5. Data Presentation Consistency:** All currency, dates, percentages, User-Friendly IDs (`#123 (abc...)`) **MUST** be formatted using the **exact same** centralized utility functions/hooks.
  - **6. Internationalization (i18n):**
    - **Implementation Note:** This project uses a custom `useTranslation` hook and a flat, prefixed key structure (e.g., `'common.save'`) defined in `src/types/i18n/keys.ts`. It does **not** use the standard nested structure often associated with `i18next`.
    - **Type Safety:** All translation keys **MUST** be defined in the `TranslationKey` union type in `src/types/i18n/keys.ts`.
    - **Synchronization Required:** Adding a new translation key **REQUIRES a two-step process**:
      1. Add the key string literal to the `TranslationKey` union type in `src/types/i18n/keys.ts`.
      2. Add the corresponding key and translated string to **ALL** language implementation files (e.g., `src/utils/locales/en.ts`, `src/utils/locales/vi.ts`).
    - **Failure to synchronize** the implementation files after updating the type will result in TypeScript errors when using the `t()` function with the new key.

**Component Usage Standards (Linked to UI Consistency):**

- **HeroUI Exclusivity & Precision:** Use `@heroui/react` components **only** (as per Rule 7.1.2).
- **`NumberInput` Configuration (Mandatory & Consistent):**
  - **Currency:** `min=0, step=0.01, formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}, startContent="$"` (or dynamic symbol).
  - **Percentage:** `min=0, step={0.1 or 1}, formatOptions={{ style: 'decimal', minimumFractionDigits: 1, maximumFractionDigits: 1 }}, endContent="%"`.
  - **Integer Quantity:** `min=1, step=1, formatOptions={{ style: 'decimal', maximumFractionDigits: 0 }}`.
- **Other Inputs:** Use `Input`, `Textarea`, `DateInput`, `Select` appropriately.
- **Labels:** **MUST** use `label` prop or (rarely, with justification) `aria-label` consistently.

**Development Guidelines & Constraints (Process, Quality & Correctness)**

- **Code Quality & Correctness:**
  - **MUST Generate Type-Safe Code:** Output **MUST** strictly adhere to TypeScript rules and defined types, including careful handling of types between local state (e.g., numbers in forms), Zod schemas (numbers), the global store (strings for currency), and the database (strings/numeric).
  - **Strive for Correctness / Prioritize Known Issue Resolution:** Code **MUST** strive for correctness. Known complex integration issues (like the TS/Zod/Form type errors noted in "Standard Workflow") **MUST** be treated as high-priority blockers requiring diligent resolution before dependent features are considered stable/complete.
  - **Internal Validation REQUIRED:** AI **MUST** internally check generated code for type safety and rule adherence _before_ finalizing output. **Do not output code known to contain easily avoidable flaws.**
  - Strict TypeScript; Pass Linters (ESLint/Prettier); TSDoc Clarity.
- **UI Consistency Enforcement:** Generated UI code **MUST strictly adhere to ALL rules defined in Section 7.1.** Internal check required before output.
- **Structure & Naming:** Adhere strictly to defined structure and consistent naming.
- **Reusability:** **Aggressively reuse** components/hooks/functions (frontend & backend). DRY principle.
- **Backend Focus:** Prioritize correct, **secure**, robust backend implementation following the **Service Layer pattern (Sec 6.1)**.
- **Caching:** Implement correct tRPC cache invalidation (`utils.invalidate()`) after successful mutations.
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
