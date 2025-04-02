import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';

interface UsePaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  total?: number;
  syncWithUrl?: boolean;
}

export function usePagination({
  defaultPage = 1,
  defaultLimit = 10,
  total = 0,
  syncWithUrl = false,
}: UsePaginationOptions = {}) {
  const router = useRouter();
  
  // Initialize from URL if syncWithUrl is enabled
  const initialPage = syncWithUrl && router.query.page 
    ? parseInt(router.query.page as string, 10) 
    : defaultPage;
  
  const initialLimit = syncWithUrl && router.query.limit 
    ? parseInt(router.query.limit as string, 10) 
    : defaultLimit;
  
  const [page, setPageInternal] = useState(initialPage);
  const [limit, setLimitInternal] = useState(initialLimit);
  
  // Calculate total pages
  const totalPages = total ? Math.max(1, Math.ceil(total / limit)) : 0;
  
  // Update URL if syncWithUrl is enabled
  const updateUrl = useCallback((newPage: number, newLimit: number) => {
    if (!syncWithUrl) return;
    
    const query = { ...router.query };
    
    if (newPage !== defaultPage) {
      query.page = newPage.toString();
    } else {
      delete query.page;
    }
    
    if (newLimit !== defaultLimit) {
      query.limit = newLimit.toString();
    } else {
      delete query.limit;
    }
    
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router, defaultPage, defaultLimit, syncWithUrl]);
  
  // Update page
  const setPage = useCallback((newPage: number) => {
    const clampedPage = Math.max(1, Math.min(newPage, totalPages || Number.MAX_SAFE_INTEGER));
    setPageInternal(clampedPage);
    updateUrl(clampedPage, limit);
  }, [limit, totalPages, updateUrl]);
  
  // Update limit
  const setLimit = useCallback((newLimit: number) => {
    setLimitInternal(newLimit);
    // When changing limit, we usually want to go back to page 1
    setPageInternal(1);
    updateUrl(1, newLimit);
  }, [updateUrl]);
  
  // Reset pagination
  const resetPagination = useCallback(() => {
    setPageInternal(defaultPage);
    setLimitInternal(defaultLimit);
    updateUrl(defaultPage, defaultLimit);
  }, [defaultPage, defaultLimit, updateUrl]);
  
  // Sync with URL when router changes
  useEffect(() => {
    if (!syncWithUrl) return;
    
    const urlPage = router.query.page 
      ? parseInt(router.query.page as string, 10) 
      : defaultPage;
    
    const urlLimit = router.query.limit 
      ? parseInt(router.query.limit as string, 10) 
      : defaultLimit;
    
    if (page !== urlPage) {
      setPageInternal(urlPage);
    }
    
    if (limit !== urlLimit) {
      setLimitInternal(urlLimit);
    }
  }, [router.query, syncWithUrl, defaultPage, defaultLimit, page, limit]);
  
  // Calculate pagination info
  const pageInfo = {
    startIndex: (page - 1) * limit,
    endIndex: Math.min((page) * limit, total) - 1,
    hasMore: page < totalPages,
    hasPrevious: page > 1,
  };
  
  return {
    page,
    limit,
    totalPages,
    setPage,
    setLimit,
    pageInfo,
    resetPagination,
  };
} 