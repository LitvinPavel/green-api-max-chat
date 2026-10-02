import React, { useState } from 'react';
import { MessageSquarePlus, X, AlertCircle, Loader2 } from 'lucide-react';
import { cleanPhoneNumber, formatPhoneDisplay, phoneToChatId } from '@/utils/formatters';
import { ApiCredentials } from '@/types';
import { GreenApiClient } from '@/api/greenApi';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (phone: string) => void;
  credentials?: ApiCredentials | null;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
  credentials,
}) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [allowBypassWarning, setAllowBypassWarning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setPhone('');
    setError(null);
    setWarning(null);
    setAllowBypassWarning(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) {
      setError('Введите номер телефона или chatId получателя');
      return;
    }

    if (trimmed.includes('@')) {
      onCreateChat(trimmed);
      resetForm();
      return;
    }

    const cleaned = cleanPhoneNumber(trimmed);
    if (cleaned.length >= 10) {
      // Validate account existence via GREEN-API checkAccount if credentials present
      if (credentials && !allowBypassWarning) {
        setIsChecking(true);
        setError(null);
        setWarning(null);
        try {
          const checkResult = await GreenApiClient.checkAccount(credentials, cleaned);
          if (checkResult && checkResult.existsWhatsapp === false) {
            setWarning('Номер не зарегистрирован в мессенджере. Нажмите кнопку ещё раз, если всё равно хотите создать чат.');
            setAllowBypassWarning(true);
            setIsChecking(false);
            return;
          }
        } catch {
          // If check fails (network/tariff), don't block chat creation
        } finally {
          setIsChecking(false);
        }
      }

      onCreateChat(cleaned);
      resetForm();
      return;
    }

    if (trimmed.length >= 4) {
      onCreateChat(trimmed);
      resetForm();
      return;
    }

    setError('Введите корректный номер телефона (например, 79991234567) или ID аккаунта');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquarePlus size={20} color="var(--max-primary)" />
            <h3>Новый чат</h3>
          </div>
          <button className="icon-btn" onClick={handleClose} title="Закрыть">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '13px', color: 'var(--max-text-secondary)', marginBottom: '16px' }}>
              Введите номер телефона получателя сообщений или прямой Chat ID.
            </p>

            {error && (
              <div className="form-alert error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {warning && (
              <div
                className="form-alert warning"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  color: '#ca8a04',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{warning}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label">
                Номер телефона или Chat ID <span style={{ color: 'var(--max-status-error)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="+7 (999) 123-45-67, 79991234567 или ID чата"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError(null);
                  setWarning(null);
                  setAllowBypassWarning(false);
                }}
                autoFocus
                required
              />
              <div className="form-hint">
                {phone.replace(/\D/g, '').length >= 10 ? (
                  <span style={{ color: 'var(--max-status-online)', fontWeight: 500 }}>
                    Формат чата: {formatPhoneDisplay(phone)} ({phoneToChatId(phone)})
                  </span>
                ) : (
                  'Номер в международном формате с кодом страны или ID получателя'
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={isChecking}>
              {isChecking ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={15} className="spinning" />
                  Проверка...
                </span>
              ) : allowBypassWarning ? (
                'Создать всё равно'
              ) : (
                'Создать чат'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
