import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEstimate } from "../services/api";
import ResultCard from "../components/ResultCard";
import { currencies, formatCurrency, convertToTZS, convertFromTZS } from "../utils/currency";

const BUSINESS_TYPES = [
  { value: "agriculture", label: "Agriculture", icon: "ti ti-trees" },
  { value: "retail", label: "Retail/Trade", icon: "ti ti-shopping-cart" },
  { value: "manufacturing", label: "Manufacturing", icon: "ti ti-factory" },
  { value: "transport", label: "Transport", icon: "ti ti-truck" },
  { value: "services", label: "Services", icon: "ti ti-building" },
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

const STEPS = [
  { id: 1, label: "Business", icon: "ti ti-building-store" },
  { id: 2, label: "Costs", icon: "ti ti-coin" },
  { id: 3, label: "Production", icon: "ti ti-calendar-time" },
  { id: 4, label: "Review", icon: "ti ti-eye" },
];

function NewEstimate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [currency, setCurrency] = useState("TZS");
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectBusiness = (value) => {
    setFormData((prev) => ({ ...prev, business_type: value }));
  };

  const selectLocation = (value) => {
    setFormData((prev) => ({ ...prev, location: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        material_cost: convertToTZS(parseFloat(formData.material_cost) || 0, currency),
        transport_cost: convertToTZS(parseFloat(formData.transport_cost) || 0, currency),
        labor_cost: convertToTZS(parseFloat(formData.labor_cost) || 0, currency),
        production_days: parseInt(formData.production_days),
        quantity: parseInt(formData.quantity),
        currency,
      };
      const response = await createEstimate(payload);
      setResult({ ...response, displayCurrency: currency });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to get estimate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setStep(1);
    setCurrency("TZS");
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

  const formatRough = (n) => formatCurrency(n, currency);

  const goNext = () => setStep((s) => Math.min(s + 1, 4));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  if (result) {
    return <ResultCard result={result} onNew={handleReset} />;
  }

  const inputStyle = (name) => ({
    border: '1px solid var(--ds-border)',
    borderRadius: '0.5rem',
    padding: '0.625rem 0.75rem 0.625rem 2.25rem',
    fontSize: '0.875rem',
    color: 'var(--ds-body-color)',
    backgroundColor: 'var(--ds-input-bg)',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h5 className="text-base font-semibold mb-1" style={{ color: 'var(--ds-heading-color)' }}>New Cost Estimate</h5>
        <p className="text-sm mb-0" style={{ color: 'var(--ds-text-secondary)' }}>Follow the steps below to get an AI-powered cost prediction.</p>
      </div>

      {/* Step Indicator */}
      <div className="card card-lg">
        <div className="card-body">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step === s.id
                      ? 'text-white shadow-lg'
                      : step > s.id
                      ? 'text-white'
                      : ''
                  }`}
                    style={{
                      backgroundColor: step > s.id ? 'var(--ds-success)' : step === s.id ? 'var(--ds-primary)' : 'var(--ds-border)',
                      color: step <= s.id && step !== s.id ? 'var(--ds-text-muted)' : undefined,
                      boxShadow: step === s.id ? '0 4px 12px rgba(0,167,111,0.35)' : 'none',
                    }}>
                    {step > s.id ? <i className="ti ti-check text-lg" /> : <i className={`${s.icon} text-lg`} />}
                  </div>
                  <span className={`text-[10px] font-semibold mt-1.5 uppercase tracking-wide transition-colors ${
                    step === s.id ? '' : ''
                  }`}
                    style={{ color: step >= s.id ? 'var(--ds-primary)' : 'var(--ds-text-muted)' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-3 mt-[-1.25rem]" style={{
                    backgroundColor: step > s.id ? 'var(--ds-success)' : 'var(--ds-border)',
                    transition: 'background-color 0.3s',
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="relative overflow-hidden">
        <div className="transition-all duration-300">
          <div className="card card-lg">
            <div className="card-body">
              {/* Step 1: Business Info */}
              {step === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h6 className="text-sm font-semibold mb-1" style={{ color: 'var(--ds-heading-color)' }}>Business Type</h6>
                    <p className="text-xs mb-4" style={{ color: 'var(--ds-text-secondary)' }}>What type of business are you running?</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {BUSINESS_TYPES.map((type) => (
                        <button key={type.value} type="button" onClick={() => selectBusiness(type.value)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                            formData.business_type === type.value
                              ? 'ring-2 text-white shadow-md'
                              : 'hover:bg-[--ds-hover-bg]'
                          }`}
                          style={{
                            backgroundColor: formData.business_type === type.value ? 'var(--ds-primary)' : 'var(--ds-hover-bg)',
                            color: formData.business_type === type.value ? '#fff' : 'var(--ds-body-color)',
                            ringColor: formData.business_type === type.value ? 'var(--ds-primary)' : undefined,
                          }}>
                          <i className={`${type.icon} text-xl`} />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <hr style={{ borderColor: 'var(--ds-border)' }} />

                  <div>
                    <h6 className="text-sm font-semibold mb-1" style={{ color: 'var(--ds-heading-color)' }}>Location</h6>
                    <p className="text-xs mb-4" style={{ color: 'var(--ds-text-secondary)' }}>Where is your business based?</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {LOCATIONS.map((loc) => (
                        <button key={loc} type="button" onClick={() => selectLocation(loc)}
                          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            formData.location === loc
                              ? 'text-white shadow-sm'
                              : 'hover:bg-[--ds-hover-bg]'
                          }`}
                          style={{
                            backgroundColor: formData.location === loc ? 'var(--ds-primary)' : 'transparent',
                            color: formData.location === loc ? '#fff' : 'var(--ds-body-color)',
                            border: formData.location === loc ? 'none' : '1px solid var(--ds-border)',
                          }}>
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Costs */}
              {step === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <h6 className="text-sm font-semibold mb-1" style={{ color: 'var(--ds-heading-color)' }}>Cost Breakdown</h6>
                  <p className="text-xs mb-4" style={{ color: 'var(--ds-text-secondary)' }}>Enter the estimated costs for each category.</p>

                  {/* Currency Selector */}
                  <div className="flex items-center gap-2 pb-2">
                    <span className="text-xs font-medium mr-1" style={{ color: 'var(--ds-text-muted)' }}>Currency:</span>
                    {currencies.map((c) => (
                      <button key={c.code} type="button" onClick={() => setCurrency(c.code)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: currency === c.code ? 'var(--ds-primary)' : 'var(--ds-hover-bg)',
                          color: currency === c.code ? '#fff' : 'var(--ds-body-color)',
                          border: currency === c.code ? 'none' : '1px solid var(--ds-border)',
                        }}>
                        {c.code}
                      </button>
                    ))}
                  </div>

                  {[
                    { name: "material_cost", label: "Material Cost", icon: "ti ti-package", placeholder: "e.g. 500000", desc: "Raw materials and supplies" },
                    { name: "transport_cost", label: "Transport Cost", icon: "ti ti-truck", placeholder: "e.g. 150000", desc: "Logistics and shipping" },
                    { name: "labor_cost", label: "Labor Cost", icon: "ti ti-users", placeholder: "e.g. 200000", desc: "Wages and workforce" },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-0.5" style={{ color: 'var(--ds-label-color)' }}>{field.label}</label>
                      <p className="text-[11px] mb-1.5" style={{ color: 'var(--ds-text-muted)' }}>{field.desc}</p>
                      <div className="relative">
                        <i className={`${field.icon} absolute left-2.5 top-1/2 -translate-y-1/2 text-base`} style={{ color: 'var(--ds-text-muted)' }} />
                        <input type="number" name={field.name} value={formData[field.name]} onChange={handleChange}
                          placeholder={field.placeholder} required style={inputStyle(field.name)}
                          className="focus:[border-color:var(--ds-primary)] focus:[box-shadow:0_0_0_2px_rgba(0,167,111,0.2)]" />
                        {parseFloat(formData[field.name]) > 0 && (
                          <i className="ti ti-check absolute right-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--ds-success)' }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3: Production */}
              {step === 3 && (
                <div className="space-y-5 animate-fadeIn">
                  <h6 className="text-sm font-semibold mb-1" style={{ color: 'var(--ds-heading-color)' }}>Production Details</h6>
                  <p className="text-xs mb-4" style={{ color: 'var(--ds-text-secondary)' }}>Tell us about your production capacity.</p>

                  <div>
                    <label className="block text-sm font-medium mb-0.5" style={{ color: 'var(--ds-label-color)' }}>Production Days</label>
                    <p className="text-[11px] mb-1.5" style={{ color: 'var(--ds-text-muted)' }}>Number of days for this production cycle</p>
                    <div className="relative">
                      <i className="ti ti-calendar-time absolute left-2.5 top-1/2 -translate-y-1/2 text-base" style={{ color: 'var(--ds-text-muted)' }} />
                      <input type="number" name="production_days" value={formData.production_days} onChange={handleChange}
                        placeholder="e.g. 14" required style={inputStyle('production_days')}
                        className="focus:[border-color:var(--ds-primary)] focus:[box-shadow:0_0_0_2px_rgba(0,167,111,0.2)]" />
                      {pd > 0 && (
                        <i className="ti ti-check absolute right-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--ds-success)' }} />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-0.5" style={{ color: 'var(--ds-label-color)' }}>Quantity</label>
                    <p className="text-[11px] mb-1.5" style={{ color: 'var(--ds-text-muted)' }}>Expected units to produce</p>
                    <div className="relative">
                      <i className="ti ti-numbers absolute left-2.5 top-1/2 -translate-y-1/2 text-base" style={{ color: 'var(--ds-text-muted)' }} />
                      <input type="number" name="quantity" value={formData.quantity} onChange={handleChange}
                        placeholder="e.g. 100" required style={inputStyle('quantity')}
                        className="focus:[border-color:var(--ds-primary)] focus:[box-shadow:0_0_0_2px_rgba(0,167,111,0.2)]" />
                      {qty > 0 && (
                        <i className="ti ti-check absolute right-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--ds-success)' }} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div className="space-y-5 animate-fadeIn">
                  <h6 className="text-sm font-semibold mb-1" style={{ color: 'var(--ds-heading-color)' }}>Review Your Details</h6>
                  <p className="text-xs mb-4" style={{ color: 'var(--ds-text-secondary)' }}>Double-check everything before submitting.</p>

                  <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--ds-hover-bg)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Business</span>
                      <span className="text-sm font-medium capitalize" style={{ color: 'var(--ds-body-color)' }}>{formData.business_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Location</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--ds-body-color)' }}>{formData.location}</span>
                    </div>
                    <hr style={{ borderColor: 'var(--ds-border)' }} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Material</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--ds-body-color)' }}>{mc > 0 ? formatRough(mc) : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Transport</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--ds-body-color)' }}>{tc > 0 ? formatRough(tc) : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Labor</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--ds-body-color)' }}>{lc > 0 ? formatRough(lc) : "—"}</span>
                    </div>
                    <hr style={{ borderColor: 'var(--ds-border)' }} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Production Days</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--ds-body-color)' }}>{pd > 0 ? pd : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Quantity</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--ds-body-color)' }}>{qty > 0 ? qty : "—"}</span>
                    </div>
                    <hr style={{ borderColor: 'var(--ds-border)' }} />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-bold" style={{ color: 'var(--ds-primary)' }}>Rough Total</span>
                      <span className="text-lg font-bold" style={{ color: 'var(--ds-primary)' }}>{subtotal > 0 ? formatRough(roughTotal) : "—"}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg text-sm flex items-center gap-2" style={{ backgroundColor: 'var(--ds-danger-bg)', color: 'var(--ds-danger-text)' }}>
                      <i className="ti ti-alert-circle" />
                      {error}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 mt-6" style={{ borderTop: '1px solid var(--ds-border)' }}>
                <div>
                  {step > 1 ? (
                    <button type="button" onClick={goBack}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={{ border: '1px solid var(--ds-border)', color: 'var(--ds-text-secondary)' }}>
                      <i className="ti ti-arrow-left" /> Back
                    </button>
                  ) : (
                    <button type="button" onClick={() => navigate(-1)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={{ border: '1px solid var(--ds-border)', color: 'var(--ds-text-secondary)' }}>
                      <i className="ti ti-x" /> Cancel
                    </button>
                  )}
                </div>

                <div>
                  {step < 4 ? (
                    <button type="button" onClick={goNext}
                      className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all"
                      style={{ backgroundColor: 'var(--ds-primary)' }}>
                      Next <i className="ti ti-arrow-right" />
                    </button>
                  ) : (
                    <button type="button" onClick={handleSubmit} disabled={loading}
                      className="inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                      style={{ backgroundColor: 'var(--ds-primary)' }}>
                      {loading ? (
                        <><i className="ti ti-loader animate-spin" /> Calculating...</>
                      ) : (
                        <><i className="ti ti-sparkles" /> Submit Estimate</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewEstimate;
