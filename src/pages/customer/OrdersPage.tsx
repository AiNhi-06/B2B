import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Order } from '../../types';
import { getDemoSession, getCustomerOrders, subscribeDemoData } from '../../services/demoService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { EmptyState } from '../../components/shared/EmptyState';

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCustomerId, setActiveCustomerId] = useState<string>('customer-1');

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const session = await getDemoSession();
      const cId = session.activeCustomerId || 'customer-1';
      setActiveCustomerId(cId);
      const data = await getCustomerOrders(cId);
      setOrders(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải lịch sử đơn hàng.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const unsub = subscribeDemoData((event) => {
      if (event.type === 'DATA_CHANGED' || event.type === 'SESSION_CHANGED' || event.type === 'RESET') {
        loadOrders();
      }
    });
    return () => unsub();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>Lịch Sử Đặt Hàng Của Quán</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Tài khoản hiện tại: <strong>{activeCustomerId}</strong>
          </span>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate('/customer')}
        >
          ➕ Đặt thêm đơn mới
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={loadOrders} />}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icon="📜"
          title="Bạn chưa có đơn hàng nào"
          description="Chưa có đơn hàng nào được ghi nhận cho tài khoản này."
          action={{
            label: 'Khám phá trái cây',
            onClick: () => navigate('/customer'),
          }}
        />
      )}

      {!loading && !error && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((order) => {
            const totalKg = order.items.reduce((s, i) => s + i.quantityKg, 0);
            return (
              <div key={order.id} className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>Đơn hàng #{order.id}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 10 }}>
                      {new Date(order.placedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status={order.status} />
                    <Link
                      to={`/customer/orders/${order.id}`}
                      className="btn-secondary"
                      style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '0.8rem' }}
                    >
                      Chi tiết & Theo dõi 🔍
                    </Link>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', fontSize: '0.9rem', marginBottom: 10 }}>
                  <div style={{ color: '#475569' }}>
                    {order.items.map((i) => `${i.productName} (${i.quantityKg}kg)`).join(', ')}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>
                    Tổng khối lượng: <strong>{totalKg} kg</strong> | Phí VC: {order.shippingFeeVnd.toLocaleString('vi-VN')} đ
                  </span>
                  <div>
                    <span style={{ color: '#64748b' }}>Tổng thanh toán: </span>
                    <strong style={{ fontSize: '1.1rem', color: '#15803d' }}>
                      {order.totalVnd.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
