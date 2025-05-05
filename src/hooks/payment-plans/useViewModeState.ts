
import { useState } from 'react';

export const useViewModeState = () => {
  const [isViewMode, setIsViewMode] = useState(false);
  
  return {
    isViewMode,
    setIsViewMode
  };
};
