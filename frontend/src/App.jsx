import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { PlusCircle, Clock, Home as HomeIcon, LogOut, User } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import NewEstimate from "./pages/NewEstimate";
import History from "./pages/History";
import Login from "./pages/Login";
import Register from "./pages/Register";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-gray-500">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/estimate" replace />;
  return children;
}

function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-bold text-gray-900">BudgetBeacon</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors text-sm">
              <HomeIcon className="w-4 h-4" /> Home
            </Link>
            {user ? (
              <>
                <Link to="/estimate" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors text-sm">
                  <PlusCircle className="w-4 h-4" /> New Estimate
                </Link>
                <Link to="/history" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors text-sm">
                  <Clock className="w-4 h-4" /> History
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <User className="w-4 h-4" /> {user.business_name || user.email}
                  </span>
                  <button onClick={logout} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            ) : (
              <Link to="/login" className="text-sm text-blue-600 hover:underline">Sign In</Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <NavBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/estimate" element={<ProtectedRoute><NewEstimate /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
