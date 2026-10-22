import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ProductListing, DemandLine, Supplier } from '../../types';
import {
  getDemoSession,
  getSupplierListings,
  getSupplierDemand,
  getSuppliers,
  subscribeDemoData,
} from '../../services/demoService';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { EmptyState } from '../../components/shared/EmptyState';

export function ListingsPage() {
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [demand, setDemand] = useState<DemandLine[]>([]);
  const [supplierName, setSupplierName] = useState<string>('Nhà vườn Chú Sáu');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const session = await getDemoSession();
      const sId = session.activeSupplierId || 'supplier-1';

      const [items, demList, supList] = await Promise.all([
        getSupplierListings(sId),
        getSupplierDemand(sId),
        getSuppliers(),
      ]);

      setListings(items);
      setDemand(demList);

      const foundSupplier = supList.find((s: Supplier) => s.id === sId);
      if (foundSupplier) {
        setSupplierName(foundSupplier.name);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeDemoData((event) => {
      if (event.type === 'DATA_CHANGED' || event.type === 'SESSION_CHANGED' || event.type === 'RESET') {
        loadData();
      }
    });
    return () => unsub();
  }, []);

  const totalAvailableKg = listings.reduce((sum, item) => sum + (item.active ? item.availableKg : 0), 0);
  const totalDemandKg = demand.reduce((sum, d) => sum + d.quantityKg, 0);

  // Map demand by product ID
  const demandByProduct = new Map<string, number>();
  demand.forEach((d) => {
    demandByProduct.set(d.productId, d.quantityKg);
  });

  return (
    <div>
      {/* 1. Header Section with Crisp Typography */}
      <div className="supplier-listing-heading">
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Khu vực cung ứng • {supplierName}
          </span>
          <h1 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Hàng đang bán
          </h1>
        </div>

        <Link to="/supplier/new" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>+</span>
          <span>Đăng lô trái cây mới</span>
        </Link>
      </div>

      {/* 2. Top Summary Metrics Bar */}
      <div className="metrics-summary-bar">
        <div className="metric-box">
          <span className="metric-label">Tổng tồn khả dụng</span>
          <span className="metric-value highlight-green">{totalAvailableKg.toLocaleString('vi-VN')} kg</span>
        </div>

        <div className="metric-box">
          <span className="metric-label">Nhu cầu các quán đã đặt</span>
          <span className="metric-value highlight-amber">
            {totalDemandKg > 0 ? `${totalDemandKg.toLocaleString('vi-VN')} kg` : 'Chưa có đơn'}
          </span>
        </div>

        <div className="metric-box">
          <span className="metric-label">Mặt hàng đang mở bán</span>
          <span className="metric-value">{listings.filter((l) => l.active).length} loại</span>
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={loadData} />}

      {!loading && !error && listings.length === 0 && (
        <EmptyState
          icon="🥑"
          title="Chưa có lô trái cây nào"
          description="Cập nhật số lượng thu hoạch và giá bán để cung cấp cho hệ thống phân phối."
          action={{
            label: 'Đăng lô hàng đầu tiên',
            onClick: () => window.location.assign('/supplier/new'),
          }}
        />
      )}

      {/* 3. High-Contrast Fruit Cards with Visuals & Priority Metrics */}
      {!loading && !error && listings.length > 0 && (
        <div className="grid-cards">
          {listings.map((item) => {
            const neededKg = demandByProduct.get(item.id) || 0;

            return (
              <div key={item.id} className="fruit-listing-card">
                <FruitPhoto id={item.id} name={item.name} imageUrl={item.imageUrl} />
                <div className="card-fruit-header">
                  <div className="card-fruit-meta">
                    <h3 className="fruit-title">{item.name}</h3>
                    <div className="fruit-variety">
                      {item.variety ? `Giống: ${item.variety}` : 'Chưa có thông tin giống'}
                    </div>
                  </div>
                  <span className={`badge ${item.active ? 'badge-delivered' : 'badge-placed'}`}>
                    {item.active ? 'Đang mở bán' : 'Tạm ẩn'}
                  </span>
                </div>

                {/* Priority Metrics: Tồn khả dụng + Giá gốc + Nhu cầu quán */}
                <div className="card-metrics-grid">
                  <div className="metric-item">
                    <span className="metric-item-label">Tồn khả dụng</span>
                    <span className="metric-item-number">
                      {item.availableKg.toLocaleString('vi-VN')} kg
                    </span>
                  </div>

                  <div className="metric-item">
                    <span className="metric-item-label">Giá gốc cung cấp</span>
                    <span className="metric-item-number green">
                      {item.basePricePerKg.toLocaleString('vi-VN')} đ/kg
                    </span>
                  </div>
                </div>

                {/* Secondary Section: Demand requirement */}
                <div style={{ padding: '10px 16px', background: neededKg > 0 ? '#fef3c7' : '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: neededKg > 0 ? '#92400e' : '#64748b' }}>
                    Nhu cầu quán cần giao Hub:
                  </span>
                  <strong style={{ fontSize: '0.95rem', color: neededKg > 0 ? '#b45309' : '#0f172a' }}>
                    {neededKg > 0 ? `${neededKg.toLocaleString('vi-VN')} kg` : '0 kg'}
                  </strong>
                </div>

                <div className="card-bottom-info">
                  <span>Giá nội bộ nhà vườn (không hiển thị cho quán)</span>
                  <Link to="/supplier/demand" style={{ color: '#15803d', fontWeight: 700, textDecoration: 'none' }}>
                    Xem gom đơn →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
