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
        {!isOutgoing && message.senderName && (
          <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--max-primary)', marginBottom: '2px' }}>
            {message.senderName}
          </div>
        )}

        <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>

        <div className="message-meta">
          <span>{formatMessageTime(message.timestamp)}</span>

          {isOutgoing && (
            <span>
              {message.status === 'pending' && <Clock size={12} />}
              {message.status === 'sent' && <Check size={13} />}
              {(message.status === 'delivered' || message.status === 'read') && (
                <CheckCheck size={14} color="#86efac" />
              )}
              {message.status === 'error' && (
                <span title={message.errorText || 'Ошибка доставки'}>
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
