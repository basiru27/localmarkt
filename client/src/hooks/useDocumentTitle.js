import { useEffect } from 'react';

export default function useDocumentTitle(title) {
  useEffect(() => {
    const baseTitle = 'GMarkt';
    document.title = title ? `${title} | ${baseTitle}` : baseTitle;
    
    // Optional: cleanup to revert to base title when unmounting, 
    // but usually not needed if every page sets it.
  }, [title]);
}
