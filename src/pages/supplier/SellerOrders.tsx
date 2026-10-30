import { Link } from 'react-router-dom';
import * as api from '../../services/demoService';
import { useDemoData } from '../../components/shared/useDemoData';
import { money } from '../../components/shared/useCatalog';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';

export function SellerOrders() {
  const s = useDemoData(async () => ({
    session: await api.getDemoSession(),
    orders: await api.getAllOrders(),
    customers: await api.getCustomers(),
    confirmations: await api.getSupplierConfirmations(),
    demand: await api.getSupplierDemand((await api.getDemoSession()).activeSupplierId!),
  }));
  if (!s.data) return s.error ? <ErrorMessage message={s.error} /> : <LoadingSpinner />;
  const { session, customers, confirmations, demand } = s.data;
  const id = session.activeSupplierId!;
  const confirmed = new Set(confirmations.filter(c => c.supplierId === id).flatMap(c => c.orderIds));
  const eligible = new Set(demand.flatMap(d => d.orderIds));
  const orders = s.data.orders.filter(o => o.items.some(item => item.supplierId === id));
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
      {!orders.length && <div className="seller-panel seller-empty">Chưa có đơn hàng phù hợp.</div>}
      {orders.map(order => {
        const items = order.items.filter(item => item.supplierId === id);
        const stage =
          order.status === 'DELIVERED'
            ? 3
            : order.status === 'DISPATCHED'
            ? 3
            : ['AT_HUB', 'READY_TO_SHIP'].includes(order.status)
            ? 2
            : confirmed.has(order.id)
            ? 1
            : 0;
        return (
          <article className="seller-order seller-panel" key={order.id}>
            <header>
              <div>
                <code>{order.id}</code>
                <h2>{customers.find(c => c.id === order.customerId)?.businessName || order.customerId}</h2>
                <p>{items.map(item => `${item.productName} (${item.quantityKg} kg)`).join(', ')}</p>
              </div>
              <div>
                <strong>{money(items.reduce((sum, item) => sum + item.lineTotalVnd, 0))}</strong>
                <small>{new Date(order.placedAt).toLocaleString('vi-VN')}</small>
              </div>
            </header>
            <ol className="seller-order-progress">
              {['Đơn mới', 'Xác nhận', 'Đóng gói / chuẩn bị giao', order.status === 'DELIVERED' ? 'Đã giao hàng' : 'Đang giao hàng'].map(
                (label, index) => (
                  <li key={label} className={index === stage ? 'active' : ''}>
                    {index + 1}. {label}
                  </li>
                )
              )}
            </ol>
            <footer>
              {!confirmed.has(order.id) && eligible.has(order.id) ? (
                <button
                  className="btn-primary"
                  disabled={s.busy}
                  onClick={() => void s.run(()=>api.confirmSupplierDemand({ supplierId: id, orderIds: [order.id] }))}
                >
                  Xác nhận đơn hàng
                </button>
              ) : (
                <span>
                  {stage === 0
                    ? 'Chờ hệ thống gom đơn'
                    : order.status === 'DELIVERED'
                    ? 'Đã hoàn tất giao hàng'
                    : 'Theo dõi tiến trình giao hàng'}
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
