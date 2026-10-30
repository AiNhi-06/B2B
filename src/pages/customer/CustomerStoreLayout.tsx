import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBuyerCart } from '../../components/shared/useBuyerCart';
import './customer-store.css';

export function CustomerStoreLayout({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const cart = useBuyerCart();
  return <div className="customer-store">
    <div className="store-topbar"><div><span>Nông sản cho quán • Dữ liệu mô phỏng</span><div><Link to="/customer/catalog">Khám phá FARMGO</Link><Link to="/supplier">Dành cho người bán</Link><Link to="/customer/profile">Tài khoản</Link></div></div></div>
    <header className="store-search-header"><Link className="store-logo" to="/customer"><img src="/farmgo-logo.png" alt="FARMGO"/><span>Nguồn hàng cho F&B</span></Link><Link className="store-category-link" to="/customer/catalog"><span aria-hidden="true">▦</span> Danh mục</Link><form role="search" onSubmit={event => { event.preventDefault(); navigate(`/customer/catalog?q=${encodeURIComponent(query.trim())}`); }}><label className="sr-only" htmlFor="store-search">Tìm nguyên liệu</label><input id="store-search" type="search" placeholder="Tìm kiếm sản phẩm, nhà cung cấp" value={query} onChange={event => setQuery(event.target.value)}/><button type="submit" aria-label="Tìm kiếm">⌕</button></form><nav aria-label="Mua sắm"><Link to="/customer/orders">Đơn hàng</Link><Link to="/customer/catalog">Mua nhanh</Link><Link className="store-cart" to="/customer/checkout">Giỏ hàng <b>{cart.items.length}</b></Link></nav></header>
    <div className="store-content">{children}</div>
  </div>;
}
