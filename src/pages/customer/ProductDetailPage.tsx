import { calculateTrueCost } from '../../services/demoService';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog, money, categoryLabels, useLabels } from '../../components/shared/useCatalog';
import { useBuyerCart } from '../../components/shared/useBuyerCart';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
export function ProductDetailPage() {
  const { id } = useParams();
  const { products, loading, error, retry } = useCatalog();
  const cart = useBuyerCart();
  const [quantity, setQuantity] = useState(10);
  const [message, setMessage] = useState('');
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={retry} />;
  const product = products.find(item => item.id === id);
  if (!product) return <div className="empty-panel"><h1>Sản phẩm chưa mở bán</h1><p>Sản phẩm có thể đã được ẩn hoặc chưa phân nhóm.</p><Link to="/customer/catalog">Quay lại danh mục</Link></div>;
  const peers = products.filter(item => item.commodityId === product.commodityId);
  return <><Link className="back-link" to="/customer/catalog">Quay lại danh mục</Link>
    <section className="product-detail"><FruitPhoto id={product.commodityId} name={product.name} imageUrl={product.imageUrl} /><div><span className="product-category">{categoryLabels[product.category]}</span><h1>{product.name}</h1><p className="supplier-name">{product.supplier.name}</p><div className="detail-facts"><div><span>Vùng trồng</span><strong>{product.originLabel || product.supplier.regionLabel || 'Chưa cung cấp'}</strong></div><div><span>Đóng gói</span><strong>{product.packagingLabel || 'Chưa cung cấp quy cách'}</strong></div><div><span>Công dụng</span><strong>{product.uses.map(use => useLabels[use]).join(', ') || 'Chưa bổ sung'}</strong></div><div><span>Tồn khả dụng</span><strong>{product.availableKg.toLocaleString('vi-VN')} kg</strong></div></div>
      <p className="governance-badge">{product.qc?.status === 'APPROVED' ? `QC demo ${product.qc.grade} · Yield ${product.qc.yieldPercent}% · Brix ${product.qc.brix ?? 'không khai'}` : 'Demo cũ — chưa thẩm định'}</p><p>{calculateTrueCost(product.publicPricePerKg, quantity, product.qc) ? `True-Cost: ${money(calculateTrueCost(product.publicPricePerKg, quantity, product.qc)!.costPerUsableKg)} /kg dùng được · ${calculateTrueCost(product.publicPricePerKg, quantity, product.qc)!.usableKg.toLocaleString('vi-VN')} kg dùng được` : 'Chưa có Yield được duyệt để tính True-Cost.'}</p><div className="detail-price">{money(product.publicPricePerKg)} <small>/kg</small></div><p>Giá công khai do nhà cung cấp khai báo. Phí giao được tính riêng khi xác nhận đơn.</p>
      <label htmlFor="detail-qty">Số lượng (kg)</label><div className="product-buy"><input id="detail-qty" type="number" min={1} max={product.availableKg} step={1} value={quantity} onChange={event => setQuantity(Number(event.target.value))} /><button className="btn-primary" disabled={!cart.ready || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > product.availableKg} onClick={() => { if (cart.add(product.id, quantity)) setMessage('Đã thêm vào giỏ hàng.'); }}>Thêm vào giỏ hàng</button></div>{cart.error && <ErrorMessage message={cart.error} />}{message && <p role="status">{message} <Link to="/customer/checkout">Xem giỏ hàng</Link></p>}
    </div></section>
    <section id="suppliers" className="card"><h2>So sánh nhà cung cấp</h2><p>Cùng mặt hàng, mỗi báo giá có tồn kho và nguồn cung riêng.</p><div className="table-responsive"><table className="data-table"><thead><tr><th>Nhà cung cấp</th><th>Vùng trồng</th><th>Giá /kg</th><th>True-Cost /kg dùng được</th><th>Tồn</th><th></th></tr></thead><tbody>{peers.map(peer => <tr key={peer.id}><td>{peer.supplier.name}</td><td>{peer.originLabel || 'Chưa cung cấp'}</td><td><strong>{money(peer.publicPricePerKg)}</strong></td><td>{calculateTrueCost(peer.publicPricePerKg,1,peer.qc) ? money(calculateTrueCost(peer.publicPricePerKg,1,peer.qc)!.costPerUsableKg) : 'Chưa có Yield duyệt'}</td><td>{peer.availableKg} kg</td><td>{peer.id === id ? 'Đang xem' : <Link to={`/customer/products/${peer.id}`}>Xem báo giá</Link>}</td></tr>)}</tbody></table></div></section>
  </>;
}
