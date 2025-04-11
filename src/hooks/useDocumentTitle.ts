
import { useEffect } from 'react';

/**
 * Hook to set the document title with a consistent format
 * @param title The page-specific part of the title
 */
export const useDocumentTitle = (title: string): void => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `CliniPay | ${title}` : 'CliniPay';
    
    // Restore the previous title when the component unmounts
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};
