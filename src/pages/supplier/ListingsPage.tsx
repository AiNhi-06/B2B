import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ProductListing, QualityReview } from '../../types';
import { getDemoSession, getSupplierListings, getSuppliers, subscribeDemoData, getQualityReviews, getCustomerCatalog, updateProduct } from '../../services/demoService';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { money } from '../../components/shared/useCatalog';
export function ListingsPage() {
  const [params] = useSearchParams();
  const [filter,setFilter]=useState('all');
  const query=(params.get('q')||'').toLocaleLowerCase('vi');
  const [quality,setQuality]=useState<QualityReview[]>([]);
  const [visibleIds,setVisibleIds]=useState<string[]>([]);
  const [listings,setListings]=useState<ProductListing[]>([]);
  const [supplierName,setSupplierName]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string>();
  const [busy,setBusy]=useState('');
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    let disposed=false,request=0;
    const load=async()=>{const current=++request;try{
      const session=await getDemoSession();
      const [products,suppliers,reviews,catalog]=await Promise.all([getSupplierListings(session.activeSupplierId!),getSuppliers(),getQualityReviews(),getCustomerCatalog()]);
      if(!disposed&&current===request){setListings(products);setQuality(reviews);setVisibleIds(catalog.map(p=>p.id));setSupplierName(suppliers.find(item=>item.id===session.activeSupplierId)?.name||'');setError(undefined);}
    }catch(err){if(!disposed&&current===request)setError(err instanceof Error?err.message:'Không tải được sản phẩm.');}finally{if(!disposed&&current===request)setLoading(false);}};
    const unsubscribe=subscribeDemoData(event=>{if(event.type==='SESSION_CHANGED'||event.type==='RESET'){setListings([]);setLoading(true);}void load();});void load();return()=>{disposed=true;unsubscribe();};
  },[revision]);
  const toggle=async(product:ProductListing)=>{setBusy(product.id);try{const session=await getDemoSession();await updateProduct({supplierId:session.activeSupplierId!,productId:product.id,changes:{active:!product.active}});}catch(err){setError(err instanceof Error?err.message:'Không cập nhật được sản phẩm.');}finally{setBusy('');}};
  return <><div className="page-heading"><div><h1>Danh mục sản phẩm & báo giá B2B</h1><p>{supplierName} · Cấu hình giá bán buôn, quy cách và tồn kho.</p></div><Link to="/supplier/new" className="btn-primary">＋ Thêm trái cây / báo giá mới</Link></div>
    {error&&<ErrorMessage message={error} onRetry={()=>setRevision(value=>value+1)}/>}{loading?<LoadingSpinner/>:<>
      {listings.some(item=>!item.commodityId)&&<div className="notice">Lô cũ chưa phân nhóm được giữ nguyên ảnh và tồn. Chọn “Bổ sung nhóm” để đưa lô vào danh mục bên mua.</div>}
      {!listings.length&&<div className="empty-panel"><h2>Chưa có lô hàng</h2><Link to="/supplier/new">Đăng lô đầu tiên</Link></div>}
      <section className="seller-panel seller-product-table"><div className="seller-tabs"><label>Lọc danh mục:</label>{[['all',`Tất cả (${listings.length})`],['mekong','Trái cây miền Tây'],['dalat','Nông sản Đà Lạt']].map(([key,label])=><button key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}>{label}</button>)}<span>{visibleIds.filter(id=>listings.some(p=>p.id===id)).length} / {listings.length} đang bán</span></div><div className="table-responsive"><table className="data-table"><thead><tr><th>Sản phẩm / SKU</th><th>Quy cách đóng gói</th><th>Giá báo buôn (đơn giá)</th><th>Thuế VAT*</th><th>Hiệu lực giá*</th><th>Tỷ lệ dùng được</th><th>Tồn kho</th><th>Thao tác</th></tr></thead><tbody>{listings.filter(item=>(filter==='all'||(filter==='dalat'?item.originLabel==='Lâm Đồng':item.originLabel!=='Lâm Đồng'))&&`${item.name} ${item.id}`.toLocaleLowerCase('vi').includes(query)).map(item=>{const qc=quality.find(q=>q.productId===item.id);return <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.packagingLabel||'Theo kg'}</td><td className="green"><strong>{money(item.publicPricePerKg)}/kg</strong></td><td><span className="seller-tax-placeholder">—</span></td><td>Chưa áp dụng</td><td>{qc?.status==='APPROVED'?`${qc.yieldPercent}%`:'Chưa duyệt'}</td><td>{item.availableKg.toLocaleString('vi-VN')} kg</td><td><div className="seller-row-actions"><Link to={`/supplier/products/${item.id}/edit`}>✎ Sửa giá</Link><button disabled={!!busy} onClick={()=>void toggle(item)}>{busy===item.id?'Đang lưu…':item.active?'Tạm ẩn':'Mở bán'}</button></div></td></tr>;})}</tbody></table></div>{!listings.some(item=>(filter==='all'||(filter==='dalat'?item.originLabel==='Lâm Đồng':item.originLabel!=='Lâm Đồng'))&&`${item.name} ${item.id}`.toLocaleLowerCase('vi').includes(query))&&<p className="seller-empty">Không có sản phẩm phù hợp với bộ lọc.</p>}</section><p className="seller-table-note">* VAT và hiệu lực giá là cột minh họa theo mẫu, chưa áp dụng vào giao dịch demo. Xem trạng thái duyệt tại mục Chất lượng & QC.</p></>}
  </>;
}
