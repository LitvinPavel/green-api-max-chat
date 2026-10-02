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
  onInstanceWidDetected?: (wid: string) => void;
  enabled?: boolean;
}

export function useGreenApiPolling({
  credentials,
  onMessageReceived,
  onInstanceWidDetected,
  enabled = true,
}: UseGreenApiPollingProps) {
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [lastNotificationType, setLastNotificationType] = useState<string | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [receivedCount, setReceivedCount] = useState<number>(0);

  // Keep references to prevent recreating closures and triggering re-renders
  const credentialsRef = useRef(credentials);
  credentialsRef.current = credentials;

  const onMessageReceivedRef = useRef(onMessageReceived);
  onMessageReceivedRef.current = onMessageReceived;

  const onInstanceWidDetectedRef = useRef(onInstanceWidDetected);
  onInstanceWidDetectedRef.current = onInstanceWidDetected;

  // Track run generation to avoid race conditions with unmounted/stale loops
  const runGenerationRef = useRef<number>(0);

  // Single step poll execution
  const pollOnce = useCallback(async (): Promise<boolean> => {
    const creds = credentialsRef.current;
    if (!creds || !creds.idInstance || !creds.apiTokenInstance) return false;

    try {
      setLastCheckTime(new Date());

      // 1. Receive notification from HTTP queue
      const notification = await GreenApiClient.receiveNotification(creds, 5);

      // On any successful response (even empty), clear previous network errors
      setPollingError(null);

      if (!notification || !notification.body) {
        // Queue is empty (200 OK with null) - normal expected state
        return false;
      }

      setLastNotificationType(notification.body.typeWebhook || 'unknown');

      // Check if instanceData.wid is provided
      if (notification.body.instanceData?.wid && onInstanceWidDetectedRef.current) {
        onInstanceWidDetectedRef.current(notification.body.instanceData.wid);
      }

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
        await GreenApiClient.deleteNotification(creds, notification.receiptId);
      }

      // If an item was processed, return true so loop can quickly check next
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Ошибка полинга очереди';
      setPollingError(errMsg);

      // If rate limit 429 occurs, pause for 12 seconds
      if (errMsg.includes('429')) {
        await new Promise((resolve) => setTimeout(resolve, 12000));
      }
      return false;
    }
  }, []);

  // Main polling loop
  useEffect(() => {
    const creds = credentialsRef.current;
    const hasKeys = Boolean(creds?.idInstance && creds?.apiTokenInstance);

    if (!hasKeys || !enabled) {
      setIsPolling(false);
      return;
    }

    // Increment run generation so any older background loops stop immediately
    const currentRun = ++runGenerationRef.current;
    setIsPolling(true);

    const runLoop = async () => {
      while (runGenerationRef.current === currentRun) {
        try {
          const hadItem = await pollOnce();

          if (runGenerationRef.current !== currentRun) break;

          // If an item was found, quickly fetch next in queue (500ms).
          // Otherwise pause 4000ms to stay safely under GREEN-API rate limits.
          const delayMs = hadItem ? 500 : 4000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } catch {
          if (runGenerationRef.current !== currentRun) break;
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      // Only update state if this is still the active run
      if (runGenerationRef.current === currentRun) {
        setIsPolling(false);
      }
    };

    runLoop();

    return () => {
      // Invalidate current run so old loop terminates without touching state
      if (runGenerationRef.current === currentRun) {
        runGenerationRef.current++;
      }
    };
  }, [enabled, credentials?.idInstance, credentials?.apiTokenInstance, pollOnce]);

  return {
    isPolling,
    lastCheckTime,
    lastNotificationType,
    pollingError,
    receivedCount,
    triggerManualCheck: pollOnce,
  };
}
