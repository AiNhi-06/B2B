import { useState } from 'react';
import { NewListingButton } from './NewListingButton';
import { SellerProductChart, SellerSalesChart } from './SellerCharts';
import { Link } from 'react-router-dom';
import * as api from '../../services/demoService';
import { useDemoData } from '../../components/shared/useDemoData';
import { money } from '../../components/shared/useCatalog';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';

export function SellerOverview() {
  const s = useDemoData(async () => ({session:await api.getDemoSession(), orders:await api.getAllOrders(), finance:await api.getFinance(), now:await api.getDemoClock()}));
  const [period,setPeriod] = useState('month');
  if (!s.data) return s.error ? <ErrorMessage message={s.error}/> : <LoadingSpinner/>;
  const {session,finance,now} = s.data;
  const id = session.activeSupplierId;
  const month = new Date(now).toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit'});
  const orders = s.data.orders.filter(order => order.items.some(item=>item.supplierId===id) && (period==='all' || new Date(order.placedAt).toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit'})===month)).sort((a,b)=>a.placedAt.localeCompare(b.placedAt));
  const amount = (order: typeof orders[number]) => order.items.filter(item=>item.supplierId===id).reduce((sum,item)=>sum+item.lineTotalVnd,0);
  const revenue = orders.reduce((sum,order)=>sum+amount(order),0);
  const balance = finance.balances.find(row=>row.supplierId===id);
  const allocations = finance.allocations.filter(row=>row.supplierId===id);
  const held = allocations.filter(row=>row.status==='HELD').reduce((sum,row)=>sum+row.goodsVnd-row.refundedVnd,0);
  const distribution = new Map<string,number>();
  orders.forEach(order=>order.items.filter(item=>item.supplierId===id).forEach(item=>distribution.set(item.productName,(distribution.get(item.productName)||0)+item.lineTotalVnd)));
  const entries = [...distribution.entries()].sort((a,b)=>b[1]-a[1]);
  const slices = entries.length>4 ? [...entries.slice(0,3),['Mặt hàng khác',entries.slice(3).reduce((sum,row)=>sum+row[1],0)] as [string,number]] : entries;
  const sales = orders.reduce<{ id: string; placedAt: string; amount: number; cumulative: number }[]>((series, order) => {
    const orderAmount = amount(order);
    series.push({ id: order.id, placedAt: order.placedAt, amount: orderAmount, cumulative: (series.at(-1)?.cumulative ?? 0) + orderAmount });
    return series;
  }, []);
  const productShares = slices.map(([name, amount]) => ({ name, amount }));
  const chartKey = `${id}-${period}-${month}`;
  const exportReport=()=>{const csv='\uFEFFMã đơn,Ngày,Tiền hàng NCC (VND)\n'+orders.map(order=>`${order.id},${order.placedAt.slice(0,10)},${amount(order)}`).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='farmgo-bao-cao-demo.csv';a.click();URL.revokeObjectURL(url);};
  return <><div className="page-heading seller-overview-heading"><div><h1>Tổng quan báo cáo & tài chính</h1><p>Theo dõi tiền hàng và dòng tiền của nhà cung cấp · Dữ liệu demo</p></div><div className="seller-actions"><select aria-label="Kỳ báo cáo" value={period} onChange={e=>setPeriod(e.target.value)}><option value="month">Tháng hiện tại ({month})</option><option value="all">Tất cả thời gian</option></select><button className="btn-secondary" onClick={exportReport}>Xuất báo cáo CSV</button><NewListingButton /></div></div>{s.error&&<ErrorMessage message={s.error}/>}
    <div className="seller-metrics"><article><i className="seller-metric-icon">＄</i><span>Tổng tiền hàng trong kỳ</span><strong>{money(revenue)}</strong><small>Phần hàng thuộc nhà cung cấp</small></article><article><i className="seller-metric-icon">▣</i><span>Số dư khả dụng</span><strong className="green">{money(balance?.availableVnd||0)}</strong><Link to="/supplier/finance">Yêu cầu rút tiền ›</Link></article><article><i className="seller-metric-icon">◷</i><span>Tiền đang tạm giữ (Escrow)</span><strong className="orange">{money(held)}</strong><small>Chờ đối soát theo trạng thái đơn</small></article><article><i className="seller-metric-icon">▤</i><span>Đơn hàng trong kỳ</span><strong>{orders.length} đơn</strong><small>{orders.filter(o=>o.status==='DELIVERED').length} đơn đã giao</small></article></div>
    <div className="seller-chart-grid">
      <SellerSalesChart key={`sales-${chartKey}`} sales={sales} total={revenue} />
      <SellerProductChart key={`products-${chartKey}`} slices={productShares} total={revenue} />
    </div>
    <section className="seller-panel"><div className="section-heading"><h2>Lịch sử đối soát & thanh toán demo</h2><Link to="/supplier/finance">Xem chi tiết dòng tiền</Link></div><div className="table-responsive"><table className="data-table"><thead><tr><th>Đơn hàng</th><th>Tiền hàng</th><th>Đã hoàn</th><th>Trạng thái</th><th>Thực nhận sau phí</th></tr></thead><tbody>{allocations.map(row=><tr key={row.id}><td>{row.orderId}</td><td>{money(row.goodsVnd)}</td><td>{money(row.refundedVnd)}</td><td>{row.status==='HELD'?'Đang tạm giữ':'Đã đối soát'}</td><td>{row.supplierNetVnd===undefined?'—':money(row.supplierNetVnd)}</td></tr>)}</tbody></table>{!allocations.length&&<p>Chưa có giao dịch đối soát demo.</p>}</div></section></>;
}
