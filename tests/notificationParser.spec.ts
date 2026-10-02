import { describe, it, expect } from 'vitest';
import { extractMessageFromNotification } from '../src/api/greenApi';
import { NotificationBody } from '../src/types';

describe('notificationParser', () => {
  it('should extract incoming text message from textMessageData', () => {
    const notification: NotificationBody = {
      typeWebhook: 'incomingMessageReceived',
      instanceData: {
        idInstance: 1101823456,
        wid: '1101823456@c.us',
        typeInstance: 'whatsapp',
      },
      timestamp: 1727784000,
      idMessage: 'BAE5F4829103C',
      senderData: {
        chatId: '79991234567@c.us',
        sender: '79991234567@c.us',
        senderName: 'Иван Иванов',
      },
      messageData: {
        typeMessage: 'textMessage',
        textMessageData: {
          textMessage: 'Привет! Это тестовое сообщение.',
        },
      },
    };

    const result = extractMessageFromNotification(notification);
    expect(result).not.toBeNull();
    expect(result?.chatId).toBe('79991234567@c.us');
    expect(result?.text).toBe('Привет! Это тестовое сообщение.');
    expect(result?.senderName).toBe('Иван Иванов');
    expect(result?.idMessage).toBe('BAE5F4829103C');
  });

  it('should extract incoming text message from extendedTextMessageData', () => {
    const notification: NotificationBody = {
      typeWebhook: 'incomingMessageReceived',
      instanceData: {
        idInstance: 1101823456,
        wid: '1101823456@c.us',
        typeInstance: 'whatsapp',
      },
      timestamp: 1727784100,
      idMessage: 'MSG_EXT_999',
      senderData: {
        chatId: '79165551122@c.us',
        sender: '79165551122@c.us',
        senderContactName: 'Анна',
      },
      messageData: {
        typeMessage: 'extendedTextMessage',
        extendedTextMessageData: {
          text: 'Сообщение со ссылкой: https://green-api.com',
        },
      },
    };

    const result = extractMessageFromNotification(notification);
    expect(result).not.toBeNull();
    expect(result?.chatId).toBe('79165551122@c.us');
    expect(result?.text).toBe('Сообщение со ссылкой: https://green-api.com');
  });

  it('should return null for non-incoming message webhooks', () => {
    const statusNotification: NotificationBody = {
      typeWebhook: 'stateInstanceChanged',
      instanceData: {
        idInstance: 1101823456,
        wid: '1101823456@c.us',
        typeInstance: 'whatsapp',
      },
      timestamp: 1727784200,
      idMessage: '',
    };

    const result = extractMessageFromNotification(statusNotification);
    expect(result).toBeNull();
  });

  it('should extract instance wid from notification', () => {
    const notification: NotificationBody = {
      typeWebhook: 'incomingMessageReceived',
      instanceData: {
        idInstance: 1101823456,
        wid: '79991234567@c.us',
        typeInstance: 'whatsapp',
      },
      timestamp: 1727784000,
      idMessage: 'MSG_123',
    };

    const wid = notification.instanceData?.wid;
    expect(wid).toBe('79991234567@c.us');
  });
});

