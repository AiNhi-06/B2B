import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDemoSession, createProduct, getSuppliers } from '../../services/demoService';
import type { Supplier } from '../../types';
import { ErrorMessage } from '../../components/shared/Feedback';
import { prepareProductPhoto } from '../../components/shared/prepareProductPhoto';

export function AddProductPage() {
  const navigate = useNavigate();
  const [supplierId, setSupplierId] = useState<string>('supplier-1');
  const [supplierName, setSupplierName] = useState<string>('Nhà vườn Chú Sáu');
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [availableKg, setAvailableKg] = useState<number>(100);
  const [basePricePerKg, setBasePricePerKg] = useState<number>(20000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>();
  const [imageError, setImageError] = useState<string | null>(null);
  const [readingImage, setReadingImage] = useState(false);
  const [photoInputKey, setPhotoInputKey] = useState(0);

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setReadingImage(true);
    setImageError(null);
    try {
      setImageUrl(await prepareProductPhoto(file));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Không thể đọc ảnh. Vui lòng chọn lại.');
    } finally {
      setReadingImage(false);
      setPhotoInputKey((key) => key + 1);
    }
  };

  useEffect(() => {
    Promise.all([getDemoSession(), getSuppliers()]).then(([sess, supList]) => {
      const sId = sess.activeSupplierId || 'supplier-1';
      setSupplierId(sId);
      const found = supList.find((s: Supplier) => s.id === sId);
      if (found) setSupplierName(found.name);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readingImage || submitting) return;
    if (!name.trim()) {
      setError('Vui lòng nhập tên loại trái cây.');
      return;
    }
    if (availableKg <= 0) {
      setError('Số lượng kg tồn khả dụng phải lớn hơn 0.');
      return;
    }
    if (basePricePerKg <= 0) {
      setError('Giá bán cho hệ thống phải lớn hơn 0 đ/kg.');
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
        imageUrl,
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
        <Link to="/supplier" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>
          ← Quay lại danh mục nguồn cung
        </Link>
      </div>

      <div className="card">
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {supplierName}
        </span>
        <h1 style={{ margin: '4px 0 12px 0', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
          Đăng Bán Lô Trái Cây Mới
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#475569', marginTop: 0, marginBottom: 20 }}>
          Cập nhật sản lượng tồn kho và giá bán bạn mong muốn nhận được từ hệ thống phân phối.
        </p>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit}>
          <div className="product-photo-upload">
            <label htmlFor="product-photo">Ảnh sản phẩm (không bắt buộc)</label>
            <p id="product-photo-help">Chọn ảnh JPG, PNG hoặc WebP, tối đa 8 MB. Ảnh chỉ được lưu trong trình duyệt cho bản demo.</p>
            <input key={photoInputKey} id="product-photo" type="file" accept="image/jpeg,image/png,image/webp"
              aria-describedby="product-photo-help product-photo-status" aria-invalid={!!imageError}
              onChange={handlePhoto} disabled={readingImage || submitting} />
            <div id="product-photo-status" aria-live="polite">
              {readingImage && <p>Đang xử lý ảnh…</p>}
              {imageError && <p className="product-photo-error" role="alert">{imageError}</p>}
            </div>
            {imageUrl && (
              <div className="product-photo-preview">
                <img src={imageUrl} alt="Ảnh sản phẩm đã chọn" width={240} height={160} />
                <button type="button" className="btn-secondary" disabled={readingImage || submitting}
                  onClick={() => { setImageUrl(undefined); setImageError(null); setPhotoInputKey((key) => key + 1); }}>Xóa ảnh</button>
              </div>
            )}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: 6 }}>
              Tên loại trái cây <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="account-dropdown"
              style={{ width: '100%', padding: '10px' }}
              placeholder="VD: Bơ Sáp, Sầu Riêng Ri6, Xoài Cát..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: 6 }}>
              Giống / Vùng trồng (không bắt buộc)
            </label>
            <input
              type="text"
              className="account-dropdown"
              style={{ width: '100%', padding: '10px' }}
              placeholder="VD: Giống 034 Đắk Lắk, Cát Hòa Lộc Tiền Giang..."
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: 6 }}>
                Sản lượng tồn khả dụng (kg) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="account-dropdown"
                style={{ width: '100%', padding: '10px' }}
                value={availableKg}
                onChange={(e) => setAvailableKg(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: 6 }}>
                Giá bán cho hệ thống (VNĐ/kg) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                className="account-dropdown"
                style={{ width: '100%', padding: '10px' }}
                value={basePricePerKg}
                onChange={(e) => setBasePricePerKg(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px', marginBottom: 20, fontSize: '0.82rem', color: '#475569' }}>
            ℹ️ <strong>Lưu ý:</strong> Mức giá này là giá nhập nội bộ giữa nhà vườn và hệ thống. Giá hiển thị trên ứng dụng của các quán cà phê sẽ được tự động cộng thêm chi phí phân phối và giao nhận.
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
            <button type="submit" className="btn-primary" disabled={submitting || readingImage}>
              {submitting ? 'Đang lưu...' : 'Đăng Bán Ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
