import { ProductCondition } from './ProductCondition';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { useCatalog, money, categoryLabels } from '../../components/shared/useCatalog';
import { useBuyerCart } from '../../components/shared/useBuyerCart';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { productRatings } from '../../mocks/productRatings';
import { productConditions } from '../../mocks/customerMerchandising';

export function CatalogPage() {
  const { products, loading, error, retry } = useCatalog();
  const cart = useBuyerCart();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState('name');
  const supplier = params.get('supplier') || '';
  const setSupplier = (value: string) => setFilter('supplier', value);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');
  const [distance, setDistance] = useState('');
  const [rating, setRating] = useState('');
  const [ripeness, setRipeness] = useState('');
  const [priceBand, setPriceBand] = useState('');
  const [area, setArea] = useState('');
  const category = params.get('category') || '';
  const query = params.get('q') || '';
  const use = params.get('use') || '';
  const setFilter = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next); };
  const suppliers = [...new Map(products.map(product => [product.supplier.id, product.supplier])).values()];
  const areas = [...new Set(products.map(product => product.supplier.regionLabel).filter((value): value is string => Boolean(value)))];
  const visible = products.filter(product => (!category || product.category === category) && (!supplier || product.supplierId === supplier) &&
    (!rating || (productRatings[product.commodityId]?.score ?? 0) >= Number(rating)) &&
    (!ripeness || (productConditions[product.id] || '').toLocaleLowerCase('vi').includes(ripeness.toLocaleLowerCase('vi'))) &&
    (!priceBand || (priceBand === 'low' ? product.publicPricePerKg < 30000 : priceBand === 'mid' ? product.publicPricePerKg >= 30000 && product.publicPricePerKg < 60000 : product.publicPricePerKg >= 60000)) &&
    (!area || product.supplier.regionLabel === area) &&
    (!distance || (distance === 'near' ? ['Q1', 'Q3'].includes(product.supplier.regionLabel || '') : distance === 'middle' ? ['Tiền Giang', 'Lâm Đồng'].includes(product.supplier.regionLabel || '') : !['Q1', 'Q3', 'Tiền Giang', 'Lâm Đồng'].includes(product.supplier.regionLabel || ''))) &&
    (!use || (use === 'DRINKS' ? product.uses.some(value => ['JUICE', 'SMOOTHIE'].includes(value)) : product.uses.includes(use as 'JUICE'))) &&
    `${product.name} ${product.supplier.name} ${product.originLabel || ''}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))
    .sort((a, b) => sort === 'price-up' ? a.publicPricePerKg - b.publicPricePerKg : sort === 'price-down' ? b.publicPricePerKg - a.publicPricePerKg : a.name.localeCompare(b.name, 'vi'));
  return <>
    <div className="page-heading"><div><h1>Danh mục nguyên liệu</h1><p>Chọn đúng mặt hàng, đúng nhà cung cấp cho quán.</p></div><Link className="btn-primary" to="/customer/checkout">Giỏ hàng ({cart.items.length})</Link></div>
    <div className="catalog-tabs" aria-label="Nhóm sản phẩm">{[['', 'Tất cả'], ['FRESH_FRUIT', 'Trái cây tươi'], ['VEGETABLES', 'Rau củ quả']].map(([value, label]) => <button key={value} className={category === value ? 'active' : ''} onClick={() => setFilter('category', value)}>{label}</button>)}<button className={use === 'DRINKS' ? 'active' : ''} onClick={() => setFilter('use', use === 'DRINKS' ? '' : 'DRINKS')}>Nguyên liệu pha chế</button></div>
    <div className="catalog-filter-row" aria-label="Bộ lọc sản phẩm">
      <label>Khoảng cách<select value={distance} onChange={event => setDistance(event.target.value)}><option value="">Tất cả</option><option value="near">Gần (Q1/Q3)</option><option value="middle">Vừa (Tiền Giang/Lâm Đồng)</option><option value="far">Xa (khu vực khác)</option></select></label>
      <label>Đánh giá sao<select value={rating} onChange={event => setRating(event.target.value)}><option value="">Tất cả</option><option value="4">Từ 4 sao</option><option value="4.5">Từ 4,5 sao</option><option value="4.8">Từ 4,8 sao</option></select></label>
      <label>Độ chín<select value={ripeness} onChange={event => setRipeness(event.target.value)}><option value="">Tất cả</option>{[...new Set(Object.values(productConditions))].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Mức giá<select value={priceBand} onChange={event => setPriceBand(event.target.value)}><option value="">Tất cả</option><option value="low">Dưới 30.000đ/kg</option><option value="mid">30.000–59.999đ/kg</option><option value="high">Từ 60.000đ/kg</option></select></label>
      <label>Danh mục<select value={category} onChange={event => setFilter('category', event.target.value)}><option value="">Tất cả</option><option value="FRESH_FRUIT">Trái cây tươi</option><option value="VEGETABLES">Rau củ quả</option></select></label>
      <label>Phường/Xã<select value={area} onChange={event => setArea(event.target.value)}><option value="">Tất cả khu vực</option>{areas.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
    </div>
    <div className="catalog-toolbar"><label>Tìm sản phẩm<input type="search" placeholder="Tên hàng, vùng trồng, nhà cung cấp…" value={query} onChange={event => setFilter('q', event.target.value)} /></label>
      <label>Nhà cung cấp<select value={supplier} onChange={event => setSupplier(event.target.value)}><option value="">Tất cả nhà cung cấp</option>{suppliers.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
      <label>Sắp xếp<select value={sort} onChange={event => setSort(event.target.value)}><option value="name">Theo tên</option><option value="price-up">Giá tăng dần</option><option value="price-down">Giá giảm dần</option></select></label></div>
    {(error || cart.error) && <ErrorMessage message={error || cart.error!} onRetry={retry} />}
    {loading ? <LoadingSpinner /> : <><p className="result-count">{visible.length} báo giá phù hợp · Giá công khai từ nhà cung cấp</p>
      {visible.length === 0 && <div className="empty-panel"><h2>Chưa tìm thấy mặt hàng</h2><p>Thử đổi từ khóa hoặc bộ lọc.</p><button className="btn-secondary" onClick={() => { setParams({}); setDistance(''); setRating(''); setRipeness(''); setPriceBand(''); setArea(''); }}>Xóa bộ lọc</button></div>}
      <div className="market-grid">{visible.map(product => { const qty = amounts[product.id] ?? 10; const count = products.filter(item => item.commodityId === product.commodityId).length;
        return <article key={product.id} className="market-card"><Link to={`/customer/products/${product.id}`} className="product-photo-link" aria-label={`Chi tiết ${product.name} từ ${product.supplier.name}`}><FruitPhoto id={product.commodityId} name={product.name} imageUrl={product.imageUrl} /></Link>
          <div className="market-card-body"><span className="product-category">{categoryLabels[product.category]}</span><h2><Link to={`/customer/products/${product.id}`}>{product.name}</Link></h2><ProductCondition id={product.id}/>
            <p className="supplier-name">{product.supplier.name}</p><p className="product-origin">{product.originLabel || product.supplier.regionLabel || 'Chưa có vùng trồng'}{product.packagingLabel ? ` · ${product.packagingLabel}` : ''}</p>
            <div className="market-price">{money(product.publicPricePerKg)}<small>/kg</small></div><span className="stock-label">{product.availableKg > 0 ? `Còn ${product.availableKg.toLocaleString('vi-VN')} kg` : 'Tạm hết hàng'}</span>
            <div className="product-buy"><label className="sr-only" htmlFor={`qty-${product.id}`}>Số kg {product.name} từ {product.supplier.name}</label><input id={`qty-${product.id}`} type="number" min={1} max={product.availableKg} step={1} disabled={product.availableKg === 0} value={qty} onChange={event => setAmounts(previous => ({ ...previous, [product.id]: Number(event.target.value) }))} />
              <button className="btn-primary" disabled={!cart.ready || product.availableKg === 0 || !Number.isSafeInteger(qty) || qty < 1 || qty > product.availableKg} onClick={() => { if (cart.add(product.id, qty)) setMessage(`Đã thêm ${qty} kg ${product.name} — ${product.supplier.name}`); }}>Thêm vào giỏ</button></div>
            {count > 1 && <Link className="compare-link" to={`/customer/products/${product.id}#suppliers`}>So sánh {count} nhà cung cấp</Link>}
          </div></article>;
      })}</div></>}
    {message && <div className="cart-toast" role="status"><span>{message}</span><button aria-label="Đóng thông báo" onClick={() => setMessage('')}>×</button></div>}
  </>;
}
