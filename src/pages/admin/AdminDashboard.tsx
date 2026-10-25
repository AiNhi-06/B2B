import { useState } from 'react';
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
import { AdminSuppliersPage } from './AdminSuppliersPage';
import { HubProductPhotos } from '../../components/shared/HubProductPhotos';
import * as api from '../../services/demoService';
import { useDemoData } from '../../components/shared/useDemoData';
import { money } from '../../components/shared/useCatalog';
import './admin-dashboard.css';

const navigation = [
  { title: 'Quản trị hệ thống', items: [
    { to: '/admin/approvals', label: 'Duyệt Doanh Nghiệp F&B', mark: '▣' },
    { to: '/admin/suppliers', label: 'Nhà cung cấp', mark: '❋' },
    { to: '/admin/quality', label: 'Kiểm duyệt nhà cung cấp', mark: '◈' },
    { to: '/admin/claims', label: 'Khiếu nại SLA 2h', mark: '⚠' },
    { to: '/admin/shipments', label: 'Đơn hàng & Milk-Run', mark: '▰' },
    { to: '/admin/finance', label: 'Đối soát & Ví Escrow', mark: '₫' },
  ] },
];

const pageTitles: Record<string, string> = {
  '/admin': 'Tổng quan vận hành', '/admin/approvals': 'Duyệt doanh nghiệp',
  '/admin/suppliers': 'Nhà cung cấp', '/admin/quality': 'Kiểm duyệt nhà cung cấp',
  '/admin/claims': 'Khiếu nại', '/admin/orders': 'Đơn hàng',
  '/admin/aggregate': 'Gom nhu cầu', '/admin/shipments': 'Đơn hàng & Milk-Run',
  '/admin/products': 'Danh mục & giá', '/admin/labels': 'Tem sọt',
  '/admin/finance': 'Tiền & đối soát',
};

export function AdminDashboard({ displayName, onSignOut }: { displayName: string; onSignOut: () => void }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? pageTitles['/admin/approvals'];

  return <HubProductPhotos><div className="freso-admin-shell">
    <aside className="admin-console-sidebar">
      <div className="admin-console-brand"><span className="admin-console-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2.7 20 6v5.5c0 5.1-3.4 8.1-8 10.5-4.6-2.4-8-5.4-8-10.5V6l8-3.3Z" stroke="currentColor" strokeWidth="2"/><path d="m8.8 11.8 2.1 2.1 4.4-4.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span><strong>FARMGO <b>HQ</b></strong><small>admin.farmgo.vn · FruitHub</small></span></div>
      <div className="admin-console-profile"><span className="admin-profile-avatar">{displayName.slice(0, 1).toUpperCase()}</span><span className="admin-profile-copy"><strong>{displayName}</strong><small>Head of Operations & QC</small></span><i/><button className="admin-sidebar-signout" onClick={onSignOut} aria-label="Đăng xuất">↗</button></div>
      <nav aria-label="Điều hướng Admin" className="admin-console-nav">
        {navigation.map(group => <section key={group.title} className="admin-nav-group">
          <h2>{group.title}</h2>
          {group.items.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => `admin-console-link${isActive ? ' active' : ''}`}>
            <span className="admin-link-mark">{item.mark}</span><span>{item.label}</span>
          </NavLink>)}
        </section>)}
      </nav>
      <div className="admin-sidebar-foot"><div><span>FARMGO Engine</span><strong><i/> MÔ PHỎNG</strong></div><div><span>Chế độ</span><strong>Mô phỏng</strong></div><small>Không kết nối dịch vụ thật</small></div>
    </aside>
    <section className="admin-console-main">
      <header className="admin-console-topbar"><div className="admin-topbar-inner"><div className="admin-topbar-crumb"><span>⌁ CENTRAL SYSTEM</span><i>/</i><strong>{title}</strong></div><AdminTopbarActions/></div></header>
      <main className="admin-console-content"><div className="admin-page-wrapper"><Routes>
        <Route path="finance" element={<FinancePage/>}/><Route path="claims" element={<ClaimsPage/>}/>
        <Route path="quality" element={<QualityPage/>}/><Route path="approvals" element={<ApprovalsPage/>}/>
        <Route index element={<Navigate to="/admin/approvals" replace/>}/><Route path="products" element={<PricingPage/>}/>
        <Route path="suppliers" element={<AdminSuppliersPage/>}/><Route path="orders" element={<AdminOrdersPage/>}/>
        <Route path="aggregate" element={<AggregatePage/>}/><Route path="labels" element={<LabelsPage/>}/>
        <Route path="shipments" element={<ShipmentsPage/>}/><Route path="*" element={<Navigate to="/admin" replace/>}/>
      </Routes></div></main>
    </section>
  </div></HubProductPhotos>;
}

function AdminTopbarActions() {
  const state = useDemoData(api.getFinance);
  const [batchMessage, setBatchMessage] = useState('');
  const escrowVnd = state.data?.allocations.filter(allocation => allocation.status === 'HELD').reduce((total, allocation) => total + allocation.goodsVnd - allocation.refundedVnd, 0) ?? 0;
  const runBatch = async () => {
    setBatchMessage('');
    const success = await state.run(async () => {
      const demand = await api.aggregateDemand();
      setBatchMessage(`Đã gom nhu cầu thành ${demand.length} nhóm.`);
    });
    if (!success) setBatchMessage('');
  };

  return <div className="admin-topbar-actions">
    <div className="admin-escrow-chip"><i/>Tổng tiền hàng đang giữ: <strong>{state.data ? money(escrowVnd) : 'Đang tải…'}</strong></div>
    <button className="admin-batch-button" onClick={() => void runBatch()} disabled={state.busy}>⚡ Chạy Batch 21h00</button>
    {(state.error || batchMessage) && <span className={state.error ? 'admin-topbar-feedback is-error' : 'admin-topbar-feedback'} role="status">{state.error || batchMessage}</span>}
  </div>;
}
