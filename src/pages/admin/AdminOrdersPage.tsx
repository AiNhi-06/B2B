import { useState, useEffect } from 'react';
import type { Order, OrderStatus, Shipment } from '../../types';
import {
  getAllOrders,
  getShipments,
  advanceOrderStatus,
  subscribeDemoData,
} from '../../services/demoService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { EmptyState } from '../../components/shared/EmptyState';

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordList, shipList] = await Promise.all([getAllOrders(), getShipments()]);
      setOrders(ordList);
      setShipments(shipList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải danh sách đơn hàng.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeDemoData((event) => {
      if (event.type === 'DATA_CHANGED' || event.type === 'RESET') {
        loadData();
      }
    });
    return () => unsub();
  }, []);

  const handleAdvanceStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setError(null);
      await advanceOrderStatus(orderId, nextStatus);
      setActionMsg(`Đã chuyển trạng thái đơn #${orderId} sang ${nextStatus}`);
      setTimeout(() => setActionMsg(null), 3000);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Chuyển trạng thái thất bại.';
      setError(msg);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>Quản Lý Đơn Hàng Toàn Hệ Thống</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Tổng số: <strong>{orders.length} đơn hàng</strong> từ các quán cà phê / nhà hàng
          </span>
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={loadData} />}
      {actionMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: '8px', marginBottom: 16 }}>
          ✅ {actionMsg}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icon="📦"
          title="Chưa có đơn hàng nào"
          description="Hệ thống chưa ghi nhận đơn đặt hàng từ các quán B2B."
        />
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Mặt hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thao tác Admin</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const assignedShipment = shipments.find((s) => s.orderIds.includes(order.id));

                  return (
                    <tr key={order.id}>
                      <td><strong>#{order.id}</strong></td>
                      <td>
                        <div><strong>{order.customerId}</strong></div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Đ/c: {order.deliveryAddressId}</div>
                      </td>
                      <td>
                        {order.items.map((i) => (
                          <div key={i.productId} style={{ fontSize: '0.85rem' }}>
                            {i.productName} × <strong>{i.quantityKg}kg</strong>
                          </div>
                        ))}
                      </td>
                      <td>
                        <strong>{order.totalVnd.toLocaleString('vi-VN')} đ</strong>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                        {assignedShipment && (
                          <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: 4 }}>
                            🚚 Tuyến: {assignedShipment.routeLabel}
                          </div>
                        )}
                      </td>
                      <td>
                        {assignedShipment ? (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }} title="Đơn đã gán chuyến; chuyển trạng thái qua màn hình Điều phối chuyến">
                            🔒 Khóa chuyển lẻ (Theo chuyến)
                          </span>
                        ) : order.status === 'SUPPLIER_CONFIRMED' ? (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => handleAdvanceStatus(order.id, 'AT_HUB')}
                          >
                            Xác nhận Nhập Hub 📥
                          </button>
                        ) : order.status === 'PLACED' ? (
                          <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                            Chờ gom đơn (Sau 22:00)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
