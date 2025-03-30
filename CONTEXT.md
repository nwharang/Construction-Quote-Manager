**Guiding Principle:** Build the **simplest, fastest, most reliable** quoting tool imaginable for small construction contractors, ensuring **absolute consistency and correctness** at every step.

**Objective:** Create a web app for generating quotes based on **Tasks** (Labor) + **Materials** (Lump Sum OR Itemized). Core goals are ease of use, speed, **strict consistency**, robust security, and **error-free implementation**.

**Core Workflow (Quote Creation/Edit - Standardized Flow):**

1.  **Quote Header:** Project Name (`Input`), Address (`Textarea`), Customer (`Select`/New via standard modal/inline form). **(Uses Standardized Form Layout)**
2.  **Add Tasks:** Dynamically add `TaskInputRow` components. Each **MUST consistently** contain:
    - `description` (`Textarea`).
    - `Task Price` (Currency `NumberInput`).
    - Materials Choice (Radio/Select): **Lump Sum OR Itemized** (Enforce exclusivity per task).
      - **Lump Sum:** `estimatedMaterialsCostLumpSum` (Currency `NumberInput`).
      - **Itemized:** Add `MaterialInputRow`s: `name` (`Input`), `quantity` (Int `NumberInput`), `unitPrice` (Currency `NumberInput`), optional `Product` lookup (`Autocomplete`/`Select`).
3.  **Review Totals (Real-time UI):** Display `subtotalTasks`, `subtotalMaterials`, `subtotalCombined`. **(Clear & Immediate Feedback)**
4.  **Adjustments:** `complexityCharge` (%), `markupCharge` (%) via Percentage `NumberInput`. Display calculated amounts. **(Simple & Understandable)**
5.  **Final Total:** Prominently display `grandTotal`.
6.  **Save/Output:** "Save" button persists data. "View"/"Print" buttons navigate via **standard patterns**.

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

**Backend Logic & Validation (tRPC - `/server/api/routers/` - Authoritative & Secure Core):**

- **Backend Authority:** All core business logic, calculations, and validation **MUST** reside in backend tRPC resolvers. **This is non-negotiable.**
- **Zero Trust Client:** Treat ALL client input as untrusted and potentially invalid/malicious.
- **MANDATORY ZOD VALIDATION:**
  - **Rigorously validate ALL incoming data** in _every_ tRPC mutation using Zod schemas **before** any DB interaction or calculation.
  - Validation **MUST** cover: Types, Required Fields, Constraints (`min`/`max`, lengths), Formats (UUID), **Ownership & Relationships (using `ctx.session.user.id`)**, and Business Rules (e.g., Lump Sum vs. Itemized exclusivity).
  - Validation occurs at procedure entry; throw `BAD_REQUEST` on failure. Backend validation is the **single source of truth**.
- **CALCULATIONS:** Implement quote totals precisely per formulas in the backend using **reusable, testable backend functions**.
- **Rounding:** Backend **MUST** round final monetary values to 2 decimal places (`Math.round(num * 100) / 100`) before storage/return.
- **User Scoping:** All DB queries/mutations **MUST** filter results based on the authenticated `userId` from the context (`ctx.session.user.id`).

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
  3.  **Styling Uniformity (Tailwind & Theme):**
      - **Theme Colors:** Use _only_ colors from the configured Tailwind theme. No arbitrary values.
      - **Spacing & Sizing:** Use Tailwind's scale consistently (`p-2`, `m-4`, `w-full`). No arbitrary pixels.
      - **Typography:** Use theme-defined fonts/sizes/weights consistently.
      - **Borders & Shadows:** Use consistent theme-defined Tailwind utilities.
  4.  **Interaction Pattern Consistency:**
      - **Forms:** Validate inline below input (consistent style). Provide feedback via **standardized** `@heroui/toast`. Use consistent loading indicators (e.g., button spinner).
      - **Loading States:** **MUST** use `@heroui/react` Skeleton components matching content shape.
      - **Notifications:** **MUST** use `@heroui/toast` with standard appearance for all feedback.
      - **Navigation:** CRUD operations **MUST** follow consistent flows (List -> Detail -> Edit, etc.).
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
- **Backend Focus:** Prioritize correct, **secure**, robust backend implementation.
- **Caching:** Implement correct tRPC cache invalidation (`utils.invalidate()`) after successful mutations.
- **Process & Workflow:**
  - **MANDATORY DOCUMENTATION LOOKUP (New Packages):** Recognize knowledge gap for `@heroui/react` V2, Tailwind v4, Drizzle, tRPC. **MUST** consult current official docs via web search during planning. Plan **MUST** show how findings (APIs, patterns) will be applied _contextually_ within these project rules.
  - **Acknowledge Documentation Request:** Fulfill documentation/planning requests directly _first_.
- **AI Role & Constraints:**
  - **Correctness & Consistency Prerequisite:** Treat generation as complete _only when_ validated as type-safe, logically consistent, adhering to the plan (incl. doc lookup findings), **AND strictly conforming to UI consistency rules (Sec 7.1).** **Do not move on if known errors or inconsistencies exist.**
  - **Strictly Context-Bound:** Generate based **strictly and solely** on these rules/plan.
  - **No Execution Environment:** **Do not** run code, install packages, build. Validation is static analysis against these rules.
  - **Flag Blocking Issues:** Clearly state if rules conflict or prevent correct generation/planning.

**How to Use This Document (For AI Assistant):**

- **Mandatory Reading & Adherence:** Every detail is strict. **UI Consistency (Sec 7.1)**, correctness, secure backend, and adherence to **Process (Sec 13)** are paramount.
- **Follow the Process:** Explicitly follow planning, documentation lookup, UI consistency checks, and internal validation _before_ outputting code.
- **Prioritize Correctness & Consistency:** Ensure generated code is type-safe, follows the plan/docs, _and_ matches UI patterns exactly. **Do not proceed if known flaws exist.**
- **Ask for Clarification:** State ambiguities preventing correct implementation.
- **Reference Sections:** Refer to sections explicitly (e.g., "Following UI rules in Sec 7.1...", "Implementing backend validation per Sec 6...") to demonstrate adherence.
