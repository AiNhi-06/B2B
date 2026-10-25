import { useEffect, useState } from 'react';
import type { Supplier } from '../../types';
import { getSuppliers, subscribeDemoData } from '../../services/demoService';
import { ErrorMessage, LoadingSpinner } from '../../components/shared/Feedback';

export function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      try {
        const data = await getSuppliers();
        if (!disposed) { setSuppliers(data); setError(undefined); }
      } catch (err) {
        if (!disposed) setError(err instanceof Error ? err.message : 'Không tải được nhà cung cấp.');
      } finally { if (!disposed) setLoading(false); }
    };
    const unsubscribe = subscribeDemoData(() => { void load(); });
    void load();
    return () => { disposed = true; unsubscribe(); };
  }, []);

  return <>
    <div className="page-heading suppliers-page-heading"><div><h1>Nhà cung cấp</h1><p>Thông tin doanh nghiệp hiện có. Chức năng thẩm định hồ sơ sẽ được bổ sung ở đợt tiếp theo.</p></div></div>
    {error && <ErrorMessage message={error} />}
    {loading ? <LoadingSpinner /> : <section className="card supplier-directory-card">
      <header className="supplier-directory-heading"><h2>Danh sách nhà cung cấp</h2><span>{suppliers.length} đơn vị</span></header>
      {suppliers.length === 0 ? <div className="supplier-directory-empty">Chưa có nhà cung cấp nào trong dữ liệu demo.</div> : <div className="table-responsive"><table className="data-table"><thead><tr><th>Nhà cung cấp</th><th>Mã số thuế</th><th>Khu vực</th><th>Thông tin liên hệ</th></tr></thead><tbody>{suppliers.map(supplier => <tr key={supplier.id}><td><strong>{supplier.name}</strong></td><td>{supplier.taxCode ? supplier.taxCode : <span className="supplier-missing-value">Chưa bổ sung</span>}</td><td>{supplier.regionLabel || supplier.gardenAddress || <span className="supplier-missing-value">Chưa bổ sung</span>}</td><td>{supplier.phone || <span className="supplier-missing-value">Chưa bổ sung</span>}</td></tr>)}</tbody></table></div>}
    </section>}
  </>;
}
