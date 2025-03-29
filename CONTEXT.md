# Construction Quotes App

**Objective:** Build a simple, fast web app for construction workers to create job quotes. Prioritize ease of use.

---

## 1. Core Concept & Workflow

### Goal
Replace slow, error-prone manual quoting with a streamlined tool reflecting worker intuition (pricing by **Tasks** + estimated **Materials**).

### Workflow
1. **Start:** Basic Quote Info (Project/Customer)
2. **Add Task(s):**
   - Description
   - `Task Price` (Labor/Skill cost)
   - `Materials Cost`: 
     - Option A: Lump Sum (`estimatedMaterialsCostLumpSum`)
     - Option B: 1-3 Key Items via `quoteMaterials`, optionally from `Product List`
3. **Repeat** for all major tasks
4. **Review Totals:** App calculates `subtotalTasks`, `subtotalMaterials`
5. **Optional Adjust:** Apply global `Complexity/Contingency` & `Markup/Profit` (stored as `complexityCharge`, `markupCharge`)
6. **View Final:** Display `grandTotal`
7. **Save/Output:** Save quote (`DRAFT` status), view summary

---

## 2. Key Data & Schema

### Key Terms
- `Task Price`: Labor/skill cost
- `Materials Cost`: Lump sum or itemized
- `Product List`: Reusable items
- `Adjustments`: Complexity charge and markup

### Schema (Drizzle ORM - PostgreSQL)
| Table | Purpose |
|-------|---------|
| `users` | User management and authentication |
| `quotes` | Main quote information |
| `tasks` | Individual tasks within quotes |
| `materials` | Materials used in tasks |
| `products` | Reusable product catalog |
| `customers` | Customer information |
| `settings` | User preferences and app settings |
| `transactions` | Financial tracking |

**Relations:** Standard links between tables with proper foreign key constraints and cascading deletes where appropriate.

---

## 3. UI/Tech Requirements

### Tech Stack
- **Frontend:** Next.js (Page Router), TypeScript
- **API:** tRPC
- **UI Components:** @heroui/react V2, @heroui/toast
- **Styling:** Tailwind CSS v4 (Alpha/Beta)
- **Authentication:** next-auth
- **Database:** Drizzle ORM with PostgreSQL

### UI Features
- **Responsive Design:** Mobile-first approach
- **Theme Support:** Dark/Light mode with system preference detection
- **Internationalization:** Multiple languages, currencies, date formats
- **Accessibility:** WCAG 2.1 compliance
- **Notifications:** Consistent, themeable toast notifications

### Key Views
- **Auth:** Login/signup forms
- **Dashboard:** Overview of quotes, stats, recent activity
- **Quotes:** List, create, edit, view details
- **Customers:** Management interface
- **Products:** Catalog management
- **Settings:** User and Global preferences
- **Reports:** Financial and customer analytics

### Data Handling
- **Loading States:** Skeleton loaders, spinners
- **Error Handling:**
  - Centralized handling for client and server-side errors
  - User-friendly toast notifications
  - Type-safe error classification
  - Automatic error recovery (e.g., auth redirects)
  - Custom hooks for consistent implementation
- **Form Validation:** Client and server-side
- **Caching:** Efficient tRPC data caching with strategic invalidation

---

## 4. Current Implementation Status

### In Progress
- Basic project structure
- Database schema
- Authentication system
- Quote management
- Customer management
- Settings system
- Localization framework
- Toast notifications
- Basic UI components
- Financial reporting
- Product management
- Advanced quote features
- Dark mode implementation
- Additional language support
- Advanced analytics
- PDF generation
- Email notifications

---

## 5. Development Guidelines

### Technical Requirements
1. ✅ Implement dark mode support
2. ✅ Add more language translations
3. ✅ Enhance financial reporting
4. ✅ Add PDF quote generation
5. ✅ Add advanced analytics
6. ✅ Optimize performance
7. ✅ Add more test coverage
8. ✅ Improve accessibility
9. ✅ Using JSDoc or TSDoc for clarification

### Code Quality
10. ✅ Use TypeScript strictly
11. ✅ Follow ESLint rules
12. ✅ Write meaningful code comments
13. ✅ Document complex logic
14. ✅ Test new features
15. ✅ Review code before finishing
16. ✅ Keep dependencies updated
17. ✅ Monitor performance

### Consistency
18. ✅ Follow accessibility guidelines
19. ✅ Maintain consistent code style
20. ✅ Maintain consistent UI style
21. ✅ Maintain consistent package documentation
22. ✅ Ensure localization for each page

### Best Practices
23. ✅ Avoid deprecated methods
24. ✅ Use Tailwind CSS (no inline styling)
25. ✅ Keep project clean (no useless files/packages)
26. ✅ Ensure no lint errors, even during build
27. ✅ Maintain high standard for code, logic, and testing
28. ✅ Centralize localization
29. ✅ Update changelog for every code update
30. ✅ Document all features and packages
31. ✅ Use consistent naming conventions for page notes

### Code Review
32. ✅ Perform thorough code reviews on all non-ignored directories and files to ensure consistent organization, naming conventions, and adherence to project standards.
