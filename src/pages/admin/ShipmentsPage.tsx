import { useState, useEffect } from 'react';
import type { Order, Shipment, ShipmentStatus } from '../../types';
import {
  getAllOrders,
  getShipments,
  assignDemoShipment,
  advanceShipmentStatus,
  subscribeDemoData,
} from '../../services/demoService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { EmptyState } from '../../components/shared/EmptyState';

export function ShipmentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Form: Create multi-stop shipment
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [routeLabel, setRouteLabel] = useState('Tuyến 1 - Trung tâm Quận 1');
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordList, shipList] = await Promise.all([getAllOrders(), getShipments()]);
      setOrders(ordList);
      setShipments(shipList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải dữ liệu chuyến xe.';
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

  // Filter orders eligible for shipment: status === 'AT_HUB' and not yet in any shipment
  const assignedOrderIds = new Set(shipments.flatMap((s) => s.orderIds));
  const eligibleOrders = orders.filter((o) => o.status === 'AT_HUB' && !assignedOrderIds.has(o.id));

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrderIds.length === 0 || !routeLabel.trim()) return;

    try {
      setCreating(true);
      setError(null);
      await assignDemoShipment({
        orderIds: selectedOrderIds,
        routeLabel: routeLabel.trim(),
      });
      setActionMsg(`Đã tạo chuyến Multi-stop [${routeLabel}] thành công!`);
      setSelectedOrderIds([]);
      setTimeout(() => setActionMsg(null), 3000);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo chuyến xe thất bại.';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleAdvanceShipment = async (shipmentId: string, next: ShipmentStatus) => {
    try {
      setError(null);
      await advanceShipmentStatus(shipmentId, next);
      setActionMsg(`Chuyến xe #${shipmentId} đã chuyển sang [${next}]! Các đơn hàng liên quan đã được đồng bộ trạng thái.`);
      setTimeout(() => setActionMsg(null), 3500);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cập nhật trạng thái chuyến thất bại.';
      setError(msg);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>🚚 Gom Tuyến Xe Multi-stop & Điều Phối Giao Hàng</h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
          Tối ưu chi phí cước bằng cách gom các quán gần nhau thành một chuyến xe giao nhiều điểm (Multi-drop).
        </p>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={loadData} />}
      {actionMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: '8px', marginBottom: 16 }}>
          ✅ {actionMsg}
        </div>
      )}

      {/* 1. Form gom tuyến mới */}
      <div className="card">
        <h3 className="card-title">1. Gom Các Đơn Tại Kho Hub Thành Chuyến Xe Mới</h3>
        {eligibleOrders.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
            Hiện chưa có đơn nào ở trạng thái <code>AT_HUB</code> sẵn sàng gom tuyến. (Đơn cần được Nhà vườn xác nhận và Admin duyệt nhập Hub trước).
          </p>
        ) : (
          <form onSubmit={handleCreateShipment}>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 12 }}>
              Chọn các đơn hàng cần gom chung vào một chuyến xe giao sáng sớm:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {eligibleOrders.map((ord) => {
                const isSelected = selectedOrderIds.includes(ord.id);
                const totalKg = ord.items.reduce((s, i) => s + i.quantityKg, 0);

                return (
                  <label
                    key={ord.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: `1px solid ${isSelected ? '#15803d' : '#e2e8f0'}`,
                      background: isSelected ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOrder(ord.id)}
                    />
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Đơn #{ord.id}</strong> — Khách: {ord.customerId} ({totalKg} kg)
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Đ/c: {ord.deliveryAddressId}</div>
                      </div>
                      <StatusBadge status={ord.status} />
                    </div>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                className="account-select"
                style={{ width: '100%', padding: '10px' }}
                placeholder="Tên tuyến đường (VD: Tuyến 1 - Nguyễn Huệ, Lê Duẩn...)"
                value={routeLabel}
                onChange={(e) => setRouteLabel(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '10px' }}
                disabled={creating || selectedOrderIds.length === 0}
              >
                {creating ? 'Đang tạo...' : `Tạo Tuyến Giao (${selectedOrderIds.length} đơn)`}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Danh sách chuyến xe hiện tại */}
      <div className="card">
        <h3 className="card-title">2. Danh Sách Chuyến Xe Điều Phối</h3>
        {shipments.length === 0 ? (
          <EmptyState
            icon="🚚"
            title="Chưa có chuyến xe nào được điều phối"
            description="Hãy gom các đơn hàng ở trên để tạo chuyến xe đầu tiên."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {shipments.map((ship) => (
              <div
                key={ship.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '16px',
                  background: '#f8fafc',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>
                      {ship.routeLabel} (#{ship.id})
                    </strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Tài xế: {ship.driverName || 'Nguyễn Văn Tài'} ({ship.driverPhone || '0903.123.456'}) | Xe: {ship.vehiclePlate || '59B1-999.88'}
                    </div>
                  </div>
                  <StatusBadge status={ship.status} />
                </div>

                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: 12 }}>
                  <span style={{ color: '#64748b' }}>Bao gồm {ship.orderIds.length} đơn hàng: </span>
                  <strong>{ship.orderIds.map((id) => `#${id}`).join(', ')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="demo-chip">Hành trình mô phỏng GPS</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {ship.status === 'ASSIGNED' && (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleAdvanceShipment(ship.id, 'IN_TRANSIT')}
                      >
                        🚀 Xuất phát giao hàng (IN_TRANSIT)
                      </button>
                    )}
                    {ship.status === 'IN_TRANSIT' && (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#16a34a' }}
                        onClick={() => handleAdvanceShipment(ship.id, 'DELIVERED')}
                      >
                        ✅ Bàn giao thành công (DELIVERED)
                      </button>
                    )}
                    {ship.status === 'DELIVERED' && (
                      <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                        Đã hoàn tất chuyến giao
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
