import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ProductListing, DemandLine, QualityReview } from '../../types';
import { getDemoSession, getSupplierListings, getSupplierDemand, getSuppliers, subscribeDemoData, getQualityReviews, getCustomerCatalog, updateProduct } from '../../services/demoService';
import { FruitPhoto } from '../../components/shared/FruitPhoto';
import { LoadingSpinner, ErrorMessage } from '../../components/shared/Feedback';
import { money } from '../../components/shared/useCatalog';
export function ListingsPage() {
  const [quality,setQuality]=useState<QualityReview[]>([]);
  const [visibleIds,setVisibleIds]=useState<string[]>([]);
  const [listings,setListings]=useState<ProductListing[]>([]);
  const [demand,setDemand]=useState<DemandLine[]>([]);
  const [supplierName,setSupplierName]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string>();
  const [busy,setBusy]=useState('');
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    let disposed=false,request=0;
    const load=async()=>{const current=++request;try{
      const session=await getDemoSession();
      const [products,lines,suppliers,reviews,catalog]=await Promise.all([getSupplierListings(session.activeSupplierId!),getSupplierDemand(session.activeSupplierId!),getSuppliers(),getQualityReviews(),getCustomerCatalog()]);
      if(!disposed&&current===request){setListings(products);setQuality(reviews);setVisibleIds(catalog.map(p=>p.id));setDemand(lines);setSupplierName(suppliers.find(item=>item.id===session.activeSupplierId)?.name||'');setError(undefined);}
    }catch(err){if(!disposed&&current===request)setError(err instanceof Error?err.message:'Không tải được sản phẩm.');}finally{if(!disposed&&current===request)setLoading(false);}};
    const unsubscribe=subscribeDemoData(event=>{if(event.type==='SESSION_CHANGED'||event.type==='RESET'){setListings([]);setLoading(true);}void load();});void load();return()=>{disposed=true;unsubscribe();};
  },[revision]);
  const toggle=async(product:ProductListing)=>{setBusy(product.id);try{const session=await getDemoSession();await updateProduct({supplierId:session.activeSupplierId!,productId:product.id,changes:{active:!product.active}});}catch(err){setError(err instanceof Error?err.message:'Không cập nhật được sản phẩm.');}finally{setBusy('');}};
  return <><div className="page-heading"><div><h1>Sản phẩm & báo giá</h1><p>{supplierName} · Quản lý hàng cung ứng và giá công khai.</p></div><Link to="/supplier/new" className="btn-primary">Đăng lô hàng</Link></div>
    {error&&<ErrorMessage message={error} onRetry={()=>setRevision(value=>value+1)}/>}{loading?<LoadingSpinner/>:<><div className="overview-metrics"><div><span>Mặt hàng đã phân nhóm</span><strong>{listings.filter(item=>item.commodityId).length}</strong></div><div><span>Tồn đang mở bán</span><strong>{listings.filter(item=>visibleIds.includes(item.id)).reduce((sum,item)=>sum+item.availableKg,0).toLocaleString('vi-VN')} kg</strong></div><div><span>Nhu cầu đang xử lý</span><strong>{demand.reduce((sum,item)=>sum+item.quantityKg,0)} kg</strong></div></div>
      {listings.some(item=>!item.commodityId)&&<div className="notice">Lô cũ chưa phân nhóm được giữ nguyên ảnh và tồn. Chọn “Bổ sung nhóm” để đưa lô vào danh mục bên mua.</div>}
      {!listings.length&&<div className="empty-panel"><h2>Chưa có lô hàng</h2><Link to="/supplier/new">Đăng lô đầu tiên</Link></div>}
      <div className="market-grid">{listings.map(item=><article className="market-card" key={item.id}><FruitPhoto id={item.commodityId||item.id} name={item.name} imageUrl={item.imageUrl}/><div className="market-card-body"><span className="stock-label">{!item.commodityId?'Cần phân nhóm':visibleIds.includes(item.id)?'Đang mở bán':!item.active?'Lô nháp / tạm ẩn':'Chờ hồ sơ hoặc QC'}</span><h2>{item.name}</h2><p>{quality.find(q=>q.productId===item.id) ? ({PENDING:'QC chờ duyệt',APPROVED:'QC đã duyệt demo',REJECTED:'QC cần bổ sung'})[quality.find(q=>q.productId===item.id)!.status] : (item.legacy?'Demo cũ — chưa thẩm định':'Chưa nộp QC')} · <Link to="/supplier/quality">Khai báo / xem QC</Link></p><p>{item.originLabel||'Chưa có vùng trồng'}{item.packagingLabel?` · ${item.packagingLabel}`:''}</p><div className="market-price">{money(item.publicPricePerKg)}<small>/kg</small></div><p>Tồn: <strong>{item.availableKg.toLocaleString('vi-VN')} kg</strong></p><p>Nhu cầu đang xử lý: <strong>{demand.find(line=>line.productId===item.id)?.quantityKg||0} kg</strong></p><div className="form-actions"><Link className="btn-primary" to={`/supplier/products/${item.id}/edit`}>{item.commodityId?'Sửa lô hàng':'Bổ sung nhóm'}</Link><button className="btn-secondary" disabled={!!busy} onClick={()=>toggle(item)}>{busy===item.id?'Đang lưu…':item.active?'Tạm ẩn':'Mở bán'}</button></div></div></article>)}</div></>}
  </>;
}
