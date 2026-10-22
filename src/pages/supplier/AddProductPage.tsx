import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDemoSession, createProduct } from '../../services/demoService';
import { ErrorMessage } from '../../components/shared/Feedback';

export function AddProductPage() {
  const navigate = useNavigate();
  const [supplierId, setSupplierId] = useState<string>('supplier-1');
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [availableKg, setAvailableKg] = useState<number>(100);
  const [basePricePerKg, setBasePricePerKg] = useState<number>(20000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDemoSession().then((sess) => {
      if (sess.activeSupplierId) setSupplierId(sess.activeSupplierId);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên loại trái cây.');
      return;
    }
    if (availableKg <= 0) {
      setError('Số lượng kg tồn khả dụng phải lớn hơn 0.');
      return;
    }
    if (basePricePerKg <= 0) {
      setError('Giá sỉ gốc phải lớn hơn 0 đ/kg.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createProduct({
        supplierId,
        name: name.trim(),
        variety: variety.trim() || undefined,
        availableKg: Math.floor(availableKg),
        basePricePerKg: Math.floor(basePricePerKg),
      });
      navigate('/supplier');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo lô hàng mới.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/supplier" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Quay lại danh sách lô hàng
        </Link>
      </div>

      <div className="card">
        <h2 className="card-title">➕ Đăng Bán Lô Trái Cây Mới (12:00 – 15:00)</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: -10, marginBottom: 20 }}>
          Khai báo sản lượng thu hoạch và giá sỉ gốc muốn bán cho hệ thống.
        </p>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
              Tên trái cây <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="account-select"
              style={{ width: '100%', padding: '10px' }}
              placeholder="VD: Bơ Sáp, Sầu Riêng Ri6, Xoài Cát..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
              Giống / Loại (không bắt buộc)
            </label>
            <input
              type="text"
              className="account-select"
              style={{ width: '100%', padding: '10px' }}
              placeholder="VD: 034, Cát Hòa Lộc, Ruột Đỏ..."
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
                Sản lượng tồn (kg) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="account-select"
                style={{ width: '100%', padding: '10px' }}
                value={availableKg}
                onChange={(e) => setAvailableKg(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
                Giá sỉ gốc (VNĐ/kg) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                className="account-select"
                style={{ width: '100%', padding: '10px' }}
                value={basePricePerKg}
                onChange={(e) => setBasePricePerKg(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '6px', marginBottom: 20, fontSize: '0.8rem', color: '#991b1b' }}>
            🔒 <strong>Bảo mật giá gốc:</strong> Hệ thống sẽ tự cộng biên lợi nhuận (Markup) trước khi hiển thị giá công khai cho quán cà phê / nhà hàng. Khách hàng hoàn toàn không thấy mức giá bạn nhập tại đây.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/supplier')}
              disabled={submitting}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Đăng Bán Ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
