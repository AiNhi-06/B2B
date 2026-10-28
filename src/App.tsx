import { DemoClock } from './components/shared/DemoClock';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { SupplierDashboard } from './pages/supplier/SupplierDashboard';
import { CustomerMarketplace } from './pages/customer/CustomerMarketplace';
import { DemoModeBanner } from './components/shared/DemoModeBanner';
import { RoleSelector } from './components/shared/RoleSelector';
import { PhaseAdvancer } from './components/shared/PhaseAdvancer';
import { AdminPortalApp, TransportPortalApp } from './pages/auth/PortalApps';
export default function App() {
  const location = useLocation();
  const isolatedPortal = location.pathname.startsWith('/admin') || location.pathname.startsWith('/transport');
  if (isolatedPortal) return <Routes><Route path="/admin/*" element={<AdminPortalApp/>}/><Route path="/transport/*" element={<TransportPortalApp/>}/><Route path="*" element={<Navigate to="/customer" replace/>}/></Routes>;
  return <div className="app-container"><DemoModeBanner/><header className="app-header">
    <Link to="/customer" className="farmgo-brand" aria-label="FARMGO — Trang chủ"><img src="/farmgo-logo.png" alt="FARMGO"/><span className="farmgo-brand-caption">Nguồn hàng cho F&B</span></Link><RoleSelector/><nav className="market-portal-links" aria-label="Cổng riêng"><Link to="/transport/login">Giao nhận</Link><Link to="/admin/login">Admin</Link></nav>
  </header><DemoClock/><PhaseAdvancer/><main className="app-main"><Routes><Route path="/" element={<Navigate to="/customer" replace/>}/><Route path="/supplier/*" element={<SupplierDashboard/>}/><Route path="/customer/*" element={<CustomerMarketplace/>}/><Route path="*" element={<div className="empty-panel"><h1>Trang không tồn tại</h1><Link to="/customer">Về trang chủ</Link></div>}/></Routes></main></div>;
}
