import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { OrderItem } from '../../types';
import {
  getClaims, getCustomerOrders, getDeliveryAddresses, getDemoClock, getDemoSession, getShipmentByOrderId,
} from '../../services/demoService';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { money, useCatalog } from '../../components/shared/useCatalog';
import { useDemoData } from '../../components/shared/useDemoData';
import { canClaim } from './orderClaimEligibility';
import './buyer-orders.css';

const carrierNames = { GHN: 'GHN Express', GHTK: 'GHTK Logi', TRUCK: 'Xe tải thường' };
const paymentNames = { BANK: 'Thẻ / Ngân hàng', COD: 'COD', MOMO: 'MoMo', ZALOPAY: 'ZaloPay' };
const dateTime = (date: string) => new Date(date).toLocaleString('vi-VN');

export function OrderDetailContent({ id }: { id: string }) {
  const [copyMessage, setCopyMessage] = useState('');
  const { products } = useCatalog();
  const { data, error } = useDemoData(async () => {
    const session = await getDemoSession();
    const customerId = session.activeCustomerId || 'customer-1';
    const orders = await getCustomerOrders(customerId);
    const order = orders.find(candidate => candidate.id === id);
    if (!order) return null;
    const [shipment, addresses, now, claims] = await Promise.all([
      getShipmentByOrderId(id), getDeliveryAddresses(customerId), getDemoClock(), getClaims(),
    ]);
    return {
      order, shipment, address: addresses.find(candidate => candidate.id === order.deliveryAddressId),
      eligible: session.role === 'CUSTOMER' && canClaim(order, claims, now),
    };
  });

  if (error) return <ErrorMessage message={error} />;
  if (data === undefined) return <LoadingSpinner />;
  if (data === null) return <ErrorMessage message="Không tìm thấy đơn hàng." />;

  const { order, shipment, address, eligible } = data;
  const groups = new Map<string, OrderItem[]>();
  for (const item of order.items) {
    const key = item.supplierId || item.supplierName || '';
    const items = groups.get(key) ?? [];
    items.push(item);
    groups.set(key, items);
  }
  const productsById = new Map(products.map(product => [product.id, product]));
  const slot = order.deliverySlot === 'MORNING' ? '05–07h' : order.deliverySlot === 'AFTERNOON' ? '13–15h' : '';
  const date = order.deliveryDate?.split('-').reverse().join('/');
  const schedule = [date, slot].filter(Boolean).join(' · ');
  const carrier = order.checkoutOptions && carrierNames[order.checkoutOptions.carrier];
  const claimPath = '/customer/claims?orderId=' + encodeURIComponent(order.id);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(id);
      setCopyMessage('Đã sao chép mã đơn.');
    } catch {
      setCopyMessage('Không thể sao chép. Bạn có thể chọn mã đơn để sao chép.');
    }
  }

  return (
    <div className="buyer-detail-content">
      <section className="buyer-detail-status" aria-label="Trạng thái đơn">
        <StatusBadge status={order.status} />
        {order.deliveredAt ? <p>Giao thành công vào {dateTime(order.deliveredAt)}</p> :
          schedule && <p>Lịch giao: {schedule}</p>}
      </section>

      <section className="buyer-detail-section">
        <h3>Thông tin vận chuyển</h3>
        {carrier && <p><strong>{carrier}</strong></p>}
        {schedule && order.deliveredAt && <p>Ca giao: {schedule}</p>}
        {shipment ? (
          <>
            <p>{shipment.routeLabel} <StatusBadge status={shipment.status} /></p>
            {shipment.trackingLabel && <p>{shipment.trackingLabel}</p>}
            {[shipment.driverName, shipment.driverPhone, shipment.vehiclePlate].filter(Boolean).length > 0 && (
              <p>{[shipment.driverName, shipment.driverPhone, shipment.vehiclePlate].filter(Boolean).join(' · ')}</p>
            )}
          </>
        ) : <p>Chưa có thông tin theo dõi vận chuyển.</p>}
        <h3 className="buyer-detail-address-title">Địa chỉ nhận hàng</h3>
        {address ? <p><strong>{address.label}</strong><br />{address.address}</p> : <p>Chưa có thông tin địa chỉ.</p>}
      </section>

      <section className="buyer-detail-section">
        <h3>Mặt hàng</h3>
        {[...groups].map(([key, items]) => (
          <div className="buyer-order-group" key={key}>
            <h4>{items[0].supplierName || key || 'Chưa rõ nhà cung cấp'}</h4>
            <ul>
              {items.map((item, index) => {
                const product = productsById.get(item.productId);
                const qc = item.qcSnapshot;
                return (
                  <li className="buyer-order-item" key={item.productId + '-' + index}>
                    <FruitPhoto id={product?.commodityId ?? item.productId} name={item.productName} imageUrl={product?.imageUrl} />
                    <div>
                      <strong>{item.productName}</strong>
                      <p>{item.quantityKg.toLocaleString('vi-VN')} kg · {money(item.unitPriceVnd)}/kg</p>
                      {qc && <p>QC lúc đặt: {qc.grade} · Yield {qc.yieldPercent}%{qc.brix != null && ' · Brix ' + qc.brix}</p>}
                    </div>
                    <strong className="buyer-order-line-total">{money(item.lineTotalVnd)}</strong>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <details className="buyer-detail-totals">
          <summary>Tổng thanh toán <strong>{money(order.totalVnd)}</strong></summary>
          <dl>
            <div><dt>Tiền hàng</dt><dd>{money(order.subtotalVnd)}</dd></div>
            <div><dt>Phí giao</dt><dd>{money(order.shippingFeeVnd)}</dd></div>
            {!!order.insuranceFeeVnd && <div><dt>Bảo hiểm</dt><dd>{money(order.insuranceFeeVnd)}</dd></div>}
          </dl>
        </details>
      </section>

      <section className="buyer-detail-section">
        <h3>Thông tin đơn</h3>
        <div className="buyer-detail-reference">
          <span>Mã đơn <strong>{order.id}</strong></span>
          <button type="button" className="btn-secondary" onClick={copyId}>Sao chép</button>
        </div>
        <div role="status">{copyMessage}</div>
        <p>Đặt lúc: {dateTime(order.placedAt)}</p>
        {order.checkoutOptions && <p>Phương thức thanh toán: {paymentNames[order.checkoutOptions.paymentMethod]}</p>}
        {order.paymentRequestKey && <p>Đã giữ tiền qua Escrow</p>}
      </section>

      <section className="buyer-detail-section">
        <h3>Hỗ trợ</h3>
        {eligible && order.deliveredAt && <p>Hạn gửi khiếu nại: {dateTime(new Date(Date.parse(order.deliveredAt) + 7_200_000).toISOString())}</p>}
        <div className="buyer-detail-support">
          {eligible && <Link className="btn-primary" to={claimPath}>Gửi khiếu nại</Link>}
          <Link to="/customer/claims">Xem khiếu nại</Link>
          <Link to="/customer/finance">Xem tài chính</Link>
        </div>
      </section>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="buyer-detail-page">
      <Link to="/customer/orders">← Quay lại danh sách đơn hàng</Link>
      <h1>Thông tin đơn hàng</h1>
      {id && <OrderDetailContent key={id} id={id} />}
    </div>
  );
}
