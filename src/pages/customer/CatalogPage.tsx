import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CustomerProduct } from '../../types';
import { getCustomerCatalog, subscribeDemoData } from '../../services/demoService';
import { FruitImage } from '../../components/shared/FruitImage';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { EmptyState } from '../../components/shared/EmptyState';

export function CatalogPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart quantities map: productId -> kg
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartSuccess, setCartSuccess] = useState<string | null>(null);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomerCatalog();
      setProducts(data);
      const initialQtys: Record<string, number> = {};
      data.forEach((p) => {
        initialQtys[p.id] = initialQtys[p.id] || 10;
      });
      setQuantities(initialQtys);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh mục sản phẩm.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
    const unsub = subscribeDemoData((event) => {
      if (event.type === 'DATA_CHANGED' || event.type === 'SESSION_CHANGED' || event.type === 'RESET') {
        loadCatalog();
      }
    });
    return () => unsub();
  }, []);

  const handleQtyChange = (productId: string, val: number, max: number) => {
    const qty = Math.max(1, Math.min(val, max));
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  const handleAddToCart = (product: CustomerProduct) => {
    const qty = quantities[product.id] || 10;
    const existingRaw = localStorage.getItem('demo-cart-items') || '[]';
    let currentCart: { productId: string; productName: string; quantityKg: number; unitPriceVnd: number }[] = [];
    try {
      currentCart = JSON.parse(existingRaw);
    } catch {
      currentCart = [];
    }

    const foundIdx = currentCart.findIndex((i) => i.productId === product.id);
    if (foundIdx >= 0) {
      currentCart[foundIdx].quantityKg = qty;
    } else {
      currentCart.push({
        productId: product.id,
        productName: product.name,
        quantityKg: qty,
        unitPriceVnd: product.sellingPricePerKg,
      });
    }

    localStorage.setItem('demo-cart-items', JSON.stringify(currentCart));
    setCartSuccess(`Đã thêm ${qty} kg ${product.name} vào đơn đặt hàng.`);
    setTimeout(() => setCartSuccess(null), 3000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Phân phối sỉ nông sản B2B
          </span>
          <h1 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Danh Mục Trái Cây Mở Bán
          </h1>
          <span style={{ fontSize: '0.85rem', color: '#475569' }}>
            Giá bán buôn minh bạch theo sọt, giao tận nơi từ kho Hub lúc 04:00 sáng.
          </span>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate('/customer/checkout')}
          style={{ padding: '8px 16px' }}
        >
          Xem giỏ hàng & Đặt đơn →
        </button>
      </div>

      {cartSuccess && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: '8px', marginBottom: 16, fontWeight: 600 }}>
          {cartSuccess}
        </div>
      )}

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={loadCatalog} />}

      {!loading && !error && products.length === 0 && (
        <EmptyState
          icon="🍉"
          title="Chưa có sản phẩm mở bán"
          description="Hiện tại nhà vườn chưa đăng lô hàng hoặc chưa tới khung giờ mở bán hôm nay."
        />
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid-cards">
          {products.map((p) => {
            const isOutOfStock = p.availableKg <= 0;
            const currentQty = quantities[p.id] || 1;

            return (
              <div key={p.id} className="fruit-listing-card" style={{ opacity: isOutOfStock ? 0.6 : 1 }}>
                <div className="card-fruit-header">
                  <FruitImage id={p.id} name={p.name} size={64} />
                  <div className="card-fruit-meta">
                    <h3 className="fruit-title">{p.name}</h3>
                    <div className="fruit-variety">
                      {p.variety ? `Giống: ${p.variety}` : 'Chuẩn sọt sỉ'}
                    </div>
                  </div>
                  <span className={`badge ${isOutOfStock ? 'badge-placed' : 'badge-delivered'}`}>
                    {isOutOfStock ? 'Hết hàng' : `Còn ${p.availableKg.toLocaleString('vi-VN')} kg`}
                  </span>
                </div>

                <div style={{ padding: '16px', background: '#fafafa' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
                    Giá sỉ công khai
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 12px 0' }}>
                    {p.sellingPricePerKg.toLocaleString('vi-VN')} đ <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>/ kg</span>
                  </div>

                  {!isOutOfStock ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Số lượng:</span>
                        <input
                          type="number"
                          min="1"
                          max={p.availableKg}
                          className="account-dropdown"
                          style={{ width: '80px', textAlign: 'center', padding: '6px' }}
                          value={currentQty}
                          onChange={(e) => handleQtyChange(p.id, Number(e.target.value), p.availableKg)}
                        />
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>kg</span>
                      </div>

                      <button
                        type="button"
                        className="btn-primary"
                        style={{ width: '100%', padding: '9px' }}
                        onClick={() => handleAddToCart(p)}
                      >
                        Thêm {currentQty} kg vào giỏ
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="btn-secondary" style={{ width: '100%' }} disabled>
                      Tạm hết hàng
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
