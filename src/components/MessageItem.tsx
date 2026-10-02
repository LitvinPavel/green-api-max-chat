import React from 'react';
import { Message } from '@/types';
import { formatMessageTime } from '@/utils/formatters';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isOutgoing = message.type === 'outgoing';

  return (
    <div className={`message-bubble-row ${isOutgoing ? 'outgoing' : 'incoming'}`}>
      <div className={`message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}>
        {/* Only show sender name on incoming messages if present */}
        {!isOutgoing && message.senderName && (
          <div className="bubble-author incoming">{message.senderName}</div>
        )}

        {/* Message Content */}
        <div className="bubble-text">{message.text}</div>

        {/* Timestamp and Delivery Status */}
        <div className="message-meta">
          <span className="bubble-time">{formatMessageTime(message.timestamp)}</span>

          {isOutgoing && (
            <span className="bubble-status-icon">
              {message.status === 'pending' && <Clock size={12} />}
              {message.status === 'sent' && <Check size={13} />}
              {(message.status === 'delivered' || message.status === 'read') && (
                <CheckCheck size={14} />
              )}
              {message.status === 'error' && (
                <span title={message.errorText || 'Ошибка отправки'}>
                  <AlertCircle size={13} color="#fca5a5" />
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
