import { useEffect, useMemo, useState } from 'react';
import type { Customer, DeliveryAddress, Order, Shipment, ShipmentStatus } from '../../types';
import {
  advanceShipmentStatus,
  getAllOrders,
  getCustomers,
  getDeliveryAddresses,
  getShipments,
  subscribeDemoData,
} from '../../services/demoService';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';
import type { PortalSession } from '../../types/portalSession';
import './transport-dashboard.css';

type TransportData = {
  addresses: DeliveryAddress[];
  customers: Customer[];
  orders: Order[];
  shipments: Shipment[];
};

const initialData: TransportData = { addresses: [], customers: [], orders: [], shipments: [] };
const slotLabel = (slot?: string) => slot === 'MORNING' ? 'Ca sáng · 05–07h' : slot === 'AFTERNOON' ? 'Ca chiều · 13–15h' : 'Lịch demo cũ';
const nextStatus: Partial<Record<ShipmentStatus, ShipmentStatus>> = { ASSIGNED: 'IN_TRANSIT', IN_TRANSIT: 'DELIVERED' };
const statusLabel: Record<ShipmentStatus, string> = {
  PENDING: 'Chờ điều phối', ASSIGNED: 'Đã phân chuyến', IN_TRANSIT: 'Đang giao', DELIVERED: 'Đã giao',
};

export function TransportDashboard({ session, onSignOut }: { session: PortalSession; onSignOut: () => void }) {
  const [data, setData] = useState<TransportData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [filter, setFilter] = useState<'ACTIVE' | 'ALL' | 'DELIVERED'>('ACTIVE');

  const loadData = async () => {
    try {
      setError('');
      const [orders, shipments, customers] = await Promise.all([getAllOrders(), getShipments(), getCustomers()]);
      const addressLists = await Promise.all(customers.map(customer => getDeliveryAddresses(customer.id)));
      setData({ orders, shipments, customers, addresses: addressLists.flat() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tải được chuyến giao demo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    return subscribeDemoData(event => {
      if (event.type === 'DATA_CHANGED' || event.type === 'RESET') void loadData();
    });
  }, []);

  const visibleShipments = useMemo(() => data.shipments.filter(shipment => {
    if (filter === 'ACTIVE') return shipment.status !== 'DELIVERED';
    if (filter === 'DELIVERED') return shipment.status === 'DELIVERED';
    return true;
  }), [data.shipments, filter]);
  const activeCount = data.shipments.filter(shipment => shipment.status !== 'DELIVERED').length;
  const deliveredCount = data.shipments.filter(shipment => shipment.status === 'DELIVERED').length;
  const totalStops = data.shipments.filter(shipment => shipment.status !== 'DELIVERED').reduce((sum, shipment) => sum + shipment.orderIds.length, 0);

  const updateStatus = async (shipment: Shipment, next: ShipmentStatus) => {
    try {
      setUpdatingId(shipment.id);
      setError('');
      await advanceShipmentStatus(shipment.id, next);
      setNotice(next === 'IN_TRANSIT' ? 'Đã ghi nhận chuyến bắt đầu giao trong dữ liệu demo.' : 'Đã ghi nhận hoàn tất giao hàng trong dữ liệu demo.');
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không cập nhật được trạng thái chuyến.');
    } finally {
      setUpdatingId('');
      window.setTimeout(() => setNotice(''), 3500);
    }
  };

  const findOrder = (id: string) => data.orders.find(order => order.id === id);
  const customerName = (id: string) => data.customers.find(customer => customer.id === id)?.businessName ?? id;
  const addressLabel = (id: string) => data.addresses.find(address => address.id === id)?.label ?? id;
  const addressText = (id: string) => data.addresses.find(address => address.id === id)?.address ?? 'Địa chỉ demo chưa có mô tả';
  const totalKg = (order: Order) => order.items.reduce((sum, item) => sum + item.quantityKg, 0);

  return <div className="transport-portal">
    <header className="transport-masthead">
      <div className="transport-brand">
        <span className="transport-brand-mark" aria-hidden="true"><TruckIcon/></span>
        <div><strong>FARMGO <span>Giao nhận</span></strong><small>Bảng chuyến qua Hub</small></div>
      </div>
      <div className="transport-masthead-actions"><div className="transport-demo-chip"><span/> Chế độ demo · dữ liệu giả lập</div><div className="transport-signed-in">{session.displayName}<small>Tài khoản giao nhận demo</small></div><button className="transport-signout" onClick={onSignOut}>Thoát</button></div>
    </header>

    <section className="transport-hero">
      <div className="transport-hero-copy">
        <p className="transport-eyebrow">Điều phối sau Hub</p>
        <h1>Mỗi chuyến,<br/><em>một nhịp giao hàng.</em></h1>
        <p>Theo dõi đơn theo ngày và ca giao. Cập nhật trạng thái sẽ đồng bộ sang lịch sử đơn của khách.</p>
      </div>
      <div className="transport-route-art" aria-label="Minh họa tuyến giao hàng demo">
        <div className="route-art-label">HUB FARMGO</div>
        <div className="route-art-line"><span/><span/><span/><span/></div>
        <div className="route-art-caption"><span>Hub</span><span>Điểm giao</span></div>
        <small>Minh họa tuyến · không dùng GPS</small>
      </div>
    </section>

    <main className="transport-content">
      <div className="transport-section-heading">
        <div><h2>Chuyến giao</h2><p>Danh sách chuyến đã được Admin điều phối</p></div>
        <div className="transport-filter" role="group" aria-label="Lọc chuyến giao">
          <button className={filter === 'ACTIVE' ? 'selected' : ''} onClick={() => setFilter('ACTIVE')}>Đang xử lý</button>
          <button className={filter === 'ALL' ? 'selected' : ''} onClick={() => setFilter('ALL')}>Tất cả</button>
          <button className={filter === 'DELIVERED' ? 'selected' : ''} onClick={() => setFilter('DELIVERED')}>Đã giao</button>
        </div>
      </div>

      <div className="transport-metrics">
        <div><span>Chuyến đang xử lý</span><strong>{activeCount.toString().padStart(2, '0')}</strong><small>Đã phân công, chưa hoàn tất</small></div>
        <div><span>Điểm giao còn lại</span><strong>{totalStops.toString().padStart(2, '0')}</strong><small>Đơn trong các chuyến đang xử lý</small></div>
        <div><span>Chuyến hoàn tất</span><strong>{deliveredCount.toString().padStart(2, '0')}</strong><small>Ghi nhận trong dữ liệu demo</small></div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => void loadData()}/>}
      {notice && <div className="transport-notice" role="status">{notice}</div>}
      {loading ? <LoadingSpinner/> : visibleShipments.length === 0 ? <section className="transport-empty">
        <div className="transport-empty-icon"><TruckIcon/></div>
        <h3>{filter === 'DELIVERED' ? 'Chưa có chuyến hoàn tất' : filter === 'ACTIVE' ? 'Không có chuyến đang xử lý' : 'Chưa có chuyến giao nào'}</h3>
        <p>Admin tạo chuyến từ các đơn đã nhập Hub. Khi có chuyến mới, thông tin sẽ xuất hiện tại đây.</p>
      </section> : <div className="transport-trip-list">
        {visibleShipments.map((shipment, index) => {
          const next = nextStatus[shipment.status];
          const completed = shipment.status === 'DELIVERED';
          const orders = shipment.orderIds.map(findOrder).filter((order): order is Order => Boolean(order));
          return <article className={`transport-trip${completed ? ' is-complete' : ''}`} key={shipment.id}>
            <div className="trip-index"><span>{String(index + 1).padStart(2, '0')}</span><i/></div>
            <div className="trip-main">
              <div className="trip-topline">
                <div><p className="trip-kicker">{shipment.deliveryDate || 'Lịch demo cũ'} <span>·</span> {slotLabel(shipment.deliverySlot)}</p><h3>{shipment.routeLabel}</h3></div>
                <span className={`trip-status status-${shipment.status.toLowerCase()}`}><i/>{statusLabel[shipment.status]}</span>
              </div>
              <div className="trip-vehicle">
                <span><b>Xe</b>{shipment.vehiclePlate || 'Chưa gán'}</span>
                <span><b>Tài xế demo</b>{shipment.driverName || 'Chưa gán'}</span>
                <span><b>Liên hệ</b>{shipment.driverPhone || 'Chưa có'}</span>
              </div>
              <div className="trip-stops">
                <div className="trip-stops-heading"><span>Điểm giao</span><span>{orders.length} đơn <i>·</i> {orders.reduce((sum, order) => sum + totalKg(order), 0)} kg</span></div>
                {orders.map((order, stopIndex) => <div className="trip-stop" key={order.id}>
                  <span className="stop-number">{String(stopIndex + 1).padStart(2, '0')}</span>
                  <div className="stop-details"><strong>{customerName(order.customerId)}</strong><span>{addressLabel(order.deliveryAddressId)} · {addressText(order.deliveryAddressId)}</span><small>{order.items.map(item => `${item.productName} ${item.quantityKg}kg`).join(' / ')}</small></div>
                  <span className="stop-order">#{order.id}</span>
                </div>)}
              </div>
              <div className="trip-bottomline">
                <p>{completed ? 'Chuyến đã hoàn tất trong bản demo.' : shipment.trackingLabel || 'Trạng thái đồng bộ từ chuyến giao demo.'}</p>
                {next ? <button className="trip-action" disabled={updatingId === shipment.id} onClick={() => void updateStatus(shipment, next)}>
                  {updatingId === shipment.id ? 'Đang cập nhật…' : next === 'IN_TRANSIT' ? 'Bắt đầu giao' : 'Xác nhận đã giao'}
                  <span aria-hidden="true">↗</span>
                </button> : <span className="trip-done">Đã hoàn tất</span>}
              </div>
            </div>
          </article>;
        })}
      </div>}
      <footer className="transport-footnote"><span>FARMGO · giao nhận qua Hub</span><span>Các thao tác trên trang chỉ cập nhật trạng thái demo, không xác nhận GPS hoặc quét QR thật.</span></footer>
    </main>
  </div>;
}

function TruckIcon() {
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3 8.5h16v14H3zM19 13h5.2l4.3 4.6v4.9H19z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="9" cy="24" r="2.5" fill="currentColor"/><circle cx="24" cy="24" r="2.5" fill="currentColor"/><path d="M6 12.5h9M6 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
