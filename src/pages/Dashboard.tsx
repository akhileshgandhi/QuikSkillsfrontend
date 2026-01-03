import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">QuikSkill LMS</h1>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-700">
                  {user.firstName} {user.lastName} ({user.role})
                </span>
              )}
              <button onClick={handleLogout} className="btn-secondary text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/courses')}
                className="btn-primary w-full text-sm"
              >
                Manage Courses
              </button>
              {user?.role === 'SUPER_ADMIN' && (
                <>
                  <button
                    onClick={() => navigate('/onboarding')}
                    className="btn-secondary w-full text-sm"
                  >
                    Create Tenant
                  </button>
                  <button
                    onClick={() => navigate('/users')}
                    className="btn-secondary w-full text-sm"
                  >
                    Manage Users
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              User Info
            </h3>
            {user && (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-medium">Role:</span>{' '}
                  <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs">
                    {user.role}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              System Status
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-green-600">✓ Backend Connected</p>
              <p className="text-green-600">✓ Database Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

