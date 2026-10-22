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
    role: 'CUSTOMER',
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

  // Sync role pill with URL if navigated directly
  const currentPath = location.pathname;
  const activeRole: Role = currentPath.startsWith('/supplier')
    ? 'SUPPLIER'
    : currentPath.startsWith('/admin')
    ? 'ADMIN'
    : 'CUSTOMER';

  return (
    <div className="role-switcher-container">
      <div className="role-pills">
        <button
          type="button"
          className={`role-pill ${activeRole === 'SUPPLIER' ? 'active' : ''}`}
          onClick={() => handleRoleChange('SUPPLIER')}
        >
          🌿 Nhà vườn
        </button>
        <button
          type="button"
          className={`role-pill ${activeRole === 'CUSTOMER' ? 'active' : ''}`}
          onClick={() => handleRoleChange('CUSTOMER')}
        >
          ☕ Khách B2B
        </button>
        <button
          type="button"
          className={`role-pill ${activeRole === 'ADMIN' ? 'active' : ''}`}
          onClick={() => handleRoleChange('ADMIN')}
        >
          ⚙️ Admin Hub
        </button>
      </div>

      {activeRole === 'SUPPLIER' && suppliers.length > 0 && (
        <select
          className="account-select"
          value={session.activeSupplierId || 'supplier-1'}
          onChange={handleSupplierChange}
          aria-label="Chọn tài khoản nhà vườn demo"
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              Vườn: {s.name} ({s.phone})
            </option>
          ))}
        </select>
      )}

      {activeRole === 'CUSTOMER' && customers.length > 0 && (
        <select
          className="account-select"
          value={session.activeCustomerId || 'customer-1'}
          onChange={handleCustomerChange}
          aria-label="Chọn tài khoản quán B2B demo"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              Quán: {c.businessName} ({c.phone})
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
