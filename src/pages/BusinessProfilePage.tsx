import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/demoService';
import type { BusinessProfile, BusinessRole } from '../types';
import { useDemoData } from '../components/shared/useDemoData';
import { prepareProductPhoto } from '../components/shared/prepareProductPhoto';
import { ErrorMessage } from '../components/shared/Feedback';
export const approvalLabels = { DRAFT: 'Bản nháp', PENDING: 'Chờ duyệt demo', APPROVED: 'Đã duyệt demo', REJECTED: 'Cần bổ sung' };
export function BusinessProfilePage() {
  const navigate = useNavigate();
  const state = useDemoData(async () => ({ session: await api.getDemoSession(), profiles: await api.getBusinessProfiles() }));
  const [form, setForm] = useState<BusinessProfile>(); const [phone, setPhone] = useState(''); const [otp, setOtp] = useState(''); const [role, setRole] = useState<BusinessRole>('CUSTOMER'); const [processing, setProcessing] = useState(false);
  const id = state.data?.session.role === 'SUPPLIER' ? state.data.session.activeSupplierId : state.data?.session.activeCustomerId;
  const current = state.data?.profiles.find(p => p.id === id);
  useEffect(() => { setForm(current); }, [current]);
  const auth = (register: boolean) => state.run(async () => { await (register ? api.registerDemoBusiness : api.loginDemo)({ role, phone, otp }); navigate(role === 'CUSTOMER' ? '/customer/profile' : '/supplier/profile'); });
  const upload = async (file: File | undefined, key: 'certificateImage' | 'vietGapImage') => { if (!file) return; setProcessing(true); await state.run(async () => { const image = await prepareProductPhoto(file); setForm(p => p ? { ...p, [key]: image } : p); }); setProcessing(false); };
  return <><div className="page-heading"><div><h1>Hồ sơ doanh nghiệp</h1><p>Tài khoản, OTP và chứng nhận chỉ phục vụ demo.</p></div></div>{state.error && <ErrorMessage message={state.error} />}
    {form && <section className="card"><div className="section-heading"><h2>{form.businessName}</h2><span className="governance-badge">{form.legacy && !form.submittedAt ? 'Demo cũ — chưa thẩm định' : approvalLabels[form.status]}</span></div>
      <p>Chưa được duyệt: xem danh mục, sửa hồ sơ và chuẩn bị lô nháp; chưa đặt hàng hoặc mở bán. Việc duyệt không ảnh hưởng đơn đã có.</p>{form.rejectionReason && <p role="status">Lý do: {form.rejectionReason}</p>}
      <form onSubmit={e => { e.preventDefault(); void state.run(async () => { const { businessName, taxCode, contactName, address, capacityKg, certificateImage, vietGapImage } = form; await api.saveBusinessProfile({ id: form.id, changes: { businessName, taxCode, contactName, address, ...(capacityKg !== undefined ? { capacityKg } : {}), ...(certificateImage ? { certificateImage } : {}), ...(vietGapImage ? { vietGapImage } : {}) } }); }); }}>
        <div className="form-grid">{(['businessName', 'taxCode', 'contactName', 'address'] as const).map((key, index) => <label key={key}>{['Tên doanh nghiệp', 'MST demo', 'Người liên hệ', 'Địa chỉ'][index]}<input required value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}<label>SĐT đăng nhập<input type="tel" value={form.phone} readOnly /></label>
        {form.role === 'SUPPLIER' && <><label>Năng lực cung ứng (kg)<input type="number" min="1" step="1" value={form.capacityKg ?? ''} onChange={e => setForm({ ...form, capacityKg: Number(e.target.value) })} /></label>{(['certificateImage', 'vietGapImage'] as const).map((key, i) => <label key={key}>{i === 0 ? 'Ảnh VSATTP demo (bắt buộc khi nộp)' : 'Ảnh VietGAP demo (tùy chọn)'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={processing} onChange={e => void upload(e.target.files?.[0], key)} />{form[key] && <img className="evidence-photo" src={form[key]} alt={i === 0 ? 'Chứng nhận VSATTP demo' : 'Chứng nhận VietGAP demo'} />}</label>)}</>}</div>
        <div className="action-row"><button className="btn-secondary" disabled={state.busy || processing}>Lưu bản nháp</button><button type="button" className="btn-primary" disabled={state.busy || processing || form.status === 'PENDING' || form.status === 'APPROVED'} onClick={() => void state.run(() => api.submitBusinessProfile(form.id))}>Nộp hồ sơ đã lưu</button></div>
      </form></section>}
    <section className="card"><h2>Đăng nhập / đăng ký demo</h2><p>OTP hiển thị: <strong>000000</strong>. Không gửi SMS. Dùng dữ liệu giả lập.</p><div className="form-grid"><label>Vai trò<select value={role} onChange={e => setRole(e.target.value as BusinessRole)}><option value="CUSTOMER">Bên mua</option><option value="SUPPLIER">Nhà cung cấp</option></select></label><label>SĐT<input autoComplete="tel" type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></label><label>OTP demo<input autoComplete="one-time-code" inputMode="numeric" value={otp} onChange={e => setOtp(e.target.value)} /></label></div><div className="action-row"><button className="btn-secondary" disabled={state.busy} onClick={() => void auth(false)}>Đăng nhập demo</button><button className="btn-primary" disabled={state.busy} onClick={() => void auth(true)}>Tạo doanh nghiệp demo</button></div></section></>;
}
