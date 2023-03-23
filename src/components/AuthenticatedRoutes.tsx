import { Navigate, Outlet } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider';

export const AuthenticatedRoutes = () => {
  const { user } = useSupabase();

  if (user === null) {
    return <Navigate to="/login" replace={true} />;
  }

  return <Outlet />;
};
