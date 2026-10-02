/**
 * Utility functions for formatting phone numbers, chat IDs, dates, and avatars
 */

/**
 * Normalizes phone numbers: removes spaces, dashes, brackets, plus sign.
 * Converts 89XXXXXXXXX to 79XXXXXXXXX for standard Russian numbers.
 */
export function cleanPhoneNumber(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');

  // Convert 89XXXXXXXXX (11 digits starting with 8) to 79XXXXXXXXX
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }

  // If 10 digits starting with 9, prepend 7
  if (digits.length === 10 && digits.startsWith('9')) {
    digits = '7' + digits;
  }

  return digits;
}

/**
 * Converts a phone number or raw ID to GREEN-API chatId format
 * Supports standard phone numbers ("79991234567@c.us") and raw/MAX chatIds ("10000000")
 */
export function phoneToChatId(phoneOrChatId: string): string {
  if (!phoneOrChatId) return '';
  const trimmed = phoneOrChatId.trim();

  if (trimmed.includes('@')) {
    return trimmed;
  }

  const cleaned = cleanPhoneNumber(trimmed);
  if (cleaned.length >= 10) {
    return `${cleaned}@c.us`;
  }

  return cleaned || trimmed;
}

/**
 * Extracts phone number digits from chatId
 */
export function chatIdToPhone(chatId: string): string {
  if (!chatId) return '';
  return chatId.replace(/@c\.us$/, '').replace(/@g\.us$/, '');
}

/**
 * Formats a phone number or chatId for user-friendly UI display
 * e.g., 79991234567 -> +7 (999) 123-45-67, or "10000000" -> "10000000"
 */
export function formatPhoneDisplay(phoneOrChatId: string): string {
  if (!phoneOrChatId) return '';
  const trimmed = phoneOrChatId.trim();
  const digits = cleanPhoneNumber(chatIdToPhone(trimmed));

  if (digits.length === 11 && digits.startsWith('7')) {
    const code = digits.slice(1, 4);
    const part1 = digits.slice(4, 7);
    const part2 = digits.slice(7, 9);
    const part3 = digits.slice(9, 11);
    return `+7 (${code}) ${part1}-${part2}-${part3}`;
  }

  if (digits.length >= 10) {
    return `+${digits}`;
  }

  return trimmed;
}

/**
 * Formats message timestamp to HH:mm
 */
export function formatMessageTime(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats date for message separators (Сегодня, Вчера, DD.MM.YYYY)
 */
export function formatMessageDateSeparator(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Сегодня';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Вчера';

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

const AVATAR_PALETTE = [
  '#5b5ce2', // MAX violet
  '#0088cc', // Blue
  '#00a884', // Emerald
  '#e542a3', // Magenta
  '#ff9500', // Amber
  '#8e44ad', // Purple
  '#2ecc71', // Green
  '#3498db', // Sky
];

/**
 * Generates deterministic avatar background color from chat identifier
 */
export function getAvatarColor(identifier: string): string {
  if (!identifier) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

/**
 * Extracts 1-2 characters for avatar
 */
export function getInitials(text: string): string {
  if (!text) return 'M';
  const clean = text.replace(/[^a-zA-Zа-яА-Я0-9]/g, '');
  if (!clean) return 'M';
  if (/^\d+$/.test(clean)) {
    return clean.slice(-2);
  }
  return clean.slice(0, 2).toUpperCase();
}
