import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GreenApiClient } from '../src/api/greenApi';
import { ApiCredentials } from '../src/types';

describe('GreenApiClient', () => {
  const mockCredentials: ApiCredentials = {
    idInstance: '1101823456',
    apiTokenInstance: 'mock_secret_token_12345',
    apiUrl: 'https://api.green-api.com',
  };

  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('getStateInstance', () => {
    it('should return state when response is 200 OK', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ stateInstance: 'authorized' }),
      } as Response);

      const result = await GreenApiClient.getStateInstance(mockCredentials);
      expect(result.stateInstance).toBe('authorized');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.green-api.com/waInstance1101823456/getStateInstance/mock_secret_token_12345',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should throw an error on 401 Unauthorized', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      await expect(GreenApiClient.getStateInstance(mockCredentials)).rejects.toThrow(
        'Неверный idInstance или apiTokenInstance'
      );
    });

    it('should throw rate limit error on 429', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      } as Response);

      await expect(GreenApiClient.getStateInstance(mockCredentials)).rejects.toThrow(
        'Превышен лимит запросов'
      );
    });
  });

  describe('sendMessage', () => {
    it('should send text message and return idMessage', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ idMessage: 'BAE5F3B40A12' }),
      } as Response);

      const result = await GreenApiClient.sendMessage(
        mockCredentials,
        '79991234567@c.us',
        'Привет, мир!'
      );

      expect(result.idMessage).toBe('BAE5F3B40A12');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.green-api.com/waInstance1101823456/sendMessage/mock_secret_token_12345',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            chatId: '79991234567@c.us',
            message: 'Привет, мир!',
          }),
        })
      );
    });

    it('should throw error when sendMessage fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Chat does not exist',
      } as Response);

      await expect(
        GreenApiClient.sendMessage(mockCredentials, 'invalid@c.us', 'Test')
      ).rejects.toThrow('Ошибка отправки сообщения (HTTP 400)');
    });
  });

  describe('receiveNotification', () => {
    it('should return notification when queue has message', async () => {
      const mockResponse = {
        receiptId: 1001,
        body: {
          typeWebhook: 'incomingMessageReceived',
          instanceData: {
            idInstance: 1101823456,
            wid: '79991234567@c.us',
            typeInstance: 'whatsapp',
          },
          timestamp: 1727784000,
          idMessage: 'MSG_999',
          senderData: {
            chatId: '79997654321@c.us',
            sender: '79997654321@c.us',
            senderName: 'Тестовый контакт',
          },
          messageData: {
            typeMessage: 'textMessage',
            textMessageData: {
              textMessage: 'Тестовый ответ',
            },
          },
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      } as Response);

      const result = await GreenApiClient.receiveNotification(mockCredentials, 5);
      expect(result).not.toBeNull();
      expect(result?.receiptId).toBe(1001);
      expect(result?.body.idMessage).toBe('MSG_999');
    });

    it('should return null when queue is empty (HTTP 200 with null body)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'null',
      } as Response);

      const result = await GreenApiClient.receiveNotification(mockCredentials, 5);
      expect(result).toBeNull();
    });

    it('should return null when queue returns empty string', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
      } as Response);

      const result = await GreenApiClient.receiveNotification(mockCredentials, 5);
      expect(result).toBeNull();
    });
  });

  describe('deleteNotification', () => {
    it('should send DELETE and return confirmation', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ result: true }),
      } as Response);

      const result = await GreenApiClient.deleteNotification(mockCredentials, 1001);
      expect(result.result).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.green-api.com/waInstance1101823456/deleteNotification/mock_secret_token_12345/1001',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should throw error when delete fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(
        GreenApiClient.deleteNotification(mockCredentials, 1001)
      ).rejects.toThrow('Ошибка удаления уведомления #1001 (HTTP 500)');
    });
  });

  describe('checkAccount', () => {
    it('should check if account exists by phone number', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ existsWhatsapp: true }),
      } as Response);

      const result = await GreenApiClient.checkAccount(mockCredentials, 79991234567);
      expect(result?.existsWhatsapp).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.green-api.com/waInstance1101823456/checkAccount/mock_secret_token_12345',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ phoneNumber: 79991234567 }),
        })
      );
    });

    it('should return null when checkAccount fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const result = await GreenApiClient.checkAccount(mockCredentials, 79991234567);
      expect(result).toBeNull();
    });
  });
});
