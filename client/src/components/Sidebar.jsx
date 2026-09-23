import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, User, LogIn, UserPlus,
  Ticket, ClipboardList, Mic2, Briefcase, ScanLine, Users,
  PlusSquare, BarChart3, LogOut, Building2, CreditCard,
  MapPin, UserCheck, LifeBuoy, Clock, CalendarCheck,
  FolderOpen, Megaphone, Star, Sparkles, Package,
  Image, CheckSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNavForRole } from '../constants/navigation';

const ICONS = {
  LayoutDashboard, Calendar, User, LogIn, UserPlus, Ticket, ClipboardList,
  Mic2, Briefcase, ScanLine, Users, PlusSquare, BarChart3, LogOut,
  Building2, CreditCard, MapPin, UserCheck, LifeBuoy, Clock,
  CalendarCheck, FolderOpen, Megaphone, Star, Sparkles,
  Package, Image, CheckSquare
};

const NavItem = ({ to, icon, label }) => {
  const Icon = ICONS[icon] || LayoutDashboard;
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '8px',
        color: isActive ? '#fff' : '#94a3b8',
        backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
        border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: isActive ? 600 : 400,
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap'
      })}
    >
      <Icon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
      <span>{label}</span>
    </NavLink>
  );
};

const iconStyle = { width: '18px', height: '18px', flexShrink: 0 };

const Sidebar = ({ isOpen }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const asideStyle = {
    width: isOpen ? '240px' : '0px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 64px)',
    position: 'sticky',
    top: '64px',
    flexShrink: 0
  };

  // Unauthenticated: public navigation only
  if (!isAuthenticated) {
    return (
      <aside style={asideStyle}>
        <div style={{ padding: '20px 12px', overflowY: 'auto', flex: 1 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <NavItem to="/events" icon="Calendar" label="Events Catalog" />
            <NavItem to="/login" icon="LogIn" label="Sign In" />
            <NavItem to="/register" icon="UserPlus" label="Register" />
          </nav>
        </div>
      </aside>
    );
  }

  const items = getNavForRole(user?.role);

  return (
    <aside style={asideStyle}>
      {/* Role workspace navigation (scrollable middle) */}
      <div style={{ padding: '20px 12px 12px 12px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <div style={{
          padding: '0 12px 8px 12px',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#64748b',
          fontWeight: 700
        }}>
          {user?.role} Workspace
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {items.map((item) => (
            <NavItem key={`${item.to}-${item.label}`} to={item.to} icon={item.icon} label={item.label} />
          ))}
        </nav>
      </div>

      {/* Bottom profile block — fixed/sticky at sidebar bottom */}
      <div style={{
        padding: '14px 12px 12px 12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(9, 13, 22, 0.6)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 4px 10px 4px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            flexShrink: 0
          }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#e2e8f0',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '11px', color: '#06b6d4', fontWeight: 500 }}>
              {user?.role}
            </div>
          </div>
        </div>

        <Link
          to="/profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '8px',
            color: '#94a3b8',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          <User style={iconStyle} />
          <span>My Profile</span>
        </Link>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            cursor: 'pointer',
            padding: '9px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '6px'
          }}
        >
          <LogOut style={{ width: '15px', height: '15px' }} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
