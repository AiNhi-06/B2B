import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { CatalogPage } from './CatalogPage';
import { CheckoutPage } from './CheckoutPage';
import { OrdersPage } from './OrdersPage';
import { OrderDetailPage } from './OrderDetailPage';

export function CustomerMarketplace() {
  return (
    <div>
      <div className="sub-nav-tabs">
        <NavLink
          to="/customer"
          end
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          🍎 Bảng giá sỉ công khai
        </NavLink>
        <NavLink
          to="/customer/checkout"
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          🛒 Giỏ hàng & Checkout
        </NavLink>
        <NavLink
          to="/customer/orders"
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          📜 Lịch sử & Theo dõi GPS
        </NavLink>
      </div>

      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="*" element={<Navigate to="/customer" replace />} />
      </Routes>
    </div>
  );
}
