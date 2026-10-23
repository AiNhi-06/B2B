import { useState, useEffect } from 'react';
import type { DemandLine, SupplierConfirmation, Supplier } from '../../types';
import {
  getDemoSession,
  getSupplierDemand,
  confirmSupplierDemand,
  getSupplierConfirmations,
  getSuppliers,
  subscribeDemoData,
} from '../../services/demoService';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { EmptyState } from '../../components/shared/EmptyState';

export function DemandPage() {
  const [demand, setDemand] = useState<DemandLine[]>([]);
  const [confirmations, setConfirmations] = useState<SupplierConfirmation[]>([]);
  const [supplierName, setSupplierName] = useState<string>('Nhà vườn Chú Sáu');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSupplierId, setActiveSupplierId] = useState<string>('supplier-1');

  // Form confirmation state
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [estimatedArrivalAt, setEstimatedArrivalAt] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const session = await getDemoSession();
      const sId = session.activeSupplierId || 'supplier-1';
      setActiveSupplierId(sId);

      const [demData, confData, supList] = await Promise.all([
        getSupplierDemand(sId),
        getSupplierConfirmations(),
        getSuppliers(),
      ]);
      setDemand(demData);
      setConfirmations(confData.filter((c) => c.supplierId === sId));

      const foundSupplier = supList.find((s: Supplier) => s.id === sId);
      if (foundSupplier) {
        setSupplierName(foundSupplier.name);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải nhu cầu tổng hợp.';
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

  const allOrderIds = Array.from(new Set(demand.flatMap((d) => d.orderIds)));
  const confirmedIds = new Set(confirmations.flatMap(confirmation => confirmation.orderIds));
  const pendingOrderIds = allOrderIds.filter(id => !confirmedIds.has(id));
  const isAlreadyConfirmed = allOrderIds.length > 0 && pendingOrderIds.length === 0;

  const totalDemandKg = demand.reduce((sum, d) => sum + d.quantityKg, 0);

  const handleConfirmSupply = async () => {
    if (pendingOrderIds.length === 0) return;
    try {
      setConfirming(true);
      setError(null);
      await confirmSupplierDemand({
        supplierId: activeSupplierId,
        orderIds: pendingOrderIds,
        vehiclePlate: vehiclePlate.trim() || undefined,
        estimatedArrivalAt: estimatedArrivalAt ? new Date(estimatedArrivalAt).toISOString() : undefined,
      });
      setSuccessMsg('Đã xác nhận vận chuyển lô hàng thành công! Kho Hub sẽ đón nhận xe lúc 03:00 - 04:00 sáng.');
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
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Điều phối nông sản • {supplierName}
        </span>
        <h1 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
          Tổng Hợp Nhu Cầu Cần Giao Kho Hub
        </h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#475569' }}>
          Số lượng tổng hợp từ các đơn đặt hàng trong ngày. Nhà vườn chuẩn bị sọt và xuất xe về Hub trước 04:00 sáng.
        </p>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={loadData} />}
      {successMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: 16, fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {!loading && !error && demand.length === 0 && (
        <EmptyState
          icon="📋"
          title="Chưa có yêu cầu xuất hàng"
          description="Các quán chưa chốt đơn hôm nay hoặc kho Hub chưa chạy tổng hợp nhu cầu lúc 22:00."
        />
      )}

      {!loading && !error && demand.length > 0 && (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Danh Sách Khối Lượng Cần Cung Cấp
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                  Tổng hợp từ {allOrderIds.length} đơn đặt hàng của các quán F&B
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                  Tổng xuất về Hub
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d' }}>
                  {totalDemandKg.toLocaleString('vi-VN')} kg
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mặt hàng</th>
                    <th>Số đơn quán đặt</th>
                    <th>Khối lượng cần giao</th>
                  </tr>
                </thead>
                <tbody>
                  {demand.map((line) => (
                    <tr key={line.productId}>
                      <td><strong style={{ fontSize: '0.95rem' }}>{line.productName}</strong></td>
                      <td style={{ color: '#475569' }}>{line.orderIds.length} quán</td>
                      <td>
                        <strong style={{ color: '#15803d', fontSize: '1.15rem' }}>
                          {line.quantityKg.toLocaleString('vi-VN')} kg
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ background: isAlreadyConfirmed ? '#f0fdf4' : '#ffffff', borderColor: isAlreadyConfirmed ? '#86efac' : '#cbd5e1' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Thông Tin Xe Vận Chuyển Về Kho Hub (03:00 – 04:00 Sáng)</span>
              {isAlreadyConfirmed && <span className="badge badge-delivered">Đã chốt lịch xe</span>}
            </h2>

            {isAlreadyConfirmed ? (
              <div style={{ fontSize: '0.9rem', color: '#166534' }}>
                <p style={{ margin: '0 0 10px 0' }}>
                  Lô hàng đã được lên lịch xuất bến. Bộ phận kiểm nhận tại kho Hub sẽ đối soát tem và tiếp nhận hàng theo thông tin xe dưới đây:
                </p>
                <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '6px', display: 'flex', gap: 32 }}>
                  <div>Biển số xe: <strong style={{ color: '#0f172a' }}>{confirmations[0]?.vehiclePlate || 'N/A'}</strong></div>
                  <div>Giờ dự kiến tới Hub: <strong style={{ color: '#0f172a' }}>{confirmations[0]?.estimatedArrivalAt || 'N/A'}</strong></div>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.88rem', color: '#475569', margin: '0 0 16px 0' }}>
                  Xác nhận cam kết đủ số lượng thu hoạch và khai báo biển số xe giao hàng để kho Hub bố trí cửa dỡ hàng:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: 4 }}>
                      Biển số xe vận chuyển:
                    </label>
                    <input
                      type="text"
                      className="account-dropdown"
                      style={{ width: '100%', padding: '9px 12px' }}
                      placeholder="VD: 49C-123.45"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: 4 }}>
                      Giờ dự kiến giao tới Hub:
                    </label>
                    <input
                      type="datetime-local"
                      className="account-dropdown"
                      style={{ width: '100%', padding: '9px 12px' }}
                      aria-label="Ngày giờ dự kiến tới Hub"
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
                  style={{ width: '100%', padding: '11px', fontSize: '0.95rem' }}
                >
                  {confirming ? 'Đang gửi thông tin...' : 'Xác Nhận Lịch Xe Vận Chuyển Về Hub'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
