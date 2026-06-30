import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    business_name: user?.business_name || "",
    phone: user?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfile(form);
      loginUser(localStorage.getItem("token"), updated);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h5 className="text-base font-semibold mb-1" style={{ color: 'var(--ds-heading-color)' }}>My Profile</h5>
        <p className="text-sm mb-0" style={{ color: 'var(--ds-text-secondary)' }}>Manage your account details.</p>
      </div>

      <form className="card card-lg" onSubmit={handleSubmit}>
        <div className="card-body space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4 pb-4" style={{ borderBottom: '1px solid var(--ds-border)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--ds-primary-bg)' }}>
              <i className="ti ti-user text-2xl" style={{ color: 'var(--ds-primary-text)' }} />
            </div>
            <div>
              <h6 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--ds-heading-color)' }}>{user?.business_name || "User"}</h6>
              <p className="text-xs mb-0" style={{ color: 'var(--ds-text-secondary)' }}>{user?.email}</p>
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>Email</label>
            <input type="email" value={user?.email || ""} disabled
              className="w-full px-3 py-2.5 text-sm rounded-lg opacity-60 cursor-not-allowed"
              style={{ border: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-input-bg)', color: 'var(--ds-body-color)' }} />
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>Business Name</label>
            <div className="relative">
              <i className="ti ti-building absolute left-2.5 top-1/2 -translate-y-1/2 text-base" style={{ color: 'var(--ds-text-muted)' }} />
              <input type="text" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg outline-none transition-all focus:border-[--ds-primary] focus:ring-2 focus:ring-[rgba(0,167,111,0.2)]"
                style={{ border: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-input-bg)', color: 'var(--ds-body-color)' }} />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>Phone</label>
            <div className="relative">
              <i className="ti ti-phone absolute left-2.5 top-1/2 -translate-y-1/2 text-base" style={{ color: 'var(--ds-text-muted)' }} />
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg outline-none transition-all focus:border-[--ds-primary] focus:ring-2 focus:ring-[rgba(0,167,111,0.2)]"
                style={{ border: '1px solid var(--ds-border)', backgroundColor: 'var(--ds-input-bg)', color: 'var(--ds-body-color)' }} />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: 'var(--ds-danger-bg)', color: 'var(--ds-danger-text)' }}>
              <i className="ti ti-alert-circle" /> {error}
            </div>
          )}

          {done && (
            <div className="p-3 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: 'var(--ds-success-bg)', color: 'var(--ds-success-text)' }}>
              <i className="ti ti-check" /> Profile updated successfully.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--ds-primary)' }}>
              {saving ? <><i className="ti ti-loader animate-spin" /> Saving...</> : <><i className="ti ti-device-floppy" /> Save Changes</>}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
              style={{ border: '1px solid var(--ds-border)', color: 'var(--ds-text-secondary)' }}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Profile;
