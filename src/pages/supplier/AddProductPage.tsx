import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Commodity, ProductUse, Supplier } from '../../types';
import { getDemoSession, getSuppliers, getSupplierListings, getCommodities, createProduct, updateProduct, subscribeDemoData } from '../../services/demoService';
import { prepareProductPhoto } from '../../components/shared/prepareProductPhoto';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';
import { useLabels, categoryLabels } from '../../components/shared/useCatalog';
const blank = {name:'',variety:'',commodityId:'',availableKg:100,publicPricePerKg:20000,originLabel:'',packagingLabel:'',imageUrl:'',uses:[] as ProductUse[],active:true};
export function AddProductPage() {
  const {id} = useParams();
  const navigate = useNavigate();
  const [form,setForm] = useState({...blank});
  const [supplier,setSupplier] = useState<Supplier>();
  const [commodities,setCommodities] = useState<Commodity[]>([]);
  const [lockedCommodity,setLockedCommodity] = useState(false);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [processing,setProcessing] = useState(false);
  const [error,setError] = useState<string>();
  const [photoError,setPhotoError] = useState<string>();
  const [inputKey,setInputKey] = useState(0);
  const [revision,setRevision] = useState(0);
  const photoRequest = useRef(0);
  useEffect(()=>subscribeDemoData(event=>{if(event.type==='SESSION_CHANGED'||event.type==='RESET')setRevision(value=>value+1);}),[]);
  useEffect(()=>{
    let disposed=false;
    const cancelPhoto = () => { photoRequest.current += 1; };
    cancelPhoto();
    setLoading(true);setPhotoError(undefined);setProcessing(false);
    const load=async()=>{try{
      const session=await getDemoSession();
      const [suppliers,groups,listings]=await Promise.all([getSuppliers(),getCommodities(),getSupplierListings(session.activeSupplierId!)]);
      const item=id?listings.find(product=>product.id===id):undefined;
      if(id&&!item)throw new Error('Lô hàng không thuộc tài khoản nhà cung cấp đang chọn.');
      if(!disposed){setSupplier(suppliers.find(entry=>entry.id===session.activeSupplierId));setCommodities(groups);setForm(item?{name:item.name,variety:item.variety||'',commodityId:item.commodityId||'',availableKg:item.availableKg,publicPricePerKg:item.publicPricePerKg,originLabel:item.originLabel||'',packagingLabel:item.packagingLabel||'',imageUrl:item.imageUrl||'',uses:item.uses,active:item.active}:{...blank,uses:[]});setLockedCommodity(!!item?.commodityId);setError(undefined);}
    }catch(err){if(!disposed){setSupplier(undefined);setError(err instanceof Error?err.message:'Không tải được lô hàng.');}}finally{if(!disposed)setLoading(false);}};
    void load();return()=>{disposed=true;cancelPhoto();};
  },[id,revision]);
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();if(!supplier||saving||processing)return;
    setSaving(true);setError(undefined);
    try{
      const values={...form,name:form.name.trim()};
      if(id){const {commodityId,...changes}=values;await updateProduct({supplierId:supplier.id,productId:id,changes:{...changes,...(!lockedCommodity?{commodityId}:{})}});}
      else {const {active:_active,...input}=values;await createProduct({...input,supplierId:supplier.id});}
      navigate('/supplier/products');
    }catch(err){setError(err instanceof Error?err.message:'Không lưu được lô hàng.');}finally{setSaving(false);}
  };
  const photo=async(event:React.ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    const current = ++photoRequest.current;
    setProcessing(true);setPhotoError(undefined);
    try{const imageUrl=await prepareProductPhoto(file);if(current===photoRequest.current)setForm(value=>({...value,imageUrl}));}catch(err){if(current===photoRequest.current)setPhotoError(err instanceof Error?err.message:'Không đọc được ảnh.');}finally{if(current===photoRequest.current){setProcessing(false);setInputKey(key=>key+1);}}
  };
  const field=(key:keyof typeof form,value:string|number|boolean|ProductUse[])=>setForm(current=>({...current,[key]:value}));
  if(loading)return <LoadingSpinner />;
  return <div className="product-form-wrap"><Link className="back-link" to="/supplier/products">Quay lại sản phẩm</Link><div className="page-heading"><div><h1>{id?'Chỉnh sửa lô hàng':'Đăng lô hàng mới'}</h1><p>{supplier?.name} · Giá công khai trực tiếp cho bên mua.</p></div></div>{error&&<ErrorMessage message={error}/>}
    {supplier&&<form className="card product-form" onSubmit={submit}><fieldset disabled={saving||processing}><legend className="sr-only">Thông tin lô hàng</legend>
      <div className="product-photo-upload"><label htmlFor="product-photo">Ảnh sản phẩm</label><p id="photo-help">JPG, PNG hoặc WebP, tối đa 8 MB. Lưu trong trình duyệt cho bản demo.</p><input id="product-photo" key={inputKey} type="file" accept="image/jpeg,image/png,image/webp" onChange={photo} aria-describedby="photo-help"/>{processing&&<p role="status">Đang xử lý ảnh…</p>}{photoError&&<p role="alert">{photoError}</p>}{form.imageUrl&&<div className="product-photo-preview"><img src={form.imageUrl} alt="Ảnh sản phẩm đã chọn" width={240} height={160}/><button type="button" className="btn-secondary" onClick={()=>field('imageUrl','')}>Xóa ảnh</button></div>}</div>
      <div className="form-grid"><label>Mặt hàng *<select required value={form.commodityId} disabled={lockedCommodity} onChange={event=>{const commodity=commodities.find(item=>item.id===event.target.value);setForm(current=>({...current,commodityId:event.target.value,name:current.name||commodity?.name||''}));}}><option value="">Chọn nhóm mặt hàng</option>{commodities.map(item=><option key={item.id} value={item.id}>{categoryLabels[item.category]} — {item.name}</option>)}</select></label><label>Tên sản phẩm *<input required value={form.name} onChange={event=>field('name',event.target.value)} placeholder="Ví dụ: Xoài Cát Hòa Lộc"/></label>
        <label>Giống / mô tả<input value={form.variety} onChange={event=>field('variety',event.target.value)}/></label><label>Vùng trồng<input value={form.originLabel} onChange={event=>field('originLabel',event.target.value)} placeholder="Ví dụ: Tiền Giang"/></label>
        <label>Tồn còn có thể đặt (kg) *<input required type="number" min={0} step={1} value={form.availableKg} onChange={event=>field('availableKg',Number(event.target.value))}/></label><label>Giá công khai (đ/kg) *<input required type="number" min={0} step={1} value={form.publicPricePerKg} onChange={event=>field('publicPricePerKg',Number(event.target.value))}/></label>
        <label>Quy cách đóng gói<input value={form.packagingLabel} onChange={event=>field('packagingLabel',event.target.value)} placeholder="Ví dụ: Sọt 20 kg"/></label>
      </div><fieldset className="use-options"><legend>Công dụng</legend>{(Object.keys(useLabels) as ProductUse[]).map(use=><label key={use}><input type="checkbox" checked={form.uses.includes(use)} onChange={()=>field('uses',form.uses.includes(use)?form.uses.filter(value=>value!==use):[...form.uses,use])}/>{useLabels[use]}</label>)}</fieldset>
      {id&&<label className="active-checkbox"><input type="checkbox" checked={form.active} onChange={event=>field('active',event.target.checked)}/>Mở bán sản phẩm</label>}
      <div className="notice">Giá này được hiển thị công khai cho bên mua và Hub. Phí vận chuyển tính riêng. Quy cách đóng gói là mô tả; số lượng đặt vẫn tính bằng kg.</div>
      <div className="form-actions"><Link className="btn-secondary" to="/supplier/products">Hủy</Link><button className="btn-primary" type="submit" disabled={saving||processing}>{saving?'Đang lưu…':id?'Lưu thay đổi':'Đăng lô hàng'}</button></div>
    </fieldset></form>}
  </div>;
}
