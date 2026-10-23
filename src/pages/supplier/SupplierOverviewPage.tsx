import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDemoSession, getSuppliers, getSupplierListings, getSupplierDemand, subscribeDemoData } from '../../services/demoService';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';
export function SupplierOverviewPage() {
  const [data, setData] = useState<{name: string; taxCode?: string; stock: number; count: number; demand: number; pending: number}>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let disposed = false, request = 0;
    const load = async () => { const current = ++request; try {
      const session = await getDemoSession();
      const [suppliers, listings, demand] = await Promise.all([getSuppliers(), getSupplierListings(session.activeSupplierId!), getSupplierDemand(session.activeSupplierId!)]);
      const supplier = suppliers.find(item => item.id === session.activeSupplierId)!;
      if (!disposed && current === request) { setData({name:supplier.name,taxCode:supplier.taxCode,stock:listings.filter(item => item.active).reduce((sum,item)=>sum+item.availableKg,0),count:listings.filter(item=>item.active && item.commodityId).length,demand:demand.reduce((sum,item)=>sum+item.quantityKg,0),pending:listings.filter(item=>!item.commodityId).length}); setError(undefined); }
    } catch(err) { if(!disposed && current===request) setError(err instanceof Error?err.message:'Không tải được tổng quan.'); } };
    const unsubscribe=subscribeDemoData(()=>{void load();});void load();return()=>{disposed=true;unsubscribe();};
  },[]);
  return <>{error && <ErrorMessage message={error} />}{!data ? <LoadingSpinner /> : <><div className="page-heading"><div><h1>Chào {data.name}</h1><p>Cập nhật nguồn hàng và chuẩn bị nhu cầu giao về Hub.</p></div><Link className="btn-primary" to="/supplier/new">Đăng lô hàng</Link></div><div className="overview-metrics"><div><span>Hàng đang bán</span><strong>{data.count} mặt hàng</strong></div><div><span>Tồn khả dụng</span><strong>{data.stock.toLocaleString('vi-VN')} kg</strong></div><div><span>Nhu cầu đang xử lý</span><strong>{data.demand.toLocaleString('vi-VN')} kg</strong></div></div>{data.pending>0 && <div className="notice">Có {data.pending} lô cũ chưa phân nhóm. <Link to="/supplier/products">Bổ sung nhóm để mở bán</Link>.</div>}<section className="card"><h2>Thông tin doanh nghiệp</h2><p><strong>{data.name}</strong></p><p>Mã số thuế: {data.taxCode || 'Chưa bổ sung trong dữ liệu cũ'}</p><p>Giá bạn khai báo là giá công khai trên FARMGO. Phí giao hàng tính riêng ở bước đặt hàng.</p></section><div className="home-categories"><Link to="/supplier/products"><span>Sản phẩm & báo giá</span><small>Sửa giá, tồn và ảnh lô hàng</small></Link><Link to="/supplier/demand"><span>Chuẩn bị giao Hub</span><small>Xác nhận nhu cầu đã gom</small></Link></div></>}</>;
}
