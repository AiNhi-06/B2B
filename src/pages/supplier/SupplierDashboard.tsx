import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { ListingsPage } from './ListingsPage';
import { AddProductPage } from './AddProductPage';
import { DemandPage } from './DemandPage';

export function SupplierDashboard() {
  return (
    <div>
      <div className="sub-nav-tabs">
        <NavLink
          to="/supplier"
          end
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          Nguồn cung trái cây
        </NavLink>
        <NavLink
          to="/supplier/new"
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          Đăng bán lô mới
        </NavLink>
        <NavLink
          to="/supplier/demand"
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          Nhu cầu giao kho Hub
        </NavLink>
      </div>

      <Routes>
        <Route path="/" element={<ListingsPage />} />
        <Route path="/new" element={<AddProductPage />} />
        <Route path="/demand" element={<DemandPage />} />
        <Route path="*" element={<Navigate to="/supplier" replace />} />
      </Routes>
    </div>
  );
}
