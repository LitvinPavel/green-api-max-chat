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
      if (isMountedRef.current) {
        setPollingError(err.message || 'Ошибка полинга очереди');
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

    const runLoop = async () => {
      while (!isCancelled && isMountedRef.current) {
        try {
          const hadItem = await pollOnce();

          // If item was found and processed, fetch next immediately.
          // Otherwise wait 2000ms before next long-poll check.
          const delayMs = hadItem ? 300 : 2000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } catch {
          // In case of error, back off 5 seconds
          await new Promise((resolve) => setTimeout(resolve, 5000));
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
