import { Navigate, useLocation } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";

export default function PublicOnlyRoute({ children }) {
  const { user, authLoading } = useUserAuth();
  const location = useLocation();

  if (authLoading) return null; // oturum çözülene kadar bekle, yoksa yanlış yönlendirir

  if (user) {
    // Korumalı sayfadan login'e atılmışsa oraya geri dön, yoksa günlüğe git
    const redirectTo = location.state?.from?.pathname || "/journalapp";
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
