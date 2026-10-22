import { useState } from 'react';
import { resetDemoData } from '../../services/demoService';
import '../../styles/theme.css';

export function DemoModeBanner() {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!window.confirm('Đặt lại toàn bộ dữ liệu mẫu ban đầu?')) {
      return;
    }
    setResetting(true);
    try {
      await resetDemoData();
    } catch (err) {
      console.error('Lỗi reset dữ liệu mẫu:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="demo-banner-slim">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span className="tag">Bản Demo</span>
        <span>Hệ thống phân phối nông sản B2B — Dữ liệu giả lập phục vụ thuyết trình</span>
      </div>
      <div>
        <button
          type="button"
          className="btn-reset-slim"
          onClick={handleReset}
          disabled={resetting}
          title="Khôi phục lại danh sách mặt hàng và đơn mẫu ban đầu"
        >
          {resetting ? 'Đang đặt lại...' : 'Đặt lại dữ liệu mẫu'}
        </button>
      </div>
    </div>
  );
}
