import { NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FinancePage } from '../FinancePage';
import { ApprovalsPage } from './ApprovalsPage';
import { QualityPage } from '../QualityPage';
import { ClaimsPage } from '../ClaimsPage';
import { PricingPage } from './PricingPage';
import { AdminOrdersPage } from './AdminOrdersPage';
import { AggregatePage } from './AggregatePage';
import { LabelsPage } from './LabelsPage';
import { ShipmentsPage } from './ShipmentsPage';
import { AdminOverviewPage } from './AdminOverviewPage';
import { AdminSuppliersPage } from './AdminSuppliersPage';
import { HubProductPhotos } from '../../components/shared/HubProductPhotos';
import { DemoClock } from '../../components/shared/DemoClock';
import './admin-dashboard.css';

const navigation = [
  { title: 'Quản trị hệ thống', items: [
    { to: '/admin/approvals', label: 'Duyệt doanh nghiệp', mark: 'DU' },
    { to: '/admin/suppliers', label: 'Nhà cung cấp', mark: 'NCC' },
    { to: '/admin/quality', label: 'Chất lượng & QC', mark: 'QC' },
    { to: '/admin/claims', label: 'Khiếu nại', mark: 'KN' },
  ] },
  { title: 'Vận hành Hub', items: [
    { to: '/admin', label: 'Tổng quan', mark: 'OV', end: true },
    { to: '/admin/orders', label: 'Đơn hàng', mark: 'DH' },
    { to: '/admin/aggregate', label: 'Gom nhu cầu', mark: 'Σ' },
    { to: '/admin/shipments', label: 'Điều phối chuyến', mark: 'VC' },
    { to: '/admin/products', label: 'Danh mục & giá', mark: 'SP' },
    { to: '/admin/labels', label: 'Tem sọt demo', mark: 'TM' },
    { to: '/admin/finance', label: 'Tiền & đối soát', mark: '₫' },
  ] },
];

const pageTitles: Record<string, string> = {
  '/admin': 'Tổng quan vận hành', '/admin/approvals': 'Duyệt doanh nghiệp',
  '/admin/suppliers': 'Nhà cung cấp', '/admin/quality': 'Chất lượng & QC',
  '/admin/claims': 'Khiếu nại', '/admin/orders': 'Đơn hàng',
  '/admin/aggregate': 'Gom nhu cầu', '/admin/shipments': 'Điều phối chuyến',
  '/admin/products': 'Danh mục & giá', '/admin/labels': 'Tem sọt demo',
  '/admin/finance': 'Tiền & đối soát',
};

export function AdminDashboard({ displayName, onSignOut }: { displayName: string; onSignOut: () => void }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? 'Tổng quan vận hành';

  return <HubProductPhotos><div className="freso-admin-shell">
    <aside className="admin-console-sidebar">
      <div className="admin-console-brand"><span className="admin-console-mark">F</span><span><strong>FRESO <b>HQ</b></strong><small>admin.freso.vn · FruitHub</small></span></div>
      <div className="admin-console-profile"><span className="admin-profile-avatar">{displayName.slice(0, 1).toUpperCase()}</span><span><strong>{displayName}</strong><small>Quản trị demo</small></span><i/></div>
      <nav aria-label="Điều hướng Admin" className="admin-console-nav">
        {navigation.map(group => <section key={group.title} className="admin-nav-group">
          <h2>{group.title}</h2>
          {group.items.map(item => <NavLink key={item.to} to={item.to} end={'end' in item ? item.end : false} className={({ isActive }) => `admin-console-link${isActive ? ' active' : ''}`}>
            <span className="admin-link-mark">{item.mark}</span><span>{item.label}</span>
          </NavLink>)}
        </section>)}
      </nav>
      <div className="admin-sidebar-foot"><div><span>FRESO Engine API</span><strong><i/> DEMO ONLINE</strong></div><div><span>Trạng thái phiên</span><strong>Đang hoạt động</strong></div><small>Dữ liệu giả lập · lưu trên trình duyệt</small></div>
    </aside>
    <section className="admin-console-main">
      <header className="admin-console-topbar"><div className="admin-topbar-crumb"><span>CENTRAL SYSTEM</span><i>/</i><strong>{title}</strong></div><DemoClock/><div className="admin-topbar-user"><span>{displayName.slice(0, 1).toUpperCase()}</span><strong>{displayName}<small>Quản trị demo</small></strong><button onClick={onSignOut}>Đăng xuất</button></div></header>
      <main className="admin-console-content"><Routes>
        <Route path="finance" element={<FinancePage/>}/><Route path="claims" element={<ClaimsPage/>}/>
        <Route path="quality" element={<QualityPage/>}/><Route path="approvals" element={<ApprovalsPage/>}/>
        <Route index element={<AdminOverviewPage/>}/><Route path="products" element={<PricingPage/>}/>
        <Route path="suppliers" element={<AdminSuppliersPage/>}/><Route path="orders" element={<AdminOrdersPage/>}/>
        <Route path="aggregate" element={<AggregatePage/>}/><Route path="labels" element={<LabelsPage/>}/>
        <Route path="shipments" element={<ShipmentsPage/>}/><Route path="*" element={<Navigate to="/admin" replace/>}/>
      </Routes></main>
    </section>
  </div></HubProductPhotos>;
}
