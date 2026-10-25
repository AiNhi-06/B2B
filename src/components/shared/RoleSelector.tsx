import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Role, DemoSession, Supplier, Customer } from '../../types';
import {
  getDemoSession,
  setDemoSession,
  getSuppliers,
  getCustomers,
  subscribeDemoData,
} from '../../services/demoService';

export function RoleSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<DemoSession>({
    role: 'SUPPLIER',
    activeSupplierId: 'supplier-1',
    activeCustomerId: 'customer-1',
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const role: Role = location.pathname.startsWith('/supplier') ? 'SUPPLIER' : 'CUSTOMER';
    void setDemoSession({role}).catch(err => setError(err instanceof Error ? err.message : 'Không chuyển được vai trò demo.'));
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [sess, supList, custList] = await Promise.all([
          getDemoSession(),
          getSuppliers(),
          getCustomers(),
        ]);
        if (isMounted) {
          setSession(sess);
          setSuppliers(supList);
          setCustomers(custList);
        }
      } catch (err) {
        console.error('Error loading role session:', err);
      }
    }

    loadData();

    const unsubscribe = subscribeDemoData((event) => {
      if (event.type === 'SESSION_CHANGED' || event.type === 'RESET' || event.type === 'DATA_CHANGED') {
        loadData();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleRoleChange = async (newRole: Role) => {
    try {
      await setDemoSession({ role: newRole });
      setSession((prev) => ({ ...prev, role: newRole }));
      if (newRole === 'SUPPLIER') navigate('/supplier');
      else if (newRole === 'CUSTOMER') navigate('/customer');
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const handleSupplierChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const activeSupplierId = e.target.value;
    try {
      await setDemoSession({ activeSupplierId });
      setSession((prev) => ({ ...prev, activeSupplierId }));
    } catch (err) {
      console.error('Failed to change active supplier:', err);
    }
  };

  const handleCustomerChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const activeCustomerId = e.target.value;
    try {
      await setDemoSession({ activeCustomerId });
      setSession((prev) => ({ ...prev, activeCustomerId }));
    } catch (err) {
      console.error('Failed to change active customer:', err);
    }
  };

  const currentPath = location.pathname;
  const activeRole: Role = currentPath.startsWith('/supplier')
    ? 'SUPPLIER'
    : 'CUSTOMER';

  return (
    <div className="role-nav-group">
      {error && <span role="alert">{error}</span>}
      <div className="role-switcher-pills">
        <button
          type="button"
          className={`role-tab-btn ${activeRole === 'SUPPLIER' ? 'active' : ''}`} aria-pressed={activeRole === 'SUPPLIER'}
          onClick={() => handleRoleChange('SUPPLIER')}
        >
          Nhà cung cấp
        </button>
        <button
          type="button"
          className={`role-tab-btn ${activeRole === 'CUSTOMER' ? 'active' : ''}`} aria-pressed={activeRole === 'CUSTOMER'}
          onClick={() => handleRoleChange('CUSTOMER')}
        >
          Bên mua F&B
        </button>
      </div>

      {activeRole === 'SUPPLIER' && suppliers.length > 0 && (
        <select
          className="account-dropdown"
          value={session.activeSupplierId || 'supplier-1'}
          onChange={handleSupplierChange}
          aria-label="Chọn nhà cung cấp"
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      {activeRole === 'CUSTOMER' && customers.length > 0 && (
        <select
          className="account-dropdown"
          value={session.activeCustomerId || 'customer-1'}
          onChange={handleCustomerChange}
          aria-label="Chọn khách hàng F&B"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.businessName}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
