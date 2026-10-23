import { FinancePage } from '../FinancePage';
import { BusinessProfilePage } from '../BusinessProfilePage';
import { ClaimsPage } from '../ClaimsPage';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CatalogPage } from './CatalogPage';
import { CheckoutPage } from './CheckoutPage';
import { OrdersPage } from './OrdersPage';
import { OrderDetailPage } from './OrderDetailPage';
import { BuyerHomePage } from './BuyerHomePage';
import { ProductDetailPage } from './ProductDetailPage';
import { PortalLayout } from '../../components/shared/PortalLayout';
export function CustomerMarketplace() {
  return <PortalLayout title="Dành cho bên mua" subtitle="Nguyên liệu F&B" links={[{to:'/customer/finance',label:'Tiền & đối soát demo'},{to:'/customer/claims',label:'Khiếu nại & phản hồi'},{to:'/customer/profile',label:'Hồ sơ & đăng nhập'},
    { to: '/customer', label: 'Trang chủ', end: true }, { to: '/customer/catalog', label: 'Danh mục nguyên liệu' },
    { to: '/customer/checkout', label: 'Giỏ hàng & đặt hàng' }, { to: '/customer/orders', label: 'Đơn hàng & theo dõi' },
  ]}><Routes><Route path="finance" element={<FinancePage/>}/><Route path="claims" element={<ClaimsPage/>}/><Route path="profile" element={<BusinessProfilePage/>}/><Route index element={<BuyerHomePage />} /><Route path="catalog" element={<CatalogPage />} /><Route path="products/:id" element={<ProductDetailPage />} /><Route path="checkout" element={<CheckoutPage />} /><Route path="orders" element={<OrdersPage />} /><Route path="orders/:id" element={<OrderDetailPage />} /><Route path="*" element={<Navigate to="/customer" replace />} /></Routes></PortalLayout>;
}
