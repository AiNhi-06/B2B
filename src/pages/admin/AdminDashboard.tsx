import { FinancePage } from '../FinancePage';
import { ApprovalsPage } from './ApprovalsPage';
import { QualityPage } from '../QualityPage';
import { ClaimsPage } from '../ClaimsPage';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PricingPage } from './PricingPage';
import { AdminOrdersPage } from './AdminOrdersPage';
import { AggregatePage } from './AggregatePage';
import { LabelsPage } from './LabelsPage';
import { ShipmentsPage } from './ShipmentsPage';
import { AdminOverviewPage } from './AdminOverviewPage';
import { AdminSuppliersPage } from './AdminSuppliersPage';
import { TransportDashboard } from './TransportDashboard';
import { HubProductPhotos } from '../../components/shared/HubProductPhotos';
import { PortalLayout } from '../../components/shared/PortalLayout';
import './admin-dashboard.css';
export function AdminDashboard() {
  return <HubProductPhotos><div className="freso-admin-shell"><PortalLayout title="FARMGO HQ" subtitle="Điều hành Hub · Demo" links={[{to:'/admin/finance',label:'Tiền & đối soát demo'},{to:'/admin/claims',label:'Khiếu nại & phản hồi'},{to:'/admin/quality',label:'Chất lượng & QC'},{to:'/admin/approvals',label:'Duyệt doanh nghiệp'},
    {to:'/admin',label:'Tổng quan',end:true},{to:'/admin/products',label:'Danh mục & giá công khai'},
    {to:'/admin/suppliers',label:'Nhà cung cấp'},{to:'/admin/orders',label:'Quản lý đơn hàng'},
    {to:'/admin/aggregate',label:'Gom nhu cầu (22h)'},{to:'/admin/labels',label:'Tem sọt demo'},
    {to:'/admin/shipments',label:'Điều phối chuyến giao'},
    {to:'/admin/transport',label:'Màn hình vận chuyển'},
  ]}><Routes><Route path="finance" element={<FinancePage/>}/><Route path="claims" element={<ClaimsPage/>}/><Route path="quality" element={<QualityPage/>}/><Route path="approvals" element={<ApprovalsPage/>}/><Route index element={<AdminOverviewPage/>}/><Route path="products" element={<PricingPage/>}/><Route path="suppliers" element={<AdminSuppliersPage/>}/><Route path="orders" element={<AdminOrdersPage/>}/><Route path="aggregate" element={<AggregatePage/>}/><Route path="labels" element={<LabelsPage/>}/><Route path="shipments" element={<ShipmentsPage/>}/><Route path="transport" element={<TransportDashboard/>}/><Route path="*" element={<Navigate to="/admin" replace/>}/></Routes></PortalLayout></div></HubProductPhotos>;
}
