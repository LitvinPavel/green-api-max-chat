import React, { useState } from 'react';
import { MessageSquarePlus, X, AlertCircle } from 'lucide-react';
import { cleanPhoneNumber, formatPhoneDisplay } from '@/utils/formatters';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (phone: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
}) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = cleanPhoneNumber(phone);

    if (!cleaned || cleaned.length < 10) {
      setError('Введите корректный номер телефона (не менее 10 цифр, например 79991234567)');
      return;
    }

    onCreateChat(cleaned);
    setPhone('');
    setError(null);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquarePlus size={20} color="var(--max-primary)" />
            <h3>Новый чат</h3>
          </div>
          <button className="icon-btn" onClick={onClose} title="Закрыть">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '13px', color: 'var(--max-text-secondary)', marginBottom: '16px' }}>
              Введите номер телефона получателя сообщений в мессенджере MAX или WhatsApp.
            </p>

            {error && (
              <div className="form-alert error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label">
                Номер телефона <span style={{ color: 'var(--max-status-error)' }}>*</span>
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="+7 (999) 123-45-67 или 79991234567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError(null);
                }}
                autoFocus
                required
              />
              <div className="form-hint">
                {phone.replace(/\D/g, '').length >= 10 ? (
                  <span style={{ color: 'var(--max-status-online)', fontWeight: 500 }}>
                    Формат чата: {formatPhoneDisplay(cleanPhoneNumber(phone))} ({cleanPhoneNumber(phone)}@c.us)
                  </span>
                ) : (
                  'Номер в международном формате с кодом страны (например, 79001234567)'
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Создать чат
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
