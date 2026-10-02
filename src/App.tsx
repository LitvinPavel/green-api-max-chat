import React, { useState } from 'react';
import { useChatState } from '@/hooks/useChatState';
import { useGreenApiPolling } from '@/hooks/useGreenApiPolling';
import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { AuthModal } from '@/components/AuthModal';
import { NewChatModal } from '@/components/NewChatModal';
import { InstanceInfoModal } from '@/components/InstanceInfoModal';
import '@/styles/max-theme.css';

export const App: React.FC = () => {
  const {
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
    refreshStatus,
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
    onInstanceWidDetected: (wid) => {
      updateAccountWid(wid);
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
    <div
      className={`max-app ${isMobileChatOpen && activeChat ? 'chat-active' : ''}`}
      data-theme={theme}
    >
      {/* Left Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onOpenNewChatModal={() => setIsNewChatModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenInstanceInfo={() => setIsInstanceInfoOpen(true)}
        credentials={credentials}
        instanceStatus={instanceStatus}
        isPolling={isPolling}
        receivedCount={receivedCount}
        pollingError={pollingError}
        onManualPoll={async () => {
          await triggerManualCheck();
          await refreshStatus();
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={clearCredentials}
        onClearAllData={clearAllData}
      />

      {/* Main Chat Area */}
      <ChatWindow
        chat={activeChat}
        messages={activeMessages}
        onSendMessage={sendMessage}
        isSending={isSending}
        onOpenNewChat={() => setIsNewChatModalOpen(true)}
        onBackToSidebar={handleBackToSidebar}
        onClearChat={activeChatId ? () => clearChatMessages(activeChatId) : undefined}
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

      <InstanceInfoModal
        isOpen={isInstanceInfoOpen}
        onClose={() => setIsInstanceInfoOpen(false)}
        credentials={credentials}
        instanceStatus={instanceStatus}
        isPolling={isPolling}
        receivedCount={receivedCount}
        onManualRefresh={async () => {
          await triggerManualCheck();
          await refreshStatus();
        }}
        onOpenSettings={() => setIsAuthModalOpen(true)}
      />
    </div>
  );
};

export default App;
