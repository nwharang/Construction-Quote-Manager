# Toast Notification Guidelines

This document outlines best practices for using toast notifications in the application to prevent overwhelming users with excessive notifications.

## Common Toast Issues

1. **Toast Spamming**: Multiple toasts appearing simultaneously for the same action
2. **Duplicate Errors**: The same error showing up multiple times
3. **Validation Errors**: Multiple error toasts for field validation instead of grouping

## Implemented Solutions

### 1. Toast Limiting

We've implemented a toast limiting system that:
- Restricts the number of visible toasts to a maximum of 2 at once
- Prevents duplicate error messages
- Prioritizes newer notifications over older ones

### 2. Consolidated Validation Errors

For form validation:
- Group validation errors into a single toast instead of showing separate toasts for each field
- Format error messages in a user-friendly way
- Show the most important errors first

### 3. Client-Side Validation

To reduce server-side validation errors:
- Implement client-side validation before submitting data
- Use more descriptive error messages
- Prevent form submission if validation fails
- Focus on invalid fields

## Best Practices

When adding toast notifications to your code:

1. **Use the `useAppToast` hook**
   ```typescript
   const toast = useAppToast();
   toast.success('Operation completed successfully');
   ```

2. **Avoid showing success toasts for every small action**
   - Group related actions into a single success message
   - Only show success toasts for important actions

3. **Handle errors appropriately**
   - Catch errors at the appropriate level
   - Format error messages to be user-friendly
   - Group related errors
   
4. **Don't show toasts on initial page load**
   - Avoid showing toasts when components first mount
   - Only show toasts in response to user actions

5. **Use appropriate toast types**
   - `success`: For successful operations
   - `error`: For errors that require attention
   - `loading`: For long-running operations (remember to dismiss these!)

6. **Toast Content Guidelines**
   - Keep messages short (under 80 characters)
   - Use plain language
   - Be specific about what succeeded or failed
   - For errors, suggest next steps when possible

## Examples

### Good Example: Grouped Validation Errors
```typescript
// Bad - multiple toasts for each validation error
if (!formData.name) toast.error('Name is required');
if (!formData.email) toast.error('Email is required');
if (!formData.phone) toast.error('Phone is required');

// Good - one toast with all validation errors
const errors = [];
if (!formData.name) errors.push('Name is required');
if (!formData.email) errors.push('Email is required');
if (!formData.phone) errors.push('Phone is required');

if (errors.length > 0) {
  toast.error(`Please fix the following: ${errors.join(', ')}`);
  return;
}
```

### Good Example: Handling Success/Error in Mutations
```typescript
const mutation = api.someResource.update.useMutation({
  onSuccess: () => {
    toast.success('Updated successfully');
    // Other success actions...
  },
  onError: (error) => {
    if (error.data?.zodError) {
      // Handle validation errors in a single toast
      const errorMessages = Object.values(error.data.zodError.fieldErrors)
        .flat()
        .filter(Boolean)
        .join(', ');
      
      toast.error(errorMessages || 'Validation failed');
    } else {
      toast.error('Failed to update. Please try again.');
    }
  },
});
``` 