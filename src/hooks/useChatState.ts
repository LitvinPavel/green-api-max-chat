import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiCredentials, Chat, Message } from '@/types';
import { GreenApiClient } from '@/api/greenApi';
import {
  phoneToChatId,
  chatIdToPhone,
  formatPhoneDisplay,
  getAvatarColor,
  cleanPhoneNumber,
} from '@/utils/formatters';

const STORAGE_KEYS = {
  CREDENTIALS: 'green_api_credentials_v1',
  CHATS: 'green_api_chats_v1',
  MESSAGES: 'green_api_messages_v1',
  ACTIVE_CHAT: 'green_api_active_chat_v1',
  THEME: 'green_api_theme_v1',
};

export function useChatState() {
  // Load credentials from localStorage
  const [credentials, setCredentialsState] = useState<ApiCredentials | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Load chats from localStorage
  const [chats, setChats] = useState<Chat[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHATS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load messages from localStorage (chatId -> Message[])
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Active chat ID
  const [activeChatId, setActiveChatIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT);
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [instanceStatus, setInstanceStatus] = useState<string>('unknown');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(!credentials);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState<boolean>(false);
  const [isInstanceInfoOpen, setIsInstanceInfoOpen] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Sync theme
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    if (credentials) {
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
    }
  }, [credentials]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT, activeChatId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT);
    }
  }, [activeChatId]);

  const lastCheckTimestampRef = useRef<number>(0);

  // Check instance status on login/start and fetch profile
  const checkStatus = useCallback(async (creds: ApiCredentials, force: boolean = false) => {
    const now = Date.now();
    // Don't re-check more often than once every 30 seconds unless forced
    if (!force && now - lastCheckTimestampRef.current < 30000) {
      return;
    }
    lastCheckTimestampRef.current = now;

    try {
      const res = await GreenApiClient.getStateInstance(creds);
      if (res && res.stateInstance) {
        setInstanceStatus(res.stateInstance);
      }

      // Proactively fetch account profile info (wid from getSettings, name and avatar from getContactInfo)
      try {
        let detectedPhone = creds.profile?.phone || '';
        let detectedAvatar = creds.profile?.avatarUrl || '';
        let detectedName = creds.profile?.name || '';

        // 1. Get settings for wid
        const settings = await GreenApiClient.getSettings(creds);
        if (settings?.wid) {
          detectedPhone = cleanPhoneNumber(settings.wid);
        }

        // 2. If wid is available, fetch contact info for name & avatar
        if (detectedPhone) {
          const contact = await GreenApiClient.getContactInfo(creds, `${detectedPhone}@c.us`);
          if (contact) {
            if (contact.name) detectedName = contact.name;
            if (contact.avatar) detectedAvatar = contact.avatar;
          }
        }

        if (detectedPhone || detectedAvatar || detectedName) {
          setCredentialsState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              profile: {
                ...prev.profile,
                phone: detectedPhone || prev.profile?.phone,
                avatarUrl: detectedAvatar || prev.profile?.avatarUrl,
                name: detectedName || prev.profile?.name,
                tariff: prev.profile?.tariff || 'MAX_DEVELOPER',
                expirationDate: prev.profile?.expirationDate || '01.01.2030',
              },
            };
          });
        }
      } catch {
        // Non-critical, ignore if unsupported
      }

      return res?.stateInstance;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('429')) {
        // Rate limit exceeded - keep previous status if known or set rate-limited
        setInstanceStatus((prev) => (prev && prev !== 'unknown' ? prev : 'rate-limited'));
        return;
      }
      setInstanceStatus('error');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (credentials) {
      checkStatus(credentials).catch(() => {});
    }
  }, [credentials, checkStatus]);

  // Reactive detection of user's own phone for "Избранное"
  useEffect(() => {
    const myPhone = credentials?.profile?.phone ? cleanPhoneNumber(credentials.profile.phone) : '';
    if (!myPhone) return;

    setChats((prev) =>
      prev.map((c) => {
        const phone = cleanPhoneNumber(c.phoneNumber);
        if (phone === myPhone && (!c.isSelf || c.displayName !== 'Избранное')) {
          return {
            ...c,
            isSelf: true,
            displayName: 'Избранное',
          };
        }
        return c;
      })
    );
  }, [credentials?.profile?.phone]);

  const updateAccountWid = useCallback((wid: string) => {
    const phone = cleanPhoneNumber(wid);
    if (!phone) return;
    setCredentialsState((prev) => {
      if (!prev) return prev;
      if (prev.profile?.phone === phone) return prev;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          phone,
          tariff: prev.profile?.tariff || 'MAX_DEVELOPER',
          expirationDate: prev.profile?.expirationDate || '01.01.2030',
        },
      };
    });
  }, []);

  const saveCredentials = useCallback(
    async (creds: ApiCredentials) => {
      await checkStatus(creds);
      setCredentialsState(creds);
      setIsAuthModalOpen(false);
    },
    [checkStatus]
  );

  const clearCredentials = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
    setCredentialsState(null);
    setInstanceStatus('unknown');
    setIsAuthModalOpen(true);
  }, []);

  const clearAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
    localStorage.removeItem(STORAGE_KEYS.CHATS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    setCredentialsState(null);
    setChats([]);
    setMessages({});
    setActiveChatIdState(null);
    setInstanceStatus('unknown');
    setIsAuthModalOpen(true);
  }, []);

  // Create new chat
  const createChat = useCallback((phoneOrChatId: string) => {
    const chatId = phoneToChatId(phoneOrChatId);
    const phone = chatIdToPhone(chatId);
    const myPhone = credentials?.profile?.phone ? cleanPhoneNumber(credentials.profile.phone) : '';
    const isSelf = Boolean(myPhone && cleanPhoneNumber(phone) === myPhone);
    const displayName = isSelf ? 'Избранное' : formatPhoneDisplay(chatId);

    setChats((prev) => {
      const existing = prev.find((c) => c.id === chatId);
      if (existing) {
        if (isSelf && !existing.isSelf) {
          return prev.map((c) => (c.id === chatId ? { ...c, isSelf: true, displayName: 'Избранное' } : c));
        }
        return prev;
      }

      const newChat: Chat = {
        id: chatId,
        phoneNumber: phone,
        displayName,
        avatarColor: getAvatarColor(chatId),
        isSelf,
        unreadCount: 0,
        createdAt: Date.now(),
      };
      return [newChat, ...prev];
    });

    setActiveChatIdState(chatId);
    setIsNewChatModalOpen(false);
    return chatId;
  }, [credentials?.profile?.phone]);

  const setActiveChatId = useCallback((chatId: string) => {
    setActiveChatIdState(chatId);
    // Mark as read
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!credentials) {
        setIsAuthModalOpen(true);
        return;
      }
      if (!activeChatId) return;

      const trimmedText = text.trim();
      if (!trimmedText) return;

      const tempId = `temp_${Date.now()}`;
      const outgoingMessage: Message = {
        id: tempId,
        chatId: activeChatId,
        text: trimmedText,
        timestamp: Date.now(),
        type: 'outgoing',
        status: 'pending',
      };

      // Optimistically add message
      setMessages((prev) => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), outgoingMessage],
      }));

      // Update chat last message
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId ? { ...c, lastMessage: outgoingMessage } : c
        )
      );

      setIsSending(true);
      setSendError(null);

      try {
        const response = await GreenApiClient.sendMessage(
          credentials,
          activeChatId,
          trimmedText
        );

        // Update message status to sent
        setMessages((prev) => {
          const list = prev[activeChatId] || [];
          return {
            ...prev,
            [activeChatId]: list.map((m) =>
              m.id === tempId
                ? { ...m, id: response.idMessage, status: 'sent' }
                : m
            ),
          };
        });

        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId && c.lastMessage?.id === tempId
              ? {
                  ...c,
                  lastMessage: {
                    ...c.lastMessage,
                    id: response.idMessage,
                    status: 'sent',
                  },
                }
              : c
          )
        );
      } catch (err: unknown) {
        const errorText = err instanceof Error ? err.message : 'Ошибка отправки';
        setSendError(errorText);
        setMessages((prev) => {
          const list = prev[activeChatId] || [];
          return {
            ...prev,
            [activeChatId]: list.map((m) =>
              m.id === tempId
                ? { ...m, status: 'error', errorText }
                : m
            ),
          };
        });
      } finally {
        setIsSending(false);
      }
    },
    [credentials, activeChatId]
  );

  // Incoming message handler called by notification poller
  const addIncomingMessage = useCallback(
    (
      chatId: string,
      text: string,
      senderName: string,
      idMessage: string,
      timestamp: number
    ) => {
      // Ensure chat exists
      setChats((prev) => {
        const exists = prev.some((c) => c.id === chatId);
        const myPhone = credentials?.profile?.phone ? cleanPhoneNumber(credentials.profile.phone) : '';
        const isSelf = Boolean(myPhone && cleanPhoneNumber(chatIdToPhone(chatId)) === myPhone);
        const displayName = isSelf ? 'Избранное' : formatPhoneDisplay(chatId);

        const incomingMsg: Message = {
          id: idMessage,
          chatId,
          text,
          timestamp,
          type: 'incoming',
          status: 'delivered',
          senderName,
        };

        if (exists) {
          return prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  isSelf: isSelf || c.isSelf,
                  displayName: isSelf ? 'Избранное' : c.displayName,
                  lastMessage: incomingMsg,
                  unreadCount: c.id === activeChatId ? 0 : c.unreadCount + 1,
                }
              : c
          );
        } else {
          const newChat: Chat = {
            id: chatId,
            phoneNumber: chatIdToPhone(chatId),
            displayName,
            avatarColor: getAvatarColor(chatId),
            isSelf,
            lastMessage: incomingMsg,
            unreadCount: 1,
            createdAt: Date.now(),
          };
          return [newChat, ...prev];
        }
      });

      // Append message (prevent duplicate by idMessage)
      setMessages((prev) => {
        const chatMessages = prev[chatId] || [];
        if (chatMessages.some((m) => m.id === idMessage)) {
          return prev;
        }

        const incomingMsg: Message = {
          id: idMessage,
          chatId,
          text,
          timestamp,
          type: 'incoming',
          status: 'delivered',
          senderName,
        };

        return {
          ...prev,
          [chatId]: [...chatMessages, incomingMsg],
        };
      });
    },
    [activeChatId, credentials?.profile?.phone]
  );

  const clearChatMessages = useCallback((chatId: string) => {
    setMessages((prev) => ({
      ...prev,
      [chatId]: [],
    }));
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, lastMessage: undefined, unreadCount: 0 } : c
      )
    );
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const activeMessages = activeChatId ? messages[activeChatId] || [] : [];

  return {
    credentials,
    instanceStatus,
    chats,
    activeChat,
    activeChatId,
    activeMessages,
    theme,
    toggleTheme,
    isAuthModalOpen,
    isNewChatModalOpen,
    isInstanceInfoOpen,
    isSending,
    sendError,
    saveCredentials,
    clearCredentials,
    clearAllData,
    createChat,
    setActiveChatId,
    sendMessage,
    addIncomingMessage,
    updateAccountWid,
    clearChatMessages,
    setIsAuthModalOpen,
    setIsNewChatModalOpen,
    setIsInstanceInfoOpen,
    refreshStatus: () => (credentials ? checkStatus(credentials, true) : Promise.resolve('')),
  };
}
