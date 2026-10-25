import { Fragment, useState } from 'react';
import * as api from '../services/demoService';
import type { ProductListing, QualityReview } from '../types';
import { useDemoData } from '../components/shared/useDemoData';
import { ErrorMessage } from '../components/shared/Feedback';
import { FruitPhoto } from '../components/shared/FruitPhoto';
import { money } from '../components/shared/useCatalog';

type QualityRun = (action: () => Promise<unknown>) => Promise<boolean>;
const statusLabel = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt niêm yết', REJECTED: 'Cần bổ sung' };

function QualityDetails({ product, supplierName, qc, admin, busy, run }: { product: ProductListing; supplierName: string; qc?: QualityReview; admin: boolean; busy: boolean; run: QualityRun }) {
  const [grade, setGrade] = useState<'A' | 'B'>(qc?.grade ?? 'A');
  const [yieldValue, setYield] = useState(qc?.yieldPercent?.toString() ?? '');
  const [brix, setBrix] = useState(qc?.brix?.toString() ?? '');
  const [note, setNote] = useState('');
  const status = qc ? statusLabel[qc.status] : product.legacy ? 'Dữ liệu cũ' : 'Chưa nộp QC';
  const trueCost = api.calculateTrueCost(product.publicPricePerKg, product.availableKg, qc);

  return <div className="quality-expanded-panel">
    <div className="quality-detail-heading">
      <div className="quality-detail-photo"><FruitPhoto id={product.commodityId || product.id} name={product.name} imageUrl={product.imageUrl} /></div>
      <div><span className="quality-detail-kicker">Chi tiết mặt hàng</span><h3>{product.name}</h3><span className={`quality-status-pill${qc ? ` quality-pill-${qc.status.toLowerCase()}` : ' quality-pill-legacy'}`}>{status}</span></div>
    </div>
    <div className="quality-detail-facts">
      <div><span>Vựa cung cấp</span><strong>{supplierName}</strong></div>
      <div><span>Tồn khả dụng</span><strong>{product.availableKg.toLocaleString('vi-VN')} kg</strong></div>
      <div><span>Giá khai báo</span><strong>{money(product.publicPricePerKg)}/kg</strong></div>
      <div><span>Quy cách</span><strong>{product.packagingLabel || 'Chưa khai báo'}</strong></div>
      <div><span>Phân hạng</span><strong>{qc?.grade ? `Grade ${qc.grade}` : 'Chưa có'}</strong></div>
      <div><span>Brix</span><strong>{qc?.brix !== undefined ? `${qc.brix}°` : 'Chưa có'}</strong></div>
      <div><span>Yield Rate</span><strong>{qc?.yieldPercent !== undefined ? `${qc.yieldPercent}%` : 'Chưa có'}</strong></div>
      <div><span>True-cost B2B</span><strong>{trueCost ? `${money(Math.round(trueCost.costPerUsableKg))}/kg` : 'Chưa đủ dữ liệu'}</strong></div>
    </div>
    {qc?.note && <p className="quality-detail-note"><strong>Ghi chú QC:</strong> {qc.note}</p>}
    {admin ? qc?.status === 'PENDING' && <div className="quality-review-form"><label>Ghi chú xét QC<input value={note} onChange={event => setNote(event.target.value)} placeholder="Nhập ghi chú xét duyệt" /></label><div className="action-row"><button disabled={busy} className="btn-primary" onClick={() => void run(() => api.reviewProductQC({ productId: product.id, approved: true, note }))}>Duyệt QC</button><button disabled={busy} className="btn-secondary" onClick={() => void run(() => api.reviewProductQC({ productId: product.id, approved: false, note }))}>Từ chối</button></div></div> : <form className="quality-submit-form" onSubmit={event => { event.preventDefault(); void run(() => api.submitProductQC({ productId: product.id, grade, ...(yieldValue !== '' ? { yieldPercent: Number(yieldValue) } : {}), ...(brix !== '' ? { brix: Number(brix) } : {}) })); }}><div className="form-grid"><label>Phân hạng<select value={grade} onChange={event => setGrade(event.target.value as 'A' | 'B')}><option>A</option><option>B</option></select></label><label>Yield (%)<input type="number" min="0.01" max="100" step="0.01" value={yieldValue} onChange={event => setYield(event.target.value)} /></label><label>Brix (tùy chọn)<input type="number" min="0" max="100" step="0.1" value={brix} onChange={event => setBrix(event.target.value)} /></label></div><p>Yield bắt buộc để duyệt. Gửi lại QC sẽ tạm ngừng catalog; đổi giá giữ nguyên QC.</p><button disabled={busy} className="btn-primary">Gửi QC</button></form>}
  </div>;
}

function AdminSupplierQuality({ suppliers, profiles, reviews, products, busy, run }: { suppliers: Awaited<ReturnType<typeof api.getSuppliers>>; profiles: Awaited<ReturnType<typeof api.getBusinessProfiles>>; reviews: QualityReview[]; products: ProductListing[]; busy: boolean; run: QualityRun }) {
  const [expandedSupplier, setExpandedSupplier] = useState<string>();
  const [expandedProduct, setExpandedProduct] = useState<string>();
  const getStatus = (supplierId: string) => {
    const profile = profiles.find(item => item.id === supplierId && item.role === 'SUPPLIER');
    if (!profile) return { label: 'Chưa có hồ sơ', style: 'legacy' };
    if (profile.status === 'PENDING') return { label: 'Chờ duyệt', style: 'pending' };
    if (profile.status === 'APPROVED') return { label: 'Đang hoạt động', style: 'approved' };
    if (profile.status === 'REJECTED') return { label: 'Cần bổ sung', style: 'rejected' };
    return { label: profile.legacy ? 'Dữ liệu cũ' : 'Bản nháp', style: 'legacy' };
  };

  return <div className="admin-supplier-quality-layout">
    <section className="card admin-quality-table-card admin-supplier-list-card">
      <header className="admin-quality-table-heading"><h2>Danh sách vựa trái cây / nông trại</h2><span>{suppliers.length} nhà cung cấp</span></header>
      <div className="table-responsive admin-quality-table-scroll"><table className="data-table admin-supplier-table"><thead><tr><th>Tên nhà cung cấp</th><th>Chứng nhận</th><th>Điểm uy tín SQS</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
        <tbody>{suppliers.map(supplier => {
          const profile = profiles.find(item => item.id === supplier.id && item.role === 'SUPPLIER');
          const supplierProducts = products.filter(product => product.supplierId === supplier.id);
          const supplierReviews = reviews.filter(review => review.supplierId === supplier.id);
          const docs = [profile?.certificateImage && 'VSATTP', profile?.vietGapImage && 'VietGAP'].filter(Boolean) as string[];
          const status = getStatus(supplier.id);
          const expanded = expandedSupplier === supplier.id;
          return <Fragment key={supplier.id}>
            <tr className={expanded ? 'admin-supplier-row is-expanded' : 'admin-supplier-row'}>
              <td><strong>{supplier.name}</strong><small className="approval-business-meta">{supplier.regionLabel || supplier.gardenAddress || 'Chưa khai khu vực'}</small></td>
              <td>{docs.length ? <span className="supplier-certificate-list">{docs.map(doc => <span key={doc}>{doc}</span>)}</span> : <span className="supplier-missing-value">Chưa bổ sung</span>}</td>
              <td><strong className="supplier-sqs-score">Chưa tính</strong><small className="approval-business-meta">{supplierReviews.length} lô có dữ liệu QC / {supplierProducts.length}</small></td>
              <td><span className={`approval-table-status approval-status-${status.style}`}>{status.label}</span></td>
              <td><button type="button" className="btn-secondary approval-open-button" aria-expanded={expanded} onClick={() => { setExpandedSupplier(expanded ? undefined : supplier.id); setExpandedProduct(undefined); }}>{expanded ? 'Thu gọn' : 'Xem hồ sơ'}</button></td>
            </tr>
            {expanded && <tr className="approval-expanded-row"><td colSpan={5}><div className="supplier-products-panel">
              <header><div><strong>Chất lượng theo lô hàng</strong><span>{supplier.phone} · {supplier.regionLabel || supplier.gardenAddress || 'Chưa khai khu vực'}</span></div><span>{supplierProducts.length} mặt hàng</span></header>
              {supplierProducts.length ? <div className="table-responsive"><table className="data-table supplier-products-table"><thead><tr><th>Mặt hàng</th><th>Giá khai báo</th><th>Brix</th><th>Yield</th><th>QC</th><th></th></tr></thead><tbody>{supplierProducts.map(product => {
                const qc = reviews.find(review => review.productId === product.id);
                const expandedQc = expandedProduct === product.id;
                const qcStatus = qc ? statusLabel[qc.status] : product.legacy ? 'Dữ liệu cũ' : 'Chưa nộp QC';
                return <Fragment key={product.id}><tr><td><button type="button" className="supplier-product-expand" aria-expanded={expandedQc} onClick={() => setExpandedProduct(expandedQc ? undefined : product.id)}>{product.name}</button></td><td>{money(product.publicPricePerKg)}/kg</td><td>{qc?.brix !== undefined ? `${qc.brix}°` : '—'}</td><td>{qc?.yieldPercent !== undefined ? `${qc.yieldPercent}%` : '—'}</td><td><span className={`quality-table-status quality-table-status-${qc?.status.toLowerCase() ?? 'legacy'}`}>{qcStatus}</span></td><td><button type="button" className="supplier-detail-link" aria-expanded={expandedQc} onClick={() => setExpandedProduct(expandedQc ? undefined : product.id)}>{expandedQc ? 'Ẩn chi tiết' : 'Xem QC'}</button></td></tr>{expandedQc && <tr className="quality-detail-row"><td colSpan={6}><QualityDetails product={product} supplierName={supplier.name} qc={qc} admin busy={busy} run={run} /></td></tr>}</Fragment>;
              })}</tbody></table></div> : <p className="quality-table-empty">Nhà cung cấp chưa có mặt hàng trong danh mục.</p>}
            </div></td></tr>}
          </Fragment>;
        })}
          {suppliers.length === 0 && <tr><td colSpan={5} className="quality-table-empty">Chưa có nhà cung cấp nào.</td></tr>}
        </tbody>
      </table></div>
    </section>
    <aside className="card sqs-criteria-card"><header><h2>Tiêu chí chấm điểm SQS</h2><p>Supplier Quality Score · trọng số minh họa</p></header>
      <div className="sqs-criteria-list">
        <article><div><strong>Tỷ lệ giao đúng hẹn (OTD)</strong><b>40%</b></div><p>Chưa đủ dữ liệu giao hàng để tổng hợp điểm.</p></article>
        <article><div><strong>Tỷ lệ hàng đạt QC / Brix</strong><b>40%</b></div><p>Theo dõi kết quả kiểm định từng lô trên danh sách.</p></article>
        <article><div><strong>Tỷ lệ xử lý khiếu nại SLA 2h</strong><b>20%</b></div><p>Thông tin khiếu nại được quản lý tại mục riêng.</p></article>
      </div>
      <footer>Điểm SQS chưa được tính trong dữ liệu hiện có.</footer>
    </aside>
  </div>;
}

export function QualityPage() {
  const [expandedId, setExpandedId] = useState<string>();
  const s = useDemoData(async () => { const session = await api.getDemoSession(); const suppliers = await api.getSuppliers(); return { session, suppliers, profiles: await api.getBusinessProfiles(), reviews: await api.getQualityReviews(), products: (await Promise.all((session.role === 'ADMIN' ? suppliers.map(supplier => supplier.id) : [session.activeSupplierId!]).map(api.getSupplierListings))).flat() }; });
  const admin = s.data?.session.role === 'ADMIN';
  const products = s.data ? [...s.data.products].sort((a, b) => {
    const rank = (product: ProductListing) => {
      const status = s.data!.reviews.find(review => review.productId === product.id)?.status;
      return status === 'PENDING' ? 0 : status === 'REJECTED' ? 1 : status === 'APPROVED' ? 2 : 3;
    };
    return rank(a) - rank(b) || a.name.localeCompare(b.name, 'vi');
  }) : [];

  if (admin && s.data) return <><div className="page-heading"><div><h1>Kiểm duyệt nhà cung cấp</h1><p>Hồ sơ, chứng nhận và chất lượng nguồn cung trong dữ liệu mô phỏng.</p></div></div>{s.error && <ErrorMessage message={s.error} />}<AdminSupplierQuality suppliers={s.data.suppliers} profiles={s.data.profiles} reviews={s.data.reviews} products={s.data.products} busy={s.busy} run={s.run} /></>;

  return <><div className="page-heading"><div><h1>Chất lượng & QC</h1><p>Phân hạng, Yield và Brix do NCC khai; Admin xét duyệt mô phỏng.</p></div></div>{s.error && <ErrorMessage message={s.error} />}
    {s.data && <section className="card admin-quality-table-card">
      <header className="admin-quality-table-heading"><h2>Danh mục nông sản & kiểm định chất lượng đầu vào</h2><span>{s.data.products.length} mặt hàng</span></header>
      <div className="table-responsive admin-quality-table-scroll"><table className="data-table admin-quality-table"><thead><tr><th>Mặt hàng trái cây</th><th>Vựa cung cấp</th><th>Giá khai báo</th><th>Độ ngọt Brix chuẩn</th><th>Yield Rate chuẩn (%)</th><th>Tính toán True-cost B2B</th><th>Phê duyệt QC</th></tr></thead>
        <tbody>{products.map(product => {
          const qc = s.data!.reviews.find(review => review.productId === product.id);
          const supplierName = s.data!.suppliers.find(supplier => supplier.id === product.supplierId)?.name || product.supplierId;
          const cost = api.calculateTrueCost(product.publicPricePerKg, product.availableKg, qc);
          const expanded = expandedId === product.id;
          const approval = qc?.status === 'APPROVED' ? 'Đã duyệt niêm yết' : qc?.status === 'PENDING' ? 'Chờ duyệt' : qc?.status === 'REJECTED' ? 'Cần bổ sung' : product.legacy ? 'Dữ liệu cũ' : 'Chưa nộp QC';
          return <Fragment key={product.id}>
            <tr className={`admin-quality-row${expanded ? ' is-expanded' : ''}`} onClick={() => setExpandedId(expanded ? undefined : product.id)}>
              <td><button type="button" className="quality-row-trigger" aria-expanded={expanded} aria-controls={`quality-detail-${product.id}`}><span><strong>{product.name}{qc?.grade ? ` · Grade ${qc.grade}` : ''}</strong><small>{expanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}</small></span><span className="quality-row-chevron" aria-hidden="true">{expanded ? '−' : '+'}</span></button></td>
              <td>{supplierName}</td><td><strong>{money(product.publicPricePerKg)}/kg</strong></td>
              <td>{qc?.brix !== undefined ? `${qc.brix}° Brix` : '—'}</td><td>{qc?.yieldPercent !== undefined ? `${qc.yieldPercent}%` : '—'}</td>
              <td className={cost ? 'quality-cost-value' : ''}>{cost ? `${money(Math.round(cost.costPerUsableKg))}/kg` : '—'}</td>
              <td><span className={`quality-table-status quality-table-status-${qc?.status.toLowerCase() ?? 'legacy'}`}>{approval}</span></td>
            </tr>
            {expanded && <tr className="quality-detail-row"><td colSpan={7}><div id={`quality-detail-${product.id}`}><QualityDetails product={product} supplierName={supplierName} qc={qc} admin={!!admin} busy={s.busy} run={s.run} /></div></td></tr>}
          </Fragment>;
        })}</tbody>
      </table></div>
      {s.data.products.length === 0 && <div className="quality-table-empty">Chưa có mặt hàng nào để kiểm định.</div>}
    </section>}
  </>;
}
