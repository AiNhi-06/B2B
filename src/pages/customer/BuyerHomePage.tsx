import { SupplierStoreCard } from './SupplierStoreCard';
import { StoreProductCard } from './StoreProductCard';
import { featuredProductIds } from '../../mocks/customerMerchandising';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCatalog, money } from '../../components/shared/useCatalog';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';
import { productRatings } from '../../mocks/productRatings';
import { productConditions } from '../../mocks/customerMerchandising';

export function BuyerHomePage() {
  const { products, loading, error, retry } = useCatalog();
  const [activeBanner, setActiveBanner] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);
  useEffect(() => {
    if (bannerPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActiveBanner(current => (current + 1) % 3), 5000);
    return () => window.clearInterval(timer);
  }, [bannerPaused]);
  const [phone, setPhone] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [filter, setFilter] = useState({ distance: '', rating: '', ripeness: '', price: '', category: '', area: '' });
  const areas = [...new Set(products.map(product => product.supplier.regionLabel).filter((value): value is string => Boolean(value)))];
  const filteredProducts = products.filter(product =>
    (!filter.distance || (filter.distance === 'near' ? ['Q1', 'Q3'].includes(product.supplier.regionLabel || '') : filter.distance === 'middle' ? ['Tiền Giang', 'Lâm Đồng'].includes(product.supplier.regionLabel || '') : !['Q1', 'Q3', 'Tiền Giang', 'Lâm Đồng'].includes(product.supplier.regionLabel || ''))) &&
    (!filter.rating || (productRatings[product.commodityId]?.score ?? 0) >= Number(filter.rating)) &&
    (!filter.ripeness || (productConditions[product.id] || '').toLocaleLowerCase('vi').includes(filter.ripeness.toLocaleLowerCase('vi'))) &&
    (!filter.price || (filter.price === 'low' ? product.publicPricePerKg < 30000 : filter.price === 'mid' ? product.publicPricePerKg >= 30000 && product.publicPricePerKg < 60000 : product.publicPricePerKg >= 60000)) &&
    (!filter.category || product.category === filter.category) && (!filter.area || product.supplier.regionLabel === filter.area));
  const banners = [
    { label: 'Nông sản từ nhà vườn', title: <>Tươi đúng độ.<br/>Ngon đúng lúc.</>, description: <>Chọn trái cây, rau củ cho quán.<br/>Biết độ chín trước khi đặt hàng.</>, link: 'Khám phá ngay', href: '/customer/catalog', fruitId: 'mango-cat-hoa-loc', fruitName: 'Xoài Cát Hòa Lộc', fruitState: 'Vừa chín tới', className: 'fresh' },
    { label: 'Nguồn trái cây chọn lọc', title: <>Trái cây tươi.<br/>Chọn đúng mùa.</>, description: <>Khám phá nguồn hàng từ nhà vườn.<br/>Xem giá và tồn kho trong một nơi.</>, link: 'Xem trái cây', href: '/customer/catalog?category=FRESH_FRUIT', fruitId: 'avocado-sap', fruitName: 'Bơ sáp', fruitState: 'Dẻo thơm tự nhiên', className: 'fruit' },
    { label: 'Nguyên liệu cho gian bếp', title: <>Rau củ xanh.<br/>Bếp luôn sẵn sàng.</>, description: <>Tìm rau củ cho thực đơn mỗi ngày.<br/>Đặt hàng dễ dàng cho quán F&B.</>, link: 'Xem rau củ', href: '/customer/catalog?category=VEGETABLES', fruitId: '', fruitName: 'Nông sản theo mùa', fruitState: 'Từ nhà vườn đến quán', className: 'vegetable' },
  ];
  const banner = banners[activeBanner];
  return <>
    <section className="store-showcase" aria-label="Khám phá nông sản">
      <nav className="store-category-menu" aria-label="Danh mục nông sản"><Link to="/customer/catalog?category=VEGETABLES"><span>🥬</span> Rau củ quả <b>›</b></Link><Link to="/customer/catalog?category=FRESH_FRUIT"><span>🥭</span> Trái cây <b>›</b></Link><Link to="/customer/catalog"><span>🧺</span> Tất cả sản phẩm <b>›</b></Link></nav>
      <div className={`store-main-banner store-main-banner-${banner.className}`} aria-label="Banner giới thiệu cửa hàng" aria-roledescription="carousel" onMouseEnter={() => setBannerPaused(true)} onMouseLeave={() => setBannerPaused(false)} onFocusCapture={() => setBannerPaused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setBannerPaused(false); }} onKeyDown={event => { if (event.key === 'ArrowRight') setActiveBanner(current => (current + 1) % banners.length); if (event.key === 'ArrowLeft') setActiveBanner(current => (current + banners.length - 1) % banners.length); }}>
        <div className="store-banner-copy" aria-live="polite"><span>{banner.label}</span><h1>{banner.title}</h1><p>{banner.description}</p><Link to={banner.href}>{banner.link}</Link></div><div className={`store-banner-fruit ${banner.fruitId ? '' : 'store-banner-illustration'}`}>{banner.fruitId ? <FruitPhoto id={banner.fruitId} name={banner.fruitName}/> : <span className="banner-vegetable-art" aria-hidden="true">🥕🥬</span>}<span>{banner.fruitName}<br/><strong>{banner.fruitState}</strong></span></div><div className="store-banner-bottom">FARMGO — Kết nối nhà vườn và quán F&amp;B</div>
        <div className="store-banner-controls" aria-label="Điều khiển banner"><button type="button" className="store-banner-arrow" aria-label="Banner trước" onClick={() => setActiveBanner(current => (current + banners.length - 1) % banners.length)}>‹</button><div className="store-banner-pagination">{banners.map((item, index) => <button key={item.className} type="button" className={index === activeBanner ? 'active' : ''} aria-label={`Chuyển đến banner ${index + 1}: ${item.label}`} aria-current={index === activeBanner ? 'true' : undefined} onClick={() => setActiveBanner(index)}/>)}</div><button type="button" className="store-banner-arrow" aria-label="Banner tiếp theo" onClick={() => setActiveBanner(current => (current + 1) % banners.length)}>›</button></div>
      </div>
      <div className="store-side-banners"><Link to="/customer/catalog?category=FRESH_FRUIT" className="store-promo-fruit"><span>Nguồn hàng cho quán</span><strong>Trái cây tươi<br/>Chọn đúng độ chín</strong><span>Xem danh mục ›</span><span className="promo-illustration" aria-hidden="true">🥑</span></Link><Link to="/customer/catalog?category=VEGETABLES" className="store-promo-veg"><span>Cho bếp mỗi ngày</span><strong>Rau xanh<br/>Tươi ngon</strong><span>Khám phá rau củ ›</span><span className="promo-illustration" aria-hidden="true">🥬</span></Link></div>
    </section>
    <section className="zalo-promo-demo" aria-labelledby="zalo-promo-title">
      <div><span className="zalo-promo-kicker">ƯU ĐÃI FARMGO</span><h2 id="zalo-promo-title">Nhận tin khuyến mãi qua Zalo</h2><p>Đăng ký nhận thông báo ưu đãi nông sản dành cho quán của bạn.</p><small>Mô phỏng demo — không kết nối Zalo thật, số điện thoại không được gửi đi hoặc lưu lại.</small></div>
      <form onSubmit={event => { event.preventDefault(); const normalized = phone.replace(/[\s().-]/g, ''); if (!/^\+?\d{9,12}$/.test(normalized)) { setPhoneError('Vui lòng nhập số điện thoại hợp lệ (9–12 chữ số).'); setSubscribed(false); return; } setPhoneError(''); setSubscribed(true); }}>
        <label htmlFor="zalo-promo-phone">Số điện thoại</label><div className="zalo-promo-input"><input id="zalo-promo-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ví dụ: 0901234567" value={phone} onChange={event => { setPhone(event.target.value); setSubscribed(false); setPhoneError(''); }} aria-describedby="zalo-promo-status"/><button type="submit">Đăng ký nhận tin demo</button></div>
        <div id="zalo-promo-status" aria-live="polite">{phoneError && <span className="zalo-promo-error">{phoneError}</span>}{subscribed && <span className="zalo-promo-success">Đăng ký demo thành công! Tin khuyến mãi mẫu: Ưu đãi nông sản tuần này — xem giá và tồn hàng đang mở bán trên FARMGO.</span>}</div>
      </form>
    </section>
    {!loading && products.some(p => ['strawberry-demo','avocado-sap','watermelon-demo','pineapple-demo'].includes(p.id)) && <section className="store-sale"><div className="sale-heading"><h2>FLASH SALE · Nông sản ưu đãi</h2><span>Giá so sánh mẫu · Mua theo giá hiện tại</span></div><div className="sale-grid">{products.filter(p => ['strawberry-demo','avocado-sap','watermelon-demo','pineapple-demo'].includes(p.id)).map(product => { const original = ({'strawberry-demo':120000,'avocado-sap':45000,'watermelon-demo':16000,'pineapple-demo':20000} as Record<string,number>)[product.id]; return <Link className="sale-product" key={product.id} to={`/customer/products/${product.id}`}><div className="sale-photo"><FruitPhoto id={product.commodityId} name={product.name} imageUrl={product.imageUrl}/>{original > product.publicPricePerKg && <b>-{Math.round((1-product.publicPricePerKg/original)*100)}%</b>}</div><strong>{product.name}</strong><div className="sale-price">{money(product.publicPricePerKg)}/kg {original > product.publicPricePerKg && <del>{money(original)}</del>}</div><small>{product.availableKg > 0 ? `Còn ${product.availableKg} kg` : 'Tạm hết hàng'}</small></Link>; })}</div></section>}
    <section className="home-catalog-section">
      <div className="section-heading"><div><h2>Khám phá nguồn hàng</h2><p>Giá và tồn khả dụng từ dữ liệu demo đang mở bán.</p></div><Link to="/customer/catalog">Xem tất cả</Link></div>
      <div className="catalog-filter-row home-catalog-filters" aria-label="Lọc nguồn hàng"><label>Khoảng cách<select value={filter.distance} onChange={event => setFilter(previous => ({ ...previous, distance: event.target.value }))}><option value="">Tất cả</option><option value="near">Gần (Q1/Q3)</option><option value="middle">Vừa (Tiền Giang/Lâm Đồng)</option><option value="far">Khu vực khác</option></select></label><label>Đánh giá sao<select value={filter.rating} onChange={event => setFilter(previous => ({ ...previous, rating: event.target.value }))}><option value="">Tất cả</option><option value="4">Từ 4 sao</option><option value="4.5">Từ 4,5 sao</option><option value="4.8">Từ 4,8 sao</option></select></label><label>Độ chín<select value={filter.ripeness} onChange={event => setFilter(previous => ({ ...previous, ripeness: event.target.value }))}><option value="">Tất cả</option>{[...new Set(Object.values(productConditions))].map(value => <option key={value} value={value}>{value}</option>)}</select></label><label>Mức giá<select value={filter.price} onChange={event => setFilter(previous => ({ ...previous, price: event.target.value }))}><option value="">Tất cả</option><option value="low">Dưới 30.000đ/kg</option><option value="mid">30.000–59.999đ/kg</option><option value="high">Từ 60.000đ/kg</option></select></label><label>Danh mục<select value={filter.category} onChange={event => setFilter(previous => ({ ...previous, category: event.target.value }))}><option value="">Tất cả</option><option value="FRESH_FRUIT">Trái cây tươi</option><option value="VEGETABLES">Rau củ quả</option></select></label><label>Phường/Xã<select value={filter.area} onChange={event => setFilter(previous => ({ ...previous, area: event.target.value }))}><option value="">Tất cả khu vực</option>{areas.map(value => <option key={value} value={value}>{value}</option>)}</select></label></div>
      {!loading && <p className="result-count">{filteredProducts.length} mặt hàng phù hợp</p>}
      {error && <ErrorMessage message={error} onRetry={retry} />}{loading ? <LoadingSpinner /> : filteredProducts.length ? <div className="market-grid home-market-grid">{filteredProducts.sort((a,b) => { const rank = (id: string) => { const index = featuredProductIds.indexOf(id); return index < 0 ? 99 : index; }; return rank(a.id) - rank(b.id); }).slice(0, 16).map(product => <StoreProductCard key={product.id} product={product}/>)}</div> : <div className="empty-panel"><h2>Không có mặt hàng phù hợp</h2><p>Thử chọn lại bộ lọc để xem thêm nguồn hàng.</p><button className="btn-secondary" onClick={() => setFilter({ distance: '', rating: '', ripeness: '', price: '', category: '', area: '' })}>Xóa bộ lọc</button></div>}
    </section>
    <section className="store-suppliers"><h2>Khám phá <span>nhà cung cấp</span> dành riêng cho bạn!</h2><div className="supplier-grid">{[...new Map(products.map(product => [product.supplier.id, product.supplier])).values()].map(supplier => <SupplierStoreCard key={supplier.id} supplier={supplier} products={products.filter(product => product.supplierId === supplier.id)}/>)}</div></section>
    <footer className="store-footer">
      <div className="store-footer-main">
        <section className="store-footer-brand" aria-label="Thông tin FARMGO">
          <Link className="store-footer-logo" to="/customer" aria-label="FARMGO — Trang chủ">
            <img src="/farmgo-logo.png" alt="FARMGO" />
            <span>Nguồn hàng cho F&B</span>
          </Link>
          <h2>Kết nối với chúng tôi</h2>
          <p>Nguồn nông sản từ nhà vườn, dành cho gian bếp chuyên nghiệp.</p>
        </section>

        <section className="store-footer-column">
          <h2>Hỗ trợ khách hàng</h2>
          <div className="store-footer-contact">
            <span>Tư vấn đặt hàng</span>
            <strong>1900 0000</strong>
            <small>Thông tin liên hệ mẫu</small>
          </div>
          <div className="store-footer-contact">
            <span>Hỗ trợ và góp ý</span>
            <strong>hotro@farmgo.example</strong>
            <small>Thông tin liên hệ mẫu</small>
          </div>
          <Link to="/customer/claims">Gửi yêu cầu hỗ trợ</Link>
        </section>

        <section className="store-footer-column">
          <h2>Về FARMGO</h2>
          <p>Nền tảng kết nối nguồn cung nông sản với nhà hàng và quán F&amp;B.</p>
          <Link to="/customer/catalog">Khám phá nguồn hàng</Link>
          <Link to="/supplier">Dành cho nhà cung cấp</Link>
        </section>

        <section className="store-footer-column">
          <h2>Thông tin</h2>
          <Link to="/customer/catalog">Danh mục sản phẩm</Link>
          <Link to="/customer/orders">Đơn hàng của tôi</Link>
          <Link to="/customer/profile">Hồ sơ doanh nghiệp</Link>
          <Link to="/customer/finance">Tài chính và đối soát</Link>
        </section>

        <section className="store-footer-column store-footer-partners">
          <h2>Thanh toán</h2>
          <div className="store-footer-logos" aria-label="Các phương thức thanh toán mô phỏng">
            <span className="store-footer-logo-tile store-footer-logo-bank" aria-label="Chuyển khoản ngân hàng">BANK</span>
            <span className="store-footer-logo-tile store-footer-logo-cod" aria-label="Thanh toán khi nhận hàng">COD</span>
            <span className="store-footer-logo-tile"><img src="/partner-logos/momo.svg" alt="MoMo" /></span>
            <span className="store-footer-logo-tile"><img src="/partner-logos/zalopay.png" alt="ZaloPay" /></span>
          </div>
          <h2 className="store-footer-shipping-title">Đơn vị giao nhận</h2>
          <div className="store-footer-logos" aria-label="Đơn vị giao nhận mô phỏng">
            <span className="store-footer-logo-tile store-footer-ghn"><img src="/partner-logos/ghn.png" alt="" /><b>GHN</b></span>
            <span className="store-footer-logo-tile store-footer-ghtk"><img src="/partner-logos/ghtk.svg" alt="GHTK" /></span>
          </div>
          <small className="store-footer-simulation-note">Thanh toán và giao nhận mô phỏng</small>
        </section>
      </div>
      <div className="store-footer-bottom">
        <span>© FARMGO · Kết nối nhà vườn và quán F&amp;B</span>
        <span>Thông tin liên hệ mẫu</span>
      </div>
    </footer>
  </>;
}
