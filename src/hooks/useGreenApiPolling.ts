import { useEffect, useRef, useState, useCallback } from 'react';
import { ApiCredentials } from '@/types';
import { GreenApiClient, extractMessageFromNotification } from '@/api/greenApi';

interface UseGreenApiPollingProps {
  credentials: ApiCredentials | null;
  onMessageReceived: (
    chatId: string,
    text: string,
    senderName: string,
    idMessage: string,
    timestamp: number
  ) => void;
  enabled?: boolean;
}

export function useGreenApiPolling({
  credentials,
  onMessageReceived,
  enabled = true,
}: UseGreenApiPollingProps) {
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [lastNotificationType, setLastNotificationType] = useState<string | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [receivedCount, setReceivedCount] = useState<number>(0);

  const isMountedRef = useRef<boolean>(true);
  const isLoopRunningRef = useRef<boolean>(false);
  const onMessageReceivedRef = useRef(onMessageReceived);
  onMessageReceivedRef.current = onMessageReceived;

  // Single step poll execution
  const pollOnce = useCallback(async (): Promise<boolean> => {
    if (!credentials) return false;

    try {
      setLastCheckTime(new Date());
      setPollingError(null);

      // 1. Receive notification from HTTP queue
      const notification = await GreenApiClient.receiveNotification(credentials, 5);

      if (!notification || !notification.body) {
        // Queue is empty
        return false;
      }

      setLastNotificationType(notification.body.typeWebhook || 'unknown');

      // 2. Extract message data if this is an incoming message
      const msg = extractMessageFromNotification(notification.body);
      if (msg) {
        onMessageReceivedRef.current(
          msg.chatId,
          msg.text,
          msg.senderName,
          msg.idMessage,
          msg.timestamp
        );
        setReceivedCount((prev) => prev + 1);
      }

      // 3. Confirm processing by deleting notification from queue (crucial step in GREEN-API)
      if (notification.receiptId) {
        await GreenApiClient.deleteNotification(credentials, notification.receiptId);
      }

      // If there was an item, return true so loop can immediately fetch next in queue
      return true;
    } catch (err: any) {
      const errMsg = err?.message || 'Ошибка полинга очереди';
      if (isMountedRef.current) {
        setPollingError(errMsg);
      }
      // If 429 rate limit hit, pause 12 seconds to let GREEN-API quota reset
      if (errMsg.includes('429')) {
        await new Promise((resolve) => setTimeout(resolve, 12000));
      }
      return false;
    }
  }, [credentials]);

  // Main polling loop
  useEffect(() => {
    isMountedRef.current = true;

    if (!credentials || !enabled) {
      setIsPolling(false);
      return;
    }

    let isCancelled = false;
    isLoopRunningRef.current = true;
    setIsPolling(true);

    let backoffDelay = 0;

    const runLoop = async () => {
      while (!isCancelled && isMountedRef.current) {
        try {
          if (backoffDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            backoffDelay = 0;
          }

          const hadItem = await pollOnce();

          // If item was found and processed, fetch next immediately.
          // Otherwise wait 4000ms to stay comfortably within GREEN-API rate limits.
          const delayMs = hadItem ? 500 : 4000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } catch (err: any) {
          const is429 = String(err?.message || '').includes('429');
          backoffDelay = is429 ? 12000 : 5000;
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }
      }
      if (isMountedRef.current) {
        setIsPolling(false);
        isLoopRunningRef.current = false;
      }
    };

    runLoop();

    return () => {
      isCancelled = true;
      isMountedRef.current = false;
      isLoopRunningRef.current = false;
    };
  }, [credentials, enabled, pollOnce]);

  return {
    isPolling,
    lastCheckTime,
    lastNotificationType,
    pollingError,
    receivedCount,
    triggerManualCheck: pollOnce,
  };
}
