import { useState } from 'react';
import * as api from '../services/demoService';
import type { Claim, ClaimLine, Order, Role } from '../types';
import { useDemoData } from '../components/shared/useDemoData';
import { prepareProductPhoto } from '../components/shared/prepareProductPhoto';
import { ErrorMessage } from '../components/shared/Feedback';
import { money } from '../components/shared/useCatalog';
const labels = { OPEN: 'Chờ xử lý', RESPONDED: 'NCC đã phản hồi', APPROVED: 'Đã duyệt hoàn', REJECTED: 'Từ chối' };
function Decision({ claim: c, role, now, busy, run, refunded, order }: { claim: Claim; order?: Order; refunded: boolean; role: Role; now: string; busy: boolean; run: (a: () => Promise<unknown>) => Promise<boolean> }) {
  const [note, setNote] = useState(''); const [lines, setLines] = useState<ClaimLine[]>(c.lines);
  const open = api.openClaim(c); const overdue = open && Date.parse(now) >= Date.parse(c.submittedAt) + 7200000;
  const supplierName = order?.items.find(i => i.supplierId === c.supplierId)?.supplierName || c.supplierId;
  return <article className={`card admin-claim-card claim-status-${c.status.toLowerCase()}`}>
    <header className="claim-card-heading">
      <div><span className="claim-eyebrow">Yêu cầu khiếu nại</span><h2>{c.id}</h2><p>Đơn hàng <strong>{c.orderId}</strong></p></div>
      <span className={`claim-status-pill claim-status-pill-${c.status.toLowerCase()}`}>{labels[c.status]}</span>
    </header>
    <div className="claim-card-facts">
      <div><span>Nhà cung cấp</span><strong>{supplierName}</strong></div>
      <div><span>Thời điểm gửi</span><strong>{new Date(c.submittedAt).toLocaleString('vi-VN')}</strong></div>
      <div><span>Hạn xử lý</span><strong>{new Date(Date.parse(c.submittedAt) + 7200000).toLocaleString('vi-VN')}</strong></div>
    </div>
    {overdue && <p className="sla-warning" role="status">Quá SLA xử lý 2 giờ — cần Admin xét, không tự hoàn.</p>}
    <section className="claim-card-body"><div><span className="claim-section-label">Lý do khiếu nại</span><p>{c.reason}</p></div>
      <div className="claim-lines">{c.lines.map(line => <div key={line.productId}><span>{order?.items.find(i => i.productId === line.productId)?.productName || line.productId}</span><strong>{line.quantityKg} kg yêu cầu</strong></div>)}</div>
      {!!c.approvedLines?.length && <div className="claim-resolution-lines">{c.approvedLines.map(line => <div key={line.productId}><span>Khối lượng được duyệt</span><strong>{order?.items.find(i => i.productId === line.productId)?.productName || line.productId} · {line.quantityKg} kg</strong></div>)}</div>}
      {c.images.length > 0 && <div className="claim-evidence"><span className="claim-section-label">Ảnh bằng chứng</span><div className="evidence-row">{c.images.map((src, i) => <img key={i} src={src} className="evidence-photo" alt={`Ảnh bằng chứng ${i + 1}`} />)}</div></div>}
      {c.response && <div className="claim-note"><span>Phản hồi nhà cung cấp</span><p>{c.response}</p></div>}
      {c.decisionNote && <div className="claim-note claim-note-resolution"><span>Kết quả xử lý · Hoàn {money(c.refundVnd ?? 0)}{c.status === 'APPROVED' ? (refunded ? ' · Đã ghi sổ Escrow' : ' · Không có giao dịch Escrow') : ''}</span><p>{c.decisionNote}</p></div>}
    </section>
    {open && role !== 'CUSTOMER' && <form className="claim-decision-form" onSubmit={event => event.preventDefault()}>
      <div className="claim-decision-fields">
        {role === 'ADMIN' && <div className="form-grid">{lines.map((line, index) => <label key={line.productId}>Kg duyệt · {order?.items.find(i => i.productId === line.productId)?.productName || line.productId}<input type="number" min="0" max={c.lines.find(item => item.productId === line.productId)!.quantityKg} step="1" value={line.quantityKg} onChange={event => setLines(lines.map((value, i) => i === index ? { ...value, quantityKg: Number(event.target.value) } : value))} /></label>)}</div>}
        <label>{role === 'ADMIN' ? 'Ghi chú quyết định' : 'Phản hồi của nhà cung cấp'}<textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Nhập nội dung xử lý…" /></label>
      </div>
      <div className="action-row">{role === 'ADMIN' ? <><button disabled={busy} className="btn-primary" onClick={() => void run(() => api.decideClaim({ claimId: c.id, approved: true, lines: lines.filter(line => line.quantityKg > 0), note }))}>Duyệt hoàn</button><button disabled={busy} className="btn-secondary" onClick={() => void run(() => api.decideClaim({ claimId: c.id, approved: false, note }))}>Từ chối</button></> : <button disabled={busy} className="btn-primary" onClick={() => void run(() => api.respondToClaim({ claimId: c.id, response: note }))}>Gửi phản hồi</button>}</div>
    </form>}
  </article>;
}
function ClaimForm({ orders, now, busy, run }: { orders: Order[]; now: string; busy: boolean; run: (a: () => Promise<unknown>) => Promise<boolean> }) {
  const [orderId, setOrder] = useState(''); const [supplierId, setSupplier] = useState(''); const [quantities, setQuantities] = useState<Record<string, number>>({}); const [reason, setReason] = useState(''); const [images, setImages] = useState<string[]>([]); const [processing, setProcessing] = useState(false);
  const order = orders.find(o => o.id === orderId); const eligible = orders.filter(o => o.status === 'DELIVERED' && o.deliveredAt && Date.parse(now) < Date.parse(o.deliveredAt) + 7200000);
  const files = async (selected: FileList | null) => { if (!selected) return; setProcessing(true); await run(async () => { if (images.length + selected.length > 3) throw Error('Tối đa ba ảnh; không nhận video.'); const result = await Promise.all(Array.from(selected).map(prepareProductPhoto)); setImages(prev => [...prev, ...result]); }); setProcessing(false); };
  return <section className="card"><h2>Gửi khiếu nại chất lượng</h2><p>Trong 2 giờ từ lúc giao thành công. Không hoàn phí giao, không đổi hàng. Đơn cũ thiếu giờ nhận không khiếu nại hồi tố.</p><form onSubmit={e => { e.preventDefault(); void run(async () => { await api.submitClaim({ orderId, supplierId, lines: Object.entries(quantities).filter(([, kg]) => kg > 0).map(([productId, quantityKg]) => ({ productId, quantityKg })), reason, images }); setReason(''); setImages([]); setQuantities({}); }); }}><div className="form-grid"><label>Đơn còn hạn<select required value={orderId} onChange={e => { setOrder(e.target.value); setSupplier(''); setQuantities({}); }}><option value="">Chọn đơn</option>{eligible.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}</select></label><label>NCC trong đơn<select required value={supplierId} onChange={e => { setSupplier(e.target.value); setQuantities({}); }}><option value="">Chọn NCC</option>{[...new Set(order?.items.map(i => i.supplierId))].filter(Boolean).map(id => <option key={id} value={id}>{order!.items.find(i => i.supplierId === id)?.supplierName || id}</option>)}</select></label></div>{order?.items.filter(i => i.supplierId === supplierId).map(i => <label key={i.productId}>{i.productName} · mua {i.quantityKg} kg<input type="number" min="0" max={i.quantityKg} step="1" value={quantities[i.productId] ?? 0} onChange={e => setQuantities(v => ({ ...v, [i.productId]: Number(e.target.value) }))} /></label>)}<label>Lý do<textarea required value={reason} onChange={e => setReason(e.target.value)} /></label><label>Bằng chứng (tối đa 3 ảnh, được nén trước khi lưu)<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={processing} onChange={e => void files(e.target.files)} /></label><div className="evidence-row">{images.map((src, i) => <div key={i}><img className="evidence-photo" src={src} alt={`Bằng chứng ${i + 1}`} /><button type="button" className="btn-secondary" onClick={() => setImages(images.filter((_, j) => j !== i))}>Bỏ ảnh {i + 1}</button></div>)}</div><button className="btn-primary" disabled={busy || processing || !order || !supplierId}>Gửi khiếu nại</button></form></section>;
}
export function ClaimsPage() {
  const s = useDemoData(async () => { const session = await api.getDemoSession(); return { session, now: await api.getDemoClock(), finance: await api.getFinance(), claims: await api.getClaims(), orders: session.role === 'CUSTOMER' ? await api.getCustomerOrders(session.activeCustomerId!) : await api.getAllOrders() }; });
  return <><div className="page-heading"><div><h1>Khiếu nại & phản hồi</h1><p>Hạn gửi và SLA xử lý được tính từ thời điểm giao hàng.</p></div></div>{s.error && <ErrorMessage message={s.error} />}{s.data?.session.role === 'CUSTOMER' && <ClaimForm key={s.data!.session.activeCustomerId} orders={s.data.orders} now={s.data.now} busy={s.busy} run={s.run} />}{s.data?.claims.length === 0 && <section className="card">Chưa có khiếu nại nào.</section>}{s.data?.claims.map(c => <Decision key={`${c.id}-${s.data!.session.role}`} claim={c} order={s.data!.orders.find(o=>o.id===c.orderId)} refunded={s.data!.finance.ledger.some(e=>e.claimId===c.id && e.kind==='REFUND')} role={s.data!.session.role} now={s.data!.now} busy={s.busy} run={s.run} />)}</>;
}
