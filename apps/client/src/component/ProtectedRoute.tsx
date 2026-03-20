import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authStorage } from "@/lib/api-client";

export const ProtectedRoute = () => {
  const location = useLocation();
  const token = authStorage.getToken();

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
