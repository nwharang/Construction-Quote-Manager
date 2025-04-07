import React from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type BreadcrumbItem = {
  label: string;
  href: string;
  isCurrent?: boolean;
};

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav className={`mb-6 ${className}`} aria-label="breadcrumb">
      <ol className="flex items-center flex-wrap">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <li className="flex items-center">
              {index === items.length - 1 ? (
                <span 
                  className="text-default-900 font-medium truncate" 
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link 
                  href={item.href}
                  className="text-default-500 hover:text-primary-500 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
            {index < items.length - 1 && (
              <ChevronRight className="h-4 w-4 mx-2 text-default-400" />
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
} 