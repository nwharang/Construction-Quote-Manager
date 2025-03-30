# HeroUI Migration Plan

## Overview
The application is being migrated to use HeroUI components exclusively. This document outlines the steps required to complete this migration, tracking progress and providing guidance for future development.

## Components Already Using HeroUI
- The quotes page (`src/pages/admin/quotes/index.tsx`) uses HeroUI components including:
  - Card, CardHeader, CardBody
  - Button
  - Modal, ModalContent, ModalHeader, ModalBody, ModalFooter
  - Chip
  - Spinner
  - Pagination

- The customers page (`src/pages/admin/customers/index.tsx`) uses HeroUI components including:
  - Table, TableHeader, TableColumn, TableBody, TableRow, TableCell
  - Card, CardHeader, CardBody
  - Button
  - Spinner
  - Pagination

- Throughout the application, we use many HeroUI components:
  - Card, CardBody, CardHeader, CardFooter
  - Button
  - Input, NumberInput, Textarea
  - Select, SelectItem
  - Table components (Table, TableHeader, TableColumn, TableBody, TableRow, TableCell)
  - Modal components (Modal, ModalContent, ModalHeader, ModalBody, ModalFooter)
  - Navigation components (Navbar, NavbarBrand, NavbarContent, NavbarItem)
  - Dropdown components (Dropdown, DropdownTrigger, DropdownMenu, DropdownItem)
  - Spinner
  - Chip, Badge
  - Switch
  - Breadcrumbs, BreadcrumbItem
  - Avatar

## Components to Remove
The following custom components should be removed as they're being replaced by HeroUI equivalents:
- ✅ `src/components/ui/card.tsx` (replaced by HeroUI Card)
- ✅ `src/components/ui/button.tsx` (replaced by HeroUI Button)
- ✅ `src/components/ui/AccessibleFormValidator.tsx` (removed, replaced by FormField component)
- ✅ `src/components/ui/AccessibleFormField.tsx` (removed, replaced by FormField component)

## Form Field Component Standard
The new approach for form fields uses a simplified wrapper around HeroUI components:

- ✅ `src/components/ui/FormField.tsx` - A consistent component that wraps HeroUI Input and Textarea components with proper labeling, error handling, and accessibility features

This component provides:
- Consistent styling across all forms
- Simplified prop interface
- Error message handling
- Built-in accessibility features

## Custom Components Updated/Remaining
1. ✅ `src/components/ui/CodeBlock.tsx` (updated to use HeroUI styling conventions)
2. ✅ `src/components/ui/FormErrorMessage.tsx` (updated to use HeroUI styling conventions)
3. ✅ `src/components/ui/toaster.tsx` (already uses HeroUI ToastProvider)
4. ✅ `src/components/ui/KeyboardFocusIndicator.tsx` (updated to use HeroUI styling conventions)
5. 🔒 `src/components/ui/FocusTrap.tsx` (keep - specialized component)
6. 🔒 `src/components/ui/KeyboardFocusWrapper.tsx` (keep - specialized component)

## Component Review Status
We've conducted an extensive review of the codebase components and their HeroUI integration:

### Specialized Providers
- ✅ `src/components/providers/ToastProvider.tsx` - Properly using `@heroui/toast`
- ✅ `src/components/shared/ToastContainer.tsx` - Properly using `@heroui/toast`

### Feature Components
All feature components have been reviewed and are using proper HeroUI components:

#### Quote Components
- ✅ `src/components/quotes/QuoteList.tsx` - Using HeroUI Table, Button, Chip
- ✅ `src/components/quotes/QuoteSummary.tsx` - Using HeroUI Card, Divider
- ✅ `src/components/quotes/QuoteAdjustments.tsx` - Using HeroUI Card, NumberInput
- ✅ `src/components/quotes/TaskList.tsx` - Using HeroUI Card, Button
- ✅ `src/components/quotes/CustomerInfoForm.tsx` - Using HeroUI Card, Input, Textarea
- ✅ `src/components/quotes/QuoteFormHeader.tsx` - Using HeroUI Button, Breadcrumbs

#### Dashboard Components
- ✅ `src/components/dashboard/StatCards.tsx` - Using HeroUI Card
- ✅ `src/components/dashboard/RecentActivity.tsx` - Using HeroUI Card, Chip, Button

#### Settings Components
- ✅ `src/components/settings/QuoteSettings.tsx` - Using HeroUI Card, Input, Button
- ✅ `src/components/settings/NotificationSettings.tsx` - Using HeroUI Card, Switch, Button
- ✅ `src/components/settings/GeneralSettings.tsx` - Using HeroUI Card, Input, Button
- ✅ `src/components/settings/AppearanceSettings.tsx` - Using HeroUI Card, Select, Button

#### Navigation & UI Controls
- ✅ `src/components/LocaleSwitch.tsx` - Using HeroUI Dropdown, Button
- ✅ `src/components/ThemeToggle.tsx` - Using HeroUI Switch
- ✅ `src/components/LanguageSelector.tsx` - Using HeroUI Select
- ✅ `src/components/NavBar.tsx` - Using HeroUI Navbar components
- ✅ `src/components/SidebarComponent.tsx` - Using HeroUI navigation components

#### Customer Components
- ✅ `src/components/customers/DeleteCustomerDialog.tsx` - Using HeroUI Modal components

### Pages
All pages have been reviewed and are consistently using HeroUI components:

- ✅ Home & Auth Pages - Using proper HeroUI Card, Button, Input components
- ✅ Admin Dashboard - Using HeroUI Card, Chip, Button, Spinner
- ✅ Admin Products - Using HeroUI Modal, Button components
- ✅ Admin Quotes - Using HeroUI Table, Modal, Button, Chip, Badge components

## Provider Optimization
We've reviewed all providers to ensure they follow the guidelines in CONTEXT.md and properly integrate with HeroUI:

### Provider Structure
- ✅ `src/components/providers/index.tsx` - Main provider composition that properly wraps the application with all necessary providers:
  - SessionProvider (from next-auth)
  - HeroUIProvider (from @heroui/react)
  - I18nProvider (custom)
  - ToastContainer (custom wrapper for HeroUI toast)

### Individual Providers
- ✅ `src/components/providers/I18nProvider.tsx` - Internationalization provider that follows React Context best practices
- ✅ `src/components/providers/ThemeProvider.tsx` - Theme provider that correctly integrates with HeroUI theme system
- ✅ `src/components/providers/UIProvider.tsx` - UI settings provider that follows React Context best practices
- ✅ `src/components/providers/ToastProvider.tsx` - Properly configured wrapper for @heroui/toast

### Provider Optimization Findings
1. **Context Value Memoization** - Our providers correctly use `useMemo` to memoize context values to prevent unnecessary re-renders (following React best practices)
2. **Proper Context Organization** - Each provider focuses on a specific concern (i18n, theme, UI settings, toasts) following the single responsibility principle
3. **Error Handling** - Hooks like `useI18n`, `useTheme`, and `useUI` properly throw errors when used outside their respective providers
4. **HeroUI Integration** - The providers properly integrate with HeroUI components and theming system

### Integration with _app.tsx
- ✅ `src/pages/_app.tsx` - Properly uses the main Providers component to wrap the entire application

## Analysis Findings
After reviewing the entire codebase, we've found:
1. The application already uses many HeroUI components directly throughout the codebase
2. Several custom components can be kept as they provide specialized functionality not directly available in HeroUI
3. Custom components that overlap with HeroUI capabilities have been successfully removed or updated
4. No remaining imports from custom UI components that should be using HeroUI were found
5. The codebase demonstrates excellent consistency in component usage, with HeroUI being used properly throughout all pages and components
6. All toast notifications are properly using `@heroui/toast`
7. All providers follow React Context best practices and properly integrate with HeroUI

## Recommended HeroUI Component Usage
Based on the HeroUI documentation, the following components should be used for specific UI patterns:

### Layout Components
- Use `Card`, `CardHeader`, `CardBody`, `CardFooter` for content containers
- Use `Divider` for separating content sections
- Use `Container` for responsive page layouts

### Form Components
- Use `Input` for text input fields
- Use `Textarea` for multi-line text input
- Use `Select`, `SelectItem` for dropdown selection
- Use `NumberInput` for numeric input with the following configurations:
  - Currency: `min=0, step=0.01, formatOptions={{ style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }}, startContent="$"`
  - Percentage: `min=0, step={0.1}, formatOptions={{ style: 'decimal', minimumFractionDigits: 1, maximumFractionDigits: 1 }}, endContent="%"`
  - Integer Quantity: `min=1, step=1, formatOptions={{ style: 'decimal', maximumFractionDigits: 0 }}`
- For simpler forms, use our `FormField` component which provides a wrapper around Input and Textarea with consistent styling

### Data Display Components
- Use `Table` components for data tables
- Use `Chip` for status indicators
- Use `Badge` for counters and small status indicators
- Use `Skeleton` for loading states

### Interactive Components
- Use `Button` for actions with appropriate color variants (`primary`, `secondary`, `danger`)
- Use `Modal` components for dialogs and pop-ups
- Use `Dropdown` components for menu actions

## Migration Steps for Future Components
1. For any new components being developed:
   - Always check the HeroUI documentation first to see if a component exists
   - Use HeroUI components where available instead of creating custom ones
   - Follow HeroUI design patterns and prop naming conventions
   - For simple form inputs, use the `FormField` component for consistent styling

2. When adding new features:
   - Use HeroUI components exclusively for UI elements
   - Follow the component configurations outlined in the CONTEXT.md document
   - Ensure consistent styling using HeroUI's theming system

3. When encountering a need for custom functionality:
   - First check if it can be accomplished by composing existing HeroUI components
   - If custom implementation is needed, follow HeroUI styling conventions
   - Document the component with clear usage examples

## Theming and Styling
1. Use HeroUI's theming system consistently:
   - Use semantic color tokens (`primary`, `secondary`, `danger`, etc.)
   - Use HeroUI's size tokens for spacing and dimensions
   - Follow HeroUI's responsive design approach

2. Avoid direct Tailwind utility classes that override HeroUI's styling when possible:
   - Use HeroUI's built-in variants and props before custom styling
   - When custom styling is needed, use the `className` prop with Tailwind classes that complement HeroUI

## Testing Strategy
1. Test each page after migration to ensure UI components render correctly
2. Verify interactive components (buttons, inputs, modals) function as expected
3. Check for any styling inconsistencies or layout issues
4. Ensure responsive behavior remains intact

## Maintenance Guidelines
For long-term success with HeroUI:

1. Keep dependencies updated:
   - Regularly update HeroUI packages to benefit from bug fixes and new features
   - Use the HeroUI CLI for managing component updates: `npx @heroui/cli upgrade`

2. Monitor HeroUI documentation for:
   - New components that might replace custom implementations
   - API changes that might affect existing component usage
   - Best practices for component composition

3. Implement a code review process that includes:
   - Checking for consistent HeroUI usage in new components
   - Validating that styling follows HeroUI conventions

## Completion Criteria
- ✅ All custom UI components either replaced with HeroUI equivalents or confirmed to follow HeroUI patterns
- ✅ No references to removed components remain in the codebase
- ✅ All pages render correctly and maintain functionality
- ✅ UI is consistent throughout the application

## Resources
- [HeroUI Documentation](https://www.heroui.com/docs)
- [NextUI to HeroUI Migration Guide](https://www.heroui.com/docs/guide/nextui-to-heroui)
- [HeroUI Components Reference](https://www.heroui.com/docs/components)
- [HeroUI NextJS Integration](https://www.heroui.com/docs/frameworks/nextjs)
- [HeroUI CLI Usage](https://www.heroui.com/docs/guide/cli) 