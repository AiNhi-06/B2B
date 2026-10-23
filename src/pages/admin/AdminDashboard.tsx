import { Routes, Route, Navigate } from 'react-router-dom';
import { PricingPage } from './PricingPage';
import { AdminOrdersPage } from './AdminOrdersPage';
import { AggregatePage } from './AggregatePage';
import { LabelsPage } from './LabelsPage';
import { ShipmentsPage } from './ShipmentsPage';
import { AdminOverviewPage } from './AdminOverviewPage';
import { AdminSuppliersPage } from './AdminSuppliersPage';
import { HubProductPhotos } from '../../components/shared/HubProductPhotos';
import { PortalLayout } from '../../components/shared/PortalLayout';
export function AdminDashboard() {
  return <HubProductPhotos><PortalLayout title="Quản trị & Hub" subtitle="Điều hành FARMGO" links={[
    {to:'/admin',label:'Tổng quan',end:true},{to:'/admin/products',label:'Danh mục & giá công khai'},
    {to:'/admin/suppliers',label:'Nhà cung cấp'},{to:'/admin/orders',label:'Quản lý đơn hàng'},
    {to:'/admin/aggregate',label:'Gom nhu cầu (22h)'},{to:'/admin/labels',label:'Tem sọt demo'},
    {to:'/admin/shipments',label:'Điều phối chuyến giao'},
  ]}><Routes><Route index element={<AdminOverviewPage/>}/><Route path="products" element={<PricingPage/>}/><Route path="suppliers" element={<AdminSuppliersPage/>}/><Route path="orders" element={<AdminOrdersPage/>}/><Route path="aggregate" element={<AggregatePage/>}/><Route path="labels" element={<LabelsPage/>}/><Route path="shipments" element={<ShipmentsPage/>}/><Route path="*" element={<Navigate to="/admin" replace/>}/></Routes></PortalLayout></HubProductPhotos>;
}
