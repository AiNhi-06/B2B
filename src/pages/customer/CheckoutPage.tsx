import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CheckoutQuote, DeliveryAddress, DeliverySlot } from '../../types';
import { getDeliveryAddresses, quoteCheckout, placeOrder, subscribeDemoData, getDemoClock, nextDeliveryDate } from '../../services/demoService';
import { useBuyerCart } from '../../components/shared/useBuyerCart';
import { useCatalog, money } from '../../components/shared/useCatalog';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';
export function CheckoutPage() {
  const cart = useBuyerCart();
  const { products } = useCatalog();
  const navigate = useNavigate();
  const [deliveryDate, setDeliveryDate] = useState('');
  const [minimumDate, setMinimumDate] = useState('');
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot>('MORNING');
  useEffect(() => { let live = true; const load = async () => { const value = nextDeliveryDate(await getDemoClock()); if(live) { setMinimumDate(value); setDeliveryDate(current => current && current >= value ? current : value); } }; void load(); const off = subscribeDemoData(() => { void load(); }); return () => { live = false; off(); }; }, []);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [addressId, setAddressId] = useState('');
  const [quoteState, setQuoteState] = useState<{key: string; value?: CheckoutQuote; error?: string}>({key: ''});
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => subscribeDemoData(() => setRevision(value => value + 1)), []);
  useEffect(() => {
    let disposed = false;
    setAddresses([]); setAddressId('');
    if (cart.customerId) getDeliveryAddresses(cart.customerId).then(data => { if (!disposed) { setAddresses(data); setAddressId(data[0]?.id || ''); setError(undefined); } }).catch(err => { if (!disposed) setError(err instanceof Error ? err.message : 'Không tải được địa chỉ.'); });
    return () => { disposed = true; };
  }, [cart.customerId]);
  const key = JSON.stringify([cart.customerId, cart.items, addressId, deliveryDate, deliverySlot, revision, cart.ready]);
  useEffect(() => {
    let disposed = false;
    if (cart.ready && cart.items.length && addressId) {
      quoteCheckout({ customerId: cart.customerId, deliveryAddressId: addressId, items: cart.items, deliveryDate, deliverySlot }).then(value => { if (!disposed) setQuoteState({key, value}); }).catch(err => { if (!disposed) setQuoteState({key, error: err instanceof Error ? err.message : 'Không tính được giá.'}); });
    }
    return () => { disposed = true; };
  }, [key, cart.ready, cart.items, cart.customerId, addressId, deliveryDate, deliverySlot]);
  const quote = quoteState.key === key ? quoteState.value : undefined;
  const requestError = quoteState.key === key ? quoteState.error : undefined;
  const place = async () => {
    if (!quote || submitting || !cart.ready) return;
    setSubmitting(true); setError(undefined);
    try {
      const fingerprint = JSON.stringify([cart.customerId,addressId,cart.items,deliveryDate,deliverySlot]);
      const storageKey = `farmgo-checkout-attempt-${cart.customerId}`;
      const previous = JSON.parse(localStorage.getItem(storageKey) || 'null') as {fingerprint:string; requestKey:string} | null;
      const attempt = previous?.fingerprint === fingerprint ? previous : {fingerprint,requestKey:crypto.randomUUID()};
      localStorage.setItem(storageKey,JSON.stringify(attempt));
      const order = await placeOrder({ requestKey: attempt.requestKey, customerId: cart.customerId, deliveryAddressId: addressId, items: cart.items, deliveryDate, deliverySlot });
      cart.clear(); localStorage.removeItem(storageKey); navigate(`/customer/orders/${order.id}`, {state: {placedTotal: order.totalVnd}});
    } catch (err) { setError(err instanceof Error ? err.message : 'Không tạo được đơn.'); }
    finally { setSubmitting(false); }
  };
  if (!cart.ready) return cart.error ? <ErrorMessage message={cart.error} /> : <LoadingSpinner />;
  if (!cart.items.length) return <div className="empty-panel"><h1>Giỏ hàng đang trống</h1><p>Chọn nguyên liệu từ danh mục để tạo đơn cho quán.</p><Link className="btn-primary" to="/customer/catalog">Chọn nguyên liệu</Link></div>;
  return <><div className="page-heading"><div><h1>Giỏ hàng & đặt hàng</h1><p>Kiểm tra nguồn cung, số lượng và địa chỉ nhận hàng.</p></div><Link to="/customer/catalog">Chọn thêm nguyên liệu</Link></div>
    {(error || cart.error || requestError) && <ErrorMessage message={error || cart.error || requestError!} />}
    <div className="checkout-layout"><div><section className="card"><h2>Nguyên liệu đã chọn</h2>{cart.items.map(item => {
      const product = products.find(value => value.id === item.productId);
      const price = quote?.items.find(value => value.productId === item.productId);
      return <div className="cart-line" key={item.productId}><div className="cart-photo"><FruitPhoto id={product?.commodityId || item.productId} name={product?.name || price?.productName || 'Sản phẩm'} imageUrl={product?.imageUrl} /></div>
        <div className="cart-line-info"><strong>{product?.name || price?.productName || 'Sản phẩm chưa mở bán'}</strong><span>{product?.supplier.name || price?.supplierName || 'Thông tin NCC chưa có'}</span><span>{price ? `${money(price.unitPriceVnd)} /kg` : product ? `${money(product.publicPricePerKg)} /kg` : 'Không có báo giá hiện tại'}</span></div>
        <label className="cart-quantity">kg<input type="number" min={1} step={1} value={item.quantityKg} disabled={submitting} aria-label={`Số kg ${product?.name || item.productId}`} onChange={event => cart.quantity(item.productId, Number(event.target.value))} /></label><strong>{price ? money(price.lineTotalVnd) : '—'}</strong><button className="btn-secondary" disabled={submitting} aria-label={`Xóa ${product?.name || item.productId}`} onClick={() => cart.remove(item.productId)}>Xóa</button></div>;
    })}</section><section className="card"><h2>Địa chỉ nhận hàng</h2>{addresses.map(address => <label className="address-choice" key={address.id}><input type="radio" name="address" checked={addressId === address.id} onChange={() => setAddressId(address.id)} disabled={submitting} /><span><strong>{address.label}</strong><br />{address.address}</span></label>)}</section></div>
      <section className="card checkout-summary"><h2>Tóm tắt đơn hàng</h2><label>Ngày giao demo<input type="date" min={minimumDate} value={deliveryDate} disabled={submitting} onChange={e => setDeliveryDate(e.target.value)} /></label><label>Ca giao qua Hub<select value={deliverySlot} disabled={submitting} onChange={e => setDeliverySlot(e.target.value as DeliverySlot)}><option value="MORNING">05–07h</option><option value="AFTERNOON">13–15h</option></select></label>{quote ? <><div><span>Tiền hàng</span><strong>{money(quote.subtotalVnd)}</strong></div><div><span>Phí vận chuyển ước tính<br /><small>(dữ liệu demo)</small></span><strong>{money(quote.shippingFeeVnd)}</strong></div><div className="checkout-total"><span>Tổng cộng</span><strong>{money(quote.totalVnd)}</strong></div></> : !requestError && <LoadingSpinner text="Đang cập nhật báo giá…" />}<p>Giá và phí được tính lại khi xác nhận đặt hàng.</p><button className="btn-primary" disabled={submitting || !quote} onClick={place}>{submitting ? 'Đang tạo đơn…' : 'Đặt hàng & thanh toán demo'}</button><small>Thanh toán và giữ tiền Escrow giả lập, không thu tiền thật.</small></section>
    </div></>;
}
