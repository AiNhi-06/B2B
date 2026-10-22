import { useState, useEffect } from 'react';
import type { DemandLine, SupplierConfirmation } from '../../types';
import {
  getDemoSession,
  getSupplierDemand,
  confirmSupplierDemand,
  getSupplierConfirmations,
  subscribeDemoData,
} from '../../services/demoService';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { EmptyState } from '../../components/shared/EmptyState';

export function DemandPage() {
  const [demand, setDemand] = useState<DemandLine[]>([]);
  const [confirmations, setConfirmations] = useState<SupplierConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSupplierId, setActiveSupplierId] = useState<string>('supplier-1');

  // Form confirmation state
  const [vehiclePlate, setVehiclePlate] = useState('49A-888.99');
  const [estimatedArrivalAt, setEstimatedArrivalAt] = useState('03:30 (Sáng sớm)');
  const [confirming, setConfirming] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const session = await getDemoSession();
      const sId = session.activeSupplierId || 'supplier-1';
      setActiveSupplierId(sId);

      const [demData, confData] = await Promise.all([
        getSupplierDemand(sId),
        getSupplierConfirmations(),
      ]);
      setDemand(demData);
      setConfirmations(confData.filter((c) => c.supplierId === sId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải nhu cầu tổng.';
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

  // Collect all unique orderIds from demand lines
  const allOrderIds = Array.from(new Set(demand.flatMap((d) => d.orderIds)));

  // Check if current demand lines have already been confirmed
  const isAlreadyConfirmed = confirmations.some((c) =>
    allOrderIds.length > 0 && allOrderIds.every((id) => c.orderIds.includes(id))
  );

  const handleConfirmSupply = async () => {
    if (allOrderIds.length === 0) return;
    try {
      setConfirming(true);
      setError(null);
      await confirmSupplierDemand({
        supplierId: activeSupplierId,
        orderIds: allOrderIds,
        vehiclePlate: vehiclePlate.trim() || undefined,
        estimatedArrivalAt: estimatedArrivalAt.trim() || undefined,
      });
      setSuccessMsg('Đã xác nhận cung ứng đơn tổng thành công! Đơn hàng đã sẵn sàng giao về Hub.');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xác nhận cung ứng thất bại.';
      setError(msg);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>Nhu Cầu Đơn Tổng Cần Giao Hub</h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
          Tổng hợp số lượng tất cả các quán đã đặt hôm nay (Sau 22:00 & 03:00–04:00 sáng).
        </p>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={loadData} />}
      {successMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: 16 }}>
          ✅ {successMsg}
        </div>
      )}

      {!loading && !error && demand.length === 0 && (
        <EmptyState
          icon="📋"
          title="Chưa có nhu cầu gom đơn"
          description="Các quán chưa chốt đơn hoặc Admin chưa thực hiện gom đơn tự động sau 22:00."
        />
      )}

      {!loading && !error && demand.length > 0 && (
        <>
          <div className="card">
            <h3 className="card-title">
              <span>Bảng Tổng Khối Lượng Trái Cây Cần Cung Cấp</span>
              <span className="demo-chip">Liên kết {allOrderIds.length} đơn quán</span>
            </h3>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mặt hàng</th>
                    <th>Mã sản phẩm</th>
                    <th>Số đơn gom</th>
                    <th>Tổng khối lượng (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {demand.map((line) => (
                    <tr key={line.productId}>
                      <td><strong>{line.productName}</strong></td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{line.productId}</td>
                      <td>{line.orderIds.length} đơn quán</td>
                      <td>
                        <strong style={{ color: '#15803d', fontSize: '1.1rem' }}>
                          {line.quantityKg.toLocaleString('vi-VN')} kg
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ borderColor: isAlreadyConfirmed ? '#86efac' : '#cbd5e1' }}>
            <h3 className="card-title">
              <span>🚚 Xác Nhận Cung Ứng & Vận Chuyển Về Kho Hub (03:00 – 04:00)</span>
              {isAlreadyConfirmed && <span className="badge badge-delivered">Đã xác nhận cung ứng</span>}
            </h3>

            {isAlreadyConfirmed ? (
              <div style={{ color: '#166534', fontSize: '0.9rem' }}>
                <p>
                  Bạn đã hoàn tất gửi thông tin xe giao hàng về Kho Hub. Nhân viên kho Hub sẽ dán tem QR khi xe tới nơi.
                </p>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', marginTop: 10 }}>
                  <div>Biển số xe khai báo: <strong>{confirmations[0]?.vehiclePlate || 'N/A'}</strong></div>
                  <div>Giờ dự kiến tới Hub: <strong>{confirmations[0]?.estimatedArrivalAt || 'N/A'}</strong></div>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Xác nhận cam kết đủ số lượng trái cây tổng hợp ở trên và khai báo thông tin xe vận chuyển về kho Hub trung tâm.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>
                      Biển số xe vận chuyển:
                    </label>
                    <input
                      type="text"
                      className="account-select"
                      style={{ width: '100%' }}
                      placeholder="VD: 49C-123.45"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>
                      Giờ dự kiến giao tới Hub:
                    </label>
                    <input
                      type="text"
                      className="account-select"
                      style={{ width: '100%' }}
                      placeholder="VD: 03:30 Sáng"
                      value={estimatedArrivalAt}
                      onChange={(e) => setEstimatedArrivalAt(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleConfirmSupply}
                  disabled={confirming}
                  style={{ width: '100%', padding: '10px' }}
                >
                  {confirming ? 'Đang gửi xác nhận...' : '✅ Xác Nhận Cung Ứng Lô Hàng Này'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
