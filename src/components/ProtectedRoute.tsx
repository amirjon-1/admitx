import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';

export function ProtectedRoute() {
  const { user } = useStore();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

