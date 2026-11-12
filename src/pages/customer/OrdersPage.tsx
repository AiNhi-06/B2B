import { Link } from 'react-router-dom';
import type { Claim, Order, OrderItem } from '../../types';
import { getClaims, getDemoClock, getDemoSession, getCustomerOrders } from '../../services/demoService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { money, useCatalog } from '../../components/shared/useCatalog';
import { useDemoData } from '../../components/shared/useDemoData';
import './buyer-orders.css';

const shortDate = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });

function canClaim(order: Order, claims: Claim[], now: string) {
  if (order.status !== 'DELIVERED' || !order.deliveredAt) return false;
  const elapsed = Date.parse(now) - Date.parse(order.deliveredAt);
  if (!(elapsed >= 0 && elapsed < 7_200_000)) return false;

  const orderClaims = claims.filter(claim => claim.orderId === order.id);
  return order.items.some(item => {
    if (!item.supplierId || orderClaims.some(claim =>
      claim.supplierId === item.supplierId && (claim.status === 'OPEN' || claim.status === 'RESPONDED')
    )) return false;
    const reservedKg = orderClaims.flatMap(claim => {
      if (claim.status === 'APPROVED') return claim.approvedLines ?? [];
      if (claim.status === 'OPEN' || claim.status === 'RESPONDED') return claim.lines;
      return [];
    }).reduce((kg, line) => kg + (line.productId === item.productId ? line.quantityKg : 0), 0);
    return item.quantityKg - reservedKg >= 1;
  });
}

export function OrdersPage() {
  const { products } = useCatalog();
  const { data, error } = useDemoData(async () => {
    const session = await getDemoSession();
    const customerId = session.activeCustomerId || 'customer-1';
    const [orders, now, claims] = await Promise.all([
      getCustomerOrders(customerId), getDemoClock(), getClaims(),
    ]);
    return { customerId, orders, now, claims, isBuyer: session.role === 'CUSTOMER' };
  });
  const productsById = new Map(products.map(product => [product.id, product]));

  return (
    <div className="buyer-orders">
      <header className="buyer-orders-heading">
        <div>
          <h1>Đơn hàng của quán</h1>
          {data && <p>Tài khoản hiện tại: {data.customerId}</p>}
        </div>
        <Link className="btn-primary" to="/customer/catalog">Đặt thêm đơn</Link>
      </header>

      {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}
      {!data && !error && <LoadingSpinner />}
      {data?.orders.length === 0 && (
        <div className="empty-panel">
          <h2>Bạn chưa có đơn hàng nào</h2>
          <Link to="/customer/catalog">Khám phá nguyên liệu</Link>
        </div>
      )}
      {data?.orders.map(order => {
        const groups = new Map<string, OrderItem[]>();
        for (const item of order.items) {
          const key = item.supplierId || item.supplierName || '';
          const group = groups.get(key) ?? [];
          group.push(item);
          groups.set(key, group);
        }
        const firstItem = order.items[0];
        const title = groups.size > 1 ? `${groups.size} nhóm nhà cung cấp` :
          firstItem?.supplierName || firstItem?.supplierId || 'Đơn hàng FARMGO';
        const detailPath = `/customer/orders/${order.id}`;
        let delivery = '';
        if (order.status === 'DELIVERED') {
          delivery = order.deliveredAt
            ? `Giao thành công vào ${shortDate.format(new Date(order.deliveredAt))}`
            : 'Đã giao';
        } else if (order.deliveryDate) {
          const slot = order.deliverySlot === 'MORNING' ? ' · 05–07h' :
            order.deliverySlot === 'AFTERNOON' ? ' · 13–15h' : '';
          delivery = `Lịch giao mô phỏng: ${shortDate.format(new Date(order.deliveryDate))}${slot}`;
        }

        return (
          <article className="buyer-order-card" key={order.id}>
            <header className="buyer-order-header">
              <div>
                <h2>{title}</h2>
                <p>#{order.id} · {new Date(order.placedAt).toLocaleString('vi-VN')}</p>
              </div>
              <StatusBadge status={order.status} />
            </header>

            {[...groups].map(([key, items]) => (
              <div className="buyer-order-group" key={key}>
                {groups.size > 1 && <h3>{items[0].supplierName || key || 'Chưa rõ nhà cung cấp'}</h3>}
                <ul>
                  {items.map((item, index) => {
                    const product = productsById.get(item.productId);
                    return (
                      <li className="buyer-order-item" key={`${item.productId}-${index}`}>
                        <FruitPhoto id={product?.commodityId ?? item.productId} name={item.productName} imageUrl={product?.imageUrl} />
                        <div>
                          <strong>{item.productName}</strong>
                          <p>{item.quantityKg.toLocaleString('vi-VN')} kg · {money(item.unitPriceVnd)}/kg</p>
                        </div>
                        <strong className="buyer-order-line-total">{money(item.lineTotalVnd)}</strong>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div className="buyer-order-total">
              <span>Phí giao: {money(order.shippingFeeVnd)}</span>
              {(order.insuranceFeeVnd ?? 0) > 0 && <span>Bảo hiểm mô phỏng: {money(order.insuranceFeeVnd ?? 0)}</span>}
              <div>Tổng tiền ({order.items.length} mặt hàng) <strong>{money(order.totalVnd)}</strong></div>
            </div>

            {delivery && <Link className="buyer-order-delivery" to={detailPath}>{delivery}<span aria-hidden="true">›</span></Link>}

            <div className="buyer-order-actions">
              {data.isBuyer && canClaim(order, data.claims, data.now) && (
                <Link className="btn-secondary" to={`/customer/claims?orderId=${encodeURIComponent(order.id)}`}>Gửi khiếu nại</Link>
              )}
              <Link className="btn-primary" to={detailPath}>Xem chi tiết</Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
