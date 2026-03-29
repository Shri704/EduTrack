import { useLocation, Outlet } from "react-router-dom";

/**
 * Re-mounts outlet when the path changes so enter animations run on every navigation
 * (same idea as staggered sections on Reports).
 */
const PageTransition = () => {
  const { pathname } = useLocation();

  return (
    <div
      key={pathname}
      className="motion-safe:animate-fade-up motion-reduce:animate-none"
    >
      <Outlet />
    </div>
  );
};

export default PageTransition;
