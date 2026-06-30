import { useEffect, useState } from "react";
import { getHistory } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
                Tsh {avgCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                <Tooltip formatter={(value) => [`Tsh ${value.toLocaleString()}`, "Cost"]} />
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-sm" style={{ color: 'var(--ds-text-secondary)' }}>Loading...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
                    No estimates yet. <a href="/dashboard/estimate" className="font-medium" style={{ color: 'var(--ds-primary)' }}>Create one</a>
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id}>
                    <td className="text-sm" style={{ color: 'var(--ds-body-color)' }}>#{item.id}</td>
                    <td className="text-sm capitalize" style={{ color: 'var(--ds-text-secondary)' }}>{item.business_type}</td>
                    <td className="text-sm font-medium" style={{ color: 'var(--ds-body-color)' }}>
                      Tsh {item.predicted_cost.toLocaleString()}
                    </td>
                    <td className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>{item.confidence_pct}%</td>
                    <td>{getRiskBadge(item.risk_level)}</td>
                    <td className="text-sm" style={{ color: 'var(--ds-text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString()}
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
