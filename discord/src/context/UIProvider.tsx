
import React, { useState } from 'react';
import { Page, UIContext } from './UIContext'
export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<Page>('guild');

  return (
    <UIContext.Provider value={{ currentPage, setCurrentPage }}>
      {children}
    </UIContext.Provider>
  );
};