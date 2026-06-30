import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import NewEstimate from "./pages/NewEstimate";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";

const INITIAL_NOTIFICATIONS = [
  { id: 1, icon: "ti ti-sparkles", text: "AI model updated — estimates are now more accurate.", time: "2h ago", unread: true },
  { id: 2, icon: "ti ti-rocket", text: "Welcome to BudgetBeacon! Start your first estimate.", time: "1d ago", unread: true },
];

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

const SEARCH_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: "ti ti-smart-home", keywords: "home main" },
  { path: "/dashboard/estimate", label: "New Estimate", icon: "ti ti-plus", keywords: "create new cost estimation" },
  { path: "/dashboard/history", label: "History", icon: "ti ti-clock", keywords: "past previous estimates" },
  { path: "/dashboard/profile", label: "Profile", icon: "ti ti-user", keywords: "account settings" },
];

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [theme, setTheme] = useState(getStoredTheme);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIdx, setSearchIdx] = useState(0);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("expanded", sidebarExpanded);
    document.documentElement.classList.toggle("collapsed", !sidebarExpanded);
  }, [sidebarExpanded]);

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    setStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (searchRef.current && !searchRef.current.contains(e.target) && showSearch) {
        setShowSearch(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSearch]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(prev => !prev);
        setSearchQuery("");
      }
      if (e.key === "Escape") {
        setShowSearch(false);
        setSearchQuery("");
        setShowNotif(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (showSearch && searchInputRef.current) searchInputRef.current.focus();
  }, [showSearch]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = (e) => {
    e.stopPropagation();
    setNotifications([]);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "ti ti-smart-home" },
    { path: "/dashboard/estimate", label: "New Estimate", icon: "ti ti-plus" },
    { path: "/dashboard/history", label: "History", icon: "ti ti-clock" },
    { path: "/dashboard/profile", label: "Profile", icon: "ti ti-user" },
  ];

  const isActive = (path) => location.pathname === path;

  const filteredSearch = searchQuery.trim()
    ? SEARCH_ITEMS.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SEARCH_ITEMS;

  const handleSearchNavigate = useCallback((path) => {
    setShowSearch(false);
    setSearchQuery("");
    navigate(path);
  }, [navigate]);

  const handleSearchKeyDown = (e) => {
    if (!filteredSearch.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchIdx(prev => Math.min(prev + 1, filteredSearch.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSearchNavigate(filteredSearch[searchIdx].path);
    }
  };

  useEffect(() => {
    setSearchIdx(0);
  }, [searchQuery]);

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

        {/* Sidebar Profile Card */}
        <button onClick={() => { navigate("/dashboard/profile"); setSidebarExpanded(true); }}
          className={`w-full text-left py-5 upgrade-ui cursor-pointer border-0 ${!sidebarExpanded && 'hidden'}`}
          style={{ backgroundColor: 'transparent' }}>
          <div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--ds-primary-bg)' }}>
              <i className="ti ti-user text-xl" style={{ color: 'var(--ds-primary-text)' }} />
            </div>
            <h5 className="text-sm font-semibold mb-1" style={{ color: 'var(--ds-heading-color)' }}>{user?.business_name || user?.email}</h5>
            <span className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>{user?.email}</span>
          </div>
        </button>
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

              <button onClick={() => { setShowSearch(true); setSearchQuery(""); }}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--ds-text-secondary)', borderColor: 'var(--ds-border)' }}>
                <i className="ti ti-search text-base" />
                <small className="hidden sm:inline">Ctrl+K</small>
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotif(!showNotif)}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-colors relative" style={{ color: 'var(--ds-text-secondary)' }}>
                  <i className="ti ti-bell text-xl" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[--ds-danger] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotif && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-lg z-[1050] overflow-hidden"
                    style={{ backgroundColor: 'var(--ds-card-bg)', border: '1px solid var(--ds-border)' }}>
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--ds-border)' }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--ds-heading-color)' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs font-medium hover:underline" style={{ color: 'var(--ds-primary)' }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} onClick={() => markAsRead(n.id)}
                          className="flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer"
                          style={{
                            borderBottom: '1px solid var(--ds-table-border)',
                            backgroundColor: n.unread ? 'var(--ds-hover-bg)' : 'transparent'
                          }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'var(--ds-primary-bg)' }}>
                            <i className={`${n.icon} text-sm`} style={{ color: 'var(--ds-primary-text)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs mb-0.5" style={{ color: 'var(--ds-body-color)' }}>{n.text}</p>
                            <span className="text-[10px]" style={{ color: 'var(--ds-text-muted)' }}>{n.time}</span>
                          </div>
                          {n.unread && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: 'var(--ds-primary)' }} />}
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="px-4 py-8 text-center text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                          <i className="ti ti-bell-off text-lg mb-2 block" />
                          No notifications yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div className="ml-2">
                <button onClick={() => navigate("/dashboard/profile")}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-colors">
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

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-[1060] flex items-start justify-center pt-[15vh]"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div ref={searchRef} className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-fadeIn"
            style={{ backgroundColor: 'var(--ds-card-bg)', border: '1px solid var(--ds-border)' }}>
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--ds-border)' }}>
              <i className="ti ti-search text-base" style={{ color: 'var(--ds-text-muted)' }} />
              <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown}
                placeholder="Type to search..."
                className="flex-1 bg-transparent border-0 outline-none text-sm" autoComplete="off"
                style={{ color: 'var(--ds-body-color)' }} />
              <kbd className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ color: 'var(--ds-text-muted)', border: '1px solid var(--ds-border)' }}>ESC</kbd>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {filteredSearch.map((item, i) => (
                <button key={item.path} onClick={() => handleSearchNavigate(item.path)} onMouseEnter={() => setSearchIdx(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                    i === searchIdx ? 'bg-[--ds-primary-bg]' : 'hover:bg-[--ds-hover-bg]'
                  }`}
                  style={{ color: i === searchIdx ? 'var(--ds-primary-text)' : 'var(--ds-body-color)' }}>
                  <i className={`${item.icon} text-base`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              {filteredSearch.length === 0 && (
                <div className="px-3 py-8 text-center text-xs" style={{ color: 'var(--ds-text-muted)' }}>
                  No results for "<strong>{searchQuery}</strong>"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
