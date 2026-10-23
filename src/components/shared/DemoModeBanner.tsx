import { useEffect, useState } from 'react';
import { resetDemoData, subscribeDemoData } from '../../services/demoService';
import { resetCartStorage } from './useBuyerCart';
import '../../styles/theme.css';

export function DemoModeBanner() {
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => subscribeDemoData(event => {
    if (event.type === 'RESET') void resetCartStorage().catch(() => setError('Không xóa được giỏ demo. Vui lòng tải lại trang.'));
  }), []);

  const handleReset = async () => {
    setResetting(true);
    setError('');
    try {
      await resetDemoData();
      await resetCartStorage();
    } catch (err) {
      console.error('Lỗi reset dữ liệu mẫu:', err);
      setError('Không đặt lại được dữ liệu demo. Dữ liệu hiện tại được giữ nguyên.');
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  };

  return (
    <div className="demo-banner-slim">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span className="tag">Bản Demo</span>
        <span>FARMGO · Demo mode — dữ liệu giả lập</span>
        {error && <span role="alert">{error}</span>}
      </div>
      <div className="demo-reset-actions">
        {confirmReset ? <>
          <span>Khôi phục toàn bộ dữ liệu demo?</span>
          <button type="button" className="btn-reset-slim" onClick={handleReset} disabled={resetting}>{resetting ? 'Đang đặt lại…' : 'Xác nhận đặt lại'}</button>
          <button type="button" className="btn-reset-slim" onClick={() => setConfirmReset(false)} disabled={resetting}>Giữ dữ liệu hiện tại</button>
        </> :
        <button
          type="button"
          className="btn-reset-slim"
          onClick={() => setConfirmReset(true)}
          disabled={resetting}
          title="Khôi phục lại danh sách mặt hàng và đơn mẫu ban đầu"
        >
          {resetting ? 'Đang đặt lại...' : 'Đặt lại dữ liệu mẫu'}
        </button>
        }
      </div>
    </div>
  );
}
