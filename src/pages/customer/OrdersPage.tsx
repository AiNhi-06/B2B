import { useRef, useState } from 'react';
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

const orderFilters: { label: string; statuses: Order['status'][] | null }[] = [
  { label: 'Tất cả', statuses: null },
  { label: 'Chờ xác nhận', statuses: ['PLACED', 'AGGREGATED'] },
  { label: 'Chờ lấy hàng', statuses: ['SUPPLIER_CONFIRMED'] },
  { label: 'Chờ giao hàng', statuses: ['AT_HUB', 'DISPATCHED'] },
  { label: 'Đã giao', statuses: ['DELIVERED'] },
  { label: 'Trả hàng', statuses: [] },
  { label: 'Đã hủy', statuses: [] },
];

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase('vi').normalize('NFD')
    .replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/#/g, '').trim();
}

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
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(orderFilters[0]);
  const searchInput = useRef<HTMLInputElement>(null);
  const clearSearch = () => {
    setQuery('');
    searchInput.current?.focus();
  };
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
  const keyword = normalizeSearch(query);
  const visibleOrders = data?.orders.filter(order => {
    if (filter.statuses && !filter.statuses.includes(order.status)) return false;
    if (!keyword) return true;
    return [order.id, ...order.items.flatMap(item => [item.productName, item.supplierName ?? ''])]
      .some(value => normalizeSearch(value).includes(keyword));
  }) ?? [];

  return (
    <div className="buyer-orders">
      <header className="buyer-orders-heading">
        <div>
          <h1>Đơn hàng của quán</h1>
          {data && <p>Tài khoản hiện tại: {data.customerId}</p>}
        </div>
        <Link className="btn-primary" to="/customer/catalog">Đặt thêm đơn</Link>
      </header>

      <section className="buyer-order-controls" aria-label="Tìm và lọc đơn hàng">
        <label htmlFor="buyer-order-search">Tìm kiếm đơn hàng</label>
        <div className="buyer-order-search">
          <input
            id="buyer-order-search"
            ref={searchInput}
            type="search"
            placeholder="Nhập mã đơn, mặt hàng hoặc nhà cung cấp"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          {query && <button type="button" onClick={clearSearch}>Xóa</button>}
        </div>
        <div className="buyer-order-filters" role="group" aria-label="Trạng thái đơn hàng">
          {orderFilters.map(option => (
            <button key={option.label} type="button" aria-pressed={option === filter} onClick={() => setFilter(option)}>
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}
      {!data && !error && <LoadingSpinner />}
      {data && (
        <p className="buyer-order-result-count" role="status">{visibleOrders.length} đơn hàng</p>
      )}
      {data && visibleOrders.length === 0 && (
        <div className="empty-panel buyer-order-empty">
          <h2>{!data.orders.length && !keyword && !filter.statuses
            ? 'Bạn chưa có đơn hàng nào'
            : 'Không tìm thấy đơn hàng phù hợp'}</h2>
          {query && <button type="button" className="btn-secondary" onClick={clearSearch}>Xóa từ khóa</button>}
          {!data.orders.length && !keyword && !filter.statuses && <Link to="/customer/catalog">Khám phá nguyên liệu</Link>}
        </div>
      )}
      {data && visibleOrders.map(order => {
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
          delivery = `Lịch giao: ${shortDate.format(new Date(order.deliveryDate))}${slot}`;
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
              {(order.insuranceFeeVnd ?? 0) > 0 && <span>Bảo hiểm: {money(order.insuranceFeeVnd ?? 0)}</span>}
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
