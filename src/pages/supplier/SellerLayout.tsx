import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDemoData } from '../../components/shared/useDemoData';
import * as api from '../../services/demoService';
import './seller.css';

export function SellerLayout({ children }: { children: ReactNode }) {
  const state = useDemoData(async () => ({ session: await api.getDemoSession(), suppliers: await api.getSuppliers() }));
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const supplier = state.data?.suppliers.find(item => item.id === state.data?.session.activeSupplierId);
  const links = [
    ['/supplier', '◴', 'Tổng quan & tài chính'],
    ['/supplier/products', '▦', 'Sản phẩm & báo giá'],
    ['/supplier/orders', '▤', 'Xử lý đơn hàng'],
    ['/supplier/reviews', '★', 'Đánh giá & phản hồi'],
    ['/supplier/shipping', '↗', 'Phạm vi phục vụ'],
    ['/supplier/profile', '▣', 'Thông tin nhà vườn'],
  ];
  return <div className="seller-shell"><aside className="seller-sidebar"><Link to="/supplier" className="seller-brand"><img src="/farmgo-logo.png" alt="FARMGO"/><div><strong>FARMGO <em>Seller</em></strong><small>Cổng quản lý nhà cung cấp</small></div></Link><div className="seller-identity"><span>{supplier?.name.charAt(0) || 'N'}</span><div><strong>{supplier?.name || 'Nhà cung cấp'}</strong><small>● Tài khoản mô phỏng</small></div></div><nav aria-label="Điều hướng seller">{links.map(([to,icon,label]) => <NavLink key={to} to={to} end={to === '/supplier'}><span aria-hidden="true">{icon}</span>{label}</NavLink>)}</nav><div className="seller-side-extra"><Link to="/supplier/quality">Chất lượng & QC</Link><Link to="/supplier/claims">Khiếu nại & bồi thường</Link><Link to="/customer">Xem cửa hàng</Link></div><footer>Hệ thống FARMGO B2B<small>Dữ liệu và thao tác mô phỏng</small></footer></aside><div className="seller-workspace"><header className="seller-topbar"><form onSubmit={event => { event.preventDefault(); navigate(`/supplier/products?q=${encodeURIComponent(query.trim())}`); }}><label className="sr-only" htmlFor="seller-search">Tìm sản phẩm hoặc mã SKU</label><input id="seller-search" placeholder="Tìm sản phẩm, mã SKU, báo giá…" value={query} onChange={event => setQuery(event.target.value)}/><button aria-label="Tìm kiếm">⌕</button></form><button className="seller-notify" onClick={() => setNotice('Thông báo mô phỏng: có yêu cầu đặt nông sản mới. Không gửi SMS và không tạo đơn hàng.')}>♧ Giả lập thông báo đơn mới</button><Link className="seller-user" to="/supplier/profile"><span>{supplier?.name.charAt(0) || 'N'}</span><div><strong>{supplier?.name || 'Nhà cung cấp'}</strong><small>{supplier?.regionLabel || 'Hồ sơ doanh nghiệp'}</small></div></Link></header>{notice && <div className="seller-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Đóng thông báo">×</button></div>}{state.error && <p role="alert">{state.error}</p>}<div className="seller-content">{children}</div></div></div>;
}
