import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { ROLE_LABELS } from '@/constants/roles';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Hệ thống quản lý mua sắm
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
          >
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-800 leading-tight">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-gray-500 leading-tight">
                {user?.role ? ROLE_LABELS[user.role] : ''}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.email || user?.username}</p>
              </div>
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <User className="w-4 h-4 text-gray-400" />
                Hồ sơ cá nhân
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <Settings className="w-4 h-4 text-gray-400" />
                Cài đặt
              </button>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
