import { useState } from 'react';
import * as api from '../services/demoService';
import type { EscrowAllocation, Withdrawal } from '../types';
import { useDemoData } from '../components/shared/useDemoData';
import { ErrorMessage, LoadingSpinner } from '../components/shared/Feedback';
import { money } from '../components/shared/useCatalog';

type RunAction = (action: () => Promise<unknown>) => Promise<boolean>;
const withdrawalStatus = { PENDING: 'Chờ duyệt', APPROVED: 'Đã chuyển khoản demo', REJECTED: 'Đã từ chối' };

function WithdrawalActions({ withdrawal, busy, run }: { withdrawal: Withdrawal; busy: boolean; run: RunAction }) {
  const [note, setNote] = useState('');
  if (withdrawal.status !== 'PENDING') return <span className={`finance-status finance-status-${withdrawal.status.toLowerCase()}`}>{withdrawalStatus[withdrawal.status]}</span>;
  return <div className="finance-row-actions">
    <label className="finance-note-field"><span className="sr-only">Ghi chú xử lý {withdrawal.id}</span><input aria-label={`Ghi chú xử lý ${withdrawal.id}`} value={note} onChange={event => setNote(event.target.value)} placeholder="Ghi chú (bắt buộc nếu từ chối)" /></label>
    <button type="button" className="btn-primary" disabled={busy} onClick={() => void run(() => api.reviewWithdrawal({ withdrawalId: withdrawal.id, approved: true, note }))}>Duyệt rút</button>
    <button type="button" className="btn-secondary" disabled={busy || !note.trim()} onClick={() => void run(() => api.reviewWithdrawal({ withdrawalId: withdrawal.id, approved: false, note }))}>Từ chối</button>
  </div>;
}

export function FinancePage() {
  const s = useDemoData(async () => ({ finance: await api.getFinance(), session: await api.getDemoSession(), orders: await api.getAllOrders(), claims: await api.getClaims(), suppliers: await api.getSuppliers(), now: await api.getDemoClock() }));
  const [amount, setAmount] = useState('');
  const admin = s.data?.session.role === 'ADMIN';
  const supplier = s.data?.session.role === 'SUPPLIER';
  const withdraw = () => s.run(async () => {
    const supplierId = s.data!.session.activeSupplierId!; const amountVnd = Number(amount); const storageKey = `farmgo-withdraw-attempt-${supplierId}`;
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as { amountVnd: number; key: string } | null;
    const request = saved?.amountVnd === amountVnd ? saved : { amountVnd, key: crypto.randomUUID() };
    localStorage.setItem(storageKey, JSON.stringify(request)); await api.requestWithdrawal({ supplierId, amountVnd, requestKey: request.key });
    localStorage.removeItem(storageKey); setAmount('');
  });

  if (!s.data) return <>{s.error ? <ErrorMessage message={s.error} /> : <LoadingSpinner />}</>;
  const { finance, suppliers, orders, claims, now } = s.data;
  const supplierName = (id: string) => suppliers.find(entry => entry.id === id)?.name || id;
  const isEligible = (allocation: EscrowAllocation) => {
    const order = orders.find(entry => entry.id === allocation.orderId);
    const due = !!order?.deliveredAt && Date.parse(now) >= Date.parse(order.deliveredAt) + 2 * 60 * 60 * 1000;
    const openClaim = claims.some(claim => claim.orderId === allocation.orderId && claim.supplierId === allocation.supplierId && api.openClaim(claim));
    return allocation.status === 'HELD' && order?.status === 'DELIVERED' && due && !openClaim;
  };
  const eligible = finance.allocations.filter(isEligible);
  const pendingWithdrawals = finance.withdrawals.filter(withdrawal => withdrawal.status === 'PENDING');
  const heldTotal = finance.ledger.reduce((total, entry) => total + (entry.kind === 'HOLD' ? entry.amountVnd : entry.kind === 'REFUND' || entry.kind === 'SETTLEMENT' ? -entry.amountVnd : 0), 0);
  const platformRevenue = finance.ledger.filter(entry => entry.kind === 'SETTLEMENT').reduce((total, entry) => total + (entry.feeVnd ?? 0), 0);
  const pendingTotal = pendingWithdrawals.reduce((total, withdrawal) => total + withdrawal.amountVnd, 0);

  const settleAll = () => s.run(async () => {
    for (const allocation of eligible) await api.settleEscrow({ orderId: allocation.orderId, supplierId: allocation.supplierId });
  });

  return <div className="finance-page">
    <div className="page-heading finance-page-heading"><div><h1>{admin ? 'Đối soát thanh toán & quản lý ví Escrow' : 'Escrow & đối soát'}</h1><p>{admin ? 'Theo dõi tiền hàng đang giữ, phí nền tảng và lệnh giải ngân.' : 'Giao dịch mô phỏng, thao tác duyệt thủ công. Không gọi ngân hàng.'}</p></div>
      {admin && <button type="button" className="btn-primary finance-batch-button" disabled={s.busy || eligible.length === 0} onClick={() => void settleAll()}>Duyệt quyết toán đủ điều kiện ({eligible.length})</button>}
    </div>
    {s.error && <ErrorMessage message={s.error} />}

    {admin && <div className="finance-overview" aria-label="Tổng quan đối soát">
      <section className="card finance-overview-card"><span>Tiền đang giữ trong Escrow</span><strong>{money(heldTotal)}</strong><small>Số dư từ sổ giao dịch demo</small></section>
      <section className="card finance-overview-card finance-overview-fees"><span>Phí nền tảng đã ghi nhận</span><strong>{money(platformRevenue)}</strong><small>3% trên tiền hàng đã đối soát</small></section>
      <section className="card finance-overview-card finance-overview-pending"><span>Lệnh chờ rút tiền</span><strong>{money(pendingTotal)}</strong><small>{pendingWithdrawals.length} yêu cầu đang chờ duyệt</small></section>
    </div>}

    {supplier && <section className="card finance-withdraw-box"><div><h2>Yêu cầu rút tiền</h2><p>Yêu cầu đang chờ sẽ giữ chỗ số dư khả dụng.</p></div><label>Số tiền VND<input type="number" min="1" step="1" value={amount} onChange={event => setAmount(event.target.value)} /></label><button disabled={s.busy || !amount} className="btn-primary" onClick={() => void withdraw()}>Gửi yêu cầu rút</button></section>}
    {supplier && <div className="finance-overview finance-supplier-balances">{finance.balances.map(balance => <section className="card finance-overview-card" key={balance.supplierId}><span>Số dư khả dụng · {supplierName(balance.supplierId)}</span><strong>{money(balance.availableVnd)}</strong><small>Đang giữ chỗ {money(balance.reservedVnd)} · Đã rút {money(balance.paidVnd)}</small></section>)}</div>}

    <section className="card finance-section finance-settlement-section">
      <header className="finance-section-heading"><div><h2>Sổ cái dòng tiền Escrow & yêu cầu giải ngân</h2><p>Phí 3% tính trên tiền hàng sau hoàn; phí giao được theo dõi riêng.</p></div><span>{finance.allocations.length} khoản</span></header>
      {finance.allocations.length === 0 ? <p className="finance-empty">Chưa có thanh toán Escrow demo. Đơn cũ không được tạo giao dịch hồi tố.</p> : <div className="table-responsive finance-table-scroll"><table className="data-table finance-table"><thead><tr><th>Mã yêu cầu</th><th>Nhà cung cấp</th><th>Tiền hàng</th><th>Phí sàn (3%)</th><th>NCC nhận</th><th>Thông tin nhận tiền</th><th>Xử lý lệnh</th></tr></thead><tbody>
        {finance.allocations.map(allocation => {
          const order = orders.find(entry => entry.id === allocation.orderId);
          const openClaim = claims.some(claim => claim.orderId === allocation.orderId && claim.supplierId === allocation.supplierId && api.openClaim(claim));
          const due = !!order?.deliveredAt && Date.parse(now) >= Date.parse(order.deliveredAt) + 2 * 60 * 60 * 1000;
          const statusText = allocation.status === 'SETTLED' ? 'Đã đối soát' : openClaim ? 'Khóa: có khiếu nại' : !due ? 'Chờ giao + 2 giờ' : 'Chờ Admin duyệt';
          return <tr key={allocation.id}>
            <td><strong className="finance-request-id">{allocation.orderId}</strong></td><td>{supplierName(allocation.supplierId)}</td>
            <td><strong>{money(allocation.goodsVnd - allocation.refundedVnd)}</strong>{allocation.refundedVnd > 0 && <small className="finance-cell-note">Đã hoàn {money(allocation.refundedVnd)}</small>}</td>
            <td className="finance-fee-value">{allocation.feeVnd !== undefined ? money(allocation.feeVnd) : 'Chưa đối soát'}</td>
            <td className="finance-net-value">{allocation.supplierNetVnd !== undefined ? money(allocation.supplierNetVnd) : 'Chưa đối soát'}</td>
            <td><span className="finance-bank-placeholder">Ví demo · chưa kết nối ngân hàng</span></td>
            <td>{allocation.status === 'SETTLED' ? <span className="finance-status finance-status-approved">✓ Đã đối soát</span> : admin && isEligible(allocation) ? <button className="btn-primary" disabled={s.busy} onClick={() => void s.run(() => api.settleEscrow({ orderId: allocation.orderId, supplierId: allocation.supplierId }))}>Duyệt giải ngân</button> : <span className="finance-status finance-status-pending">{statusText}</span>}</td>
          </tr>;
        })}
      </tbody></table></div>}
    </section>

    {(admin || supplier) && <section className="card finance-section finance-withdrawals-section"><header className="finance-section-heading"><div><h2>Yêu cầu rút tiền của vựa</h2><p>Giải ngân được mô phỏng trong ví FARMGO, chưa chuyển khoản thật.</p></div><span>{pendingWithdrawals.length} chờ duyệt</span></header>
      {finance.withdrawals.length === 0 ? <p className="finance-empty">Chưa có yêu cầu rút tiền.</p> : <div className="table-responsive finance-table-scroll"><table className="data-table finance-table"><thead><tr><th>Mã yêu cầu</th><th>Nhà cung cấp</th><th>Số tiền yêu cầu</th><th>Thời gian</th><th>Trạng thái / thao tác</th></tr></thead><tbody>
        {finance.withdrawals.map(withdrawal => <tr key={withdrawal.id}><td><strong className="finance-request-id">{withdrawal.id}</strong></td><td>{supplierName(withdrawal.supplierId)}</td><td className="finance-net-value"><strong>{money(withdrawal.amountVnd)}</strong></td><td>{new Date(withdrawal.createdAt).toLocaleString('vi-VN')}</td><td><WithdrawalActions withdrawal={withdrawal} busy={s.busy} run={s.run} />{withdrawal.status !== 'PENDING' && withdrawal.note && <small className="finance-cell-note">{withdrawal.note}</small>}</td></tr>)}
      </tbody></table></div>}
    </section>}

    <section className="card finance-section finance-ledger-section"><header className="finance-section-heading"><div><h2>Lịch sử giao dịch</h2><p>Các khoản giữ tiền, hoàn tiền, đối soát và rút tiền demo.</p></div></header>
      <div className="table-responsive finance-table-scroll"><table className="data-table finance-table"><thead><tr><th>Mã giao dịch</th><th>Nghiệp vụ</th><th>Tham chiếu</th><th>Số tiền</th><th>Thời gian</th></tr></thead><tbody>{finance.ledger.map(entry => <tr key={entry.id}><td>{entry.id}</td><td>{({ HOLD: 'Giữ tiền', REFUND: 'Hoàn tiền', SETTLEMENT: 'Đối soát', WITHDRAWAL: 'Rút tiền' })[entry.kind]}</td><td>{entry.orderId || entry.withdrawalId || '—'}{entry.claimId ? ` · ${entry.claimId}` : ''}</td><td><strong>{money(entry.amountVnd)}</strong>{entry.feeVnd !== undefined && <small className="finance-cell-note">Phí {money(entry.feeVnd)}</small>}</td><td>{new Date(entry.createdAt).toLocaleString('vi-VN')}</td></tr>)}</tbody></table></div>
    </section>
  </div>;
}