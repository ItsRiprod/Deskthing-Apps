import { JSX, useMemo } from 'react';
import { CallLayout } from './CallLayout';
import { ChatLayout } from './ChatLayout';
import { Loading } from '../pages/Loading'
import { GuildLayout } from './GuildLayout'
import { useUIStore } from '@src/stores/uiStore'
import { useCallStore } from '@src/stores/callStore'
import { useChatStore } from '@src/stores/chatStore'

export function MainLayout(): JSX.Element {
  const currentPage = useUIStore((state) => state.currentPage)
  const isInCall = useCallStore((state) => state.callStatus?.isConnected);
  const isChatExpanded = useChatStore((state) => state.chatStatus?.isLoading);
  const isLoading = useChatStore((state) => state.isLoading)

  const currentPageComponent = useMemo(() => {
    switch (currentPage) {
      case 'chat':
        return <ChatLayout />
      case 'guild':
        return <GuildLayout />
      case 'call':
        return <CallLayout />
    }
  }, [isInCall, isChatExpanded])

  if (isLoading) {
    return (
      <Loading />
    )
  }


  return (
    <div className="relative h-full w-full">
      {/* Main content area - conditionally render Call or Chat */}
      {currentPageComponent}
    </div>
  );
}