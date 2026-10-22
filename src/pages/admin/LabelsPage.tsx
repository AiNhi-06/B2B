import { useState, useEffect } from 'react';
import type { Order } from '../../types';
import { getAllOrders, subscribeDemoData } from '../../services/demoService';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { EmptyState } from '../../components/shared/EmptyState';
import { HubProductThumbnail } from '../../components/shared/HubProductPhotos';

export function LabelsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllOrders();
      setOrders(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải danh sách in tem.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const unsub = subscribeDemoData((event) => {
      if (event.type === 'DATA_CHANGED' || event.type === 'RESET') {
        loadOrders();
      }
    });
    return () => unsub();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>🏷️ Phân Loại & In Tem Nhãn Sọt Hàng (04:00 Sáng)</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Sinh mã QR và in tem dán lên từng sọt chứa hàng cho các quán trước khi bàn giao cho tài xế.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => window.print()}
        >
          🖨️ In Hàng Loạt Tem Sọt
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={loadOrders} />}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icon="🏷️"
          title="Chưa có đơn hàng để in tem"
          description="Khi có đơn hàng được tổng hợp và đưa về Hub, tem sọt sẽ xuất hiện tại đây."
        />
      )}

      {!loading && !error && orders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {orders.map((order) => {
            const totalKg = order.items.reduce((s, i) => s + i.quantityKg, 0);

            return (
              <div
                key={order.id}
                style={{
                  border: '2px dashed #0f172a',
                  borderRadius: '10px',
                  background: '#ffffff',
                  padding: '16px',
                  position: 'relative',
                  fontFamily: 'monospace',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>TEM SỌT TRÁI CÂY HUB</span>
                    <h3 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', color: '#0f172a' }}>
                      ĐƠN #{order.id}
                    </h3>
                  </div>

                  {/* Simulated QR Code SVG */}
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      background: '#0f172a',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Mã QR định danh đơn hàng"
                  >
                    <svg viewBox="0 0 24 24" width="56" height="56" fill="white">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v4h-4v-4zm-4 4h4v4h-4v-4zm4-4h-4v-4h4v4zm0-6h4v2h-4v-2zm-6 0h2v4h-2v-4z" />
                    </svg>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', marginBottom: 10 }}>
                  <div>Khách nhận: <strong>{order.customerId}</strong></div>
                  <div>Địa chỉ: <strong>{order.deliveryAddressId}</strong></div>
                </div>

                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>CHI TIẾT TRÁI CÂY TRONG SỌT:</div>
                  {order.items.map((i) => (
                    <div key={i.productId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className="hub-product-line"><HubProductThumbnail id={i.productId} name={i.productName} />{i.productName}</div>
                      <strong>{i.quantityKg} kg</strong>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #cbd5e1', marginTop: 4, paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>TỔNG KHỐI LƯỢNG:</span>
                    <span>{totalKg} KG</span>
                  </div>
                </div>

                <div className="demo-chip" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                  QR demo — không dùng để quét thực tế
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
