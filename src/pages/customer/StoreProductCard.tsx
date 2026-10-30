import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CustomerProduct } from '../../types';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { money } from '../../components/shared/useCatalog';
import { useBuyerCart } from '../../components/shared/useBuyerCart';
import { ProductCondition } from './ProductCondition';

export function StoreProductCard({ product }: { product: CustomerProduct }) {
  const cart = useBuyerCart();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  return <article className="market-card">
    <Link to={`/customer/products/${product.id}`} aria-label={`Xem ${product.name}`}><FruitPhoto id={product.commodityId} name={product.name} imageUrl={product.imageUrl}/></Link>
    <div className="market-card-body"><h3><Link to={`/customer/products/${product.id}`}>{product.name}</Link></h3><ProductCondition id={product.id}/>
      <p className="supplier-name">{product.supplier.name}</p><p className="product-origin">{product.originLabel}</p>
      <div className="market-price">{money(product.publicPricePerKg)} <small>/kg</small></div><p className="stock-label">{product.availableKg ? `Còn ${product.availableKg.toLocaleString('vi-VN')} kg` : 'Tạm hết hàng'}</p>
      <div className="product-buy"><label className="sr-only" htmlFor={`home-qty-${product.id}`}>Số kg {product.name}</label><input id={`home-qty-${product.id}`} type="number" min="1" max={product.availableKg} value={quantity} onChange={event => setQuantity(Number(event.target.value))}/><button className="btn-primary" disabled={!cart.ready || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > product.availableKg} onClick={() => { if (cart.add(product.id, quantity)) setMessage(`Đã thêm ${quantity} kg vào giỏ`); }}>Thêm vào giỏ</button></div>
      {(message || cart.error) && <p role="status">{cart.error || message}</p>}
    </div></article>;
}
