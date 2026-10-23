import { Routes, Route, Navigate } from 'react-router-dom';
import { ListingsPage } from './ListingsPage';
import { AddProductPage } from './AddProductPage';
import { DemandPage } from './DemandPage';
import { SupplierOverviewPage } from './SupplierOverviewPage';
import { PortalLayout } from '../../components/shared/PortalLayout';
export function SupplierDashboard() {
  return <PortalLayout title="Nhà cung cấp" subtitle="Quản lý nguồn hàng" links={[
    {to:'/supplier',label:'Tổng quan',end:true}, {to:'/supplier/products',label:'Sản phẩm & báo giá'},
    {to:'/supplier/new',label:'Đăng lô hàng'}, {to:'/supplier/demand',label:'Nhu cầu & giao Hub'},
  ]}><Routes><Route index element={<SupplierOverviewPage />} /><Route path="products" element={<ListingsPage />} /><Route path="new" element={<AddProductPage />} /><Route path="products/:id/edit" element={<AddProductPage />} /><Route path="demand" element={<DemandPage />} /><Route path="*" element={<Navigate to="/supplier" replace />} /></Routes></PortalLayout>;
}
