import { FinancePage } from '../FinancePage';
import { QualityPage } from '../QualityPage';
import { SellerProfile } from './SellerProfile';
import { SellerOrders } from './SellerOrders';
import { SellerShipping } from './SellerShipping';
import { SellerReviews } from './SellerReviews';
import { ClaimsPage } from '../ClaimsPage';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ListingsPage } from './ListingsPage';
import { AddProductPage } from './AddProductPage';
import { DemandPage } from './DemandPage';
import { SellerOverview } from './SellerOverview';
import { SellerLayout } from './SellerLayout';
export function SupplierDashboard() {
  return (
    <SellerLayout>
      <Routes>
        <Route path="orders" element={<SellerOrders />} />
        <Route path="reviews" element={<SellerReviews />} />
        <Route path="shipping" element={<SellerShipping />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="claims" element={<ClaimsPage />} />
        <Route path="profile" element={<SellerProfile />} />
        <Route path="quality" element={<QualityPage />} />
        <Route index element={<SellerOverview />} />
        <Route path="products" element={<ListingsPage />} />
        <Route path="new" element={<AddProductPage />} />
        <Route path="products/:id/edit" element={<AddProductPage />} />
        <Route path="demand" element={<DemandPage />} />
        <Route path="*" element={<Navigate to="/supplier" replace />} />
      </Routes>
    </SellerLayout>
  );
}
