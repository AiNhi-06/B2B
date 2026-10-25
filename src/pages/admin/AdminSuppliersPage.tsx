import { useEffect, useState } from 'react';
import type { Supplier } from '../../types';
import { getSuppliers, subscribeDemoData } from '../../services/demoService';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';
export function AdminSuppliersPage() {
  const [suppliers,setSuppliers]=useState<Supplier[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string>();
  useEffect(()=>{let disposed=false;const load=async()=>{try{const data=await getSuppliers();if(!disposed){setSuppliers(data);setError(undefined);}}catch(err){if(!disposed)setError(err instanceof Error?err.message:'Không tải được NCC.');}finally{if(!disposed)setLoading(false);}};const unsubscribe=subscribeDemoData(()=>{void load();});void load();return()=>{disposed=true;unsubscribe();};},[]);
  return <><div className="page-heading"><div><h1>Nhà cung cấp</h1><p>Thông tin doanh nghiệp hiện có. Chức năng thẩm định hồ sơ sẽ được bổ sung ở đợt tiếp theo.</p></div></div>{error&&<ErrorMessage message={error}/>} {loading?<LoadingSpinner/>:<div className="table-responsive card"><table className="data-table"><thead><tr><th>Nhà cung cấp</th><th>MST</th><th>Khu vực</th><th>Thông tin liên hệ</th></tr></thead><tbody>{suppliers.map(supplier=><tr key={supplier.id}><td><strong>{supplier.name}</strong></td><td>{supplier.taxCode||'Chưa bổ sung'}</td><td>{supplier.regionLabel||supplier.gardenAddress}</td><td>{supplier.phone}</td></tr>)}</tbody></table></div>}</>;
}
