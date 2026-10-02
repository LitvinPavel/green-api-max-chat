import {
  ApiCredentials,
  StateInstanceResponse,
  SendMessageResponse,
  ReceiveNotificationResponse,
  DeleteNotificationResponse,
  NotificationBody,
} from '@/types';

/**
 * Direct GREEN-API HTTP API Client
 * Implements methods required by the specification:
 * - getStateInstance
 * - sendMessage
 * - receiveNotification
 * - deleteNotification
 */

function buildBaseUrl(credentials: ApiCredentials): string {
  const host = (credentials.apiUrl || 'https://api.green-api.com').replace(/\/$/, '');
  const id = credentials.idInstance.trim();
  return `${host}/waInstance${id}`;
}

export class GreenApiClient {
  /**
   * Check connection and authorization status of the GREEN-API instance
   */
  static async getStateInstance(credentials: ApiCredentials): Promise<StateInstanceResponse> {
    const url = `${buildBaseUrl(credentials)}/getStateInstance/${credentials.apiTokenInstance.trim()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Неверный idInstance или apiTokenInstance. Проверьте учетные данные.');
      }
      throw new Error(`Ошибка проверки статуса инстанса (HTTP ${response.status})`);
    }

    return response.json();
  }

  /**
   * Send text message to recipient (MAX / WhatsApp)
   * Method: POST https://api.green-api.com/waInstance{{idInstance}}/sendMessage/{{apiTokenInstance}}
   */
  static async sendMessage(
    credentials: ApiCredentials,
    chatId: string,
    message: string
  ): Promise<SendMessageResponse> {
    const url = `${buildBaseUrl(credentials)}/sendMessage/${credentials.apiTokenInstance.trim()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        chatId,
        message,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Ошибка отправки сообщения (HTTP ${response.status}): ${errText || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Receive next notification from the queue using HTTP API
   * Method: GET https://api.green-api.com/waInstance{{idInstance}}/receiveNotification/{{apiTokenInstance}}
   * Returns null if queue is empty (HTTP 200 with empty body or null)
   */
  static async receiveNotification(
    credentials: ApiCredentials,
    receiveTimeoutSec: number = 5
  ): Promise<ReceiveNotificationResponse | null> {
    const url = `${buildBaseUrl(credentials)}/receiveNotification/${credentials.apiTokenInstance.trim()}?receiveTimeout=${receiveTimeoutSec}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Ошибка авторизации (401/403): проверьте токен инстанса');
      }
      throw new Error(`Ошибка получения уведомления (HTTP ${response.status})`);
    }

    const text = await response.text();
    // When the queue is empty, GREEN-API returns HTTP 200 OK with empty body or "null"
    if (!text || text.trim() === '' || text.trim() === 'null') {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  /**
   * Delete notification from queue by receiptId to confirm processing
   * Method: DELETE https://api.green-api.com/waInstance{{idInstance}}/deleteNotification/{{apiTokenInstance}}/{{receiptId}}
   */
  static async deleteNotification(
    credentials: ApiCredentials,
    receiptId: number
  ): Promise<DeleteNotificationResponse> {
    const url = `${buildBaseUrl(credentials)}/deleteNotification/${credentials.apiTokenInstance.trim()}/${receiptId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка удаления уведомления #${receiptId} (HTTP ${response.status})`);
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      return { result: true };
    }
    try {
      return JSON.parse(text);
    } catch {
      return { result: true };
    }
  }
}

/**
 * Extracts text and sender info from a GREEN-API notification body
 */
export function extractMessageFromNotification(body: NotificationBody): {
  chatId: string;
  text: string;
  senderName: string;
  idMessage: string;
  timestamp: number;
} | null {
  if (!body) return null;

  // We are interested in incoming text messages
  if (body.typeWebhook === 'incomingMessageReceived') {
    const chatId = body.senderData?.chatId || '';
    const senderName = body.senderData?.senderName || body.senderData?.senderContactName || chatId;

    let text = '';
    if (body.messageData?.textMessageData?.textMessage) {
      text = body.messageData.textMessageData.textMessage;
    } else if (body.messageData?.extendedTextMessageData?.text) {
      text = body.messageData.extendedTextMessageData.text;
    }

    if (chatId && text) {
      return {
        chatId,
        text,
        senderName,
        idMessage: body.idMessage,
        timestamp: (body.timestamp || Math.floor(Date.now() / 1000)) * 1000,
      };
    }
  }

  return null;
}
