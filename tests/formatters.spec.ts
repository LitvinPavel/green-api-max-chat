import { describe, it, expect } from 'vitest';
import {
  cleanPhoneNumber,
  phoneToChatId,
  chatIdToPhone,
  formatPhoneDisplay,
  formatMessageTime,
  getInitials,
} from '../src/utils/formatters';

describe('formatters', () => {
  it('cleanPhoneNumber should normalize Russian phone numbers with 8 to 7', () => {
    expect(cleanPhoneNumber('8 (999) 123-45-67')).toBe('79991234567');
    expect(cleanPhoneNumber('+7 999 123 45 67')).toBe('79991234567');
    expect(cleanPhoneNumber('9991234567')).toBe('79991234567');
  });

  it('cleanPhoneNumber should keep international format clean', () => {
    expect(cleanPhoneNumber('+1 (555) 234-5678')).toBe('15552345678');
  });

  it('phoneToChatId should add @c.us suffix', () => {
    expect(phoneToChatId('+7 999 123-45-67')).toBe('79991234567@c.us');
    expect(phoneToChatId('79991234567@c.us')).toBe('79991234567@c.us');
    expect(phoneToChatId('123456@g.us')).toBe('123456@g.us');
  });

  it('chatIdToPhone should strip @c.us suffix', () => {
    expect(chatIdToPhone('79991234567@c.us')).toBe('79991234567');
    expect(chatIdToPhone('79991234567')).toBe('79991234567');
  });

  it('formatPhoneDisplay should format to Russian standard mask', () => {
    expect(formatPhoneDisplay('79991234567@c.us')).toBe('+7 (999) 123-45-67');
    expect(formatPhoneDisplay('79165554433')).toBe('+7 (916) 555-44-33');
  });

  it('formatMessageTime should format timestamp to HH:mm', () => {
    const date = new Date(2026, 9, 1, 14, 30);
    expect(formatMessageTime(date.getTime())).toBe('14:30');
  });

  it('getInitials should extract readable initials', () => {
    expect(getInitials('Алексей')).toBe('АЛ');
    expect(getInitials('+7 (999) 123-45-67')).toBe('67');
  });
});
