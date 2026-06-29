import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { BarChart3, PlusCircle, Clock, Home as HomeIcon } from "lucide-react";
import Home from "./pages/Home";
import NewEstimate from "./pages/NewEstimate";
import History from "./pages/History";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
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
                <Link to="/" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors text-sm">
                  <HomeIcon className="w-4 h-4" />
                  Home
                </Link>
                <Link to="/estimate" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors text-sm">
                  <PlusCircle className="w-4 h-4" />
                  New Estimate
                </Link>
                <Link to="/history" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors text-sm">
                  <Clock className="w-4 h-4" />
                  History
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/estimate" element={<NewEstimate />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
