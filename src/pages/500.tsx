import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

export default function ServerErrorPage() {
  return (
    <>
      <Head>
        <title>Server Error | Construction Quote Manager</title>
      </Head>
      
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl font-bold text-red-600 dark:text-red-400">500</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Server Error
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              We're sorry, something went wrong on our server. Please try again later.
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              Return to Home
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 