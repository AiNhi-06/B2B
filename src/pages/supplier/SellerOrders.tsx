import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { OrderStatus, ShipmentStatus } from '../../types';
import * as api from '../../services/demoService';
import { useDemoData } from '../../components/shared/useDemoData';
import { money } from '../../components/shared/useCatalog';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import './seller-order-card.css';

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
});
const quantity = new Intl.NumberFormat('vi-VN');

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
  const s = useDemoData(async () => {
    const session = await api.getDemoSession();
    const [allOrders, customers, confirmations, shipments, demand] = await Promise.all([
      api.getAllOrders(), api.getCustomers(), api.getSupplierConfirmations(), api.getShipments(),
      api.getSupplierDemand(session.activeSupplierId!),
    ]);
    const orders = allOrders.filter(order => order.items.some(item => item.supplierId === session.activeSupplierId));
    const customerIds = new Set(orders.map(order => order.customerId));
    const addressLists = await Promise.all(customers.filter(customer => customerIds.has(customer.id))
      .map(customer => api.getDeliveryAddresses(customer.id)));
    const addresses = new Map(addressLists.flat().map(address => [address.id, address]));
    return { session, orders, customers, confirmations, shipments, demand, addresses };
  });
  if (!s.data) return s.error ? <ErrorMessage message={s.error} /> : <LoadingSpinner />;
  const { session, orders, customers, confirmations, demand, shipments, addresses } = s.data;
  const id = session.activeSupplierId!;
  const confirmationByOrder = new Map(confirmations.filter(c => c.supplierId === id)
    .flatMap(confirmation => confirmation.orderIds.map(orderId => [orderId, confirmation] as const)));
  const eligible = new Set(demand.flatMap(d => d.orderIds));
  const shipmentByOrder = new Map(shipments.flatMap(shipment => shipment.orderIds.map(orderId => [orderId, shipment] as const)));
  const rows = orders.map(order => {
    const shipment = shipmentByOrder.get(order.id);
    const confirmation = confirmationByOrder.get(order.id);
    return { order, shipment, confirmation, stage: orderStage(order.status, shipment?.status, Boolean(confirmation)) };
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
      {visible.map(({ order, shipment, confirmation, stage }) => {
        const items = order.items.filter(item => item.supplierId === id);
        const address = addresses.get(order.deliveryAddressId);
        const slot = order.deliverySlot === 'MORNING' ? '05:00–07:00' : order.deliverySlot === 'AFTERNOON' ? '13:00–15:00' : '';
        const canConfirm = stage === 'pending' && eligible.has(order.id);
        const current = stages.find(item => item.key === stage)!;
        const statusLabel = stage === 'transport'
          ? shipment?.status === 'ASSIGNED' ? 'Đã phân công chuyến' : 'Đã tới điểm gom'
          : current.label;
        return (
          <article className="seller-order seller-order-card seller-panel" key={order.id} aria-label={`Đơn ${order.id}`}>
            <header className="seller-order-card-head">
              <div className="seller-order-card-id">
                <h2>{order.id}</h2>
                <span className="seller-order-status" data-stage={stage}>{statusLabel}</span>
              </div>
              {order.deliveredAt ? (
                <p>Đã giao <time dateTime={order.deliveredAt}>{dateTime.format(new Date(order.deliveredAt))}</time></p>
              ) : order.deliveryDate && (
                <p>Lịch giao <time dateTime={order.deliveryDate}>{order.deliveryDate.split('-').reverse().join('/')}</time>{slot && ` · ${slot}`}</p>
              )}
            </header>
            <div className="seller-order-card-grid">
              <section>
                <h3>Khách hàng</h3>
                <p><b>{customers.find(customer => customer.id === order.customerId)?.businessName || order.customerId}</b></p>
                {address && <p>{address.address}</p>}
              </section>
              <section>
                <h3>Sản phẩm và số lượng</h3>
                <ul>
                  {items.map(item => <li key={item.productId}>
                    <b>{item.productName}</b>
                    <span>{quantity.format(item.quantityKg)} kg · {money(item.lineTotalVnd)}</span>
                  </li>)}
                </ul>
                {items.length > 1 && <p>Tổng <b>{quantity.format(items.reduce((sum, item) => sum + item.quantityKg, 0))} kg</b> · <b>{money(items.reduce((sum, item) => sum + item.lineTotalVnd, 0))}</b></p>}
              </section>
              <section>
                <h3>Tài xế và phương tiện</h3>
                {shipment ? <>
                  <p><b>{shipment.driverName || shipment.routeLabel}</b></p>
                  {shipment.vehiclePlate && <p>Biển số xe {shipment.vehiclePlate}</p>}
                  {shipment.trackingLabel && <p>{shipment.trackingLabel}</p>}
                </> : confirmation?.vehiclePlate ? (
                  <p>Xe về điểm gom <b>{confirmation.vehiclePlate}</b></p>
                ) : <p>Chưa có thông tin xe</p>}
              </section>
            </div>
            <footer>
              <span>{stage === 'pending' && !canConfirm ? 'Chờ hệ thống gom đơn' : <>Đặt lúc <time dateTime={order.placedAt}>{dateTime.format(new Date(order.placedAt))}</time></>}</span>
              <div className="seller-order-card-actions">
              {canConfirm && (
                <button
                  className="btn-primary"
                  disabled={s.busy}
                  onClick={() => void s.run(()=>api.confirmSupplierDemand({ supplierId: id, orderIds: [order.id] }))}
                >
                  Xác nhận đơn hàng
                </button>
              )}
                <Link className="btn-secondary" to="/supplier/demand">Chi tiết cung ứng</Link>
              </div>
            </footer>
          </article>
        );
      })}
    </>
  );
}
