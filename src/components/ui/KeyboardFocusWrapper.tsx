import React, { useRef, useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';

interface KeyboardFocusWrapperProps {
  /** The child components to be wrapped */
  children: React.ReactNode;
  /** Enable/disable keyboard navigation functionality */
  enabled?: boolean;
  /** Whether to trap focus within this component */
  trapFocus?: boolean;
  /** Callback when escape key is pressed */
  onEscape?: () => void;
  /** Optional CSS class */
  className?: string;
  /** Optional ID for the wrapper */
  id?: string;
}

/**
 * Enhances keyboard navigation for grouped interactive elements
 * Handles focus trapping and directional navigation for accessibility
 * Implements WCAG 2.1 criteria for keyboard navigation (2.1.1, 2.1.2, 2.4.3, 2.4.7)
 */
export function KeyboardFocusWrapper({
  children,
  enabled = true,
  trapFocus = false,
  onEscape,
  className = '',
  id,
}: KeyboardFocusWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [focusVisible, setFocusVisible] = useState(false);
  
  // Track input method (mouse vs keyboard)
  useEffect(() => {
    const handleMouseDown = () => {
      setFocusVisible(false);
    };
    
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Tab') {
        setFocusVisible(true);
      }
    };
    
    // Add global listeners to detect input method
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!enabled) return;
    
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }
    
    if (!trapFocus) return;
    
    const focusableElements = wrapperRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusableElements || focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    // Trap focus - handle tab and shift+tab navigation
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  return (
    <div
      ref={wrapperRef}
      id={id}
      className={`${className} ${focusVisible ? 'focus-visible' : ''}`}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {children}
    </div>
  );
} 