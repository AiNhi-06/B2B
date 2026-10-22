import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { DeliveryAddress, CheckoutQuote } from '../../types';
import {
  getDemoSession,
  getDeliveryAddresses,
  quoteCheckout,
  placeOrder,
  subscribeDemoData,
} from '../../services/demoService';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { EmptyState } from '../../components/shared/EmptyState';

interface CartItem {
  productId: string;
  productName: string;
  quantityKg: number;
  unitPriceVnd: number;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string>('customer-1');
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Load cart items
  const loadCart = () => {
    try {
      const raw = localStorage.getItem('demo-cart-items') || '[]';
      const parsed = JSON.parse(raw);
      setCartItems(parsed);
    } catch {
      setCartItems([]);
    }
  };

  // 2. Load customer session and addresses
  const loadSessionAndAddresses = async () => {
    try {
      const session = await getDemoSession();
      const cId = session.activeCustomerId || 'customer-1';
      setCustomerId(cId);
      const addrList = await getDeliveryAddresses(cId);
      setAddresses(addrList);
      if (addrList.length > 0) {
        setSelectedAddressId((prev) => prev || addrList[0].id);
      }
    } catch (err: unknown) {
      console.error('Lỗi tải địa chỉ nhận hàng:', err);
    }
  };

  useEffect(() => {
    loadCart();
    loadSessionAndAddresses();

    const unsub = subscribeDemoData((event) => {
      if (event.type === 'RESET') {
        localStorage.removeItem('demo-cart-items');
        setCartItems([]);
      } else if (event.type === 'SESSION_CHANGED') {
        loadSessionAndAddresses();
      }
    });
    return () => unsub();
  }, []);

  // 3. Trigger live quote when items or address changes
  useEffect(() => {
    if (cartItems.length === 0 || !selectedAddressId) {
      setQuote(null);
      return;
    }

    let isMounted = true;
    async function calculateQuote() {
      try {
        setLoadingQuote(true);
        setError(null);
        const q = await quoteCheckout({
          customerId,
          deliveryAddressId: selectedAddressId,
          items: cartItems.map((i) => ({ productId: i.productId, quantityKg: i.quantityKg })),
        });
        if (isMounted) setQuote(q);
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Lỗi tính báo giá.';
          setError(msg);
        }
      } finally {
        if (isMounted) setLoadingQuote(false);
      }
    }

    calculateQuote();
    return () => {
      isMounted = false;
    };
  }, [cartItems, customerId, selectedAddressId]);

  const handleUpdateQty = (productId: string, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.productId === productId) {
          const newQty = item.quantityKg + delta;
          return newQty > 0 ? { ...item, quantityKg: newQty } : null;
        }
        return item;
      })
      .filter((i): i is CartItem => i !== null);

    setCartItems(updated);
    localStorage.setItem('demo-cart-items', JSON.stringify(updated));
  };

  const handleRemoveItem = (productId: string) => {
    const updated = cartItems.filter((i) => i.productId !== productId);
    setCartItems(updated);
    localStorage.setItem('demo-cart-items', JSON.stringify(updated));
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !selectedAddressId) return;

    try {
      setSubmitting(true);
      setError(null);
      await placeOrder({
        customerId,
        deliveryAddressId: selectedAddressId,
        items: cartItems.map((i) => ({ productId: i.productId, quantityKg: i.quantityKg })),
      });
      // Clear cart
      localStorage.removeItem('demo-cart-items');
      setCartItems([]);
      navigate('/customer/orders');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đặt đơn hàng thất bại.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Giỏ hàng của bạn đang trống"
        description="Hãy chọn các loại trái cây tươi ngon từ danh mục mở bán hôm nay."
        action={{
          label: 'Xem danh mục trái cây',
          onClick: () => navigate('/customer'),
        }}
      />
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/customer" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Tiếp tục chọn thêm trái cây
        </Link>
      </div>

      <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>🛒 Xác Nhận Đơn Hàng & Thanh Toán</h2>

      {error && <ErrorMessage message={error} />}

      <div className="card">
        <h3 className="card-title">1. Danh sách sản phẩm đặt sỉ</h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => {
                const lineTotal = item.quantityKg * item.unitPriceVnd;
                return (
                  <tr key={item.productId}>
                    <td><strong>{item.productName}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                          onClick={() => handleUpdateQty(item.productId, -5)}
                        >
                          -5
                        </button>
                        <strong style={{ minWidth: '40px', textAlign: 'center' }}>
                          {item.quantityKg} kg
                        </strong>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                          onClick={() => handleUpdateQty(item.productId, 5)}
                        >
                          +5
                        </button>
                      </div>
                    </td>
                    <td>{item.unitPriceVnd.toLocaleString('vi-VN')} đ</td>
                    <td><strong>{lineTotal.toLocaleString('vi-VN')} đ</strong></td>
                    <td>
                      <button
                        type="button"
                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                        onClick={() => handleRemoveItem(item.productId)}
                        title="Xóa khỏi giỏ"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">2. Địa chỉ giao hàng (Chi nhánh quán)</h3>
        {addresses.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Đang nạp địa chỉ...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {addresses.map((addr) => (
              <label
                key={addr.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: `1px solid ${selectedAddressId === addr.id ? '#15803d' : '#e2e8f0'}`,
                  background: selectedAddressId === addr.id ? '#f0fdf4' : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="deliveryAddress"
                  value={addr.id}
                  checked={selectedAddressId === addr.id}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                />
                <div>
                  <strong>{addr.label}:</strong> {addr.address}
                  <span className="demo-chip" style={{ marginLeft: 8 }}>Khu vực: {addr.deliveryZone}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">3. Tổng tiền thanh toán dự tính</h3>
        {loadingQuote ? (
          <LoadingSpinner text="Đang tính cước vận chuyển..." />
        ) : quote ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Tiền hàng ({quote.items.reduce((sum, i) => sum + i.quantityKg, 0)} kg):</span>
              <strong>{quote.subtotalVnd.toLocaleString('vi-VN')} đ</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Cước vận chuyển:</span>
                <span className="demo-chip">Dữ liệu demo ước tính</span>
              </span>
              <strong>{quote.shippingFeeVnd.toLocaleString('vi-VN')} đ</strong>
            </div>

            <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 0' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tổng cộng:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#15803d' }}>
                {quote.totalVnd.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        ) : null}

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '10px 14px', borderRadius: '6px', marginTop: 16, fontSize: '0.85rem' }}>
          ⚠️ <strong>Giá và phí được tính lại khi xác nhận đặt hàng.</strong>
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', marginTop: 16, padding: '12px', fontSize: '1rem' }}
          onClick={handlePlaceOrder}
          disabled={submitting || loadingQuote || !quote}
        >
          {submitting ? 'Đang tạo đơn...' : 'Xác Nhận Đặt Hàng Ngay'}
        </button>
      </div>
    </div>
  );
}
