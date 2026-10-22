import { useState, useEffect } from 'react';
import type { PricingRule } from '../../types';
import { getPricingRule, updatePricingRule, subscribeDemoData } from '../../services/demoService';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';

export function PricingPage() {
  const [rule, setRule] = useState<PricingRule>({ mode: 'PERCENT', value: 30 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadRule = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPricingRule();
      setRule(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải cấu hình markup.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRule();
    const unsub = subscribeDemoData((event) => {
      if (event.type === 'DATA_CHANGED' || event.type === 'RESET') {
        loadRule();
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      const updated = await updatePricingRule({
        mode: rule.mode,
        value: Number(rule.value),
      });
      setRule(updated);
      setSuccessMsg('Đã cập nhật biên lợi nhuận thành công! Giá trên catalog khách hàng đã được đồng bộ.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cập nhật markup thất bại.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Example preview calculation
  const sampleBasePrice = 20000;
  const calculatedSellingPrice =
    rule.mode === 'PERCENT'
      ? Math.round(sampleBasePrice * (1 + rule.value / 100))
      : sampleBasePrice + rule.value;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>⚙️ Cấu Hình Biên Lợi Nhuận (Markup Rule)</h2>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
          Hệ thống tự động cộng tỷ lệ hoặc số tiền cố định vào giá sỉ gốc của nhà vườn để công khai cho khách B2B.
        </p>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={loadRule} />}
      {successMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: 16 }}>
          ✅ {successMsg}
        </div>
      )}

      {!loading && (
        <div className="card">
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: 8 }}>
                Phương thức tính biên lợi nhuận:
              </label>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="markupMode"
                    value="PERCENT"
                    checked={rule.mode === 'PERCENT'}
                    onChange={() => setRule((prev) => ({ ...prev, mode: 'PERCENT' }))}
                  />
                  <span>Theo phần trăm (%)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="markupMode"
                    value="FIXED_VND_PER_KG"
                    checked={rule.mode === 'FIXED_VND_PER_KG'}
                    onChange={() => setRule((prev) => ({ ...prev, mode: 'FIXED_VND_PER_KG' }))}
                  />
                  <span>Số tiền cố định (VNĐ/kg)</span>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: 8 }}>
                Giá trị biên lợi nhuận: {rule.mode === 'PERCENT' ? '(%)' : '(VNĐ/kg)'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min="0"
                  step={rule.mode === 'PERCENT' ? '1' : '500'}
                  className="account-select"
                  style={{ width: '160px', padding: '10px' }}
                  value={rule.value}
                  onChange={(e) => setRule((prev) => ({ ...prev, value: Number(e.target.value) }))}
                  required
                />
                <span style={{ fontWeight: 600, color: '#64748b' }}>
                  {rule.mode === 'PERCENT' ? '%' : 'VNĐ/kg'}
                </span>
              </div>
            </div>

            {/* Interactive Preview Box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                🔍 Minh họa công thức tính giá bán khách hàng:
              </div>
              <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>Giá sỉ gốc của nhà vườn (Ví dụ Bơ 034): <strong>20.000 đ/kg</strong></div>
                <div>
                  Biên lợi nhuận áp dụng:{' '}
                  <strong>{rule.mode === 'PERCENT' ? `+${rule.value}%` : `+${rule.value.toLocaleString('vi-VN')} đ/kg`}</strong>
                </div>
                <div style={{ marginTop: 4, paddingTop: 6, borderTop: '1px dashed #cbd5e1', fontSize: '1rem' }}>
                  Giá bán lẻ công khai trên App: <strong style={{ color: '#ea580c' }}>{calculatedSellingPrice.toLocaleString('vi-VN')} đ/kg</strong>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '10px 20px' }}>
              {saving ? 'Đang lưu cấu hình...' : 'Lưu & Áp Dụng Toàn Hệ Thống'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
