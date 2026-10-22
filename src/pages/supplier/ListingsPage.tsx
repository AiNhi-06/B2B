import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ProductListing } from '../../types';
import { getDemoSession, getSupplierListings, subscribeDemoData } from '../../services/demoService';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { EmptyState } from '../../components/shared/EmptyState';

export function ListingsPage() {
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSupplierId, setActiveSupplierId] = useState<string>('supplier-1');

  const loadListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const session = await getDemoSession();
      const sId = session.activeSupplierId || 'supplier-1';
      setActiveSupplierId(sId);
      const data = await getSupplierListings(sId);
      setListings(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
    const unsub = subscribeDemoData((event) => {
      if (event.type === 'DATA_CHANGED' || event.type === 'SESSION_CHANGED' || event.type === 'RESET') {
        loadListings();
      }
    });
    return () => unsub();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>Lô Trái Cây Đang Cung Ứng</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Mã nhà vườn hiện tại: <strong>{activeSupplierId}</strong> (12:00 – 15:00)
          </span>
        </div>
        <Link to="/supplier/new" className="btn-primary" style={{ textDecoration: 'none' }}>
          ➕ Đăng bán lô mới
        </Link>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={loadListings} />}

      {!loading && !error && listings.length === 0 && (
        <EmptyState
          icon="🥑"
          title="Chưa có lô hàng nào được đăng"
          description="Nhà vườn cập nhật số lượng tồn khả dụng và giá sỉ gốc để tham gia gom đơn hôm nay."
          action={{
            label: 'Đăng bán lô đầu tiên',
            onClick: () => window.location.assign('/supplier/new'),
          }}
        />
      )}

      {!loading && !error && listings.length > 0 && (
        <div className="grid-cards">
          {listings.map((item) => (
            <div key={item.id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#1e293b' }}>
                    {item.name}
                  </h3>
                  {item.variety && (
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Giống: {item.variety}</span>
                  )}
                </div>
                <span className={`badge ${item.active ? 'badge-delivered' : 'badge-placed'}`}>
                  {item.active ? 'Đang mở bán' : 'Tạm ẩn'}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Tồn kho khả dụng:</span>
                  <strong style={{ fontSize: '0.95rem' }}>{item.availableKg.toLocaleString('vi-VN')} kg</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Giá sỉ gốc:</span>
                  <strong style={{ fontSize: '1.05rem', color: '#15803d' }}>
                    {item.basePricePerKg.toLocaleString('vi-VN')} đ/kg
                  </strong>
                </div>
              </div>

              <div className="security-badge" title="Quy tắc bảo mật B2B">
                🔒 Giá sỉ gốc bảo mật tuyệt đối với các Quán
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
