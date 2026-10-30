import { Link } from 'react-router-dom';
import type { CustomerProduct, SupplierPublicProfile } from '../../types';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { money } from '../../components/shared/useCatalog';

export function SupplierStoreCard({ supplier, products }: { supplier: SupplierPublicProfile; products: CustomerProduct[] }) {
  const vegetables = products.filter(product => product.category === 'VEGETABLES').length;
  const fruit = products.length - vegetables;
  const preview = products.slice(0, 3);
  return <article className="supplier-store-card">
    <div className="supplier-store-awning" aria-hidden="true"/>
    <header><div className="supplier-store-avatar" aria-hidden="true">{supplier.name.charAt(0)}</div><div><h3>{supplier.name}</h3><p>{supplier.regionLabel || 'Chưa có thông tin khu vực'}</p></div><span className="supplier-store-count">{products.length} mặt hàng</span></header>
    <div className="supplier-store-tags">{fruit > 0 && <span>Trái cây · {fruit}</span>}{vegetables > 0 && <span>Rau củ · {vegetables}</span>}</div>
    <div className="supplier-store-preview">{preview.map(product => <Link key={product.id} to={`/customer/products/${product.id}`}><FruitPhoto id={product.commodityId} name={product.name} imageUrl={product.imageUrl}/><span>{product.name}</span><strong>{money(product.publicPricePerKg)}<small>/kg</small></strong></Link>)}</div>
    <footer><span>Giá niêm yết từ nhà cung cấp</span><Link to={`/customer/catalog?supplier=${encodeURIComponent(supplier.id)}`}>Xem gian hàng <span aria-hidden="true">›</span></Link></footer>
  </article>;
}
