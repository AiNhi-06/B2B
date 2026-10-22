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
      if (event.type === 'SESSION_CHANGED' || event.type === 'RESET') {
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
      else if (newRole === 'ADMIN') navigate('/admin');
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
    : currentPath.startsWith('/admin')
    ? 'ADMIN'
    : 'CUSTOMER';

  return (
    <div className="role-nav-group">
      <div className="role-switcher-pills">
        <button
          type="button"
          className={`role-tab-btn ${activeRole === 'SUPPLIER' ? 'active' : ''}`}
          onClick={() => handleRoleChange('SUPPLIER')}
        >
          Nhà Vườn
        </button>
        <button
          type="button"
          className={`role-tab-btn ${activeRole === 'CUSTOMER' ? 'active' : ''}`}
          onClick={() => handleRoleChange('CUSTOMER')}
        >
          Quán Cà Phê / F&B
        </button>
        <button
          type="button"
          className={`role-tab-btn ${activeRole === 'ADMIN' ? 'active' : ''}`}
          onClick={() => handleRoleChange('ADMIN')}
        >
          Kho Hub & Điều Phối
        </button>
      </div>

      {activeRole === 'SUPPLIER' && suppliers.length > 0 && (
        <select
          className="account-dropdown"
          value={session.activeSupplierId || 'supplier-1'}
          onChange={handleSupplierChange}
          aria-label="Chọn nhà vườn"
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
