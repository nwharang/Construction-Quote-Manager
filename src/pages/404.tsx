import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="">
      <Head>
        <title>Page Not Found | Construction Quote Manager</title>
      </Head>
      
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl font-bold text-blue-600 dark:text-blue-400">404</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Page Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sorry, the page you are looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 