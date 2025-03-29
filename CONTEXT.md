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

| Table          | Purpose                            |
| -------------- | ---------------------------------- |
| `users`        | User management and authentication |
| `quotes`       | Main quote information             |
| `tasks`        | Individual tasks within quotes     |
| `materials`    | Materials used in tasks            |
| `products`     | Reusable product catalog           |
| `customers`    | Customer information               |
| `settings`     | User preferences and app settings  |
| `transactions` | Financial tracking                 |

**Relations:** Standard links between tables with proper foreign key constraints and cascading deletes where appropriate.

### ID Display and Numbering System

To make IDs more user-friendly for construction workers:

- **Sequential Numbering:** Each item (quote, product, etc.) has a database-assigned sequential ID 
- **Implementation:** 
  - Added `sequentialId: serial('sequential_id')` field to database tables
  - Display format: `#123 (ae42b8f2...)` shows both sequential ID and shortened UUID
  - Workers can verbally reference quotes/products by their sequential number
  - Database still uses UUIDs internally for relationships and technical purposes
  - Sequential IDs are automatically incremented when new items are created

This approach bridges the gap between technical requirements (unique UUIDs) and practical usability for workers who need simple references while ensuring each item has a permanent, reliable identifier in the database.

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

### Component Usage Guidelines

- **Input Types:**
  - **Numeric Values:** Always use `NumberInput` from HeroUI with appropriate configuration:
    - `min`, `max`, and `step` values tailored to the field
    - `formatOptions` customized for currency, percentages, or plain numbers
    - Default values to prevent NaN issues (e.g., `value={parseFloat(value) || 0}`)
  - **Dates:** Use `DateInput` from HeroUI for date fields with appropriate localization
  - **Text:** Regular `Input` component for text fields
  - **Long Text:** `Textarea` for descriptions and notes

- **Monetary Values:**
  - Use `NumberInput` with `formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}`
  - Include `startContent="$"` (or appropriate currency symbol)
  - Set `min={0}` and `step={0.01}` for proper decimal handling

- **Quantities:**
  - Use `NumberInput` with `min={1}` and `step={1}` for integer inputs
  - No decimal places for quantity values

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

### Accessibility

- **Input Components:**
  - Always provide either a visible label or an `aria-label` attribute for screen readers
  - For `NumberInput` components, use the following pattern:
    ```tsx
    <NumberInput
      label="Price"
      value={price}
      onValueChange={setPrice}
      aria-label="Price"
      // other props...
    />
    ```
  - For inputs that relate to specific items (like tasks or materials), make the aria-label contextual:
    ```tsx
    <NumberInput
      label="Price"
      value={material.price}
      aria-label={`Price for material ${material.name}`}
      // other props...
    />
    ```
  - Error messages should be properly linked to inputs using `aria-describedby`
  - All interactive elements must be keyboard accessible
  - Color should not be the only means of conveying information (include text or icons)

- **Other Components:**
  - Buttons should have descriptive text or aria-labels
  - Use semantic HTML elements when possible (`<button>`, `<input>`, etc.)
  - Maintain proper heading hierarchy (`h1`, `h2`, etc.)
  - Ensure sufficient color contrast (WCAG AA compliance)

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

1. Implement dark mode support
2. Add more language translations
3. Enhance financial reporting
4. Add PDF quote generation
5. Add advanced analytics
6. Optimize performance
7. Add more test coverage
8. Improve accessibility
9. Using JSDoc or TSDoc for clarification

### Code Quality

10. Use TypeScript strictly
11. Follow ESLint rules
12. Write meaningful code comments
13. Document complex logic
14. Test new features
15. Review code before finishing
16. Keep dependencies updated
17. Monitor performance
18. Break down large files (500+ lines) into smaller, reusable components

### Consistency

19. Follow accessibility guidelines
20. Maintain consistent code style
21. Maintain consistent UI style
22. Maintain consistent package documentation
23. Ensure localization for each page
24. Use appropriate input components for data types (NumberInput for numbers, DateInput for dates)

### Best Practices

25. Avoid deprecated methods
26. Use Tailwind CSS (no inline styling)
27. Keep project clean (no useless files/packages)
28. Ensure no lint errors, even during build
29. Maintain high standard for code, logic, and testing
30. Centralize localization
31. Update changelog for every code update
32. Document all features and packages
33. Use consistent naming conventions for page notes
34. Always validate form inputs through proper components
35. Ensure proper cache invalidation when data changes

### Code Review

36. Perform thorough code reviews on all non-ignored directories and files to ensure consistent organization, naming conventions, and adherence to project standards.

37. Dont run the project for me.
