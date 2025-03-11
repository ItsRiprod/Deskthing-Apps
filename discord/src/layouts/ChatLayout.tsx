import { JSX } from 'react';
import { Chat } from '../pages/Chat';

interface ChatLayoutProps {
  embedded?: boolean;
}

export function ChatLayout({ 
  embedded = true 
}: ChatLayoutProps): JSX.Element {

  return (
    <div className={'h-full w-full overflow-hidden bg-gray-800'}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-700 p-3 bg-gray-900">
          <h3 className="font-semibold text-white">Chat</h3>
        </div>
        
        {/* Main chat content */}
        <div className="flex-grow overflow-auto bg-gray-800">
          <Chat />
        </div>
      </div>
    </div>
  );
}