import { ProductRating } from './ProductRating';
import { ProductCondition } from './ProductCondition';
import { calculateTrueCost } from '../../services/demoService';
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useCatalog, money, categoryLabels, useLabels } from '../../components/shared/useCatalog';
import { useBuyerCart } from '../../components/shared/useBuyerCart';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { getStoredReviews, subscribeReviews, type CustomerReview } from '../../mocks/productReviews';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loading, error, retry } = useCatalog();
  const cart = useBuyerCart();
  const [quantity, setQuantity] = useState(10);
  const [message, setMessage] = useState('');
  const [reviews, setReviews] = useState<CustomerReview[]>(getStoredReviews);

  useEffect(() => {
    const unsub = subscribeReviews(() => {
      setReviews(getStoredReviews());
    });
    return () => unsub();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={retry} />;
  const product = products.find(item => item.id === id);
  if (!product) return <div className="empty-panel"><h1>Sản phẩm chưa mở bán</h1><p>Sản phẩm có thể đã được ẩn hoặc chưa phân nhóm.</p><Link to="/customer/catalog">Quay lại danh mục</Link></div>;
  const peers = products.filter(item => item.commodityId === product.commodityId);
  const valid = Number.isSafeInteger(quantity) && quantity >= 1 && quantity <= product.availableKg && Number.isSafeInteger(quantity * product.publicPricePerKg);
  const trueCost = valid ? calculateTrueCost(product.publicPricePerKg, quantity, product.qc) : null;
  const productReviews = reviews.filter(r => r.productId === product.id);

  const addToCart = (buyNow: boolean) => {
    if (!valid || !cart.ready) return;
    if (cart.add(product.id, quantity)) {
      if (buyNow) navigate('/customer/checkout');
      else setMessage(`Đã thêm ${quantity} kg ${product.name} vào giỏ hàng.`);
    }
  };

  return (
    <div className="purchase-page">
      <section className="purchase-card" aria-label="Mua sản phẩm">
        <header className="purchase-heading">
          <span>{categoryLabels[product.category]}</span>
          <Link to="/customer/catalog" aria-label="Đóng chi tiết sản phẩm">×</Link>
        </header>

        <div className="purchase-grid">
          <div className="purchase-visual">
            <FruitPhoto id={product.commodityId} name={product.name} imageUrl={product.imageUrl} />
            <aside className="purchase-tip">
              <strong>💡 Gợi ý sử dụng</strong>
              <p>
                {product.qc?.status === 'APPROVED' ? `Tỷ lệ dùng được ${product.qc.yieldPercent}% (QC demo). ` : ''}
                {product.uses.length ? `Phù hợp: ${product.uses.map(use => useLabels[use]).join(', ')}.` : 'Chưa bổ sung thông tin công dụng.'}
              </p>
              <ProductCondition id={product.id} />
            </aside>
          </div>

          <div className="purchase-info">
            <h1>{product.name}</h1>
            <ProductRating id={product.id} />
            <p className="purchase-meta">
              {product.originLabel || product.supplier.regionLabel || 'Chưa có vùng trồng'} <span>•</span> Còn <strong>{product.availableKg.toLocaleString('vi-VN')} kg</strong>
            </p>
            <div className="purchase-price">
              {money(product.publicPricePerKg)} <small>/kg</small>
            </div>
            <div className="purchase-supplier">
              <div>
                <strong>{product.supplier.name}</strong>
                <small>{product.supplier.regionLabel || 'Nhà cung cấp FARMGO'}</small>
              </div>
              <Link to={`/customer/catalog?supplier=${encodeURIComponent(product.supplierId)}`}>Ghé gian hàng</Link>
            </div>

            <label className="purchase-quantity-label" htmlFor="detail-qty">
              Số lượng đặt (tối thiểu 1 kg) *
            </label>
            <div className="purchase-quantity">
              <input
                id="detail-qty"
                type="number"
                min={1}
                max={product.availableKg}
                step={1}
                value={quantity}
                disabled={product.availableKg === 0}
                aria-invalid={!valid}
                onChange={event => {
                  setQuantity(Number(event.target.value));
                  setMessage('');
                }}
              />
              <span>Tạm tính: <strong>{valid ? money(quantity * product.publicPricePerKg) : '—'}</strong></span>
            </div>

            {!valid && (
              <p className="purchase-validation" role="status">
                {product.availableKg === 0 ? 'Sản phẩm tạm hết hàng.' : `Nhập số kg nguyên từ 1 đến ${product.availableKg}.`}
              </p>
            )}

            <div className="purchase-actions">
              <button className="purchase-add" disabled={!cart.ready || !valid} onClick={() => addToCart(false)}>
                Thêm vào giỏ hàng
              </button>
              <button className="purchase-now" disabled={!cart.ready || !valid} onClick={() => addToCart(true)}>
                Mua ngay (Thanh toán)
              </button>
            </div>

            <p className="purchase-note">Phí giao tính tại bước đặt hàng. Thanh toán mô phỏng.</p>
            {cart.error && <ErrorMessage message={cart.error} />}
            {message && (
              <p className="purchase-success" role="status">
                {message} <Link to="/customer/checkout">Xem giỏ hàng</Link>
              </p>
            )}

            <details className="purchase-details">
              <summary>Quy cách & chất lượng</summary>
              <p>Đóng gói: {product.packagingLabel || 'Theo kg'}</p>
              <p>{product.qc?.status === 'APPROVED' ? `QC demo ${product.qc.grade} · Yield ${product.qc.yieldPercent}%` : 'Chưa có QC được duyệt.'}</p>
              {trueCost && <p>Chi phí mỗi kg dùng được: {money(trueCost.costPerUsableKg)}</p>}
            </details>
          </div>
        </div>
      </section>

      {/* --- Đánh giá & phản hồi từ khách hàng B2B --- */}
      <section className="card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Đánh Giá & Phản Hồi Từ Khách Hàng B2B
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Nhận xét thực tế từ các quán nước, nhà hàng đã đặt mua lô hàng này
            </span>
          </div>
          <ProductRating id={product.id} />
        </div>

        {productReviews.length === 0 ? (
          <div style={{ padding: '24px 0', color: '#64748b', fontSize: '0.9rem' }}>
            <p>Chưa có đánh giá chi tiết cho sản phẩm này. Khách hàng đã đặt có thể đánh giá sau khi nhận hàng.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {productReviews.map(rev => (
              <article key={rev.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{rev.customerName}</strong>
                      <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                        ✓ Đã mua hàng
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{rev.customerBusiness}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#f59e0b', fontSize: '0.95rem' }}>{'★'.repeat(rev.rating)}</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                <p style={{ margin: '8px 0', fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.5 }}>
                  {rev.comment}
                </p>

                {rev.tags && rev.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0 10px' }}>
                    {rev.tags.map(t => (
                      <span key={t} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 7px', fontSize: '0.75rem', color: '#475569' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Seller Response Box */}
                {rev.sellerResponse && (
                  <div style={{ background: '#f0fdf4', borderLeft: '3px solid #10b981', padding: '10px 14px', borderRadius: '0 8px 8px 0', marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: '0.85rem' }}>💬</span>
                      <strong style={{ fontSize: '0.82rem', color: '#166534' }}>Phản hồi từ {rev.sellerResponse.responderName}:</strong>
                      <small style={{ fontSize: '0.75rem', color: '#15803d' }}>
                        {new Date(rev.sellerResponse.respondedAt).toLocaleDateString('vi-VN')}
                      </small>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534', lineHeight: 1.45 }}>
                      {rev.sellerResponse.message}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="suppliers" className="card" style={{ marginTop: 24 }}>
        <h2>So sánh nhà cung cấp</h2>
        <p>Cùng mặt hàng, mỗi báo giá có tồn kho và nguồn cung riêng.</p>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nhà cung cấp</th>
                <th>Vùng trồng</th>
                <th>Giá /kg</th>
                <th>True-Cost /kg dùng được</th>
                <th>Tồn</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {peers.map(peer => (
                <tr key={peer.id}>
                  <td>{peer.supplier.name}</td>
                  <td>{peer.originLabel || 'Chưa cung cấp'}</td>
                  <td><strong>{money(peer.publicPricePerKg)}</strong></td>
                  <td>{calculateTrueCost(peer.publicPricePerKg, 1, peer.qc) ? money(calculateTrueCost(peer.publicPricePerKg, 1, peer.qc)!.costPerUsableKg) : 'Chưa có Yield duyệt'}</td>
                  <td>{peer.availableKg} kg</td>
                  <td>{peer.id === id ? 'Đang xem' : <Link to={`/customer/products/${peer.id}`}>Xem báo giá</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
