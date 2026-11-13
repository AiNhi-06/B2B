import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AddProductPage } from './AddProductPage';

export function NewListingButton() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const title = useId();

  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    element.showModal();
    return () => {
      element.close();
      trigger.current?.focus();
    };
  }, [open]);

  return (
    <div className="seller-listing-entry">
      <button ref={trigger} type="button" className="btn-primary" onClick={() => { setSaved(false); setOpen(true); }}>
        Đăng lô hàng
      </button>
      {saved && <div className="seller-listing-feedback" role="status">
        Đã đăng lô hàng. <Link to="/supplier/quality">Xem tại Chất lượng &amp; QC</Link>
      </div>}
      {open && (
        <dialog ref={dialog} className="seller-listing-dialog" aria-labelledby={title}
          onCancel={event => { event.preventDefault(); setOpen(false); }}>
          <header>
            <h2 id={title}>Đăng lô hàng mới</h2>
            <button type="button" className="btn-secondary" aria-label="Đóng popup" onClick={() => setOpen(false)}>×</button>
          </header>
          <AddProductPage onCancel={() => setOpen(false)} onSaved={() => { setOpen(false); setSaved(true); }} />
        </dialog>
      )}
    </div>
  );
}
