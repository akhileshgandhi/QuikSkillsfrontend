import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  BookOpen,
  Award,
  Activity,
  BarChart3,
  Search,
  User,
  Users,
  LogOut,
  Menu,
  X,
  Edit,
} from 'lucide-react';
import ProfileEditModal from '../ProfileEditModal';

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const menuItems = [
    {
      id: 'organizations',
      label: 'Organizations',
      icon: Building2,
      path: '/dashboard/organizations',
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      path: '/dashboard/users',
    },
    {
      id: 'master-library',
      label: 'Master Library',
      icon: BookOpen,
      path: '/dashboard/master-library',
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: Award,
      path: '/dashboard/certificates',
    },
    {
      id: 'system-health',
      label: 'System Health',
      icon: Activity,
      path: '/dashboard/system-health',
    },
    {
      id: 'audit',
      label: 'Audit & Storage',
      icon: BarChart3,
      path: '/dashboard/audit',
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 fixed h-screen left-0 top-0 z-30 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-primary-600">QuikSkill</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto overflow-x-hidden min-h-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Section - Fixed at bottom */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">Super Admin</p>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Edit Profile"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'ml-64' : 'ml-20'
      }`}>
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search organizations, courses, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Profile Badge */}
          <div className="flex items-center gap-3 ml-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs text-gray-500">Super Admin</span>
            </div>
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowProfileModal(true)}
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowProfileModal(true)}
              >
                <User className="w-5 h-5 text-primary-600" />
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <ProfileEditModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onSuccess={() => {
            // Reload user data from localStorage
            const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
            window.location.reload(); // Simple refresh to update all user displays
          }}
        />
      )}
    </div>
  );
};

export default SuperAdminLayout;

