import { useMemo, useState } from 'react';
import * as api from '../../services/demoService';
import type { BusinessProfile } from '../../types';
import { useDemoData } from '../../components/shared/useDemoData';
import { ErrorMessage } from '../../components/shared/Feedback';

const approvalLabels = { DRAFT: 'Bản nháp', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Cần bổ sung' };
type RunAction = (action: () => Promise<unknown>) => Promise<boolean>;

function ApprovalRow({ profile, busy, run, expanded, onToggle }: { profile: BusinessProfile; busy: boolean; run: RunAction; expanded: boolean; onToggle: () => void }) {
  const [note, setNote] = useState('');
  const status = profile.legacy && !profile.submittedAt ? 'Dữ liệu cũ · Chưa thẩm định' : approvalLabels[profile.status];
  const docs = [profile.certificateImage && 'VSATTP', profile.vietGapImage && 'VietGAP'].filter(Boolean) as string[];
  return <>
    <tr className={expanded ? 'approval-table-row is-expanded' : 'approval-table-row'}>
      <td><strong className="approval-business-name">{profile.businessName}</strong><small className="approval-business-meta">{profile.phone}</small></td>
      <td>{profile.taxCode || <span className="supplier-missing-value">Chưa khai</span>}</td>
      <td><strong>{profile.role === 'SUPPLIER' ? 'Nhà cung cấp' : 'Bên mua'}</strong><small className="approval-business-meta">{profile.contactName || 'Chưa có người đại diện'}</small></td>
      <td>{docs.length ? <span className="approval-doc-summary">{docs.join(' · ')}</span> : <span className="supplier-missing-value">Chưa có tệp</span>}</td>
      <td><span className={`approval-table-status approval-status-${profile.status.toLowerCase()}`}>{status}</span></td>
      <td><button className={profile.status === 'PENDING' ? 'btn-primary approval-open-button' : 'btn-secondary approval-open-button'} type="button" aria-expanded={expanded} onClick={onToggle}>{expanded ? 'Đóng hồ sơ' : profile.status === 'PENDING' ? 'Thẩm định' : 'Xem hồ sơ'}</button></td>
    </tr>
    {expanded && <tr className="approval-expanded-row"><td colSpan={6}><div className="approval-expanded-panel">
      <div className="approval-expanded-facts">
        <div><span>Địa chỉ</span><strong>{profile.address || 'Chưa khai địa chỉ'}</strong></div>
        <div><span>Điện thoại</span><strong>{profile.phone}</strong></div>
        {profile.role === 'SUPPLIER' && <div><span>Năng lực cung ứng</span><strong>{profile.capacityKg !== undefined ? `${profile.capacityKg.toLocaleString('vi-VN')} kg` : 'Chưa khai'}</strong></div>}
        <div><span>Tình trạng dữ liệu</span><strong>{profile.legacy ? 'Hồ sơ cũ · dữ liệu demo' : 'Hồ sơ demo đã nộp'}</strong></div>
      </div>
      {profile.rejectionReason && <p className="approval-rejection-reason">Lý do yêu cầu bổ sung: {profile.rejectionReason}</p>}
      <div className="evidence-row">{profile.certificateImage && <img className="evidence-photo" src={profile.certificateImage} alt="Chứng nhận VSATTP do nhà cung cấp gửi" />}{profile.vietGapImage && <img className="evidence-photo" src={profile.vietGapImage} alt="Chứng nhận VietGAP do nhà cung cấp gửi" />}</div>
      {profile.status === 'PENDING' && <div className="approval-review-form"><label>Lý do / ghi chú<input value={note} onChange={event => setNote(event.target.value)} placeholder="Nhập ghi chú xét duyệt" /></label><div className="action-row"><button disabled={busy} className="btn-primary" onClick={() => void run(() => api.reviewBusinessProfile({ id: profile.id, approved: true, note }))}>Duyệt hồ sơ</button><button disabled={busy} className="btn-secondary" onClick={() => void run(() => api.reviewBusinessProfile({ id: profile.id, approved: false, note }))}>Từ chối & yêu cầu bổ sung</button></div></div>}
    </div></td></tr>}
  </>;
}

export function ApprovalsPage() {
  const s = useDemoData(api.getBusinessProfiles);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string>();
  const filtered = useMemo(() => (s.data ?? []).filter(profile => {
    const text = `${profile.businessName} ${profile.taxCode} ${profile.phone} ${profile.contactName}`.toLocaleLowerCase('vi');
    return text.includes(query.trim().toLocaleLowerCase('vi')) && (statusFilter === 'ALL' || profile.status === statusFilter);
  }).sort((a, b) => (a.status === 'PENDING' ? 0 : 1) - (b.status === 'PENDING' ? 0 : 1) || a.businessName.localeCompare(b.businessName, 'vi')), [query, s.data, statusFilter]);

  return <><div className="page-heading"><div><h1>Duyệt doanh nghiệp</h1><p>Danh sách hồ sơ bên mua và nhà cung cấp; thao tác duyệt dùng dữ liệu mô phỏng.</p></div></div>
    {s.error && <ErrorMessage message={s.error} />}
    {s.data && <section className="card approval-directory-card">
      <div className="approval-toolbar"><label className="sr-only" htmlFor="approval-search">Tìm doanh nghiệp</label><input id="approval-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên quán, MST, người đại diện…" /><label className="sr-only" htmlFor="approval-status-filter">Lọc trạng thái</label><select id="approval-status-filter" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="ALL">Tất cả trạng thái</option><option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Cần bổ sung</option><option value="DRAFT">Bản nháp</option></select></div>
      <div className="table-responsive approval-table-scroll"><table className="data-table approval-table"><thead><tr><th>Tên doanh nghiệp / quán F&B</th><th>Mã số thuế</th><th>Loại hình & đại diện</th><th>Hồ sơ đính kèm</th><th>Trạng thái</th><th>Thao tác thẩm định</th></tr></thead><tbody>
        {filtered.map(profile => <ApprovalRow key={profile.id} profile={profile} busy={s.busy} run={s.run} expanded={expandedId === profile.id} onToggle={() => setExpandedId(expandedId === profile.id ? undefined : profile.id)} />)}
        {filtered.length === 0 && <tr><td colSpan={6} className="approval-table-empty">Không tìm thấy hồ sơ phù hợp.</td></tr>}
      </tbody></table></div>
      <footer className="approval-table-footer"><span>{filtered.length} hồ sơ hiển thị</span><span>Thẩm định trong chế độ mô phỏng</span></footer>
    </section>}
  </>;
}
