import React, { useState, useEffect } from 'react';

interface KeyboardFocusIndicatorProps {
  /** Child components to enhance with focus indicators */
  children: React.ReactNode;
  /** Optional custom class for the focus indicator */
  focusClassName?: string;
  /** Optional ID for the wrapper */
  id?: string;
  /** Optional additional class name */
  className?: string;
  /** Whether to show the focus indicator - useful for controlled scenarios */
  showFocus?: boolean;
}

/**
 * Adds visible focus indicators only when using keyboard navigation
 * Enhances accessibility while maintaining clean visual aesthetics for mouse users
 * Implements WCAG 2.1 criterion 2.4.7 (Focus Visible)
 * Follows HeroUI design patterns
 */
export function KeyboardFocusIndicator({
  children,
  focusClassName = 'ring-2 ring-primary ring-offset-2',
  id,
  className = '',
  showFocus,
}: KeyboardFocusIndicatorProps) {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  
  // Track input method (mouse vs keyboard)
  useEffect(() => {
    // Function to handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };
    
    // Function to handle mouse interaction
    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };
    
    // Add event listeners to detect input method
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  // Determine whether to show focus, either from props or state
  const shouldShowFocus = showFocus !== undefined ? showFocus : isKeyboardUser;
  
  // Apply focus class conditionally
  const focusClasses = shouldShowFocus ? focusClassName : '';
  
  return (
    <div 
      id={id}
      className={`outline-none focus-within:${focusClasses} ${className}`}
      data-keyboard-focus={shouldShowFocus ? 'true' : 'false'}
      data-focus-visible={shouldShowFocus ? 'true' : 'false'}
    >
      {children}
    </div>
  );
} 