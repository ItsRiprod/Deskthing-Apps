import { JSX } from 'react';
import { CallLayout } from './CallLayout';
import { ChatLayout } from './ChatLayout';
import Controls from '../overlays/Controls';
import { useAppSelector } from '../hooks/useAppSelector'
import { useAppState } from '../hooks/useAppState'
import { Loading } from '../pages/Loading'

export function MainLayout(): JSX.Element {
  const isInCall = useAppSelector((state) => state.callStatus?.isConnected);
  const isChatExpanded = useAppSelector((state) => state.chatStatus?.isExpanded);
  const { isLoading } = useAppState()

  if (isLoading) {
    return (
      <Loading />
    )
  }

  return (
    <div className="relative h-full w-full">
      {/* Main content area - conditionally render Call or Chat */}
      {isInCall ? (
        // When in a call
        <>
          <CallLayout />
          <Controls /> {/* Controls overlay when in a call */}
        </>
      ) : (
        // When not in a call - either expanded chat or chat button
        <ChatLayout expanded={isChatExpanded} />
      )}
    </div>
  );
}