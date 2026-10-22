import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { PricingPage } from './PricingPage';
import { AdminOrdersPage } from './AdminOrdersPage';
import { AggregatePage } from './AggregatePage';
import { LabelsPage } from './LabelsPage';
import { ShipmentsPage } from './ShipmentsPage';
import { HubProductPhotos } from '../../components/shared/HubProductPhotos';

export function AdminDashboard() {
  return (
    <HubProductPhotos><div>
      <div className="sub-nav-tabs">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          🏷️ Cấu hình Markup
        </NavLink>
        <NavLink
          to="/admin/orders"
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          📦 Quản lý Đơn hàng
        </NavLink>
        <NavLink
          to="/admin/aggregate"
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          🔄 Gom đơn Hub (22:00)
        </NavLink>
        <NavLink
          to="/admin/labels"
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          🏷️ In tem QR sọt
        </NavLink>
        <NavLink
          to="/admin/shipments"
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          🚚 Điều phối Chuyến giao
        </NavLink>
      </div>

      <Routes>
        <Route path="/" element={<PricingPage />} />
        <Route path="/orders" element={<AdminOrdersPage />} />
        <Route path="/aggregate" element={<AggregatePage />} />
        <Route path="/labels" element={<LabelsPage />} />
        <Route path="/shipments" element={<ShipmentsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div></HubProductPhotos>
  );
}
