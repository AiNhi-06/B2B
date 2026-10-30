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
import { CustomerStoreLayout } from './CustomerStoreLayout';
export function CustomerMarketplace() {
  return <CustomerStoreLayout><Routes><Route path="finance" element={<FinancePage/>}/><Route path="claims" element={<ClaimsPage/>}/><Route path="profile" element={<BusinessProfilePage/>}/><Route index element={<BuyerHomePage />} /><Route path="catalog" element={<CatalogPage />} /><Route path="products/:id" element={<ProductDetailPage />} /><Route path="checkout" element={<CheckoutPage />} /><Route path="orders" element={<OrdersPage />} /><Route path="orders/:id" element={<OrderDetailPage />} /><Route path="*" element={<Navigate to="/customer" replace />} /></Routes></CustomerStoreLayout>;
}
