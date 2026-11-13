import { useState } from 'react';
import type { Claim, Order } from '../../types';
import * as api from '../../services/demoService';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';
import { useDemoData } from '../../components/shared/useDemoData';
import { money } from '../../components/shared/useCatalog';
import './seller-claims.css';

const minute = 60_000;
const resolutionWindow = 120 * minute;
const priorities = [
  { tone: 'normal', label: 'Còn trên 60 phút' },
  { tone: 'soon', label: 'Còn 30–60 phút' },
  { tone: 'urgent', label: 'Còn dưới 30 phút' },
  { tone: 'late', label: 'Quá hạn' },
] as const;
const statuses = {
  OPEN: 'Chờ xử lý',
  RESPONDED: 'Đã phản hồi',
  APPROVED: 'Đã duyệt hoàn',
  REJECTED: 'Từ chối hoàn',
};
const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
});

function getPriority(remaining: number) {
  if (remaining <= 0) return priorities[3];
  if (remaining < 30 * minute) return priorities[2];
  if (remaining <= 60 * minute) return priorities[1];
  return priorities[0];
}

function ClaimCard({ claim, order, customer, now, refunded, busy, run }: {
  claim: Claim; order?: Order; customer: string; now: number; refunded: boolean; busy: boolean;
  run: (action: () => Promise<unknown>) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState('');
  const open = api.openClaim(claim);
  const deadline = Date.parse(claim.submittedAt) + resolutionWindow;
  const remaining = deadline - now;
  const priority = open ? getPriority(remaining) : null;
  const minutesLeft = Math.ceil(remaining / minute);
  const productName = (id: string) => order?.items.find(item => item.productId === id && item.supplierId === claim.supplierId)?.productName ?? id;

  return (
    <article className="seller-claim" data-tone={priority?.tone ?? 'closed'}>
      <header className="seller-claim-header">
        <div><span className="seller-claim-status">{statuses[claim.status]}</span> <span>Đơn <b>{claim.orderId}</b></span></div>
        {priority && <span className="seller-claim-priority">{priority.label}</span>}
      </header>
      <div className="seller-claim-grid">
        <div>
          <h2>{customer}</h2>
          <div className="seller-claim-reason">
            <h3>Sản phẩm khiếu nại</h3>
            <ul>{claim.lines.map(line => <li key={line.productId}>{productName(line.productId)} · <b>{line.quantityKg} kg</b></li>)}</ul>
            <h3>Lý do từ khách hàng</h3>
            <p>{claim.reason}</p>
          </div>
        </div>
        {claim.images.length > 0 && <section className="seller-claim-evidence">
          <h3>Ảnh bằng chứng</h3>
          <div>{claim.images.map((src, index) => <img key={index} src={src} alt={`Ảnh bằng chứng ${index + 1}`} loading="lazy" />)}</div>
        </section>}
        <div className="seller-claim-action">
          {claim.response && <div><h3>Phản hồi đã gửi</h3><p>{claim.response}</p></div>}
          {open ? <form onSubmit={async event => {
            event.preventDefault();
            if (!draft.trim() || busy) return;
            const saved = await run(() => api.respondToClaim({ claimId: claim.id, response: draft.trim() }));
            if (saved) setDraft('');
          }}>
            <label>Phản hồi nhà cung cấp<textarea required rows={3} value={draft} onChange={event => setDraft(event.target.value)} /></label>
            <button type="submit" className="btn-primary" disabled={busy || !draft.trim()}>{claim.response ? 'Gửi phản hồi cập nhật' : 'Gửi phản hồi'}</button>
          </form> : <section>
            <h3>Kết quả xử lý</h3>
            <p><b>{claim.status === 'APPROVED' ? `Hoàn ${money(claim.refundVnd ?? 0)}` : 'Từ chối hoàn tiền'}</b></p>
            {claim.status === 'APPROVED' && <p>{refunded ? 'Đã ghi sổ Escrow' : 'Chưa có giao dịch hoàn qua Escrow'}</p>}
            {!!claim.approvedLines?.length && <ul>{claim.approvedLines.map(line => <li key={line.productId}>{productName(line.productId)} · {line.quantityKg} kg được duyệt</li>)}</ul>}
            {claim.decisionNote && <p>{claim.decisionNote}</p>}
          </section>}
        </div>
      </div>
      {priority && <footer className="seller-claim-deadline">
        <span>Hạn xử lý <time dateTime={new Date(deadline).toISOString()}>{dateTime.format(deadline)}</time></span>
        <strong>{remaining <= 0 ? 'Quá hạn xử lý' : `Còn ${minutesLeft >= 60 ? `${Math.floor(minutesLeft / 60)} giờ ` : ''}${minutesLeft % 60} phút`}</strong>
      </footer>}
    </article>
  );
}

export function SellerClaims() {
  const { data, error, busy, run } = useDemoData(async () => {
    const session = await api.getDemoSession();
    const [claims, orders, customers, clock, finance] = await Promise.all([
      api.getClaims(), api.getAllOrders(), api.getCustomers(), api.getDemoClock(), api.getFinance(),
    ]);
    return {
      claims: claims.filter(claim => claim.supplierId === session.activeSupplierId),
      orders: new Map(orders.map(order => [order.id, order])),
      customers: new Map(customers.map(customer => [customer.id, customer.businessName])),
      refunded: new Set(finance.ledger.filter(entry => entry.kind === 'REFUND').map(entry => entry.claimId)),
      now: Date.parse(clock),
    };
  });

  return <div className="seller-claims">
    <header className="page-heading seller-claims-heading">
      <div><h1>Khiếu nại &amp; bồi thường</h1><p>Thời hạn xử lý là 2 giờ kể từ lúc khách gửi khiếu nại.</p></div>
      <ul className="seller-claims-legend" aria-label="Mức ưu tiên xử lý">
        {priorities.map(priority => <li key={priority.tone} data-tone={priority.tone}>{priority.label}</li>)}
      </ul>
    </header>
    {error && <ErrorMessage message={error} />}
    {!data && !error && <LoadingSpinner />}
    {data?.claims.length === 0 && <p className="seller-panel">Chưa có khiếu nại nào.</p>}
    {data?.claims.map(claim => <ClaimCard key={claim.id} claim={claim} order={data.orders.get(claim.orderId)}
      customer={data.customers.get(claim.customerId) ?? claim.customerId}
      now={data.now} refunded={data.refunded.has(claim.id)} busy={busy} run={run} />)}
  </div>;
}
