import { useState, useEffect } from 'react';
import type { DemandLine, Order } from '../../types';
import {
  getAllOrders,
  getSuppliers,
  getSupplierDemand,
  aggregateDemand,
  subscribeDemoData,
} from '../../services/demoService';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { EmptyState } from '../../components/shared/EmptyState';
import { HubProductThumbnail, HubSupplierName } from '../../components/shared/HubProductPhotos';

export function AggregatePage() {
  const [demand, setDemand] = useState<DemandLine[]>([]);
  const [placedOrdersCount, setPlacedOrdersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [aggregating, setAggregating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const orders = await getAllOrders();
      const placed = orders.filter((o) => o.status === 'PLACED').length;
      setPlacedOrdersCount(placed);

      const suppliers = await getSuppliers();
      const batches = await Promise.all(suppliers.map(supplier => getSupplierDemand(supplier.id)));
      setDemand(batches.flat());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải dữ liệu gom đơn.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeDemoData((event) => {
      if (event.type === 'DATA_CHANGED' || event.type === 'RESET') {
        loadData();
      }
    });
    return () => unsub();
  }, []);

  const handleAggregate = async () => {
    try {
      setAggregating(true);
      setError(null);
      setSuccessMsg(null);
      const res = await aggregateDemand();
      setDemand(res);
      setSuccessMsg('Đã gom các đơn mới thành nhu cầu cung ứng cho nhà cung cấp.');
      const orders = await getAllOrders();
      setPlacedOrdersCount(orders.filter((o: Order) => o.status === 'PLACED').length);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gom đơn thất bại.';
      setError(msg);
    } finally {
      setAggregating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>🔄 Gom Nhu Cầu Demo (mốc 22:00)</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Tổng hợp các đơn đặt hàng nhỏ lẻ từ tất cả các quán cà phê thành đơn hàng sỉ tổng gửi về các nhà vườn.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={handleAggregate}
          disabled={aggregating}
        >
          {aggregating ? 'Đang tổng hợp...' : 'Gom các đơn mới'}
        </button>
      </div>

      {placedOrdersCount > 0 ? (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', padding: '10px 16px', borderRadius: '8px', marginBottom: 16, fontSize: '0.9rem' }}>
          🔔 Có <strong>{placedOrdersCount} đơn hàng mới</strong> từ các quán đang chờ chốt gom đơn lúc 22:00.
        </div>
      ) : (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '10px 16px', borderRadius: '8px', marginBottom: 16, fontSize: '0.85rem' }}>
          ℹ️ Không có đơn mới chờ gom.
        </div>
      )}

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={loadData} />}
      {successMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px 16px', borderRadius: '8px', marginBottom: 16 }}>
          ✅ {successMsg}
        </div>
      )}

      {!loading && !error && demand.length === 0 && (
        <EmptyState
          icon="📊"
          title="Chưa có nhu cầu gom đơn"
          description="Chưa có đơn hàng nào được đặt hoặc tất cả đơn đã hoàn thành giao hàng."
        />
      )}

      {!loading && !error && demand.length > 0 && (
        <div className="card">
          <h3 className="card-title">Bảng Tổng Hợp Khối Lượng Theo Mặt Hàng & Nhà Vườn</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Nhà vườn phụ trách</th>
                  <th>Tổng khối lượng cần cấp</th>
                  <th>Chi tiết đơn gom</th>
                </tr>
              </thead>
              <tbody>
                {demand.map((line) => (
                  <tr key={line.productId}>
                    <td><div className="hub-product-line"><HubProductThumbnail id={line.productId} name={line.productName} /><strong>{line.productName}</strong></div></td>
                    <td>
                      <span className="badge badge-placed"><HubSupplierName supplierId={line.supplierId} /></span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1.15rem', color: '#15803d' }}>
                        {line.quantityKg.toLocaleString('vi-VN')} kg
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                        Gộp từ {line.orderIds.length} đơn: {line.orderIds.map((id) => `#${id}`).join(', ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
