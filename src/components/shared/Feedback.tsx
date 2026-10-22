export function LoadingSpinner({ text = 'Đang tải dữ liệu...' }: { text?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', gap: 10, color: '#64748b' }}>
      <span style={{ fontSize: '1.2rem', animation: 'spin 1s linear infinite' }}>⏳</span>
      <span style={{ fontSize: '0.9rem' }}>{text}</span>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      padding: '12px 16px',
      borderRadius: '8px',
      margin: '12px 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div style={{ fontSize: '0.9rem' }}>
        <strong>Lỗi:</strong> {message}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            background: '#ffffff',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
