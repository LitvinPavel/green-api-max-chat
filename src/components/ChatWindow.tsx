import React, { useState, useRef, useEffect } from 'react';
import { Chat, Message } from '@/types';
import { MessageItem } from './MessageItem';
import { formatMessageDateSeparator } from '@/utils/formatters';
import {
  Send,
  MessageSquare,
  ArrowLeft,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Phone,
} from 'lucide-react';

interface ChatWindowProps {
  chat: Chat | null;
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  isSending: boolean;
  onOpenNewChat: () => void;
  onBackToSidebar?: () => void;
  onClearChat?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  messages,
  onSendMessage,
  isSending,
  onOpenNewChat,
  onBackToSidebar,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when active chat changes
  useEffect(() => {
    if (chat) {
      inputRef.current?.focus();
    }
  }, [chat?.id]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText('');
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // If no chat is selected, show empty state
  if (!chat) {
    return (
      <div className="max-chat-window">
        <div className="empty-chat-screen">
          <div className="empty-chat-illustration">
            <MessageSquare size={44} />
          </div>
          <h3>Выберите чат для начала общения</h3>
          <p>
            Отправляйте и получайте сообщения через сервис GREEN-API в мессенджере MAX или WhatsApp.
          </p>
          <button className="btn btn-primary" onClick={onOpenNewChat}>
            + Начать новый чат
          </button>
        </div>
      </div>
    );
  }

  // Group messages by date for date separators
  let lastDateStr = '';

  return (
    <div className="max-chat-window">
      {/* Chat Top Header */}
      <div className="max-chat-header">
        <div className="chat-header-profile">
          {onBackToSidebar && (
            <button
              className="icon-btn"
              onClick={onBackToSidebar}
              style={{ marginRight: '-4px' }}
              title="Назад к списку чатов"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div
            className="chat-header-avatar"
            style={{ backgroundColor: chat.avatarColor }}
          >
            {chat.displayName.slice(0, 2)}
          </div>

          <div className="chat-header-text">
            <h2>{chat.displayName}</h2>
            <span>мессенджер MAX • {chat.id}</span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setShowMenu((prev) => !prev)}
            title="Опции чата"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                border: '1px solid var(--max-border)',
                minWidth: '180px',
                zIndex: 20,
                padding: '4px',
              }}
            >
              <button
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  border: 'none',
                  justifyContent: 'flex-start',
                  padding: '8px 12px',
                  fontSize: '13px',
                }}
                onClick={() => {
                  navigator.clipboard.writeText(chat.phoneNumber);
                  setShowMenu(false);
                }}
              >
                <Phone size={14} style={{ marginRight: '8px' }} />
                Копировать номер
              </button>

              {onClearChat && (
                <button
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    border: 'none',
                    justifyContent: 'flex-start',
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: 'var(--max-status-error)',
                  }}
                  onClick={() => {
                    onClearChat();
                    setShowMenu(false);
                  }}
                >
                  <Trash2 size={14} style={{ marginRight: '8px' }} />
                  Очистить сообщения
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message Feed */}
      <div className="max-message-feed">
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--max-text-muted)',
              fontSize: '13.5px',
              margin: 'auto',
              maxWidth: '320px',
              lineHeight: 1.5,
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <CheckCircle2 size={24} color="var(--max-primary)" />
            </div>
            Чат с номером <strong>{chat.displayName}</strong> создан.
            <br />
            Напишите первое сообщение ниже, чтобы начать диалог в MAX!
          </div>
        ) : (
          messages.map((msg) => {
            const dateStr = formatMessageDateSeparator(msg.timestamp);
            const showSeparator = dateStr !== lastDateStr;
            lastDateStr = dateStr;

            return (
              <React.Fragment key={msg.id}>
                {showSeparator && (
                  <div className="date-separator">{dateStr}</div>
                )}
                <MessageItem message={msg} />
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form className="max-input-bar" onSubmit={handleSend}>
        <textarea
          ref={inputRef}
          className="message-input"
          placeholder="Сообщение"
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          type="submit"
          className="send-btn"
          disabled={!inputText.trim() || isSending}
          title="Отправить сообщение"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
