import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  Warehouse,
  Truck,
  ClipboardList,
  Import,
  Users,
  BarChart3,
  Store,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    to: ROUTES.DASHBOARD,
    icon: <LayoutDashboard className="w-5 h-5" />,
    label: 'Tổng quan',
    roles: ['ADMIN', 'CHU_QUAN', 'MANAGER', 'CASHIER', 'NHAN_VIEN'],
  },
  {
    to: ROUTES.POS,
    icon: <ShoppingCart className="w-5 h-5" />,
    label: 'Bán hàng (POS)',
    roles: ['ADMIN', 'CHU_QUAN', 'MANAGER', 'CASHIER', 'NHAN_VIEN'],
  },
  {
    to: ROUTES.PRODUCTS,
    icon: <Package className="w-5 h-5" />,
    label: 'Sản phẩm',
    roles: ['ADMIN', 'CHU_QUAN', 'MANAGER', 'CASHIER', 'NHAN_VIEN'],
  },
  {
    to: ROUTES.CATEGORIES,
    icon: <Tag className="w-5 h-5" />,
    label: 'Danh mục',
    roles: ['ADMIN', 'CHU_QUAN', 'MANAGER'],
  },
  {
    to: ROUTES.INVENTORY,
    icon: <Warehouse className="w-5 h-5" />,
    label: 'Kho hàng',
    roles: ['ADMIN', 'CHU_QUAN', 'MANAGER', 'CASHIER', 'NHAN_VIEN'],
  },
  {
    to: ROUTES.SUPPLIERS,
    icon: <Truck className="w-5 h-5" />,
    label: 'Nhà cung cấp',
    roles: ['ADMIN', 'CHU_QUAN', 'MANAGER'],
  },
  {
    to: ROUTES.ORDERS,
    icon: <ClipboardList className="w-5 h-5" />,
    label: 'Đơn hàng',
    roles: ['ADMIN', 'CHU_QUAN', 'MANAGER', 'CASHIER', 'NHAN_VIEN'],
  },
  {
    to: ROUTES.IMPORTS,
    icon: <Import className="w-5 h-5" />,
    label: 'Nhập hàng',
    roles: ['ADMIN', 'CHU_QUAN', 'MANAGER'],
  },
  {
    to: ROUTES.REPORTS,
    icon: <BarChart3 className="w-5 h-5" />,
    label: 'Báo cáo',
    roles: ['ADMIN', 'CHU_QUAN', 'MANAGER'],
  },
  {
    to: ROUTES.USERS,
    icon: <Users className="w-5 h-5" />,
    label: 'Người dùng',
    roles: ['ADMIN', 'CHU_QUAN'],
  },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <aside
      className={`relative flex flex-col bg-gray-900 text-white h-screen transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      } flex-shrink-0`}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b border-gray-800 cursor-pointer"
        onClick={() => navigate(ROUTES.DASHBOARD)}
      >
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Store className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold leading-tight">Quản Lý</p>
            <p className="text-xs text-gray-400 leading-tight">Mua Sắm Online</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.DASHBOARD}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                ${isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {collapsed && (
                <div className="absolute left-16 z-50 hidden group-hover:block">
                  <div className="bg-gray-800 text-white text-xs py-1 px-2 rounded-lg whitespace-nowrap ml-2 shadow-lg">
                    {item.label}
                  </div>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-gray-700 border border-gray-600 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors shadow-md z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-300" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-300" />
        )}
      </button>

      {/* User info at bottom */}
      {!collapsed && user && (
        <div className="border-t border-gray-800 px-4 py-3">
          <p className="text-xs font-medium text-white truncate">{user.full_name}</p>
          <p className="text-xs text-gray-500 truncate">{user.username}</p>
        </div>
      )}
    </aside>
  );
};
