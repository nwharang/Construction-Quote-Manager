import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-[rgba(var(--background-start-rgb),0.95)]">
      <div className="relative w-16 h-16">
        <div className="absolute border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full w-16 h-16 animate-spin"></div>
        <div className="absolute border-4 border-t-transparent border-r-primary border-b-transparent border-l-transparent rounded-full w-12 h-12 left-2 top-2 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        <div className="absolute border-4 border-t-transparent border-r-transparent border-b-primary border-l-transparent rounded-full w-8 h-8 left-4 top-4 animate-spin" style={{ animationDuration: '0.6s' }}></div>
      </div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex justify-center items-center bg-[rgba(var(--background-start-rgb),0.95)]">
      <LoadingSpinner />
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="w-full h-full">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8 mt-4">
          <div className="h-8 bg-default-200 dark:bg-default-700 rounded-md w-64 animate-pulse"></div>
          <div className="h-4 bg-default-100 dark:bg-default-800 rounded-md w-96 mt-2 animate-pulse"></div>
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border border-default-200 dark:border-default-700 rounded-lg">
              <div className="h-6 bg-default-200 dark:bg-default-700 rounded-md w-48 animate-pulse"></div>
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-default-100 dark:bg-default-800 rounded-md w-full animate-pulse"></div>
                <div className="h-4 bg-default-100 dark:bg-default-800 rounded-md w-3/4 animate-pulse"></div>
                <div className="h-4 bg-default-100 dark:bg-default-800 rounded-md w-5/6 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 