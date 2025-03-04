import React, { JSX } from 'react';
import ParticipantGrid from '../components/call/ParticipantGrid';
import CallTimer from '../components/call/CallTimer';
import UserList from '../components/user/UserList'
import { ChatLayout } from './ChatLayout';
import { useAppSelector } from '../hooks/useAppSelector'

export function CallLayout(): JSX.Element {

  const callStatus = useAppSelector((state) => state.callStatus)
  const chatStatus = useAppSelector((state) => state.chatStatus)

  // Safety check - this should not typically happen due to the check in MainLayout
  if (!callStatus?.isConnected) {
    return <div>Not in a call</div>
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Main call area */}
      <div className={`flex flex-col ${chatStatus?.isExpanded ? 'w-2/3' : 'w-full'} bg-gray-900 p-4 text-white`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Voice Call</h2>
          {callStatus?.timestamp && <CallTimer startTime={callStatus.timestamp} />}
        </div>
        
        {/* Participant grid - main view of call participants */}
        <div className="flex-grow h-full overflow-y-auto">
          <ParticipantGrid participants={callStatus.participants} />
        </div>
      </div>
      
      {/* Side panel for chat when expanded */}
      {chatStatus?.isExpanded && (
        <div className="w-1/3 border-l border-gray-700">
          <ChatLayout expanded={true} embedded={true} />
        </div>
      )}
      
      {/* Participant list sidebar - could be toggled */}
      <div className="hidden w-64 h-full flex-col border-l border-gray-700 bg-gray-800 p-4 md:flex">
        <h3 className="mb-4 text-lg font-semibold text-white">Participants ({callStatus.participants.length})</h3>
        <UserList users={callStatus.participants} />

      </div>
    </div>
  );
}