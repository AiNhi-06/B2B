import { useState } from 'react';
import * as api from '../services/demoService';
import type { Withdrawal } from '../types';
import { useDemoData } from '../components/shared/useDemoData';
import { ErrorMessage } from '../components/shared/Feedback';
import { money } from '../components/shared/useCatalog';
function WithdrawalReview({ w, busy, run }: { w: Withdrawal; busy: boolean; run: (a: () => Promise<unknown>) => Promise<boolean> }) {
  const [note, setNote] = useState(''); return <div className="card"><h3>{w.id} · {money(w.amountVnd)}</h3><p>NCC {w.supplierId} · {({PENDING:'Chờ duyệt',APPROVED:'Đã duyệt',REJECTED:'Từ chối'})[w.status]} · {w.note}</p>{w.status === 'PENDING' && <><label>Ghi chú rút tiền<input value={note} onChange={e => setNote(e.target.value)} /></label><div className="action-row"><button className="btn-primary" disabled={busy} onClick={() => void run(() => api.reviewWithdrawal({ withdrawalId: w.id, approved: true, note }))}>Duyệt rút tiền</button><button className="btn-secondary" disabled={busy} onClick={() => void run(() => api.reviewWithdrawal({ withdrawalId: w.id, approved: false, note }))}>Từ chối</button></div></>}</div>;
}
export function FinancePage() {
  const s = useDemoData(async () => ({ finance: await api.getFinance(), session: await api.getDemoSession(), orders: await api.getAllOrders(), claims: await api.getClaims(), suppliers: await api.getSuppliers(), now: await api.getDemoClock() }));
  const [amount, setAmount] = useState(''); const admin = s.data?.session.role === 'ADMIN'; const supplier = s.data?.session.role === 'SUPPLIER';
  const withdraw = () => s.run(async () => {
    const supplierId = s.data!.session.activeSupplierId!; const amountVnd = Number(amount); const storageKey = `farmgo-withdraw-attempt-${supplierId}`;
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as { amountVnd: number; key: string } | null;
    const request = saved?.amountVnd === amountVnd ? saved : { amountVnd, key: crypto.randomUUID() };
    localStorage.setItem(storageKey, JSON.stringify(request)); await api.requestWithdrawal({ supplierId, amountVnd, requestKey: request.key });
    localStorage.removeItem(storageKey); setAmount('');
  });
  return <><div className="page-heading"><div><h1>Escrow & đối soát</h1><p>Giao dịch mô phỏng, thao tác duyệt thủ công. Không gọi ngân hàng.</p></div></div>{s.error && <ErrorMessage message={s.error} />}
    <div className="finance-stats">{s.data?.finance.balances.map(b => <section className="card" key={b.supplierId}><h2>{s.data!.suppliers.find(p=>p.id===b.supplierId)?.name || b.supplierId}</h2><p>Khả dụng <strong>{money(b.availableVnd)}</strong></p><p>Chờ duyệt rút: {money(b.reservedVnd)}</p><p>Đã rút: {money(b.paidVnd)}</p></section>)}</div>
    {supplier && <section className="card"><h2>Yêu cầu rút tiền</h2><p>Yêu cầu chờ duyệt sẽ giữ chỗ số tiền này.</p><label>Số tiền VND<input type="number" min="1" step="1" value={amount} onChange={e => setAmount(e.target.value)} /></label><button disabled={s.busy || !amount} className="btn-primary" onClick={() => void withdraw()}>Gửi yêu cầu rút</button></section>}
    <section className="card"><h2>Phân bổ tiền hàng theo NCC</h2><p>Phí sàn 3% trên tiền hàng sau hoàn, làm tròn VND một lần. Phí giao theo dõi riêng, không vào số dư NCC.</p>{s.data?.finance.allocations.length === 0 && <p>Chưa có thanh toán Escrow. Đơn cũ không được tạo giao dịch hồi tố.</p>}<div className="table-responsive"><table className="data-table"><thead><tr><th>Đơn / NCC</th><th>Tiền hàng</th><th>Đã hoàn</th><th>Còn giữ</th><th>Phí sàn</th><th>NCC nhận</th><th>Đối soát</th></tr></thead><tbody>{s.data?.finance.allocations.map(a => {
      const o = s.data!.orders.find(o => o.id === a.orderId); const open = s.data!.claims.some(c => c.orderId === a.orderId && c.supplierId === a.supplierId && api.openClaim(c)); const due = !!o?.deliveredAt && Date.parse(s.data!.now) >= Date.parse(o.deliveredAt) + 7200000;
      return <tr key={a.id}><td>{a.orderId}<br />{s.data!.suppliers.find(p=>p.id===a.supplierId)?.name || a.supplierId}</td><td>{money(a.goodsVnd)}</td><td>{money(a.refundedVnd)}</td><td>{money(a.status === 'HELD' ? a.goodsVnd - a.refundedVnd : 0)}</td><td>{a.feeVnd !== undefined ? money(a.feeVnd) : 'Chưa đối soát'}</td><td>{a.supplierNetVnd !== undefined ? money(a.supplierNetVnd) : 'Chưa đối soát'}</td><td>{a.status === 'SETTLED' ? 'Đã đối soát' : open ? 'Khóa: khiếu nại mở' : !due ? 'Chờ giao + 2 giờ' : admin ? <button disabled={s.busy} className="btn-primary" onClick={() => void s.run(() => api.settleEscrow({ orderId: a.orderId, supplierId: a.supplierId }))}>Duyệt đối soát</button> : 'Chờ Admin duyệt'}</td></tr>;
    })}</tbody></table></div></section>
    <section className="card"><h2>Phí giao theo dõi riêng</h2>{s.data?.orders.filter(o => s.data!.finance.allocations.some(a => a.orderId === o.id)).map(o => <p key={o.id}>{o.id}: {money(o.shippingFeeVnd)} · không tính phí sàn</p>)}</section>
    {(admin || supplier) && <section className="card"><h2>Yêu cầu rút tiền</h2>{s.data?.finance.withdrawals.length === 0 && <p>Chưa có yêu cầu.</p>}{s.data?.finance.withdrawals.map(w => admin ? <WithdrawalReview key={w.id} w={w} busy={s.busy} run={s.run} /> : <p key={w.id}>{w.id} · {money(w.amountVnd)} · {({PENDING:'Chờ duyệt',APPROVED:'Đã duyệt',REJECTED:'Từ chối'})[w.status]} {w.note && `· ${w.note}`}</p>)}</section>}
    <section className="card"><h2>Sổ giao dịch</h2><div className="table-responsive"><table className="data-table"><thead><tr><th>Mã</th><th>Nghiệp vụ</th><th>Tham chiếu</th><th>Số tiền</th><th>Thời gian</th></tr></thead><tbody>{s.data?.finance.ledger.map(e => <tr key={e.id}><td>{e.id}</td><td>{({ HOLD: 'Giữ tiền', REFUND: 'Hoàn tiền', SETTLEMENT: 'Đối soát', WITHDRAWAL: 'Rút tiền' })[e.kind]}</td><td>{e.orderId || e.withdrawalId} {e.claimId}</td><td>{money(e.amountVnd)}</td><td>{new Date(e.createdAt).toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div></section></>;
}
