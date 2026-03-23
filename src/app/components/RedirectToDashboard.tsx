import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export function RedirectToDashboard() {
  const { agent } = useAuth();
  // CS agents only have access to /support; everyone else goes to /dashboard
  const target = agent?.role === "customer_support" ? "/support" : "/dashboard";
  return <Navigate to={target} replace />;
}
