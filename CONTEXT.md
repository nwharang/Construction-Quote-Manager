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
- **Schema:** Uses **Drizzle ORM (PostgreSQL)**. Key tables:
  - `users`: User management and authentication
  - `quotes`: Main quote information
  - `tasks`: Individual tasks within quotes
  - `materials`: Materials used in tasks
  - `products`: Reusable product catalog
  - `customers`: Customer information
  - `settings`: User preferences and app settings
  - `transactions`: Financial tracking
- **Relations:** Standard links between tables with proper foreign key constraints and cascading deletes where appropriate.

---

## 3. UI/Tech Requirements

- **Stack:**
  - **Next.js (Page Router)**, TypeScript
  - **tRPC** (API)
  - **@heroui/react V2** (UI Components)
  - **Tailwind CSS v4** (Required - Alpha/Beta)
  - **react-hot-toast** (Notifications)
  - **next-auth** (Authentication)
  - **Drizzle ORM** (Database)
  - **PostgreSQL** (Database)
- **UI Features:**
  - **Responsive Design:** Mobile-first approach
  - **Dark/Light Mode:** System preference detection and manual toggle
  - **Localization:** Support for multiple languages, currencies, date formats
  - **Accessibility:** WCAG 2.1 compliance
- **Key Views:**
  - **Auth:** Login/signup forms
  - **Dashboard:** Overview of quotes, stats, recent activity
  - **Quotes:** List, create, edit, view details
  - **Customers:** Management interface
  - **Products:** Catalog management
  - **Settings:** User preferences
  - **Reports:** Financial and customer analytics
- **Data Handling:**
  - **Loading States:** Skeleton loaders, spinners
  - **Error Handling:** Toast notifications, inline errors
  - **Form Validation:** Client and server-side validation
  - **Real-time Updates:** Optimistic updates where appropriate

---

## 4. Deployment & Testing

- **Deployment:**
  - Target: **Vercel**
  - Environment Variables: Properly configured
  - Database: PostgreSQL (Vercel Postgres)
  - Build Process: Optimized for production
- **Testing:**
  - **Playwright** for E2E tests
  - Coverage for:
    - Authentication flows
    - Quote CRUD operations
    - Customer management
    - Settings management
    - Localization
    - Responsive design
    - Form validation
    - Error handling

---

## 5. Current Implementation Status

- **Completed:**
  - Basic project structure
  - Database schema
  - Authentication system
  - Quote management
  - Customer management
  - Settings system
  - Localization framework
  - Toast notifications
  - Basic UI components
- **In Progress:**
  - Financial reporting
  - Product management
  - Advanced quote features
- **Pending:**
  - Dark mode implementation
  - Additional language support
  - Advanced analytics
  - PDF generation
  - Email notifications

---

## 6. Next Steps

1. Implement dark mode support
2. Add more language translations
3. Enhance financial reporting
4. Add PDF quote generation
5. Implement email notifications
6. Add advanced analytics
7. Optimize performance
8. Add more test coverage
9. Improve accessibility
10. Add user documentation

---

## 7. Development Guidelines

1. Use TypeScript strictly
2. Follow ESLint rules
3. Write meaningful commit messages
4. Document complex logic
5. Test new features
6. Review code before merging
7. Keep dependencies updated
8. Monitor performance
9. Follow accessibility guidelines
10. Maintain consistent code style
