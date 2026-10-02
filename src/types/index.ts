/**
 * Domain types for GREEN-API MAX Messenger Client
 */

export interface InstanceProfile {
  phone?: string;
  avatarUrl?: string;
  name?: string;
  tariff?: string;
  expirationDate?: string;
}

export interface ApiCredentials {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string; // default: 'https://api.green-api.com'
  profile?: InstanceProfile;
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'error';

export interface Message {
  id: string;
  chatId: string;
  text: string;
  timestamp: number;
  type: 'incoming' | 'outgoing';
  status: MessageStatus;
  senderName?: string;
  errorText?: string;
}

export interface Chat {
  id: string; // e.g. "79991234567@c.us"
  phoneNumber: string; // e.g. "79991234567"
  displayName: string; // e.g. "+7 (999) 123-45-67" or "Избранное"
  avatarColor: string;
  avatarUrl?: string;
  isSelf?: boolean;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: number;
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface StateInstanceResponse {
  stateInstance: 'authorized' | 'notAuthorized' | 'blocked' | 'sleepMode' | 'starting' | string;
}

export interface WaSettingsResponse {
  stateInstance?: string;
  phone?: string;
  avatar?: string;
  name?: string;
  deviceType?: string;
  [key: string]: any;
}

export interface NotificationBody {
  typeWebhook: string;
  instanceData: {
    idInstance: number;
    wid: string;
    typeInstance: string;
  };
  timestamp: number;
  idMessage: string;
  senderData?: {
    chatId: string;
    sender: string;
    senderName?: string;
    senderContactName?: string;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: {
      textMessage: string;
    };
    extendedTextMessageData?: {
      text: string;
      description?: string;
    };
  };
}

export interface ReceiveNotificationResponse {
  receiptId: number;
  body: NotificationBody;
}

export interface DeleteNotificationResponse {
  result: boolean;
}

