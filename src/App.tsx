import React, { useState } from 'react';
import { useChatState } from '@/hooks/useChatState';
import { useGreenApiPolling } from '@/hooks/useGreenApiPolling';
import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { AuthModal } from '@/components/AuthModal';
import { NewChatModal } from '@/components/NewChatModal';
import '@/styles/max-theme.css';

export const App: React.FC = () => {
  const {
    credentials,
    instanceStatus,
    chats,
    activeChat,
    activeChatId,
    activeMessages,
    isAuthModalOpen,
    isNewChatModalOpen,
    isSending,
    saveCredentials,
    createChat,
    setActiveChatId,
    sendMessage,
    addIncomingMessage,
    setIsAuthModalOpen,
    setIsNewChatModalOpen,
  } = useChatState();

  // Polling hook for receiving messages through HTTP API queue
  const {
    isPolling,
    receivedCount,
    pollingError,
    triggerManualCheck,
  } = useGreenApiPolling({
    credentials,
    onMessageReceived: (chatId, text, senderName, idMessage, timestamp) => {
      addIncomingMessage(chatId, text, senderName, idMessage, timestamp);
    },
    enabled: Boolean(credentials),
  });

  // Mobile navigation state
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setIsMobileChatOpen(true);
  };

  const handleBackToSidebar = () => {
    setIsMobileChatOpen(false);
  };

  return (
    <div className={`max-app ${isMobileChatOpen && activeChat ? 'chat-active' : ''}`}>
      {/* Left Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onOpenNewChatModal={() => setIsNewChatModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        credentials={credentials}
        instanceStatus={instanceStatus}
        isPolling={isPolling}
        receivedCount={receivedCount}
        pollingError={pollingError}
        onManualPoll={triggerManualCheck}
      />

      {/* Main Chat Area */}
      <ChatWindow
        chat={activeChat}
        messages={activeMessages}
        onSendMessage={sendMessage}
        isSending={isSending}
        onOpenNewChat={() => setIsNewChatModalOpen(true)}
        onBackToSidebar={handleBackToSidebar}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSave={saveCredentials}
        currentCredentials={credentials}
      />

      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onCreateChat={(phone) => {
          handleSelectChat(createChat(phone));
        }}
      />
    </div>
  );
};

export default App;
