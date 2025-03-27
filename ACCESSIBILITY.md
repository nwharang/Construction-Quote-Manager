# Accessibility Guidelines for Construction Quotes Application

## Overview
This document outlines the accessibility standards and best practices that must be followed throughout the Construction Quotes application. Our goal is to create an inclusive application that adheres to WCAG 2.2 AA standards and provides an excellent experience for all users, including those using assistive technologies.

## Core Requirements

### 1. Semantic HTML Structure
- Use proper HTML5 semantic elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`)
- Main content should be wrapped in `<main role="main">` 
- Navigation should use `<nav role="navigation">`
- Each page must have exactly one `<h1>` element
- Maintain proper heading hierarchy (h1 → h2 → h3)

### 2. Keyboard Accessibility
- All interactive elements must be keyboard accessible
- Focus states must be visible and clearly distinguishable
- Ensure logical tab order follows visual layout
- Implement keyboard shortcuts where appropriate (with proper documentation)
- Modal dialogs must trap focus when open

### 3. ARIA Implementation
- Use ARIA attributes appropriately and only when necessary
- All buttons, especially icon-only buttons, must have descriptive `aria-label` attributes
- Form inputs must have associated labels (either explicitly with `<label>` or via `aria-label`/`aria-labelledby`)
- If there are multiple instances of the same landmark role, use `aria-label` to distinguish them
- Dynamic content should use appropriate ARIA live regions

### 4. Color and Contrast
- Text must maintain a minimum contrast ratio of 4.5:1 against its background
- UI controls and meaningful graphics must maintain a minimum contrast ratio of 3:1
- Do not rely on color alone to convey meaning
- Support system color schemes and dark/light mode preferences

### 5. Forms and Validation
- All form fields must have proper labels
- Error messages must be programmatically associated with their relevant fields
- Provide clear instructions for completing forms
- Ensure form validation error messages are accessible to all users

### 6. Images and Media
- All images must have appropriate `alt` text
- Decorative images should have empty `alt=""` attributes
- Complex images should have detailed descriptions available
- Media controls must be keyboard accessible

### 7. Dynamic Content
- Use ARIA live regions for important dynamic updates
- Ensure screen readers are notified of status changes
- Manage focus appropriately after content changes

## Implementation Examples

### Buttons with Icons
```tsx
// GOOD: Icon button with aria-label
<Button isIconOnly variant="light" aria-label="Open menu">
  <Menu className="h-5 w-5" />
</Button>

// BAD: Icon button without aria-label
<Button isIconOnly variant="light">
  <Menu className="h-5 w-5" />
</Button>
```

### Form Fields
```tsx
// GOOD: Input with explicit label
<div>
  <Label htmlFor="customerName">Customer Name</Label>
  <Input id="customerName" />
</div>

// GOOD: Input with aria-label when visual label isn't possible
<Input aria-label="Search quotes" />

// BAD: Input without any labeling
<Input placeholder="Enter customer name" />
```

### Navigation
```tsx
// GOOD: Nav with aria-label
<nav role="navigation" aria-label="Main Navigation">
  {/* Navigation content */}
</nav>

// GOOD: Secondary navigation with distinct label
<nav role="navigation" aria-label="Account Settings">
  {/* Secondary navigation content */}
</nav>
```

## Testing Requirements

1. **Automated Testing:**
   - All pages must pass accessibility tests using Playwright with axe-core
   - Tests must verify proper semantic structure, ARIA usage, and keyboard accessibility

2. **Manual Testing:**
   - Regularly test with screen readers (NVDA, VoiceOver)
   - Verify keyboard navigation and focus management
   - Test with different display modes (zoom, high contrast)

3. **Continuous Integration:**
   - Accessibility tests must be included in CI/CD pipeline
   - Failed accessibility tests should block deployment

## Resources
- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [MDN Accessibility Documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [NextUI Accessibility Features](https://nextui.org/docs/guides/accessibility)
- [Next.js Accessibility](https://nextjs.org/docs/accessibility)

## Implementation Process
1. **Design Phase:** Consider accessibility from the beginning
2. **Development:** Implement using the guidelines above
3. **Testing:** Automated and manual testing before release
4. **Maintenance:** Regular audits and updates

By following these guidelines, we ensure our Construction Quotes application is inclusive, usable, and accessible to all users regardless of their abilities or the assistive technologies they use. 