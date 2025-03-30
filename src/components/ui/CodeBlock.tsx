import React from 'react';

interface CodeBlockProps {
  children: string;
  className?: string;
}

/**
 * Component for displaying formatted code with proper styling
 * Following HeroUI design patterns
 */
export function CodeBlock({ children, className = '' }: CodeBlockProps) {
  return (
    <div className={`bg-default-100 rounded-md overflow-auto ${className}`}>
      <pre className="p-4 text-sm">
        <code className="text-default-foreground font-mono">{children}</code>
      </pre>
    </div>
  );
} 