import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(form);
      loginUser(res.token, res.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    border: '1px solid var(--ds-border)',
    borderRadius: '0.5rem',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    color: 'var(--ds-body-color)',
    backgroundColor: 'var(--ds-input-bg)',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
  };

  return (
    <main className="min-h-screen flex flex-col justify-center relative" style={{ backgroundColor: 'var(--ds-body-bg)' }}>
      <button onClick={toggleTheme} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full transition-colors z-10" style={{ color: 'var(--ds-text-secondary)' }}>
        <i className={`ti ${theme === 'dark' ? 'ti-sun' : 'ti-moon-stars'} text-xl`} />
      </button>
      <section className="py-8">
        <div className="container max-w-lg mx-auto px-4">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 no-underline mb-4">
              <img src="/logo-icon.svg" alt="BudgetBeacon" className="w-9 h-9" />
              <span className="text-2xl font-bold" style={{ color: 'var(--ds-heading-color)' }}>BudgetBeacon</span>
            </Link>
            <h1 className="text-[1.75rem] font-semibold mb-1" style={{ color: 'var(--ds-heading-color)' }}>Welcome Back</h1>
            <p style={{ color: 'var(--ds-text-secondary)' }}>
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-medium" style={{ color: 'var(--ds-primary)' }}>Register here</Link>
            </p>
          </div>

          <div className="card card-lg" style={{ boxShadow: 'var(--ds-shadow-card)' }}>
            <div className="card-body p-8">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>
                    Email <span style={{ color: 'var(--ds-danger)' }}>*</span>
                  </label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--ds-primary)'; e.target.style.boxShadow = '0 0 0 2px rgba(0,167,111,0.25)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--ds-border)'; e.target.style.boxShadow = 'none' }} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>
                    Password <span style={{ color: 'var(--ds-danger)' }}>*</span>
                  </label>
                  <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--ds-primary)'; e.target.style.boxShadow = '0 0 0 2px rgba(0,167,111,0.25)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--ds-border)'; e.target.style.boxShadow = 'none' }} />
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--ds-danger-bg)', color: 'var(--ds-danger-text)' }}>{error}</div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full text-white py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50 text-sm"
                  style={{ backgroundColor: 'var(--ds-primary)' }}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;
