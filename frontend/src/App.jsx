import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { PlusCircle, Clock, LogOut, User } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import NewEstimate from "./pages/NewEstimate";
import History from "./pages/History";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Redirects to /login if not authenticated
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="text-xl font-bold text-gray-900">BudgetBeacon</span>
          </Link>

          <nav className="flex items-center gap-6">
            {user ? (
              <>
                <Link to="/estimate" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors text-sm">
                  <PlusCircle className="w-4 h-4" /> New Estimate
                </Link>
                <Link to="/history" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors text-sm">
                  <Clock className="w-4 h-4" /> History
                </Link>

                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="hidden sm:inline font-medium">
                      {user.business_name || user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
                  Sign in
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/estimate" element={<ProtectedRoute><NewEstimate /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
