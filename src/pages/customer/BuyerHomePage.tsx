import { Link } from 'react-router-dom';
import { useCatalog, money } from '../../components/shared/useCatalog';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';

export function BuyerHomePage() {
  const { products, loading, error, retry } = useCatalog();
  return <>
    <section className="buyer-hero"><div className="buyer-hero-copy"><span className="hero-kicker">Nguồn hàng cho chuỗi F&B</span><h1>Nguyên liệu tươi.<br />Chọn từ đúng nguồn.</h1><p>Rau củ, trái cây và nguyên liệu pha chế từ nhiều nhà cung cấp. Xem giá công khai, so sánh nguồn hàng và đặt theo nhu cầu quán.</p><Link className="btn-primary" to="/customer/catalog">Khám phá danh mục</Link></div>
      <div className="hero-produce" aria-hidden="true"><FruitPhoto id="mango-cat-hoa-loc" name="Xoài" /><span className="hero-stamp">FARMGO<br /><small>Từ nguồn cung đến quán</small></span></div></section>
    <div className="home-categories"><Link to="/customer/catalog?category=FRESH_FRUIT"><span>Trái cây tươi</span><small>Ăn tươi, sinh tố và tráng miệng</small></Link><Link to="/customer/catalog?category=VEGETABLES"><span>Rau củ quả</span><small>Nguyên liệu cho bếp & salad</small></Link><Link to="/customer/catalog?use=DRINKS"><span>Nguyên liệu pha chế</span><small>Lọc mặt hàng dùng cho nước ép, sinh tố</small></Link></div>
    <div className="section-heading"><div><h2>Khám phá nguồn hàng</h2><p>Giá và tồn khả dụng từ dữ liệu demo đang mở bán.</p></div><Link to="/customer/catalog">Xem tất cả</Link></div>
    {error && <ErrorMessage message={error} onRetry={retry} />}{loading ? <LoadingSpinner /> : <div className="market-grid home-market-grid">{products.slice(0, 4).map(product => <Link key={product.id} className="market-card home-product" to={`/customer/products/${product.id}`}><FruitPhoto id={product.commodityId} name={product.name} imageUrl={product.imageUrl} /><div className="market-card-body"><h3>{product.name}</h3><p>{product.supplier.name}</p><strong>{money(product.publicPricePerKg)} /kg</strong></div></Link>)}</div>}
    <div className="section-heading"><div><h2>Nhà cung cấp trên FARMGO</h2><p>Khám phá mặt hàng của từng nguồn cung.</p></div></div>
    <div className="supplier-grid">{[...new Map(products.map(product => [product.supplier.id, product.supplier])).values()].map(supplier => <div className="supplier-card" key={supplier.id}><div className="supplier-initial" aria-hidden="true">{supplier.name.charAt(0)}</div><h3>{supplier.name}</h3><p>{supplier.regionLabel || 'Chưa có thông tin khu vực'}</p><span>{products.filter(product => product.supplierId === supplier.id).length} mặt hàng đang bán</span><Link to={`/customer/catalog?q=${encodeURIComponent(supplier.name)}`}>Xem mặt hàng</Link></div>)}</div>
  </>;
}
