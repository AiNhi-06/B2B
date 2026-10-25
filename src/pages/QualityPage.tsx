import { useState } from 'react';
import * as api from '../services/demoService';
import type { ProductListing, QualityReview } from '../types';
import { useDemoData } from '../components/shared/useDemoData';
import { ErrorMessage } from '../components/shared/Feedback';
import { FruitPhoto } from '../components/shared/FruitPhoto';
function QualityForm({ product, qc, admin, busy, run }: { product: ProductListing; qc?: QualityReview; admin: boolean; busy: boolean; run: (action: () => Promise<unknown>) => Promise<boolean> }) {
  const [grade, setGrade] = useState<'A' | 'B'>(qc?.grade ?? 'A'); const [yieldValue, setYield] = useState(qc?.yieldPercent?.toString() ?? ''); const [brix, setBrix] = useState(qc?.brix?.toString() ?? ''); const [note, setNote] = useState('');
  const statusLabel = qc ? ({ PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Cần bổ sung' }[qc.status]) : product.legacy ? 'Dữ liệu cũ' : 'Chưa nộp QC';
  return <article className={`card admin-quality-card${qc ? ` quality-status-${qc.status.toLowerCase()}` : ''}`}>
    <div className="quality-title"><div className="cart-photo"><FruitPhoto id={product.commodityId || product.id} name={product.name} imageUrl={product.imageUrl} /></div><div className="quality-heading-copy">
      <div className="quality-heading-row"><h2>{product.name}</h2><span className={`quality-status-pill${qc ? ` quality-pill-${qc.status.toLowerCase()}` : ' quality-pill-legacy'}`}>{statusLabel}</span></div>
      {qc ? <div className="quality-metrics"><span>Lần {qc.revision}</span><span>Hạng {qc.grade}</span><span>Yield {qc.yieldPercent ?? '—'}%</span><span>Brix {qc.brix ?? '—'}</span></div> : <p className="quality-empty-state">{product.legacy ? 'Chưa có hồ sơ thẩm định.' : 'Chưa nộp thông tin kiểm định.'}</p>}
      {qc?.note && <p className="quality-note">{qc.note}</p>}
    </div></div>
    {admin ? qc?.status === 'PENDING' && <><label>Ghi chú xét QC<input value={note} onChange={e => setNote(e.target.value)} /></label><div className="action-row"><button disabled={busy} className="btn-primary" onClick={() => void run(() => api.reviewProductQC({ productId: product.id, approved: true, note }))}>Duyệt QC</button><button disabled={busy} className="btn-secondary" onClick={() => void run(() => api.reviewProductQC({ productId: product.id, approved: false, note }))}>Từ chối</button></div></> : <form onSubmit={e => { e.preventDefault(); void run(() => api.submitProductQC({ productId: product.id, grade, ...(yieldValue !== '' ? { yieldPercent: Number(yieldValue) } : {}), ...(brix !== '' ? { brix: Number(brix) } : {}) })); }}><div className="form-grid"><label>Phân hạng<select value={grade} onChange={e => setGrade(e.target.value as 'A' | 'B')}><option>A</option><option>B</option></select></label><label>Yield (%)<input type="number" min="0.01" max="100" step="0.01" value={yieldValue} onChange={e => setYield(e.target.value)} /></label><label>Brix (tùy chọn)<input type="number" min="0" max="100" step="0.1" value={brix} onChange={e => setBrix(e.target.value)} /></label></div><p>Yield bắt buộc để duyệt. Gửi lại QC sẽ tạm ngừng catalog; đổi giá giữ nguyên QC.</p><button disabled={busy} className="btn-primary">Gửi QC</button></form>}
  </article>;
}
export function QualityPage() {
  const s = useDemoData(async () => { const session = await api.getDemoSession(); const suppliers = await api.getSuppliers(); return { session, reviews: await api.getQualityReviews(), products: (await Promise.all((session.role === 'ADMIN' ? suppliers.map(s => s.id) : [session.activeSupplierId!]).map(api.getSupplierListings))).flat() }; });
  return <><div className="page-heading"><div><h1>Chất lượng & QC</h1><p>Phân hạng, Yield và Brix do NCC khai; Admin xét duyệt mô phỏng.</p></div></div>{s.error && <ErrorMessage message={s.error} />}{s.data?.products && <div className="admin-quality-grid">{s.data.products.map(p => <QualityForm key={`${p.id}-${s.data!.session.role}-${s.data!.reviews.find(q => q.productId === p.id)?.revision}`} product={p} qc={s.data!.reviews.find(q => q.productId === p.id)} admin={s.data!.session.role === 'ADMIN'} busy={s.busy} run={s.run} />)}</div>}</>;
}
