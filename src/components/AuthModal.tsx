import React, { useState } from 'react';
import { ApiCredentials } from '@/types';
import { KeyRound, AlertCircle, Loader2, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (credentials: ApiCredentials) => Promise<void>;
  currentCredentials: ApiCredentials | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentCredentials,
}) => {
  const [idInstance, setIdInstance] = useState(currentCredentials?.idInstance || '');
  const [apiTokenInstance, setApiTokenInstance] = useState(currentCredentials?.apiTokenInstance || '');
  const [apiUrl, setApiUrl] = useState(currentCredentials?.apiUrl || 'https://api.green-api.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = idInstance.trim();
    const cleanToken = apiTokenInstance.trim();
    const cleanUrl = (apiUrl || 'https://api.green-api.com').trim().replace(/\/$/, '');

    if (!cleanId) {
      setError('Укажите idInstance (например, 1101823456)');
      return;
    }
    if (!cleanToken) {
      setError('Укажите apiTokenInstance');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave({
        idInstance: cleanId,
        apiTokenInstance: cleanToken,
        apiUrl: cleanUrl,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка подключения к инстансу GREEN-API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} color="var(--max-primary)" />
            <h3>Подключение к GREEN-API</h3>
          </div>
          {currentCredentials && (
            <button className="icon-btn" onClick={onClose} title="Закрыть">
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-alert info" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ flex: 1, fontSize: '12.5px', lineHeight: 1.45 }}>
                Для отправки и получения сообщений введите параметры вашего аккаунта из личного кабинета{' '}
                <a
                  href="https://console.green-api.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}
                >
                  GREEN-API
                </a>.
              </div>
            </div>

            {error && (
              <div className="form-alert error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                idInstance <span style={{ color: 'var(--max-status-error)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="например, 1101823456 или 7103823456"
                value={idInstance}
                onChange={(e) => setIdInstance(e.target.value)}
                autoFocus
                required
              />
              <div className="form-hint">Уникальный числовой номер инстанса</div>
            </div>

            <div className="form-group">
              <label className="form-label">
                apiTokenInstance <span style={{ color: 'var(--max-status-error)' }}>*</span>
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Секретный токен инстанса"
                value={apiTokenInstance}
                onChange={(e) => setApiTokenInstance(e.target.value)}
                required
              />
              <div className="form-hint">Токен доступа к API инстанса</div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                API Host URL (по умолчанию https://api.green-api.com)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://api.green-api.com"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                />
              </div>
              <div className="form-hint">
                Укажите кастомный хост, если ваш инстанс размещен на выделенном сервере (например, https://7103.api.green-api.com)
              </div>
            </div>
          </div>

          <div className="modal-footer">
            {currentCredentials && (
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Отмена
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading && <Loader2 size={16} className="spinning" />}
              {loading ? 'Проверка связи...' : 'Сохранить и войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
