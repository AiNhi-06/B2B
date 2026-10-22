import { useState } from 'react';
import { resetDemoData } from '../../services/demoService';
import '../../styles/theme.css';

export function DemoModeBanner() {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!window.confirm('Khôi phục dữ liệu demo về trạng thái hạt giống (Seed) ban đầu?')) {
      return;
    }
    setResetting(true);
    try {
      await resetDemoData();
    } catch (err) {
      console.error('Lỗi reset demo data:', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="demo-banner">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span className="demo-badge-pill">Prototype</span>
        <span>
          <strong>Chế độ DEMO:</strong> Toàn bộ dữ liệu trái cây, đơn hàng, GPS và tài xế là giả lập phục vụ thuyết trình cuộc thi.
        </span>
      </div>
      <div>
        <button
          className="btn-reset-demo"
          onClick={handleReset}
          disabled={resetting}
          title="Xóa phiên làm việc hiện tại và khôi phục dữ liệu mẫu ban đầu"
        >
          {resetting ? 'Đang khôi phục...' : '🔄 Khôi phục Seed'}
        </button>
      </div>
    </div>
  );
}
