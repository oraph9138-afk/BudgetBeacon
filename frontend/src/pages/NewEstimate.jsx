import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEstimate } from "../services/api";
import ResultCard from "../components/ResultCard";

const BUSINESS_TYPES = [
  { value: "agriculture", label: "Agriculture" },
  { value: "retail", label: "Retail/Trade" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "transport", label: "Transport" },
  { value: "services", label: "Services" },
];

const LOCATIONS = [
  "Dar es Salaam",
  "Arusha",
  "Mwanza",
  "Dodoma",
  "Zanzibar",
  "Mbeya",
  "Other",
];

function NewEstimate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    business_type: "agriculture",
    material_cost: "",
    transport_cost: "",
    labor_cost: "",
    production_days: "",
    quantity: "",
    location: "Dar es Salaam",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        material_cost: parseFloat(formData.material_cost),
        transport_cost: parseFloat(formData.transport_cost),
        labor_cost: parseFloat(formData.labor_cost),
        production_days: parseInt(formData.production_days),
        quantity: parseInt(formData.quantity),
      };
      const response = await createEstimate(payload);
      setResult(response);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to get estimate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFormData({
      business_type: "agriculture",
      material_cost: "",
      transport_cost: "",
      labor_cost: "",
      production_days: "",
      quantity: "",
      location: "Dar es Salaam",
    });
  };

  if (result) {
    return <ResultCard result={result} onNew={handleReset} />;
  }

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
    <div className="max-w-2xl mx-auto space-y-6">
      <h5 className="text-base font-semibold mb-0" style={{ color: 'var(--ds-heading-color)' }}>New Cost Estimate</h5>

      <form className="card card-lg">
        <div className="card-body">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>Business Type</label>
              <select name="business_type" value={formData.business_type} onChange={handleChange} style={inputStyle}
                className="focus:[border-color:var(--ds-primary)] focus:[box-shadow:0_0_0_2px_rgba(0,167,111,0.25)]">
                {BUSINESS_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>Location</label>
              <select name="location" value={formData.location} onChange={handleChange} style={inputStyle}
                className="focus:[border-color:var(--ds-primary)] focus:[box-shadow:0_0_0_2px_rgba(0,167,111,0.25)]">
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>Material Cost (Tsh)</label>
              <input type="number" name="material_cost" value={formData.material_cost} onChange={handleChange}
                placeholder="e.g. 500000" required style={inputStyle}
                className="focus:[border-color:var(--ds-primary)] focus:[box-shadow:0_0_0_2px_rgba(0,167,111,0.25)]"
                onFocus={(e) => { e.target.style.borderColor = 'var(--ds-primary)'; e.target.style.boxShadow = '0 0 0 2px rgba(0,167,111,0.25)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--ds-border)'; e.target.style.boxShadow = 'none' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>Transport Cost (Tsh)</label>
              <input type="number" name="transport_cost" value={formData.transport_cost} onChange={handleChange}
                placeholder="e.g. 150000" required style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--ds-primary)'; e.target.style.boxShadow = '0 0 0 2px rgba(0,167,111,0.25)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--ds-border)'; e.target.style.boxShadow = 'none' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>Labor Cost (Tsh)</label>
              <input type="number" name="labor_cost" value={formData.labor_cost} onChange={handleChange}
                placeholder="e.g. 200000" required style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--ds-primary)'; e.target.style.boxShadow = '0 0 0 2px rgba(0,167,111,0.25)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--ds-border)'; e.target.style.boxShadow = 'none' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>Production Days</label>
              <input type="number" name="production_days" value={formData.production_days} onChange={handleChange}
                placeholder="e.g. 14" required style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--ds-primary)'; e.target.style.boxShadow = '0 0 0 2px rgba(0,167,111,0.25)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--ds-border)'; e.target.style.boxShadow = 'none' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>Quantity</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange}
                placeholder="e.g. 100" required style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--ds-primary)'; e.target.style.boxShadow = '0 0 0 2px rgba(0,167,111,0.25)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--ds-border)'; e.target.style.boxShadow = 'none' }} />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--ds-danger-bg)', color: 'var(--ds-danger-text)' }}>{error}</div>
          )}

          <div className="mt-6 flex gap-3">
            <button type="submit" disabled={loading}
              className="text-white px-5 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              style={{ backgroundColor: 'var(--ds-primary)' }}>
              {loading ? "Calculating..." : "Get Estimate"}
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

export default NewEstimate;
