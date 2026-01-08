import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Award,
  BarChart3,
  Search,
  User,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ToggleLeft,
  ToggleRight,
  Edit,
} from 'lucide-react';
import ProfileEditModal from '../ProfileEditModal';

const ManagerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLearnerView, setIsLearnerView] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      path: '/manager-dashboard',
    },
    {
      id: 'courses',
      label: 'My Courses',
      icon: BookOpen,
      path: '/manager-dashboard/courses',
    },
    {
      id: 'team',
      label: 'My Team',
      icon: Users,
      path: '/manager-dashboard/team',
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: Award,
      path: '/manager-dashboard/certificates',
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const isActive = (path: string) => {
    if (path === '/manager-dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
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
            <h1 className="text-xl font-bold brand-primary-text">QuikSkill</h1>
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
                    ? 'brand-primary-bg-light font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={active ? { color: 'var(--brand-primary, #6366f1)' } : {}}
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
                <div className="w-10 h-10 rounded-full brand-primary-bg-light flex items-center justify-center">
                  <User className="w-5 h-5 brand-primary-text" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">Manager</p>
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
                placeholder="Search courses, team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{
                  '--tw-ring-color': 'var(--brand-primary, #6366f1)',
                } as React.CSSProperties & { '--tw-ring-color': string }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 2px var(--brand-primary, #6366f1)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '';
                }}
              />
            </div>
          </div>

          {/* Profile Badge and View Toggle */}
          <div className="flex items-center gap-3 ml-4">
            {/* Switch to Learner View Toggle */}
            <button
              onClick={() => {
                setIsLearnerView(!isLearnerView);
                if (!isLearnerView) {
                  navigate('/learner/dashboard');
                } else {
                  navigate('/manager-dashboard');
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              title={isLearnerView ? 'Switch to Manager View' : 'Switch to Learner View'}
            >
              {isLearnerView ? (
                <>
                  <BarChart3 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700 hidden sm:inline">Manager View</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700 hidden sm:inline">My Learning</span>
                </>
              )}
            </button>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs text-gray-500">Manager</span>
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
                className="w-10 h-10 rounded-full brand-primary-bg-light flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowProfileModal(true)}
              >
                <User className="w-5 h-5 brand-primary-text" />
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
            const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default ManagerLayout;

