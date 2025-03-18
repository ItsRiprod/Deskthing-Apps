import { JSX, useMemo } from 'react';
import { CallLayout } from './CallLayout';
import { ChatLayout } from './ChatLayout';
import Controls from '../overlays/Controls';
import { useAppSelector } from '../hooks/useAppSelector'
import { useAppState } from '../hooks/useAppState'
import { Loading } from '../pages/Loading'
import { useUI } from '../hooks/useUI'
import { GuildLayout } from './GuildLayout'

export function MainLayout(): JSX.Element {
  const { currentPage } = useUI()
  const isInCall = useAppSelector((state) => state.callStatus?.isConnected);
  const isChatExpanded = useAppSelector((state) => state.chatStatus?.isLoading);
  const { isLoading } = useAppState()

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