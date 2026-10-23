import { FinancePage } from '../FinancePage';
import { QualityPage } from '../QualityPage';
import { BusinessProfilePage } from '../BusinessProfilePage';
import { ClaimsPage } from '../ClaimsPage';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ListingsPage } from './ListingsPage';
import { AddProductPage } from './AddProductPage';
import { DemandPage } from './DemandPage';
import { SupplierOverviewPage } from './SupplierOverviewPage';
import { PortalLayout } from '../../components/shared/PortalLayout';
export function SupplierDashboard() {
  return <PortalLayout title="Nhà cung cấp" subtitle="Quản lý nguồn hàng" links={[{to:'/supplier/finance',label:'Tiền & đối soát demo'},{to:'/supplier/claims',label:'Khiếu nại & phản hồi'},{to:'/supplier/profile',label:'Hồ sơ & đăng nhập'},{to:'/supplier/quality',label:'Chất lượng & QC'},
    {to:'/supplier',label:'Tổng quan',end:true}, {to:'/supplier/products',label:'Sản phẩm & báo giá'},
    {to:'/supplier/new',label:'Đăng lô hàng'}, {to:'/supplier/demand',label:'Nhu cầu & giao Hub'},
  ]}><Routes><Route path="finance" element={<FinancePage/>}/><Route path="claims" element={<ClaimsPage/>}/><Route path="profile" element={<BusinessProfilePage/>}/><Route path="quality" element={<QualityPage/>}/><Route index element={<SupplierOverviewPage />} /><Route path="products" element={<ListingsPage />} /><Route path="new" element={<AddProductPage />} /><Route path="products/:id/edit" element={<AddProductPage />} /><Route path="demand" element={<DemandPage />} /><Route path="*" element={<Navigate to="/supplier" replace />} /></Routes></PortalLayout>;
}
