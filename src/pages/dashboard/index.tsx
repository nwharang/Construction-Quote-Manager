import React from 'react';
import Head from 'next/head';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { LogOut, FileText, Plus, User, Home, Settings, CreditCard, BarChart4 } from 'lucide-react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };
  
  return (
    <>
      <Head>
        <title>Dashboard | Construction Quote Manager</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-md hidden md:block">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Construction Quotes</h1>
          </div>
          
          <nav className="mt-6">
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Main</p>
            </div>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700"
            >
              <Home className="h-5 w-5 mr-3" />
              <span>Dashboard</span>
            </a>
            <a 
              href="#" 
              onClick={() => router.push('/quotes')}
              className="flex items-center px-6 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FileText className="h-5 w-5 mr-3" />
              <span>Quotes</span>
            </a>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <User className="h-5 w-5 mr-3" />
              <span>Customers</span>
            </a>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <BarChart4 className="h-5 w-5 mr-3" />
              <span>Reports</span>
            </a>
            
            <div className="px-4 py-2 mt-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</p>
            </div>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Settings className="h-5 w-5 mr-3" />
              <span>Settings</span>
            </a>
            <a 
              href="#" 
              className="flex items-center px-6 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <CreditCard className="h-5 w-5 mr-3" />
              <span>Billing</span>
            </a>
            <button 
              onClick={handleSignOut}
              className="flex items-center w-full px-6 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {/* Mobile Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center md:hidden">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Construction Quotes</h1>
            <button 
              onClick={handleSignOut}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </header>
          
          {/* Page Header */}
          <div className="bg-white dark:bg-gray-800 shadow-sm md:hidden">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            </div>
          </div>
          
          <div className="p-6">
            <div className="md:flex md:items-center md:justify-between mb-8 hidden">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <button
                onClick={() => router.push('/quotes/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New Quote
              </button>
            </div>
            
            {/* Welcome Card */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-md rounded-lg mb-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Welcome, {session?.user?.name || 'User'}!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You are signed in as <span className="font-medium">{session?.user?.email}</span>
                </p>
                <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => router.push('/quotes')}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FileText className="-ml-1 mr-2 h-5 w-5" />
                    View Quotes
                  </button>
                  <button
                    onClick={() => router.push('/quotes/new')}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Create New Quote
                  </button>
                </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-md rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Quotes</dt>
                        <dd className="text-xl font-bold text-gray-900 dark:text-white">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-md rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Accepted Quotes</dt>
                        <dd className="text-xl font-bold text-gray-900 dark:text-white">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-md rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Customers</dt>
                        <dd className="text-xl font-bold text-gray-900 dark:text-white">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-md rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                      <BarChart4 className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                        <dd className="text-xl font-bold text-gray-900 dark:text-white">$0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-md rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="text-center py-10">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No activity yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Get started by creating your first quote.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => router.push('/quotes/new')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="-ml-1 mr-2 h-5 w-5" />
                      New Quote
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 