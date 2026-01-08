import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  useEffect(() => {
    if (success === 'true' && token) {
      // Store token
      localStorage.setItem('access_token', token);

      // Fetch user profile to get role and redirect accordingly
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const user = data.data;
            localStorage.setItem('user', JSON.stringify(user));

            // Redirect based on role
            const role = user.role;
            if (role === 'SUPER_ADMIN') {
              navigate('/dashboard');
            } else if (role === 'TENANT_ADMIN') {
              navigate('/tenant-dashboard');
            } else if (role === 'MANAGER') {
              navigate('/manager-dashboard');
            } else if (role === 'LEARNER') {
              navigate('/learner/dashboard');
            } else {
              navigate('/courses');
            }
          } else {
            navigate('/login?error=Failed to fetch user profile');
          }
        })
        .catch((err) => {
          console.error('Error fetching user profile:', err);
          navigate('/login?error=Authentication failed');
        });
    } else {
      // Handle error
      const errorMessage = error || 'Authentication failed';
      navigate(`/login?error=${encodeURIComponent(errorMessage)}`);
    }
  }, [token, success, error, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;

