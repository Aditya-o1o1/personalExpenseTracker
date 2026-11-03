import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './ui';

export default function RouteGuard() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <PageLoader />;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}
