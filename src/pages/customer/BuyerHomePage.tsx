import { SupplierStoreCard } from './SupplierStoreCard';
import { StoreProductCard } from './StoreProductCard';
import { featuredProductIds } from '../../mocks/customerMerchandising';
import { Link } from 'react-router-dom';
import { useCatalog, money } from '../../components/shared/useCatalog';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';

export function BuyerHomePage() {
  const { products, loading, error, retry } = useCatalog();
  return <>
    <section className="store-showcase" aria-label="Khám phá nông sản">
      <nav className="store-category-menu" aria-label="Danh mục nông sản"><Link to="/customer/catalog?category=VEGETABLES"><span>🥬</span> Rau củ quả <b>›</b></Link><Link to="/customer/catalog?category=FRESH_FRUIT"><span>🥭</span> Trái cây <b>›</b></Link><Link to="/customer/catalog"><span>🧺</span> Tất cả sản phẩm <b>›</b></Link></nav>
      <div className="store-main-banner"><div className="store-banner-copy"><span>Nông sản từ nhà vườn</span><h1>Tươi đúng độ.<br/>Ngon đúng lúc.</h1><p>Chọn trái cây, rau củ cho quán.<br/>Biết độ chín trước khi đặt hàng.</p><Link to="/customer/catalog">Khám phá ngay</Link></div><div className="store-banner-fruit"><FruitPhoto id="mango-cat-hoa-loc" name="Xoài Cát Hòa Lộc"/><span>Xoài Cát Hòa Lộc<br/><strong>Vừa chín tới</strong></span></div><div className="store-banner-bottom">FARMGO — Kết nối nhà vườn và quán F&B</div></div>
      <div className="store-side-banners"><Link to="/customer/catalog?category=FRESH_FRUIT" className="store-promo-fruit"><span>Nguồn hàng cho quán</span><strong>Trái cây tươi<br/>Chọn đúng độ chín</strong><span>Xem danh mục ›</span><span className="promo-illustration" aria-hidden="true">🥑</span></Link><Link to="/customer/catalog?category=VEGETABLES" className="store-promo-veg"><span>Cho bếp mỗi ngày</span><strong>Rau xanh<br/>Tươi ngon</strong><span>Khám phá rau củ ›</span><span className="promo-illustration" aria-hidden="true">🥬</span></Link></div>
    </section>
    {!loading && products.some(p => ['strawberry-demo','avocado-sap','watermelon-demo','pineapple-demo'].includes(p.id)) && <section className="store-sale"><div className="sale-heading"><h2>FLASH SALE · Nông sản ưu đãi</h2><span>Giá so sánh mẫu · Mua theo giá hiện tại</span></div><div className="sale-grid">{products.filter(p => ['strawberry-demo','avocado-sap','watermelon-demo','pineapple-demo'].includes(p.id)).map(product => { const original = ({'strawberry-demo':120000,'avocado-sap':45000,'watermelon-demo':16000,'pineapple-demo':20000} as Record<string,number>)[product.id]; return <Link className="sale-product" key={product.id} to={`/customer/products/${product.id}`}><div className="sale-photo"><FruitPhoto id={product.commodityId} name={product.name} imageUrl={product.imageUrl}/>{original > product.publicPricePerKg && <b>-{Math.round((1-product.publicPricePerKg/original)*100)}%</b>}</div><strong>{product.name}</strong><div className="sale-price">{money(product.publicPricePerKg)}/kg {original > product.publicPricePerKg && <del>{money(original)}</del>}</div><small>{product.availableKg > 0 ? `Còn ${product.availableKg} kg` : 'Tạm hết hàng'}</small></Link>; })}</div></section>}
    <section className="store-suppliers"><h2>Khám phá <span>nhà cung cấp</span> dành riêng cho bạn!</h2><div className="supplier-grid">{[...new Map(products.map(product => [product.supplier.id, product.supplier])).values()].map(supplier => <SupplierStoreCard key={supplier.id} supplier={supplier} products={products.filter(product => product.supplierId === supplier.id)}/>)}</div></section>
    <div className="section-heading"><div><h2>Khám phá nguồn hàng</h2><p>Giá và tồn khả dụng từ dữ liệu demo đang mở bán.</p></div><Link to="/customer/catalog">Xem tất cả</Link></div>
    {error && <ErrorMessage message={error} onRetry={retry} />}{loading ? <LoadingSpinner /> : <div className="market-grid home-market-grid">{[...products].sort((a,b) => { const rank = (id: string) => { const index = featuredProductIds.indexOf(id); return index < 0 ? 99 : index; }; return rank(a.id) - rank(b.id); }).slice(0, 16).map(product => <StoreProductCard key={product.id} product={product}/>)}</div>}
    <footer className="store-footer"><strong>FARMGO · Nguồn hàng cho F&B</strong><div><Link to="/customer/finance">Tiền & đối soát demo</Link><Link to="/customer/claims">Khiếu nại & phản hồi</Link><Link to="/customer/profile">Hồ sơ doanh nghiệp</Link></div></footer>
  </>;
}
