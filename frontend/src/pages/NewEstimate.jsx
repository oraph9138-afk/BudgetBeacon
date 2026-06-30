import { useState, useMemo } from "react";
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
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const mc = parseFloat(formData.material_cost) || 0;
  const tc = parseFloat(formData.transport_cost) || 0;
  const lc = parseFloat(formData.labor_cost) || 0;
  const pd = parseInt(formData.production_days) || 0;
  const qty = parseInt(formData.quantity) || 0;
  const subtotal = mc + tc + lc;
  const roughTotal = subtotal * (qty || 1);

  const filledCount = [mc > 0, tc > 0, lc > 0, pd > 0, qty > 0].filter(Boolean).length;
  const progress = Math.round((filledCount / 5) * 100);

  if (result) {
    return <ResultCard result={result} onNew={handleReset} />;
  }

  const inputClass = (name) =>
    `w-full pl-9 pr-3 py-2.5 text-sm rounded-lg outline-none transition-all duration-200` +
    ` ${focusedField === name ? 'border-[--ds-primary] ring-2 ring-[rgba(0,167,111,0.2)]' : ''}`;

  const fieldIcons = {
    business_type: "ti ti-building-store",
    location: "ti ti-map-pin",
    material_cost: "ti ti-package",
    transport_cost: "ti ti-truck",
    labor_cost: "ti ti-users",
    production_days: "ti ti-calendar-time",
    quantity: "ti ti-numbers",
  };

  const formatRough = (n) => `Tsh ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h5 className="text-base font-semibold mb-1" style={{ color: 'var(--ds-heading-color)' }}>New Cost Estimate</h5>
        <p className="text-sm mb-0" style={{ color: 'var(--ds-text-secondary)' }}>Fill in your business details to get an AI-powered cost prediction.</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--ds-border)' }}>
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: progress === 100 ? 'var(--ds-success)' : 'var(--ds-primary)' }} />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Form */}
        <div className="md:col-span-2">
          <form className="card card-lg">
            <div className="card-body space-y-6">
              {/* Section: Business Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <i className="ti ti-building text-base" style={{ color: 'var(--ds-primary)' }} />
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ds-text-muted)' }}>Business Info</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>Business Type</label>
                    <div className="relative">
                      <i className={`ti ti-building-store absolute left-2.5 top-1/2 -translate-y-1/2 text-base`} style={{ color: focusedField === 'business_type' ? 'var(--ds-primary)' : 'var(--ds-text-muted)' }} />
                      <select name="business_type" value={formData.business_type} onChange={handleChange}
                        onFocus={() => setFocusedField('business_type')} onBlur={() => setFocusedField(null)}
                        className={inputClass('business_type')}
                        style={{ border: `1px solid ${focusedField === 'business_type' ? 'var(--ds-primary)' : 'var(--ds-border)'}`, backgroundColor: 'var(--ds-input-bg)', color: 'var(--ds-body-color)' }}>
                        {BUSINESS_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>Location</label>
                    <div className="relative">
                      <i className="ti ti-map-pin absolute left-2.5 top-1/2 -translate-y-1/2 text-base" style={{ color: focusedField === 'location' ? 'var(--ds-primary)' : 'var(--ds-text-muted)' }} />
                      <select name="location" value={formData.location} onChange={handleChange}
                        onFocus={() => setFocusedField('location')} onBlur={() => setFocusedField(null)}
                        className={inputClass('location')}
                        style={{ border: `1px solid ${focusedField === 'location' ? 'var(--ds-primary)' : 'var(--ds-border)'}`, backgroundColor: 'var(--ds-input-bg)', color: 'var(--ds-body-color)' }}>
                        {LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <hr style={{ borderColor: 'var(--ds-border)' }} />

              {/* Section: Cost Details */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <i className="ti ti-coin text-base" style={{ color: 'var(--ds-primary)' }} />
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ds-text-muted)' }}>Cost Details</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { name: "material_cost", label: "Material Cost (Tsh)", icon: "ti ti-package", placeholder: "e.g. 500000" },
                    { name: "transport_cost", label: "Transport Cost (Tsh)", icon: "ti ti-truck", placeholder: "e.g. 150000" },
                    { name: "labor_cost", label: "Labor Cost (Tsh)", icon: "ti ti-users", placeholder: "e.g. 200000" },
                    { name: "production_days", label: "Production Days", icon: "ti ti-calendar-time", placeholder: "e.g. 14" },
                    { name: "quantity", label: "Quantity", icon: "ti ti-numbers", placeholder: "e.g. 100" },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ds-label-color)' }}>{field.label}</label>
                      <div className="relative">
                        <i className={`${field.icon} absolute left-2.5 top-1/2 -translate-y-1/2 text-base transition-colors`}
                          style={{ color: focusedField === field.name ? 'var(--ds-primary)' : 'var(--ds-text-muted)' }} />
                        <input type="number" name={field.name} value={formData[field.name]} onChange={handleChange}
                          placeholder={field.placeholder} required
                          onFocus={() => setFocusedField(field.name)} onBlur={() => setFocusedField(null)}
                          className={inputClass(field.name)}
                          style={{ border: `1px solid ${focusedField === field.name ? 'var(--ds-primary)' : 'var(--ds-border)'}`, backgroundColor: 'var(--ds-input-bg)', color: 'var(--ds-body-color)' }} />
                        {parseFloat(formData[field.name]) > 0 && (
                          <i className="ti ti-check absolute right-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--ds-success)' }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: 'var(--ds-danger-bg)', color: 'var(--ds-danger-text)' }}>
                  <i className="ti ti-alert-circle" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading || progress < 100}
                  className="inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-lg font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  style={{ backgroundColor: progress === 100 ? 'var(--ds-primary)' : 'var(--ds-text-muted)' }}>
                  {loading ? (
                    <><i className="ti ti-loader animate-spin" /> Calculating...</>
                  ) : (
                    <><i className="ti ti-sparkles" /> Get Estimate</>
                  )}
                </button>
                <button type="button" onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
                  style={{ border: '1px solid var(--ds-border)', color: 'var(--ds-text-secondary)' }}>
                  <i className="ti ti-x" /> Cancel
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Live Preview Panel */}
        <div className="card card-lg" style={{ height: 'fit-content', position: 'sticky', top: '5.5rem' }}>
          <div className="card-body space-y-4">
            <div className="flex items-center gap-2">
              <i className="ti ti-eye text-base" style={{ color: 'var(--ds-primary)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--ds-heading-color)' }}>Live Preview</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--ds-table-border)' }}>
                <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Material</span>
                <span className="text-sm font-medium" style={{ color: mc > 0 ? 'var(--ds-body-color)' : 'var(--ds-text-muted)' }}>{mc > 0 ? formatRough(mc) : "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--ds-table-border)' }}>
                <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Transport</span>
                <span className="text-sm font-medium" style={{ color: tc > 0 ? 'var(--ds-body-color)' : 'var(--ds-text-muted)' }}>{tc > 0 ? formatRough(tc) : "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--ds-table-border)' }}>
                <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Labor</span>
                <span className="text-sm font-medium" style={{ color: lc > 0 ? 'var(--ds-body-color)' : 'var(--ds-text-muted)' }}>{lc > 0 ? formatRough(lc) : "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--ds-table-border)' }}>
                <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Qty</span>
                <span className="text-sm font-medium" style={{ color: qty > 0 ? 'var(--ds-body-color)' : 'var(--ds-text-muted)' }}>{qty > 0 ? qty : "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--ds-table-border)' }}>
                <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Days</span>
                <span className="text-sm font-medium" style={{ color: pd > 0 ? 'var(--ds-body-color)' : 'var(--ds-text-muted)' }}>{pd > 0 ? pd : "—"}</span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ds-primary)' }}>Rough Total</span>
                <span className="text-base font-bold" style={{ color: subtotal > 0 ? 'var(--ds-primary)' : 'var(--ds-text-muted)' }}>
                  {subtotal > 0 ? formatRough(roughTotal) : "—"}
                </span>
              </div>
              {subtotal > 0 && (
                <p className="text-[10px] mb-0" style={{ color: 'var(--ds-text-muted)' }}>
                  Sum of costs &times; quantity. Actual estimate may differ.
                </p>
              )}
            </div>

            {progress < 100 && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs" style={{ backgroundColor: 'var(--ds-warning-bg)', color: 'var(--ds-warning-text)' }}>
                <i className="ti ti-info-circle text-sm" />
                Fill all cost fields to enable the estimate.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewEstimate;
