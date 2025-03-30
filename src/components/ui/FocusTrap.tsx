import React, { useRef, useEffect } from 'react';

interface FocusTrapProps {
  /** Components to trap focus within */
  children: React.ReactNode;
  /** Whether the focus trap is active */
  active?: boolean;
  /** Initial element to focus when trap is activated */
  initialFocus?: React.RefObject<HTMLElement | null>;
  /** Optional ref to return focus to when trap is deactivated */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
}

/**
 * FocusTrap component that keeps focus within a specific container
 * Useful for modal dialogs, dropdown menus, and other UI elements that should trap focus
 * Implements WCAG 2.1 criterion 2.4.3 (Focus Order)
 */
export function FocusTrap({
  children,
  active = true,
  initialFocus,
  returnFocusTo,
}: FocusTrapProps) {
  const trapRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  
  // Store the previously focused element when the trap is activated
  useEffect(() => {
    if (active) {
      previousFocus.current = document.activeElement as HTMLElement;
    }
  }, [active]);
  
  // Set up focus trap when component mounts or when active state changes
  useEffect(() => {
    if (!active || !trapRef.current) return;
    
    // Find all focusable elements
    const focusableElements = Array.from(
      trapRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
    
    // Focus the initial element or the first focusable element
    if (initialFocus?.current) {
      initialFocus.current.focus();
    } else if (focusableElements.length > 0) {
      focusableElements[0]?.focus();
    }
    
    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (!trapRef.current) return;
      
      // If no focusable elements, do nothing
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // Ensure elements exist before using them
      if (!firstElement || !lastElement) return;
      
      // Handle tab and shift+tab navigation
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    // Add event listener for keyboard navigation
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Return focus to the previous element when the trap is deactivated
      if (!active && previousFocus.current && returnFocusTo?.current) {
        returnFocusTo.current.focus();
      } else if (!active && previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [active, initialFocus, returnFocusTo]);
  
  return (
    <div ref={trapRef} data-focus-trap={active ? 'true' : 'false'}>
      {children}
    </div>
  );
} 