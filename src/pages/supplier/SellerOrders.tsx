import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { OrderStatus, ShipmentStatus } from '../../types';
import * as api from '../../services/demoService';
import { useDemoData } from '../../components/shared/useDemoData';
import { money } from '../../components/shared/useCatalog';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';

const stages = [
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'preparing', label: 'Đang soạn hàng / chuẩn bị' },
  { key: 'transport', label: 'Chờ vận chuyển' },
  { key: 'tracking', label: 'Đang giao hàng / tracking' },
  { key: 'completed', label: 'Hoàn thành' },
] as const;

type Stage = typeof stages[number]['key'];

function orderStage(status: OrderStatus, shipment: ShipmentStatus | undefined, confirmed: boolean): Stage {
  if (status === 'DELIVERED' || shipment === 'DELIVERED') return 'completed';
  if (status === 'DISPATCHED' || shipment === 'IN_TRANSIT') return 'tracking';
  if (status === 'AT_HUB' || shipment === 'ASSIGNED') return 'transport';
  if (confirmed || status === 'SUPPLIER_CONFIRMED') return 'preparing';
  return 'pending';
}

export function SellerOrders() {
  const [filter, setFilter] = useState<Stage | 'all'>('all');
  const s = useDemoData(async () => ({
    session: await api.getDemoSession(),
    orders: await api.getAllOrders(),
    customers: await api.getCustomers(),
    confirmations: await api.getSupplierConfirmations(),
    shipments: await api.getShipments(),
    demand: await api.getSupplierDemand((await api.getDemoSession()).activeSupplierId!),
  }));
  if (!s.data) return s.error ? <ErrorMessage message={s.error} /> : <LoadingSpinner />;
  const { session, customers, confirmations, demand, shipments } = s.data;
  const id = session.activeSupplierId!;
  const confirmed = new Set(confirmations.filter(c => c.supplierId === id).flatMap(c => c.orderIds));
  const eligible = new Set(demand.flatMap(d => d.orderIds));
  const orders = s.data.orders.filter(o => o.items.some(item => item.supplierId === id));
  const shipmentByOrder = new Map(shipments.flatMap(shipment => shipment.orderIds.map(orderId => [orderId, shipment] as const)));
  const rows = orders.map(order => {
    const shipment = shipmentByOrder.get(order.id);
    return { order, shipment, stage: orderStage(order.status, shipment?.status, confirmed.has(order.id)) };
  });
  const visible = filter === 'all' ? rows : rows.filter(row => row.stage === filter);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Xử lý đơn hàng B2B</h1>
          <p>Tiếp nhận đơn từ các quán F&B và chuẩn bị đóng gói giao hàng.</p>
        </div>
        <span className="seller-chip">● Luồng đơn hàng demo</span>
      </div>
      {s.error && <ErrorMessage message={s.error} />}
      <div className="seller-order-filters" role="group" aria-label="Lọc đơn hàng theo tiến độ">
        {[{ key: 'all', label: 'Tất cả đơn' } as const, ...stages].map(({ key, label }) => (
          <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
            {label} <span>{key === 'all' ? rows.length : rows.filter(row => row.stage === key).length}</span>
          </button>
        ))}
      </div>
      <p className="seller-order-count" role="status">{visible.length} đơn hàng</p>
      {!visible.length && <div className="seller-panel seller-empty">Chưa có đơn hàng trong mục này.</div>}
      {visible.map(({ order, shipment, stage }) => {
        const items = order.items.filter(item => item.supplierId === id);
        const current = stages.find(item => item.key === stage)!;
        const statusLabel = stage === 'transport'
          ? shipment?.status === 'ASSIGNED' ? 'Đã phân công chuyến' : 'Đã tới điểm gom'
          : current.label;
        return (
          <article className="seller-order seller-panel" key={order.id}>
            <header>
              <div>
                <code>{order.id}</code>
                <h2>{customers.find(c => c.id === order.customerId)?.businessName || order.customerId}</h2>
                <p>{items.map(item => `${item.productName} (${item.quantityKg} kg)`).join(', ')}</p>
              </div>
              <div>
                <span className="seller-order-status">{statusLabel}</span>
                <strong>{money(items.reduce((sum, item) => sum + item.lineTotalVnd, 0))}</strong>
                <small>{new Date(order.placedAt).toLocaleString('vi-VN')}</small>
              </div>
            </header>
            <ol className="seller-order-progress">
              {stages.map(
                ({ key, label }, index) => (
                  <li key={key} className={key === stage ? 'active' : ''} aria-current={key === stage ? 'step' : undefined}>
                    {index + 1}. {label}
                  </li>
                )
              )}
            </ol>
            <footer>
              {stage === 'pending' && eligible.has(order.id) ? (
                <button
                  className="btn-primary"
                  disabled={s.busy}
                  onClick={() => void s.run(()=>api.confirmSupplierDemand({ supplierId: id, orderIds: [order.id] }))}
                >
                  Xác nhận đơn hàng
                </button>
              ) : (
                <span>
                  {stage === 'pending'
                    ? 'Chờ hệ thống gom đơn'
                    : stage === 'completed'
                    ? 'Đã hoàn tất giao hàng'
                    : shipment?.trackingLabel || statusLabel}
                </span>
              )}
              <Link className="btn-secondary" to="/supplier/demand">Chi tiết cung ứng</Link>
            </footer>
          </article>
        );
      })}
    </>
  );
}
