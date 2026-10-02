import React, { useState, useRef, useEffect } from 'react';
import { Chat, Message } from '@/types';
import { MessageItem } from './MessageItem';
import { formatMessageDateSeparator } from '@/utils/formatters';
import {
  Send,
  MessageSquare,
  ArrowLeft,
  MoreVertical,
  Trash2,
  Phone,
  Bookmark,
  CheckCircle2,
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
      <div className="max-chat-window empty-view">
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

  const isSelf = Boolean(chat.isSelf);
  let lastDateStr = '';

  return (
    <div className="max-chat-window">
      {/* Chat Top Header */}
      <div className="max-chat-header">
        <div className="chat-header-profile">
          {onBackToSidebar && (
            <button
              className="icon-btn header-back-btn"
              onClick={onBackToSidebar}
              title="Назад к списку чатов"
            >
              <ArrowLeft size={19} />
            </button>
          )}

          <div
            className={`chat-header-avatar ${isSelf ? 'chat-avatar-self' : ''}`}
            style={{ backgroundColor: isSelf ? '#5b5ce2' : chat.avatarColor }}
          >
            {isSelf ? <Bookmark size={18} /> : chat.displayName.slice(0, 2)}
          </div>

          <div className="chat-header-text">
            <div className="chat-header-title-row">
              <h2>{isSelf ? 'Избранное' : chat.displayName}</h2>
              {isSelf && <span className="self-tag">Вы</span>}
            </div>
            <span>
              {isSelf
                ? 'мессенджер MAX • Заметки и файлы себе'
                : `мессенджер MAX • ${chat.phoneNumber || chat.id}`}
            </span>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="chat-header-actions" style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setShowMenu((prev) => !prev)}
            title="Опции чата"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div className="chat-options-menu">
              <button
                className="menu-item"
                onClick={() => {
                  navigator.clipboard.writeText(chat.phoneNumber);
                  setShowMenu(false);
                }}
              >
                <Phone size={14} />
                Копировать номер
              </button>

              {onClearChat && (
                <button
                  className="menu-item text-danger"
                  onClick={() => {
                    onClearChat();
                    setShowMenu(false);
                  }}
                >
                  <Trash2 size={14} />
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
          <div className="feed-empty-message">
            <div className="feed-empty-icon">
              {isSelf ? (
                <Bookmark size={26} color="var(--max-primary)" />
              ) : (
                <CheckCircle2 size={26} color="var(--max-primary)" />
              )}
            </div>
            <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>
              {isSelf ? 'Ваши сохраненные сообщения' : `Чат с ${chat.displayName}`}
            </div>
            <p>
              {isSelf
                ? 'Здесь удобно сохранять важные заметки, ссылки и проверять доставку сообщений через GREEN-API.'
                : 'Диалог создан. Напишите первое сообщение ниже, чтобы начать общение!'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const rawDateStr = formatMessageDateSeparator(msg.timestamp);
            const dateStr = rawDateStr.toUpperCase();
            const showSeparator = dateStr !== lastDateStr;
            lastDateStr = dateStr;

            return (
              <React.Fragment key={msg.id}>
                {showSeparator && (
                  <div className="date-separator-wrap">
                    <span className="date-separator-pill">{dateStr}</span>
                  </div>
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
          placeholder="Введите сообщение"
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
