import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { setDemoRole } from '../../services/demoService';
import { getPortalSession, registerDemoTransport, signInDemoPortal, signOutDemoPortal } from '../../services/portalSessionService';
import type { PortalName, PortalSession } from '../../types/portalSession';
import { AdminDashboard } from '../admin/AdminDashboard';
import { TransportDashboard } from '../transport/TransportDashboard';
import './portal-auth.css';

export function AdminPortalApp() {
  const [session, setSession] = useState<PortalSession | null | undefined>(undefined);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try { setSession(getPortalSession('admin')); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không đọc được phiên Admin demo.'); setSession(null); }
  }, []);
  useEffect(() => { if (session) void setDemoRole('ADMIN').catch(cause => setError(cause instanceof Error ? cause.message : 'Không mở được phiên Admin demo.')); }, [session]);

  const signIn = (account: string, password: string) => {
    try {
      const next = signInDemoPortal('admin', account, password);
      setSession(next);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Đăng nhập demo chưa thành công.');
    }
  };

  const signOut = () => {
    signOutDemoPortal('admin');
    setSession(null);
    void setDemoRole('CUSTOMER').catch(cause => setError(cause instanceof Error ? cause.message : 'Không đóng được phiên Admin demo.'));
    navigate('/admin/login', { replace: true });
  };

  if (session === undefined) return <PortalLoading />;
  if (!session) return <PortalLogin portal="admin" error={error} onSignIn={signIn} />;
  if (location.pathname === '/admin/login') return <Navigate to="/admin" replace />;

  return <div className="isolated-portal isolated-admin">
    <AdminDashboard displayName={session.displayName} onSignOut={signOut} />
  </div>;
}

export function TransportPortalApp() {
  const [session, setSession] = useState<PortalSession | null | undefined>(undefined);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try { setSession(getPortalSession('transport')); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không đọc được phiên giao nhận demo.'); setSession(null); }
  }, []);

  const signIn = (account: string, password: string) => {
    try {
      setSession(signInDemoPortal('transport', account, password));
      setError('');
      navigate('/transport/dashboard', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Đăng nhập demo chưa thành công.');
    }
  };

  const register = (displayName: string, account: string, password: string) => {
    try {
      setSession(registerDemoTransport({ displayName, account, password }));
      setError('');
      navigate('/transport/dashboard', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Đăng ký demo chưa thành công.');
    }
  };

  const signOut = () => {
    signOutDemoPortal('transport');
    setSession(null);
    navigate('/transport/login', { replace: true });
  };

  if (session === undefined) return <PortalLoading />;
  if (!session) return <PortalLogin portal="transport" mode={location.pathname.endsWith('/register') ? 'register' : 'login'} error={error} onSignIn={signIn} onRegister={register} />;
  if (location.pathname.endsWith('/login') || location.pathname.endsWith('/register') || location.pathname === '/transport') return <Navigate to="/transport/dashboard" replace />;

  return <div className="isolated-portal isolated-transport"><TransportDashboard session={session} onSignOut={signOut} /></div>;
}

function PortalLogin({ portal, mode = 'login', error, onSignIn, onRegister }: {
  portal: PortalName;
  mode?: 'login' | 'register';
  error: string;
  onSignIn: (account: string, password: string) => void;
  onRegister?: (displayName: string, account: string, password: string) => void;
}) {
  const isTransport = portal === 'transport';
  const [displayName, setDisplayName] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const registering = isTransport && mode === 'register';

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');
    if (registering) {
      if (password !== confirmPassword) { setLocalError('Mật khẩu nhập lại chưa khớp.'); return; }
      onRegister?.(displayName, account, password);
    } else {
      onSignIn(account, password);
    }
  };

  return <main className={`portal-auth-page ${isTransport ? 'auth-transport' : 'auth-admin'}`}>
    <header className="auth-portal-masthead">
      <Link to="/customer" className="auth-portal-brand"><span>{isTransport ? '↗' : 'F'}</span><span><strong>{isTransport ? 'FARMGO Express' : 'FARMGO HQ'}</strong><small>{isTransport ? 'LogiHub · Vận chuyển nông sản B2B' : 'Central System · Trung tâm điều hành'}</small></span></Link>
      <span className="auth-portal-demo">DỮ LIỆU MÔ PHỎNG</span>
    </header>
    <section className="auth-form-side">
      <div className="auth-form-wrap">
        <Link to="/customer" className="auth-mobile-brand">← Về mua & cung ứng</Link>
        {isTransport && <div className="auth-mode-switch"><Link className={!registering ? 'active' : ''} to="/transport/login">Đăng nhập</Link><Link className={registering ? 'active' : ''} to="/transport/register">Đăng ký nhà xe</Link></div>}
        <p className="auth-form-kicker">{isTransport ? 'CỔNG GIAO NHẬN' : 'KHU VỰC QUẢN TRỊ'}</p>
        <h2>{registering ? 'Tạo tài khoản demo' : isTransport ? 'Đăng nhập vận chuyển' : 'Đăng nhập Admin'}</h2>
        <p className="auth-form-description">{registering ? 'Tạo hồ sơ để mở bảng chuyến giao mô phỏng.' : isTransport ? 'Đăng nhập bằng tài khoản bất kỳ để xem bảng chuyến demo.' : 'Đăng nhập để tiếp tục vào trung tâm điều hành FARMGO.'}</p>

        <form className="auth-form" onSubmit={submit}>
          {registering && <label>Tên hiển thị<input autoComplete="name" value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Tên của bạn" required/></label>}
          <label>{isTransport ? 'Tài khoản' : 'Tài khoản quản trị'}<input autoComplete="username" value={account} onChange={event => setAccount(event.target.value)} placeholder={isTransport ? 'Email hoặc tên đăng nhập' : 'Tên đăng nhập'} required/></label>
          <label>Mật khẩu<input type="password" autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={registering ? 'Tạo mật khẩu demo' : 'Nhập mật khẩu'} required/></label>
          {registering && <label>Nhập lại mật khẩu<input type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu" required/></label>}
          {(error || localError) && <p className="auth-error" role="alert">{localError || error}</p>}
          <button className="auth-submit" type="submit">{registering ? 'Tạo tài khoản demo' : 'Đăng nhập'}<span>↗</span></button>
        </form>
        <div className="auth-demo-note"><span>i</span><p>{isTransport ? 'Tài khoản được mô phỏng trong trình duyệt. Không xác minh email, OTP hay hãng vận chuyển.' : 'Phiên đăng nhập chỉ phục vụ demo trong trình duyệt, không phải xác thực bảo mật.'}</p></div>
        {!isTransport && <p className="auth-no-register">Admin không có luồng đăng ký.</p>}
        <Link to="/customer" className="auth-return-link">← Quay về mua & cung ứng</Link>
      </div>
    </section>
  </main>;
}

function PortalLoading() {
  return <main className="portal-loading" role="status">Đang mở cổng demo…</main>;
}
