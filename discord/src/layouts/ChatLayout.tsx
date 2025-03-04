import React, { JSX } from 'react';
import { Chat } from '../pages/Chat';
import { useAppSelector } from '../hooks/useAppSelector'
import { useAppState } from '../hooks/useAppState'
import { IconX } from '../assets/icons'

interface ChatLayoutProps {
  expanded?: boolean;
  embedded?: boolean; // When embedded in call view
}

export function ChatLayout({ 
  embedded = false 
}: ChatLayoutProps): JSX.Element {
  const { setChatExpanded } = useAppState();
  const isExpanded = useAppSelector((state) => state.chatStatus?.isExpanded ?? false);
  
  const handleCloseChat = () => {
    setChatExpanded(false);
  };

  // If not expanded and not embedded, show the chat toggle button
  if (!isExpanded && !embedded) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-primary p-3 text-white shadow-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors duration-200"
        onClick={() => setChatExpanded(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      </div>
    );
  }

  // When chat is expanded or embedded
  let containerClass = embedded
    ? 'h-full w-full overflow-hidden bg-white dark:bg-gray-800' // Embedded in call view
    : 'fixed bottom-4 right-4 z-50 h-[400px] w-[300px] rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700'; // Floating chat

  return (
    <div className={containerClass}>
      <div className="flex h-full flex-col">
        {/* Chat header with title and close button */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-white">Chat</h3>
          <button 
            className="rounded p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors duration-200" 
            onClick={handleCloseChat}
            aria-label="Close chat"
          >
            <IconX />
          </button>
        </div>
        
        {/* Main chat content */}
        <div className="flex-grow overflow-auto bg-white dark:bg-gray-800">
          <Chat />
        </div>
      </div>
    </div>
  );
}