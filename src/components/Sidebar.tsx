import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Bookmark,
  Sun,
  Moon,
  Info,
  MoreVertical,
  LogOut,
} from 'lucide-react';
import { formatMessageTime, getInitials, formatPhoneDisplay } from '@/utils/formatters';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenNewChatModal: () => void;
  onOpenAuthModal: () => void;
  onOpenInstanceInfo: () => void;
  onLogout?: () => void;
  credentials: ApiCredentials | null;
  instanceStatus: string;
  isPolling: boolean;
  receivedCount: number;
  pollingError: string | null;
  onManualPoll: () => Promise<any>;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onOpenNewChatModal,
  onOpenAuthModal,
  onOpenInstanceInfo,
  onLogout,
  credentials,
  instanceStatus,
  isPolling: _isPolling,
  receivedCount: _receivedCount,
  pollingError,
  onManualPoll,
  theme,
  onToggleTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

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
      : instanceStatus === 'notAuthorized' ||
        instanceStatus === 'starting' ||
        instanceStatus === 'sleepMode' ||
        instanceStatus === 'rate-limited'
      ? 'warning'
      : instanceStatus === 'unknown'
      ? 'offline'
      : 'error';

  const profilePhone = credentials?.profile?.phone;
  const profileName = credentials?.profile?.name;
  const profileAvatar = credentials?.profile?.avatarUrl;

  return (
    <aside className="max-sidebar">
      {/* Top Header: Clean 2-button layout so everything fits in full */}
      <div className="max-sidebar-header">
        <div
          className="max-user-profile"
          onClick={onOpenInstanceInfo}
          title="Нажмите, чтобы просмотреть карточку аккаунта"
        >
          <div className="max-user-avatar-wrap">
            {profileAvatar ? (
              <img src={profileAvatar} alt="Profile" className="max-user-avatar-img" />
            ) : (
              <div className="max-user-avatar-placeholder">
                {profileName
                  ? getInitials(profileName)
                  : profilePhone
                  ? getInitials(profilePhone)
                  : 'M'}
              </div>
            )}
            <span
              className={`status-indicator-badge ${statusColorClass}`}
              title={`Статус: ${instanceStatus}`}
            />
          </div>

          <div className="max-user-info">
            <div className="max-user-title-row">
              <span className="max-user-title">
                {profileName ||
                  (profilePhone
                    ? formatPhoneDisplay(profilePhone)
                    : credentials?.idInstance || 'MAX Messenger')}
              </span>
              <span className="max-purple-badge">MAX</span>
            </div>

            <div className="max-user-sub-row">
              <span className={`status-pill-text ${statusColorClass}`}>
                ● {instanceStatus === 'authorized'
                  ? 'Авторизован'
                  : instanceStatus === 'rate-limited'
                  ? 'Лимит 429'
                  : instanceStatus === 'unknown'
                  ? 'В сети'
                  : instanceStatus}
              </span>
              {/* Only show secondary ID or phone if not already used as main title */}
              {profileName && profilePhone ? (
                <span className="max-id-text">• {formatPhoneDisplay(profilePhone)}</span>
              ) : profilePhone && credentials?.idInstance ? (
                <span className="max-id-text">• id: {credentials.idInstance}</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Action icons: exactly 2 buttons to avoid crowding */}
        <div className="max-header-actions" ref={menuRef}>
          <button
            className="icon-btn icon-btn-primary"
            onClick={onOpenNewChatModal}
            title="Начать новый чат"
          >
            <MessageSquarePlus size={20} />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              onClick={() => setShowMenu((prev) => !prev)}
              title="Меню и настройки"
            >
              <MoreVertical size={19} />
            </button>

            {showMenu && (
              <div className="sidebar-menu-dropdown">
                <button
                  className="menu-item"
                  onClick={() => {
                    onOpenInstanceInfo();
                    setShowMenu(false);
                  }}
                >
                  <Info size={15} />
                  <span>Инфо об инстансе</span>
                </button>

                <button
                  className="menu-item"
                  onClick={() => {
                    onToggleTheme();
                    setShowMenu(false);
                  }}
                >
                  {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  <span>{theme === 'dark' ? 'Светлая тема' : 'Темная тема'}</span>
                </button>

                <button
                  className="menu-item"
                  onClick={() => {
                    onOpenAuthModal();
                    setShowMenu(false);
                  }}
                >
                  <Settings size={15} />
                  <span>Настройки ключей</span>
                </button>

                {onLogout && (
                  <button
                    className="menu-item text-danger"
                    onClick={() => {
                      onLogout();
                      setShowMenu(false);
                    }}
                  >
                    <LogOut size={15} />
                    <span>Выйти</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Error Banner (Only shown if rate-limited or offline) */}
      {pollingError && (
        <div className="polling-error-banner">
          <AlertCircle size={14} className="banner-icon" />
          <span className="banner-text">
            {pollingError.includes('429')
              ? 'Лимит запросов GREEN-API (429). Ожидание паузы...'
              : pollingError}
          </span>
          <button
            className="banner-action-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Повторить запрос"
          >
            <RefreshCw
              size={12}
              style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}
            />
          </button>
        </div>
      )}

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
            const isSelf = Boolean(chat.isSelf);

            return (
              <div
                key={chat.id}
                className={`max-chat-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div
                  className={`chat-avatar ${isSelf ? 'chat-avatar-self' : ''}`}
                  style={{ backgroundColor: isSelf ? '#5b5ce2' : chat.avatarColor }}
                >
                  {isSelf ? <Bookmark size={20} /> : getInitials(chat.displayName)}
                </div>

                <div className="chat-info">
                  <div className="chat-info-top">
                    <span className="chat-name" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {isSelf ? 'Избранное' : chat.displayName}
                      {isSelf && (
                        <span className="self-tag">Вы</span>
                      )}
                    </span>
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
                          {isSelf ? 'Заметки и сообщения себе' : 'Нет сообщений'}
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
