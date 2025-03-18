import { JSX } from 'react';
import { ChatMessage } from '@shared/types/discord';
import Avatar from '../common/Avatar';

interface Props {
  message: ChatMessage;
}

export default function MessageItem({ message }: Props): JSX.Element {
  return (
    <div className="flex items-start space-x-2">
      <Avatar
        src={message.author.profileUrl}
        alt={message.author.username}
        size="sm"
      />
      <div>
        <div className="flex items-center space-x-1">
          <span className="font-bold text-white">{message.author.username}</span>
          <span className="text-xs text-gray-300">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-sm text-gray-50 break-all">{message.content}</p>
      </div>
    </div>
  );
}