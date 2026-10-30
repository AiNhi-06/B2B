import { useState } from 'react';
import { useDemoData } from '../../components/shared/useDemoData';
import * as api from '../../services/demoService';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';

interface FormState {
  farmName: string;
  ownerName: string;
  phone: string;
  taxCode: string;
  gardenAddress: string;
  vietGapCode: string;
  vietGapExpiry: string;
  hasVatInvoice: boolean;
}

export function SellerProfile() {
  const s = useDemoData(async () => ({
    session: await api.getDemoSession(),
    profiles: await api.getBusinessProfiles(),
    suppliers: await api.getSuppliers(),
  }));

  const supplier = s.data?.suppliers.find(p => p.id === s.data?.session.activeSupplierId);
  const profile = s.data?.profiles.find(p => p.id === s.data?.session.activeSupplierId);

  const storageKey = `farmgo-seller-profile-${s.data?.session.activeSupplierId || 'default'}`;
  const [form, setForm] = useState<FormState | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && typeof saved.farmName === 'string') return saved as FormState;
    } catch {
      /* fallback to defaults */
    }
    return null;
  });

  const defaults: FormState = {
    farmName:
      supplier && supplier.name !== 'Nhà vườn Chú Sáu'
        ? supplier.name
        : 'Trang Trại Xanh VietGAP Đà Lạt - Gia Lai',
    ownerName:
      profile && profile.contactName && profile.contactName !== 'Chú Sáu'
        ? profile.contactName
        : 'Nguyễn Văn Năm (Chú Năm)',
    phone:
      supplier && supplier.phone && supplier.phone !== '0900000001'
        ? supplier.phone
        : '0918 234 567',
    taxCode:
      supplier && supplier.taxCode && supplier.taxCode !== 'DEMO-MST-NCC-01'
        ? supplier.taxCode
        : '5801234567',
    gardenAddress:
      supplier && supplier.gardenAddress && supplier.gardenAddress !== 'Vườn demo, Lâm Đồng'
        ? supplier.gardenAddress
        : 'Tổ 5, Thôn Lạc Trường, Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng (Kho tiếp vận Pleiku, Tỉnh Gia Lai)',
    vietGapCode: 'VietGAP-BDL-2024-8839',
    vietGapExpiry: '2027',
    hasVatInvoice: true,
  };

  const f = form ?? defaults;
  const [message, setMessage] = useState('');

  const handleSave = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(f));
      setMessage('Đã lưu cập nhật hồ sơ trang trại thành công!');
    } catch {
      setMessage('Không lưu được cập nhật. Vui lòng thử lại.');
    }
  };

  const update = (patch: Partial<FormState>) => {
    const next = { ...f, ...patch };
    setForm(next);
    setMessage('');
  };

  if (!s.data) return s.error ? <ErrorMessage message={s.error} /> : <LoadingSpinner />;

  return (
    <div className="seller-profile-wrapper">
      <section className="seller-panel seller-profile-farm">
        <div className="page-heading">
          <div>
            <h1>Thông Tin Hồ Sơ Trang Trại / Nhà Vườn</h1>
            <p>Thông tin này hiển thị công khai trên ứng dụng mua hàng của các Bếp Trưởng / Nhà Hàng B2B</p>
          </div>
        </div>

        {s.error && <ErrorMessage message={s.error} />}

        <div className="farm-profile-form">
          <div className="form-grid">
            <label>
              <span className="farm-field-label">Tên trang trại / nhà vườn</span>
              <input
                type="text"
                value={f.farmName}
                onChange={e => update({ farmName: e.target.value })}
                placeholder="Nhập tên trang trại / nhà vườn"
              />
            </label>
            <label>
              <span className="farm-field-label">Chủ hộ / Người đại diện</span>
              <input
                type="text"
                value={f.ownerName}
                onChange={e => update({ ownerName: e.target.value })}
                placeholder="Họ và tên người đại diện"
              />
            </label>
          </div>

          <div className="form-grid">
            <label>
              <span className="farm-field-label">Số điện thoại liên hệ pick-up</span>
              <input
                type="tel"
                value={f.phone}
                onChange={e => update({ phone: e.target.value })}
                placeholder="Số điện thoại đón xe hàng"
              />
            </label>
            <label>
              <span className="farm-field-label">Mã số thuế / MST hộ kinh doanh</span>
              <input
                type="text"
                value={f.taxCode}
                onChange={e => update({ taxCode: e.target.value })}
                placeholder="Mã số thuế đăng ký"
              />
            </label>
          </div>

          <label className="farm-address-field">
            <span className="farm-field-label">Địa chỉ chi tiết vườn (để xe tải tới lấy hàng)</span>
            <input
              type="text"
              value={f.gardenAddress}
              onChange={e => update({ gardenAddress: e.target.value })}
              placeholder="Địa chỉ cụ thể kèm hướng dẫn đường xe tải"
            />
          </label>

          <div className="farm-badges">
            <div className="farm-badge farm-badge-gap">
              <div className="farm-badge-header">
                <div className="farm-badge-title">
                  <span className="farm-shield-icon" aria-hidden="true">🛡️</span>
                  <strong>Chứng nhận VietGAP / GlobalGAP</strong>
                </div>
                <span className="farm-badge-tag">ĐÃ KIỂM DUYỆT</span>
              </div>
              <small>Mã số: {f.vietGapCode} (Hiệu lực đến {f.vietGapExpiry})</small>
            </div>

            <label className="farm-badge farm-badge-vat">
              <div className="farm-badge-header">
                <input
                  type="checkbox"
                  checked={f.hasVatInvoice}
                  onChange={e => update({ hasVatInvoice: e.target.checked })}
                />
                <strong>Có Khả Năng Xuất Hóa Đơn VAT Điện Tử</strong>
              </div>
              <small>Thu hút các chuỗi nhà hàng lớn và khách sạn 5 sao đặt hàng sỉ.</small>
            </label>
          </div>

          <div className="seller-actions">
            {message && <p role="status" className="farm-save-msg">{message}</p>}
            <button className="btn-primary btn-save-farm" type="button" onClick={handleSave}>
              Lưu Cập Nhật Hồ Sơ
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
