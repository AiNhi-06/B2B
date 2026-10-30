import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ProductListing } from '../../types';
import { getSuppliers, getSupplierListings, subscribeDemoData } from '../../services/demoService';
import { money } from './useCatalog';
import { FruitPhoto } from './FruitPhoto';
import { ErrorMessage } from './Feedback';

type HubListing = ProductListing & { supplierName: string };
const ProductsContext = createContext<HubListing[]>([]);

export function HubProductPhotos({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<HubListing[]>([]);
  const [error, setError] = useState<string>();
  useEffect(() => {
    let disposed = false;
    let request = 0;
    const load = async () => {
      const current = ++request;
      try {
        const suppliers = await getSuppliers();
        const batches = await Promise.all(suppliers.map((supplier) => getSupplierListings(supplier.id)));
        if (!disposed && current === request) { setProducts(batches.flatMap((batch,index) => batch.map(product => ({...product,supplierName:suppliers[index].name})))); setError(undefined); }
      } catch {
        if (!disposed && current === request) setError('Không tải được ảnh sản phẩm. Vui lòng tải lại trang.');
      }
    };
    const unsubscribe = subscribeDemoData(() => { void load(); });
    void load();
    return () => { disposed = true; unsubscribe(); };
  }, []);
  return <ProductsContext.Provider value={products}>{error && <ErrorMessage message={error} />}{children}</ProductsContext.Provider>;
}

export function HubProductThumbnail({ id, name }: { id: string; name: string }) {
  const product = useContext(ProductsContext).find((item) => item.id === id);
  return <div className="hub-product-thumbnail"><FruitPhoto id={id} name={name} imageUrl={product?.imageUrl} /></div>;
}

export function HubSupplierName({ supplierId }: { supplierId: string }) {
  const listing = useContext(ProductsContext).find(product => product.supplierId === supplierId);
  return <>{listing?.supplierName || 'Thông tin NCC chưa có'}</>;
}

export function HubProductGallery() {
  const products = useContext(ProductsContext);
  return (
    <section className="card" aria-label="Ảnh sản phẩm">
      <h3 className="card-title">Sản phẩm từ nhà cung ứng</h3>
      {products.length === 0 && <p>Chưa có sản phẩm để hiển thị.</p>}
      <div className="grid-cards">
        {products.map((product) => <article key={product.id} className="fruit-listing-card">
          <FruitPhoto id={product.id} name={product.name} imageUrl={product.imageUrl} />
          <div className="card-fruit-header"><div>
            <h4 className="fruit-title">{product.name}</h4><p>{product.supplierName}</p><p><strong>{money(product.publicPricePerKg)} /kg</strong></p>
            <span>{product.availableKg.toLocaleString('vi-VN')} kg · {!product.commodityId ? 'Chưa phân nhóm' : product.active ? 'Đang mở bán' : 'Tạm ẩn'}</span>
          </div></div>
        </article>)}
      </div>
    </section>
  );
}
