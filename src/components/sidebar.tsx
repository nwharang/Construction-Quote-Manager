import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FileText, Package, Home, Menu, X } from 'lucide-react';
import { Button } from '@heroui/react';

// Export as default function for better compatibility
export default function Sidebar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (pathname: string) => router.pathname === pathname;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        isIconOnly
        
        className="fixed md:hidden bottom-4 right-4 z-50 bg-primary text-white rounded-full shadow-lg"
        onPress={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`static left-0 w-64 h-full bg-[rgba(var(--background-start-rgb),0.95)] border-r border-[rgba(var(--border-color),0.5)] backdrop-blur-md overflow-y-auto z-40 shadow-sm transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="py-4 px-3">
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className={`flex items-center p-3 rounded-lg ${
                  isActive('/')
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-default-100 dark:hover:bg-default-50/10'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home size={18} />
                <span className="ml-3">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                href="/quotes"
                className={`flex items-center p-3 rounded-lg ${
                  isActive('/quotes') || router.pathname.startsWith('/quotes/')
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-default-100 dark:hover:bg-default-50/10'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FileText size={18} />
                <span className="ml-3">Quotes</span>
              </Link>
            </li>
            <li>
              <Link
                href="/products"
                className={`flex items-center p-3 rounded-lg ${
                  isActive('/products')
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-default-100 dark:hover:bg-default-50/10'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Package size={18} />
                <span className="ml-3">Products</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
