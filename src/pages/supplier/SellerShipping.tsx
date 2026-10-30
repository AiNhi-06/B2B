import { useState } from 'react';
import { useDemoData } from '../../components/shared/useDemoData';
import { getDemoSession } from '../../services/demoService';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';

const DEFAULT_ZONES = [
  'Quận 1',
  'Quận 3',
  'Bình Thạnh',
  'TP. Thủ Đức',
  'Quận 7',
  'Tân Bình',
  'Gò Vấp',
  'Phú Nhuận',
  'Quận 10',
];

function ShippingForm({ supplierId }: { supplierId: string }) {
  const key = `farmgo-seller-shipping-${supplierId}`;
  const [zones, setZones] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved && Array.isArray(saved.zones)) return saved.zones;
    } catch {
      /* recover to default draft */
    }
    return ['Quận 1', 'Quận 3', 'Bình Thạnh', 'TP. Thủ Đức', 'Quận 7'];
  });
  const [message, setMessage] = useState('');

  const toggleZone = (zone: string) => {
    setZones(current =>
      current.includes(zone) ? current.filter(z => z !== zone) : [...current, zone]
    );
    setMessage('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(key, JSON.stringify({ zones }));
      setMessage('Đã lưu phạm vi phục vụ của nhà vườn trên trình duyệt.');
    } catch {
      setMessage('Không lưu được dữ liệu. Vui lòng thử lại.');
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Phạm vi phục vụ</h1>
          <p>Khu vực giao nhận đề xuất mà nhà vườn có thể chuẩn bị và tiếp nhận đơn hàng.</p>
        </div>
      </div>

      <div className="seller-service-area-layout">
        <form className="seller-panel seller-service-area-panel" onSubmit={handleSave}>
          <div className="seller-service-area-header">
            <div>
              <h2>Khu vực nhận đơn đề xuất</h2>
              <p>Chọn các quận/huyện trong phạm vi giao nhận của nhà vườn (vận chuyển được liên kết và điều phối tự động qua FARMGO).</p>
            </div>
            <div className="seller-service-count">
              Đã chọn: <strong>{zones.length}</strong> khu vực
            </div>
          </div>

          <div className="seller-zones-grid">
            {DEFAULT_ZONES.map(zone => {
              const selected = zones.includes(zone);
              return (
                <label key={zone} className={`seller-zone-card ${selected ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleZone(zone)}
                  />
                  <div>
                    <strong>{zone}</strong>
                    <span>TP. Hồ Chí Minh</span>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="seller-transport-linked-notice">
            <span className="notice-icon">🚚</span>
            <div>
              <strong>Phương thức vận chuyển đã liên kết tự động</strong>
              <p>Mọi đơn hàng được vận chuyển tự động qua mạng lưới đối tác vận chuyển FARMGO. Nhà vườn không cần cấu hình cước riêng lẻ.</p>
            </div>
          </div>

          <div className="seller-actions">
            {message && <p role="status" className="seller-save-status">{message}</p>}
            <button className="btn-primary" type="submit">Lưu phạm vi phục vụ</button>
          </div>
        </form>
      </div>
    </>
  );
}

export function SellerShipping() {
  const s = useDemoData(getDemoSession);
  return s.data?.activeSupplierId ? (
    <ShippingForm key={s.data.activeSupplierId} supplierId={s.data.activeSupplierId} />
  ) : s.error ? (
    <ErrorMessage message={s.error} />
  ) : (
    <LoadingSpinner />
  );
}
