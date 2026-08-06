import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthSession } from '../store/features/auth/useAuthSession';

const Privateroutes = ({ children, role }) => {
  const { user, authChecked } = useSelector((state) => state.auth);
  const { isVerifying } = useAuthSession();
  const location = useLocation();

  useEffect(() => {
    if (user && role && user.role !== role && user.role !== 'admin') {
      toast.error('You do not have permission to view this page. Use an authorized account.', {
        id: 'route-permission-denied',
      });
    }
  }, [role, user]);

  if (!authChecked || isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
        Checking your session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (role && user.role !== role && user.role !== 'admin') {
    // User does not have the required role, redirect to unauthorized page or home
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default Privateroutes;
