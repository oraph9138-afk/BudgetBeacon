import { useEffect, useState, useRef } from "react";
import { getHistory } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { formatCurrency, convertFromTZS } from "../utils/currency";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const quoteRefs = useRef({});

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (tzs) => formatCurrency(convertFromTZS(tzs, "TZS"), "TZS");

  const handleDownloadPDF = async (item) => {
    const el = quoteRefs.current[item.id];
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save(`BudgetBeacon_Quote_#${item.id}.pdf`);
  };

  const chartData = history.slice(0, 10).map((item) => ({
    id: `#${item.id}`,
    cost: item.predicted_cost,
    confidence: item.confidence_pct,
  })).reverse();

  const getRiskBadge = (risk) => {
    const styles = {
      Low: { bg: 'var(--ds-success-bg)', text: 'var(--ds-success-text)' },
      Medium: { bg: 'var(--ds-warning-bg)', text: 'var(--ds-warning-text)' },
      High: { bg: 'var(--ds-danger-bg)', text: 'var(--ds-danger-text)' },
    };
    const s = styles[risk] || styles.Low;
    return (
      <span className="badge" style={{ backgroundColor: s.bg, color: s.text }}>{risk}</span>
    );
  };

  const totalEstimates = history.length;
  const avgConfidence = history.length
    ? (history.reduce((sum, e) => sum + e.confidence_pct, 0) / history.length).toFixed(1)
    : 0;
  const avgCost = history.length
    ? history.reduce((sum, e) => sum + e.predicted_cost, 0) / history.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h5 className="text-base font-semibold mb-0" style={{ color: 'var(--ds-heading-color)' }}>Estimate History</h5>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="card card-lg">
          <div className="card-body d-flex flex-column gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--ds-primary-bg)' }}>
                <i className="ti ti-list text-xl" style={{ color: 'var(--ds-primary-text)' }} />
              </div>
              <div className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>Total Estimates</div>
            </div>
            <div className="flex items-end justify-between lh-1">
              <div className="text-[1.75rem] font-bold" style={{ color: 'var(--ds-heading-color)' }}>{totalEstimates}</div>
            </div>
          </div>
        </div>
        <div className="card card-lg">
          <div className="card-body d-flex flex-column gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--ds-info-bg)' }}>
                <i className="ti ti-shield text-xl" style={{ color: 'var(--ds-info-text)' }} />
              </div>
              <div className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>Avg Confidence</div>
            </div>
            <div className="flex items-end justify-between lh-1">
              <div className="text-[1.75rem] font-bold" style={{ color: 'var(--ds-heading-color)' }}>{avgConfidence}%</div>
            </div>
          </div>
        </div>
        <div className="card card-lg">
          <div className="card-body d-flex flex-column gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--ds-success-bg)' }}>
                <i className="ti ti-coin text-xl" style={{ color: 'var(--ds-success-text)' }} />
              </div>
              <div className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>Avg Estimated Cost</div>
            </div>
            <div className="flex items-end justify-between lh-1">
              <div className="text-[1.75rem] font-bold" style={{ color: 'var(--ds-heading-color)' }}>
                {fmt(avgCost)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="card card-lg">
          <div className="card-body">
            <h5 className="text-base font-semibold mb-4" style={{ color: 'var(--ds-heading-color)' }}>Recent Estimates</h5>
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-border)" />
                <XAxis dataKey="id" tick={{ fontSize: 12, fill: 'var(--ds-text-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--ds-text-muted)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [fmt(value), "Cost"]} />
                <Bar dataKey="cost" fill="var(--ds-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card card-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Business</th>
                <th>Predicted Cost</th>
                <th>Confidence</th>
                <th>Risk</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-sm" style={{ color: 'var(--ds-text-secondary)' }}>Loading...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
                    No estimates yet. <a href="/dashboard/estimate" className="font-medium" style={{ color: 'var(--ds-primary)' }}>Create one</a>
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id}>
                    {/* Hidden quote template */}
                    <td colSpan={7} className="hidden" style={{ display: 'none' }}>
                      <div ref={(el) => { quoteRefs.current[item.id] = el; }}
                        className="p-8" style={{ fontFamily: "'Public Sans', sans-serif", backgroundColor: '#ffffff', color: '#1c252e' }}>
                        <div style={{ borderBottom: '2px solid #00a76f', paddingBottom: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <img src="/logo-icon.svg" alt="" style={{ width: 28, height: 28 }} />
                          <span style={{ fontSize: 18, fontWeight: 700 }}>BudgetBeacon</span>
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Cost Estimate Quote #{item.id}</h2>
                        <p style={{ fontSize: 11, color: '#637381', marginBottom: 20 }}>{item.business_type} &middot; {new Date(item.created_at).toLocaleDateString()}</p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f4f6f8' }}>
                              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Item</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid #e5e8eb' }}>
                              <td style={{ padding: '8px 10px', color: '#637381' }}>Estimated Total Cost</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#00a76f' }}>{fmt(item.predicted_cost)}</td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ fontSize: 11, color: '#637381', marginTop: 6 }}>Confidence: {item.confidence_pct}% &middot; Risk: {item.risk_level}</div>
                        <div style={{ fontSize: 10, color: '#637381', marginTop: 24, borderTop: '1px solid #e5e8eb', paddingTop: 12 }}>
                          Powered by BudgetBeacon &mdash; AI-Powered Cost Estimation
                        </div>
                      </div>
                    </td>
                    { /* Visible row */ }
                    <td className="text-sm" style={{ color: 'var(--ds-body-color)' }}>#{item.id}</td>
                    <td className="text-sm capitalize" style={{ color: 'var(--ds-text-secondary)' }}>{item.business_type}</td>
                    <td className="text-sm font-medium" style={{ color: 'var(--ds-body-color)' }}>
                      {fmt(item.predicted_cost)}
                    </td>
                    <td className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>{item.confidence_pct}%</td>
                    <td>{getRiskBadge(item.risk_level)}</td>
                    <td className="text-sm" style={{ color: 'var(--ds-text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button onClick={() => handleDownloadPDF(item)}
                        className="p-2 rounded-lg transition-colors cursor-pointer text-sm"
                        style={{ color: 'var(--ds-primary)' }}
                        title="Download PDF">
                        <i className="ti ti-file-download" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default History;
