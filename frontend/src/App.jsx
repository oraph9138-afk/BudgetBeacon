import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import NewEstimate from "./pages/NewEstimate";
import History from "./pages/History";
import Login from "./pages/Login";
import Register from "./pages/Register";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--ds-body-bg)' }}>
        <div className="w-8 h-8 border-4 border-[--ds-primary] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function getStoredTheme() {
  return localStorage.getItem("theme") || "light";
}

function setStoredTheme(theme) {
  localStorage.setItem("theme", theme);
}

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("expanded", sidebarExpanded);
    document.documentElement.classList.toggle("collapsed", !sidebarExpanded);
  }, [sidebarExpanded]);

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    setStoredTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "ti ti-smart-home" },
    { path: "/dashboard/estimate", label: "New Estimate", icon: "ti ti-plus" },
    { path: "/dashboard/history", label: "History", icon: "ti ti-clock" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Sidebar */}
      <div id="miniSidebar" className={`${sidebarExpanded ? 'w-[250px]' : 'w-[60px]'} fixed top-0 left-0 h-full z-[1024] transition-[width] duration-300`}
        style={{ backgroundColor: 'var(--ds-sidebar-bg)', borderRight: '1px dashed var(--ds-border)' }}>
        <div className="brand-logo sticky top-0 z-[2] px-4 py-3" style={{ backgroundColor: 'var(--ds-sidebar-bg)' }}>
          <Link to="/dashboard" className="flex items-center gap-2 no-underline">
            <img src="/logo-icon.svg" alt="BudgetBeacon" className="w-7 h-7 flex-shrink-0" />
            <span className={`font-bold text-lg site-logo-text ${!sidebarExpanded && 'hidden'}`} style={{ color: 'var(--ds-heading-color)' }}>BudgetBeacon</span>
          </Link>
        </div>

        <nav className={`overflow-auto ${sidebarExpanded ? 'h-[calc(100vh-4.5rem)] pb-8' : 'overflow-visible'}`}>
          <div className={`${sidebarExpanded ? 'block' : 'hidden'} text-xs font-bold tracking-[1px] uppercase px-5 py-4`} style={{ color: 'var(--ds-text-secondary)' }}>
            Pages
          </div>
          <hr className={`${sidebarExpanded ? 'hidden' : 'block'} mx-5 mb-1`} style={{ borderTop: '1px solid var(--ds-border)' }} />

          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center no-underline whitespace-nowrap overflow-hidden px-3 py-[10px] mx-2 my-[0.125rem] rounded-lg text-sm font-medium leading-[1.2] transition-colors ${
                  active
                    ? 'bg-[--ds-primary-bg]'
                    : 'hover:bg-[--ds-hover-bg]'
                }`}
                style={{ color: active ? 'var(--ds-primary-text)' : 'var(--ds-text-secondary)' }}
              >
                <i className={`${item.icon} text-lg flex-shrink-0 ${sidebarExpanded ? 'mr-2' : ''}`} />
                {sidebarExpanded && <span className="align-middle font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`text-center py-5 upgrade-ui ${!sidebarExpanded && 'hidden'}`}>
          <div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--ds-primary-bg)' }}>
              <i className="ti ti-user text-xl" style={{ color: 'var(--ds-primary-text)' }} />
            </div>
            <h5 className="text-sm font-semibold mb-1" style={{ color: 'var(--ds-heading-color)' }}>{user?.business_name || user?.email}</h5>
            <span className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="content" className={`min-h-screen ${sidebarExpanded ? 'ml-[250px]' : 'ml-[60px]'} transition-[margin-left] duration-300`}>
        {/* Navbar Glass */}
        <div className="navbar-glass fixed top-0 right-0 z-[1034] flex items-center h-16 px-4 lg:px-6 backdrop-blur-[6px]"
          style={{
            width: sidebarExpanded ? 'calc(100% - 250px)' : 'calc(100% - 60px)',
            backgroundColor: 'var(--ds-navbar-bg)',
            borderBottom: '1px dashed var(--ds-border)'
          }}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="p-2 transition-colors hidden lg:block" style={{ color: 'var(--ds-text-secondary)' }}>
                <span className={sidebarExpanded ? 'hidden' : 'block'}>
                  <i className="ti ti-arrow-bar-left text-xl" />
                </span>
                <span className={sidebarExpanded ? 'block' : 'hidden'}>
                  <i className="ti ti-arrow-bar-right text-xl" />
                </span>
              </button>
              <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="p-2 lg:hidden" style={{ color: 'var(--ds-text-secondary)' }}>
                <i className="ti ti-menu-2 text-xl" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-full transition-colors" style={{ color: 'var(--ds-text-secondary)' }}>
                <i className={`ti ${theme === 'dark' ? 'ti-sun' : 'ti-moon-stars'} text-xl`} />
              </button>

              <button type="button" className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors" style={{ color: 'var(--ds-text-secondary)', borderColor: 'var(--ds-border)' }}>
                <i className="ti ti-search text-base" />
                <small className="hidden sm:inline">Ctrl+K</small>
              </button>

              <div className="relative">
                <button className="w-9 h-9 flex items-center justify-center rounded-full transition-colors relative" style={{ color: 'var(--ds-text-secondary)' }}>
                  <i className="ti ti-bell text-xl" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[--ds-danger] text-white text-[10px] font-bold rounded-full flex items-center justify-center">2</span>
                </button>
              </div>

              <div className="ml-2">
                <button className="w-9 h-9 flex items-center justify-center rounded-full transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--ds-primary-bg)' }}>
                    <i className="ti ti-user text-sm" style={{ color: 'var(--ds-primary-text)' }} />
                  </div>
                </button>
              </div>

              <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 ml-1 text-sm transition-colors rounded-lg" style={{ color: 'var(--ds-text-secondary)' }}>
                <i className="ti ti-logout text-base" />
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="pt-20 px-5 lg:px-10 pb-10">
          <Outlet />
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Home />} />
            <Route path="estimate" element={<NewEstimate />} />
            <Route path="history" element={<History />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
