import React, { useState } from 'react';
import { ApiCredentials } from '@/types';
import { formatPhoneDisplay } from '@/utils/formatters';
import {
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface InstanceInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: ApiCredentials | null;
  instanceStatus: string;
  isPolling: boolean;
  receivedCount: number;
  onManualRefresh: () => Promise<any>;
  onOpenSettings: () => void;
}

export const InstanceInfoModal: React.FC<InstanceInfoModalProps> = ({
  isOpen,
  onClose,
  credentials,
  instanceStatus,
  isPolling,
  receivedCount,
  onManualRefresh,
  onOpenSettings,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onManualRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const idInstance = credentials?.idInstance || '—';
  const apiUrl = credentials?.apiUrl || 'https://api.green-api.com';
  const token = credentials?.apiTokenInstance || '';
  const phone = credentials?.profile?.phone || '';
  const tariff = credentials?.profile?.tariff || 'MAX_DEVELOPER';
  const expirationDate = credentials?.profile?.expirationDate || '01.01.2030';
  const isAuthorized = instanceStatus === 'authorized';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content instance-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        {/* Modal Top Title */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600 }}>
              {idInstance !== '—' ? idInstance : 'Инстанс'}
            </h3>
            <ShieldCheck size={18} color="var(--max-primary)" />
            <span className="max-purple-badge">MAX</span>
          </div>

          <button className="icon-btn" onClick={onClose} title="Закрыть">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {/* Green Tariff Banner (like in GREEN-API console) */}
          <div className="instance-tariff-banner">
            <div style={{ fontWeight: 700, fontSize: '13.5px' }}>Тариф {tariff}</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              Инстанс оплачен до {expirationDate}
            </div>
          </div>

          {/* Table of properties */}
          <div className="instance-properties-table">
            <div className="instance-prop-row">
              <span className="prop-name">apiUrl</span>
              <span className="prop-val-wrap">
                <span className="prop-value">{apiUrl}</span>
                <button
                  className="copy-mini-btn"
                  onClick={() => handleCopy('apiUrl', apiUrl)}
                  title="Копировать apiUrl"
                >
                  {copiedField === 'apiUrl' ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                </button>
              </span>
            </div>

            <div className="instance-prop-row">
              <span className="prop-name">idInstance</span>
              <span className="prop-val-wrap">
                <span className="prop-value font-mono">{idInstance}</span>
                <button
                  className="copy-mini-btn"
                  onClick={() => handleCopy('idInstance', idInstance)}
                  title="Копировать idInstance"
                >
                  {copiedField === 'idInstance' ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                </button>
              </span>
            </div>

            <div className="instance-prop-row">
              <span className="prop-name">apiTokenInstance</span>
              <span className="prop-val-wrap">
                <span className="prop-value font-mono">
                  {showToken ? token : token ? '•'.repeat(28) : '—'}
                </span>
                {token && (
                  <>
                    <button
                      className="copy-mini-btn"
                      onClick={() => setShowToken(!showToken)}
                      title={showToken ? 'Скрыть токен' : 'Показать токен'}
                    >
                      {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      className="copy-mini-btn"
                      onClick={() => handleCopy('token', token)}
                      title="Копировать токен"
                    >
                      {copiedField === 'token' ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                    </button>
                  </>
                )}
              </span>
            </div>

            <div className="instance-prop-row">
              <span className="prop-name">Наименование</span>
              <span className="prop-val-wrap">
                <span className="prop-value">Instance {idInstance}</span>
                <button
                  className="copy-mini-btn"
                  onClick={() => handleCopy('name', `Instance ${idInstance}`)}
                >
                  {copiedField === 'name' ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                </button>
              </span>
            </div>

            <div className="instance-prop-row">
              <span className="prop-name">Статус</span>
              <span className="prop-val-wrap">
                <span
                  className={`status-pill ${
                    isAuthorized ? 'authorized' : instanceStatus === 'rate-limited' ? 'warning' : 'offline'
                  }`}
                >
                  ● {isAuthorized ? 'Авторизован' : instanceStatus === 'rate-limited' ? 'Лимит 429' : instanceStatus}
                </span>
              </span>
            </div>

            <div className="instance-prop-row">
              <span className="prop-name">Телефон</span>
              <span className="prop-val-wrap">
                <span className="prop-value">
                  {phone ? formatPhoneDisplay(phone) : 'Не указан'}
                </span>
                {phone && (
                  <button
                    className="copy-mini-btn"
                    onClick={() => handleCopy('phone', phone)}
                    title="Копировать номер"
                  >
                    {copiedField === 'phone' ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                  </button>
                )}
              </span>
            </div>

            <div className="instance-prop-row">
              <span className="prop-name">Очередь на отправку</span>
              <span className="prop-val-wrap">
                <span className="prop-value font-mono" style={{ color: '#22c55e', fontWeight: 600 }}>
                  0
                </span>
              </span>
            </div>

            <div className="instance-prop-row">
              <span className="prop-name">Очередь на получение</span>
              <span className="prop-val-wrap">
                <span className="prop-value font-mono">
                  {isPolling ? (
                    <span style={{ color: '#22c55e', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Radio size={12} /> Активна ({receivedCount} принято)
                    </span>
                  ) : (
                    'Остановлена'
                  )}
                </span>
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                size={14}
                style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}
              />
              Проверить входящие
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
            >
              <ExternalLink size={14} />
              Настройки ключей
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
