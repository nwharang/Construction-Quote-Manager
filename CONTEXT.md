**Objective:** Build a simple, fast, web app for construction workers to create job quotes. Prioritize ease of use. Target deployment: **Vercel**. Validate with **Playwright**. **The final generated code must be buildable.**

---

## 1. Core Concept & Workflow

- **Goal:** Replace slow, error-prone manual quoting with a streamlined tool reflecting worker intuition (pricing by **Tasks** + estimated **Materials**).
- **Workflow:**
  1.  **Start:** Basic Quote Info (Project/Customer).
  2.  **Add Task(s):**
      - Description.
      - `Task Price` (Labor/Skill cost).
      - `Materials Cost`: Opt A (Lump Sum `estimatedMaterialsCostLumpSum`) OR Opt B (1-3 Key Items via `quoteMaterials`, optionally from `Product List`).
  3.  **Repeat** for all major tasks.
  4.  **Review Totals:** App calculates `subtotalTasks`, `subtotalMaterials`.
  5.  **(Optional) Adjust:** Apply global `Complexity/Contingency` & `Markup/Profit` (stored as `complexityCharge`, `markupCharge`).
  6.  **View Final:** Display `grandTotal`.
  7.  **Save/Output:** Save quote (`DRAFT` status), view summary.

---

## 2. Key Data & Schema (Drizzle ORM Summary)

- **Key Terms:** `Task Price` (labor), `Materials Cost` (lump/itemized), `Product List` (reusable items), Adjustments (`Complexity`, `Markup`).
- **Schema:** Uses **Drizzle ORM (PostgreSQL)**. Key tables: `users`, `products`, `quotes`, `quoteTasks`, `quoteMaterials`. **Crucially, rely on the previously provided FULL Drizzle schema for implementation details.** Totals (`subtotalTasks`, etc.) stored on `quotes` table, managed by backend.

```typescript
// Drizzle Schema Summary (Requires FULL schema provided separately)
// Enums: quoteStatusEnum ('DRAFT', ...)
// Tables: users, products, quotes, quoteTasks, quoteMaterials
// Relations: Standard links (users<->quotes, quotes<->tasks, etc.)
```

---

## 3. UI/Tech Requirements

- **Stack:**
  - **Next.js (App Router)**, React, TS
  - **tRPC** (API)
  - **NextUI V2** (UI Components)
  - **Tailwind CSS v4 (Required - Alpha/Beta)**
    - **Caveat:** Tailwind v4 is experimental. Ensure configuration follows v4 practices (potentially minimal `tailwind.config.js`, leveraging new engine features). **Crucially, verify compatibility with NextUI v2.** Be prepared for potential styling conflicts or the need for specific compatibility configurations or workarounds between NextUI and Tailwind v4. Prioritize NextUI component functionality if direct conflicts arise.
- **UI:** Use **NextUI V2** components extensively. **Must be Responsive**.
- **Data:** **tRPC hooks** for all data ops. Handle loading (`Spinner`/`Skeleton`) & errors (inline/toast).
- **Key Views (Summarized - Use NextUI Components):**
  - **Auth:** Simple centered login/signup form.
  - **Quote List (`/quotes`):** `Navbar`; `Table`/`Card` list; "Create" button. Responsive.
  - **Quote Create/Edit (`/quotes/...`):** Multi-section form.
    - **Task Component:** Inputs for Desc, `Task Price`; Material inputs (Opt A/B support, Opt B uses Modal/inline form potentially with `Autocomplete` for Products). Remove task button.
    - **Other:** "Add Task" button; Adjustment inputs; Dynamic totals display; Save/Update button w/ loading state. Client-side validation needed (e.g., `react-hook-form`). Responsive (stacking).
  - **Quote Detail (`/quotes/[id]`):** Read-only display. Edit/Delete/Status actions. Responsive.
  - **Product Mgmt (`/products`, Optional):** CRUD interface for `Product List` using `Table`/`Card`s and `Modal` form. Responsive.
- **Accessibility:** Use semantic HTML & NextUI's accessible components.

---

## 4. Deployment & Testing

- **Deployment:** Target **Vercel**. Ensure code compatibility (env vars, serverless functions, DB connections, Tailwind v4 build process).
- **Testing:** **Playwright (Required)** for E2E tests. Cover key scenarios: Auth, Quote CRUD (incl. Task/Material variations, Adjustments), Product CRUD (if implemented), Responsiveness basics, Form Validation. **Refer to the previously provided detailed test case list.**

---

## 5. AI Instructions

Generate **Next.js (App Router)**, **tRPC**, **Playwright**, and **TypeScript** code for the app.

1.  Implement the **Core Workflow** accurately.
2.  Use **Required Tech Stack** (NextUI v2, tRPC, Drizzle).
3.  Configure and utilize **Tailwind CSS v4**, acknowledging potential **NextUI v2 compatibility issues** and its experimental nature. Prioritize functionality.
4.  Ensure UI is **Responsive**.
5.  Use **tRPC hooks** correctly (loading/error states).
6.  Adhere to the **FULL Drizzle Schema** (provided previously).
7.  Prioritize **Simplicity & UX** for the target user.
8.  **Add Code Comments** for readability.
9.  Ensure **Vercel Compatibility**, including Tailwind v4 build steps.
10. Generate **Playwright Tests** covering key scenarios (referencing prior detailed list).
11. **Ensure Build Success:** The final generated codebase **must be buildable** (`npm run build` or equivalent). Iteratively fix any build errors, including those potentially arising from Tailwind v4 integration or configuration.
12. **For all the packages that we think we need, please add them to the package.json, also search for all of them in latest version, read their documentation before changing anything, also use pnpm instead of npm.**

---
