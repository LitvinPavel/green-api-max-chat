import React, { useState, useMemo } from 'react';
import { Chat, ApiCredentials } from '@/types';
import {
  MessageSquarePlus,
  Settings,
  Search,
  RefreshCw,
  Check,
  CheckCheck,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { formatMessageTime, getInitials } from '@/utils/formatters';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenNewChatModal: () => void;
  onOpenAuthModal: () => void;
  credentials: ApiCredentials | null;
  instanceStatus: string;
  isPolling: boolean;
  receivedCount: number;
  pollingError: string | null;
  onManualPoll: () => Promise<any>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onOpenNewChatModal,
  onOpenAuthModal,
  credentials,
  instanceStatus,
  isPolling,
  receivedCount,
  pollingError,
  onManualPoll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter chats by search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase().trim();
    return chats.filter(
      (c) =>
        c.displayName.toLowerCase().includes(query) ||
        c.phoneNumber.includes(query) ||
        c.lastMessage?.text.toLowerCase().includes(query)
    );
  }, [chats, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onManualPoll();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const statusColorClass =
    instanceStatus === 'authorized'
      ? 'online'
      : instanceStatus === 'notAuthorized' || instanceStatus === 'starting' || instanceStatus === 'sleepMode'
      ? 'warning'
      : instanceStatus === 'unknown'
      ? 'offline'
      : 'error';

  return (
    <aside className="max-sidebar">
      {/* Top Header */}
      <div className="max-sidebar-header">
        <div className="max-brand">
          <div className="max-brand-logo">M</div>
          <div className="max-brand-info">
            <h1>MAX Web</h1>
            <div className="max-instance-badge">
              <span
                className={`status-indicator ${statusColorClass}`}
                title={`Статус инстанса: ${instanceStatus}`}
              />
              <span title={`Статус инстанса: ${instanceStatus}`}>
                {credentials
                  ? `id: ${credentials.idInstance}${instanceStatus !== 'authorized' && instanceStatus !== 'unknown' ? ` (${instanceStatus})` : ''}`
                  : 'Не авторизован'}
              </span>
            </div>
          </div>
        </div>

        <div className="max-header-actions">
          <button
            className="icon-btn icon-btn-primary"
            onClick={onOpenNewChatModal}
            title="Начать новый чат"
          >
            <MessageSquarePlus size={19} />
          </button>
          <button
            className="icon-btn"
            onClick={onOpenAuthModal}
            title="Настройки подключения GREEN-API"
          >
            <Settings size={19} />
          </button>
        </div>
      </div>

      {/* HTTP API Queue Status Bar */}
      <div className="polling-status-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div
            className="polling-pulse"
            style={{
              background: pollingError
                ? 'var(--max-status-error)'
                : isPolling
                ? 'var(--max-primary)'
                : '#9ca3af',
            }}
          />
          <span
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={pollingError || (isPolling ? 'Очередь непрерывно опрашивается' : 'Слушатель остановлен')}
          >
            HTTP Очередь:{' '}
            <strong style={{ color: pollingError ? 'var(--max-status-error)' : undefined }}>
              {pollingError ? `Ошибка: ${pollingError}` : isPolling ? 'Слушатель активен' : 'Остановлен'}
            </strong>
            {receivedCount > 0 && ` (${receivedCount} получено)`}
          </span>
        </div>

        <button
          className="icon-btn"
          style={{ width: '26px', height: '26px', flexShrink: 0 }}
          onClick={handleRefresh}
          disabled={isRefreshing || !credentials}
          title="Проверить входящие сообщения сейчас (receiveNotification)"
        >
          <RefreshCw
            size={13}
            style={{
              animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
            }}
          />
        </button>
      </div>

      {/* Search Input */}
      <div className="max-sidebar-search">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Поиск по чатам и сообщениям..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="max-chat-list">
        {filteredChats.length === 0 ? (
          <div className="empty-chat-list">
            <MessageCircle size={40} style={{ opacity: 0.35, margin: '0 auto' }} />
            <p>
              {searchQuery
                ? 'Ничего не найдено по вашему запросу'
                : 'Список чатов пуст. Создайте первый чат по номеру телефона!'}
            </p>
            {!searchQuery && (
              <button className="btn btn-primary" onClick={onOpenNewChatModal}>
                + Новый чат
              </button>
            )}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            const lastMsg = chat.lastMessage;

            return (
              <div
                key={chat.id}
                className={`max-chat-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div
                  className="chat-avatar"
                  style={{ backgroundColor: chat.avatarColor }}
                >
                  {getInitials(chat.displayName)}
                </div>

                <div className="chat-info">
                  <div className="chat-info-top">
                    <span className="chat-name">{chat.displayName}</span>
                    {lastMsg && (
                      <span className="chat-time">
                        {formatMessageTime(lastMsg.timestamp)}
                      </span>
                    )}
                  </div>

                  <div className="chat-info-bottom">
                    <span className="chat-snippet">
                      {lastMsg ? (
                        <>
                          {lastMsg.type === 'outgoing' && (
                            <span style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                              {lastMsg.status === 'sent' && <Check size={12} />}
                              {(lastMsg.status === 'delivered' || lastMsg.status === 'read') && (
                                <CheckCheck size={12} color="var(--max-primary)" />
                              )}
                              {lastMsg.status === 'error' && (
                                <AlertCircle size={12} color="var(--max-status-error)" />
                              )}
                            </span>
                          )}
                          {lastMsg.text}
                        </>
                      ) : (
                        <span style={{ fontStyle: 'italic', opacity: 0.7 }}>
                          Нет сообщений
                        </span>
                      )}
                    </span>

                    {chat.unreadCount > 0 && (
                      <span className="unread-badge">{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
