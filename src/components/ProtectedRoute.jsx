import { Navigate, useLocation } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useUserAuth();
  const location = useLocation();

  if (authLoading) return null;
  return user ? (
    children
  ) : (
    <Navigate to="/" state={{ from: location }} replace />
  );
}
