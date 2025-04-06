# Task and Material Management Implementation Document

## 1. Current State Analysis

The quotes system currently has a partial implementation with several key components that need enhancement:

- Basic quote creation form with title, customer, status and markup percentage fields
- Preliminary TaskList component with basic fields (description, price)
- Initial MaterialsList component with partial ProductSelector integration
- Translation keys for most UI elements established

## 2. Missing Components & Implementation Plan

### 2.1 Missing Features

1. **Material Type Toggle**

   - Missing UI for switching between ITEMIZED/LUMPSUM material types
   - Missing implementation of lump sum cost input
   - No conditional rendering based on material type

2. **Task Management**

   - Missing task reordering functionality (up/down buttons)
   - Incomplete task editing capabilities
   - No task deletion confirmation

3. **Material Management**

   - Product selection needs proper error handling
   - Unit price calculation/syncing with product prices incomplete
   - Material deletion without confirmation

4. **UI/UX Consistency**
   - Select component implementation issues
   - Inconsistent component styling/behavior
   - Incomplete translation key usage

### 2.2 Implementation Plan

#### Phase 1: Core Component Fixes (1-2 days)

1. **Fix TaskList Component**

   - Implement proper HeroUI components consistently
   - Fix type safety issues with optional properties
   - Ensure proper translation key usage
   - Fix missing button in MaterialsList

2. **Fix Select Component Issues**
   - Correct implementation of Status selector in QuoteForm
   - Ensure proper styling and interaction patterns

#### Phase 2: Material Type Toggle Implementation (1-2 days)

1. **Add Material Type Selection**

   - Add toggle between ITEMIZED/LUMPSUM using HeroUI components
   - Implement conditional rendering based on selected type
   - Update calculation logic to handle both material types

2. **Implement Lump Sum Input**
   - Add lump sum cost input with proper validation
   - Ensure proper display in quote summary
   - Add proper translation keys for lump sum UI

#### Phase 3: Task Management Enhancements (2-3 days)

1. **Task Ordering Implementation**

   - Add up/down controls for task reordering
   - Implement task order maintenance in state
   - Store and maintain order in database

2. **Task Editing Improvements**
   - Add task editing with proper validation
   - Implement task deletion with confirmation
   - Ensure proper state management for all task operations

#### Phase 4: Material Management Enhancements (2-3 days)

1. **Product Selection Enhancements**

   - Improve ProductSelector integration
   - Sync product details (price, name) when selected
   - Add quantity/price calculations with line totals

2. **Material List Improvements**
   - Add material deletion with confirmation
   - Add inline editing for materials
   - Implement proper validation for all material fields

#### Phase 5: UI/UX Refinement (1-2 days)

1. **Design System Compliance**

   - Ensure all components follow HeroUI design system
   - Establish consistent spacing, typography and colors
   - Implement proper responsive behavior

2. **Accessibility Improvements**
   - Add proper ARIA labels
   - Ensure keyboard navigation
   - Implement focus management for complex interactions

## 3. UI/UX Design Specifications

### 3.1 Task Card Component

```
┌─────────────────────────────────────────────────────────────┐
│ Task Description                           Labor Price      │
│ ┌───────────────────────────┐           ┌──────────┐  [↑]  │
│ │ Install new countertop    │           │ $450.00  │  [↓]  │
│ └───────────────────────────┘           └──────────┘  [✕]  │
│                                                           │
│ Material Type                                             │
│ ┌─────────────┐                                           │
│ │ ▢ Itemized  │                                           │
│ │ ▢ Lump Sum  │                                           │
│ └─────────────┘                                           │
│                                                           │
│ [Conditional rendering based on Material Type selection]   │
│                                                           │
│ ┌─────────────────────────────────────────────────────────┐
│ │ Materials                                                │
│ │ ┌────────────────┐ ┌────┐ ┌─────────┐ ┌────────────┐    │
│ │ │ Select product │ │ Qty │ │ Price  │ │ Line Total │    │
│ │ └────────────────┘ └────┘ └─────────┘ └────────────┘    │
│ │                                                        │
│ │ ┌────────────────┐ ┌────┐ ┌─────────┐ ┌────────────┐    │
│ │ │ Granite slab   │ │  1  │ │ $320.00│ │   $320.00  │ [✕]│
│ │ └────────────────┘ └────┘ └─────────┘ └────────────┘    │
│ │                                                        │
│ │ ┌────────────────┐ ┌────┐ ┌─────────┐ ┌────────────┐    │
│ │ │ Caulk          │ │  2  │ │ $8.50  │ │   $17.00   │ [✕]│
│ │ └────────────────┘ └────┘ └─────────┘ └────────────┘    │
│ │                                                        │
│ │ ┌────────────────┐ ┌────┐ ┌─────────┐                 │
│ │ │ Select product │ │  1  │ │ $0.00  │ [Add Material] │
│ │ └────────────────┘ └────┘ └─────────┘                 │
│ └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Lump Sum Material View

```
┌─────────────────────────────────────────────────────────────┐
│ Material Type                                             │
│ ┌─────────────┐                                           │
│ │ ▢ Itemized  │                                           │
│ │ ▣ Lump Sum  │                                           │
│ └─────────────┘                                           │
│                                                           │
│ Estimated Materials Cost                                   │
│ ┌───────────────────────────┐                             │
│ │ $250.00                   │                             │
│ └───────────────────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Quote Summary Component

```
┌─────────────────────────────────────────────────────────────┐
│ Quote Summary                                              │
│                                                           │
│ Tasks Subtotal:                           $450.00          │
│ Materials Subtotal:                       $337.00          │
│ ─────────────────────────────────────────────────          │
│ Combined Subtotal:                        $787.00          │
│ Markup (15%):                             $118.05          │
│ ─────────────────────────────────────────────────          │
│ Grand Total:                              $905.05          │
│                                                           │
└─────────────────────────────────────────────────────────────┘
```

## 4. Implementation Details and Requirements

### 4.1 Technical Requirements

1. **Component Structure**

   - TaskList component manages task creation, editing, and deletion
   - MaterialsList component (subcomponent of TaskList) manages materials
   - All components must use HeroUI components exclusively
   - Type safety must be maintained throughout all components

2. **State Management**

   - Use local state with proper React patterns
   - Ensure proper data flow between parent and child components
   - Implement proper mutation handling for all operations

3. **Translation Implementation**
   - All UI text must use translation keys
   - New keys must be added to both English and Vietnamese translations
   - Use the useTranslation hook consistently

### 4.2 MDC Compliance Requirements

1. **UI Component Standards**

   - Use only `@heroui/react` components
   - Follow consistent layout patterns with proper spacing
   - Implement consistent typography and color schemes

2. **Form Implementation**

   - Proper validation for all inputs
   - Clear error messages
   - Consistent input styling

3. **Accessibility**
   - Proper ARIA labels for all interactive elements
   - Proper focus management
   - Keyboard navigation support

### 4.3 Implementation Sequence

1. First, fix the basic component structure and ensure type safety
2. Implement the material type toggle and conditional rendering
3. Add task reordering functionality
4. Complete the product selector integration
5. Refine UI/UX for consistency with HeroUI standards
6. Add accessibility improvements

## 5. Conclusion

This implementation plan provides a comprehensive roadmap for enhancing the quotes module with proper task and material management capabilities. Following this plan will ensure a consistent user experience with proper adherence to the MDC rules.

The implementation will significantly improve the user experience by allowing for more flexible quotes creation with both itemized and lump sum material handling, proper product selection, and a more intuitive task management interface.
