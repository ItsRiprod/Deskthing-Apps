
import React, { JSX } from 'react';
import { Chat } from '../../pages/Chat';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppState } from '../../hooks/useAppState';
import { IconX } from '../../assets/icons';

export function ChatEmbed(): JSX.Element {
  const { setChatExpanded } = useAppState();
  const isExpanded = useAppSelector((state) => state.chatStatus?.isExpanded ?? false);

  const handleCloseChat = () => {
    setChatExpanded(false);
  };

  if (!isExpanded) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-primary p-3 text-white shadow-lg hover:bg-primary-dark focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors duration-200"
        onClick={() => setChatExpanded(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      </div>
    );
  }
    return (
      <div className="fixed bottom-4 right-4 z-50 h-[400px] w-[300px] rounded-lg bg-gray-800 shadow-xl border border-gray-700">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-700 p-3 bg-gray-900">
            <h3 className="font-semibold text-white">Chat</h3>
            <button 
              className="rounded-sm p-1.5 text-gray-400 hover:bg-gray-700 transition-colors duration-200" 
              onClick={handleCloseChat}
              aria-label="Close chat"
            >
              <IconX />
            </button>
          </div>
          <div className="grow overflow-auto bg-gray-800">
            <Chat />
          </div>
        </div>
      </div>
    );
  }
