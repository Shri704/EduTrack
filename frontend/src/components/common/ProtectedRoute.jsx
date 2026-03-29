import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ roles, children }) => {
  const { token, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Role-based access:
  // - If roles includes "admin", allow "superadmin" as well (inherits admin rights)
  const isAllowed =
    !roles ||
    roles.includes(user.role) ||
    (user.role === "superadmin" && roles.includes("admin"));

  if (!isAllowed) {
    const fallback =
      user.role === "superadmin"
        ? "/admin"
        : user.role === "admin"
          ? "/admin"
          : user.role === "teacher"
            ? "/teacher"
            : "/student";

    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;