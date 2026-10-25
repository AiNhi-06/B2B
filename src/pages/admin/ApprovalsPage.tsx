import { useState } from 'react';
import * as api from '../../services/demoService';
import type { BusinessProfile } from '../../types';
import { useDemoData } from '../../components/shared/useDemoData';
import { ErrorMessage } from '../../components/shared/Feedback';

const approvalLabels = { DRAFT: 'Bản nháp', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Cần bổ sung' };

type RunAction = (action: () => Promise<unknown>) => Promise<boolean>;

function Application({ profile, busy, run }: { profile: BusinessProfile; busy: boolean; run: RunAction }) {
  const [note, setNote] = useState('');
  const status = profile.legacy && !profile.submittedAt ? 'Dữ liệu cũ · Chưa thẩm định' : approvalLabels[profile.status];

  return <article className={`card admin-application-card${profile.status === 'PENDING' ? ' is-pending' : ''}`}>
    <div className="approval-card-main">
      <div className="admin-application-heading"><h3>{profile.businessName}</h3><span className={`governance-badge approval-status-${profile.status.toLowerCase()}`}>{status}</span></div>
      <div className="admin-application-details">
        <p><strong>{profile.role === 'SUPPLIER' ? 'Nhà cung cấp' : 'Bên mua'}</strong><span>MST {profile.taxCode || 'chưa khai'}</span><span>{profile.phone}</span></p>
        <p>{profile.contactName && <><span>{profile.contactName}</span><i>·</i></>}<span>{profile.address || 'Chưa khai địa chỉ'}</span></p>
        {profile.role === 'SUPPLIER' && <p><span>Năng lực</span><strong>{profile.capacityKg !== undefined ? `${profile.capacityKg.toLocaleString('vi-VN')} kg` : 'Chưa khai'}</strong></p>}
      </div>
      <div className="evidence-row">{profile.certificateImage && <img className="evidence-photo" src={profile.certificateImage} alt="Chứng nhận VSATTP do nhà cung cấp gửi" />}{profile.vietGapImage && <img className="evidence-photo" src={profile.vietGapImage} alt="Chứng nhận VietGAP do nhà cung cấp gửi" />}</div>
      {profile.rejectionReason && <p className="approval-rejection-reason">{profile.rejectionReason}</p>}
    </div>
    {profile.status === 'PENDING' && <div className="approval-review-form">
      <label>Lý do / ghi chú<input value={note} onChange={event => setNote(event.target.value)} placeholder="Nhập ghi chú xét duyệt" /></label>
      <div className="action-row"><button disabled={busy} className="btn-primary" onClick={() => void run(() => api.reviewBusinessProfile({ id: profile.id, approved: true, note }))}>Duyệt hồ sơ</button><button disabled={busy} className="btn-secondary" onClick={() => void run(() => api.reviewBusinessProfile({ id: profile.id, approved: false, note }))}>Từ chối & yêu cầu bổ sung</button></div>
    </div>}
  </article>;
}

export function ApprovalsPage() {
  const s = useDemoData(api.getBusinessProfiles);
  const pending = (s.data ?? []).filter(profile => profile.status === 'PENDING');
  const other = (s.data ?? []).filter(profile => profile.status !== 'PENDING');
  const renderApplications = (profiles: BusinessProfile[]) => <div className="admin-application-grid">{profiles.map(profile => <Application key={profile.id} profile={profile} busy={s.busy} run={s.run} />)}</div>;

  return <><div className="page-heading"><div><h1>Duyệt doanh nghiệp</h1><p>Quyết định mô phỏng; không xác minh MST hoặc chứng nhận thật.</p></div></div>
    {s.error && <ErrorMessage message={s.error} />}
    {s.data && <div className="admin-approval-groups">
      <section className="admin-approval-group"><header><div><h2>Hồ sơ chờ duyệt</h2><p>Cần xem xét thông tin trước khi kích hoạt tài khoản.</p></div><span>{pending.length}</span></header>{pending.length ? renderApplications(pending) : <div className="card admin-approval-empty">Không có hồ sơ nào đang chờ duyệt.</div>}</section>
      {other.length > 0 && <section className="admin-approval-group"><header><div><h2>Hồ sơ đã ghi nhận</h2><p>Hồ sơ cũ và các quyết định đã xử lý.</p></div><span>{other.length}</span></header>{renderApplications(other)}</section>}
    </div>}
  </>;
}
