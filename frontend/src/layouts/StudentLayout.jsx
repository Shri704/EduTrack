import Navbar from "../components/common/Navbar.jsx";
import Sidebar from "../components/common/Sidebar.jsx";
import PageTransition from "../components/common/PageTransition.jsx";
import StudentMobileNav from "../components/common/StudentMobileNav.jsx";
import { SidebarDrawerProvider } from "../context/SidebarDrawerContext.jsx";

const StudentLayout = () => {
  return (
    <SidebarDrawerProvider>
      <div className="flex min-h-dvh flex-col overflow-x-hidden bg-slate-100 dark:bg-slate-900">
        <Navbar />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          <Sidebar />
          <main className="edu-main-surface flex-1 max-md:pb-24">
            <PageTransition />
          </main>
        </div>
        <StudentMobileNav />
      </div>
    </SidebarDrawerProvider>
  );
};

export default StudentLayout;
