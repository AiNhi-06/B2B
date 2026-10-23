import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Order, Shipment } from '../../types';
import {
  getDemoSession,
  getCustomerOrders,
  getShipmentByOrderId,
  subscribeDemoData,
} from '../../services/demoService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const loadOrderDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const session = await getDemoSession();
        const cId = session.activeCustomerId || 'customer-1';
        const orders = await getCustomerOrders(cId);
        const found = orders.find((o) => o.id === id);

        if (!found) {
          if (isMounted) setError(`Không tìm thấy đơn hàng #${id}`);
          return;
        }

        if (isMounted) {
          setOrder(found);
          const ship = await getShipmentByOrderId(id);
          setShipment(ship);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Lỗi khi tải chi tiết đơn hàng.';
          setError(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOrderDetail();
    const unsub = subscribeDemoData((event) => {
      if (event.type === 'DATA_CHANGED' || event.type === 'SESSION_CHANGED' || event.type === 'RESET') {
        loadOrderDetail();
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error || !order) return <ErrorMessage message={error || 'Đơn hàng không tồn tại'} />;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/customer/orders" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Quay lại danh sách đơn hàng
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.3rem' }}>Đơn Hàng #{order.id}</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Đặt lúc: {new Date(order.placedAt).toLocaleString('vi-VN')}
          </span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Simulated GPS & Driver Tracking */}
      <div className="card" style={{ borderColor: shipment ? '#38bdf8' : '#e2e8f0', background: shipment ? '#f0f9ff' : '#ffffff' }}>
        <h3 className="card-title" style={{ color: '#0369a1' }}>
          <span>🚚 Giám Sát Hành Trình Giao Hàng (Sáng Sớm)</span>
          <span className="demo-chip">Hành trình & Tài xế mô phỏng (Demo)</span>
        </h3>

        {shipment ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Tài xế giao hàng:</span>
                <div style={{ fontWeight: 600 }}>{shipment.driverName || 'Nguyễn Văn Tài'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Số điện thoại:</span>
                <div style={{ fontWeight: 600 }}>{shipment.driverPhone || '0903.123.456'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Biển số xe:</span>
                <div style={{ fontWeight: 600 }}>{shipment.vehiclePlate || '59B1-999.88'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Tuyến giao:</span>
                <div style={{ fontWeight: 600 }}>{shipment.routeLabel}</div>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#0369a1' }}>Trạng thái vận chuyển:</span>
                <StatusBadge status={shipment.status} />
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>
                📍 {shipment.trackingLabel || 'Xe đang di chuyển giao qua các quán trên cùng tuyến đường Multi-stop.'}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '0.9rem', padding: '10px 0' }}>
            ⏳ Đơn hàng của bạn đang được tổng hợp tại kho Hub. Admin sẽ dán tem QR và gom tuyến xe lúc 04:00 sáng.
          </div>
        )}
      </div>

      {/* Order Item Details */}
      <div className="card">
        <h3 className="card-title">Chi Tiết Mặt Hàng</h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mặt hàng</th>
                <th>Số lượng</th>
                <th>Giá lúc đặt hàng</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.productId}>
                  <td><strong>{i.productName}</strong><div>{i.supplierName || 'Thông tin NCC chưa có'}</div></td>
                  <td>{i.quantityKg} kg</td>
                  <td>{i.unitPriceVnd.toLocaleString('vi-VN')} đ/kg</td>
                  <td><strong>{i.lineTotalVnd.toLocaleString('vi-VN')} đ</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', fontSize: '0.95rem' }}>
          <div>
            <span style={{ color: '#64748b' }}>Tiền hàng: </span>
            <strong>{order.subtotalVnd.toLocaleString('vi-VN')} đ</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Phí vận chuyển (demo): </span>
            <strong>{order.shippingFeeVnd.toLocaleString('vi-VN')} đ</strong>
          </div>
          <div style={{ fontSize: '1.2rem', marginTop: 4 }}>
            <span>Tổng cộng: </span>
            <strong style={{ color: '#15803d' }}>{order.totalVnd.toLocaleString('vi-VN')} đ</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
