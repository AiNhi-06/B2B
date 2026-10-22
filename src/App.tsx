import { Routes, Route, Navigate } from 'react-router-dom'

// Các component do Frontend Agent (Antigravity) triển khai
import { SupplierDashboard } from './pages/supplier/SupplierDashboard'
import { CustomerMarketplace } from './pages/customer/CustomerMarketplace'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { DemoModeBanner } from './components/shared/DemoModeBanner'
import { RoleSelector } from './components/shared/RoleSelector'
import { PhaseAdvancer } from './components/shared/PhaseAdvancer'

export default function App() {
  return (
    <div className="app-container">
      {/* Thanh cố định hỗ trợ quay video demo */}
      <DemoModeBanner />
      <header className="app-header">
        <h1>B2B Fruit Distribution (Demo)</h1>
        <RoleSelector />
      </header>

      {/* Widget chuyển nhanh khung giờ demo (12h-15h, 16h-22h, 04h...) */}
      <PhaseAdvancer />

      {/* Điều hướng 3 vai trò */}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/customer" replace />} />
          <Route path="/supplier/*" element={<SupplierDashboard />} />
          <Route path="/customer/*" element={<CustomerMarketplace />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="*" element={<div>Trang không tồn tại</div>} />
        </Routes>
      </main>
    </div>
  )
}
