import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

export function PortalLayout({ title, subtitle, links, children }: {
  title: string; subtitle: string; links: { to: string; label: string; end?: boolean }[]; children: ReactNode;
}) {
  return <div className="portal-layout">
    <aside className="portal-sidebar">
      <div className="portal-identity"><span className="portal-mark" aria-hidden="true">F</span><div><strong>{title}</strong><span>{subtitle}</span></div></div>
      <nav aria-label={title}>{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end}
        className={({ isActive }) => `portal-link${isActive ? ' active' : ''}`}>{link.label}</NavLink>)}</nav>
      <div className="portal-footnote">Demo mode<br />Dữ liệu giả lập</div>
    </aside>
    <div className="portal-content">{children}</div>
  </div>;
}
