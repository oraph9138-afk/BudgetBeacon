import { useEffect, useState } from "react";
import { getHistory } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertTriangle, Shield } from "lucide-react";

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
      Low: "bg-green-100 text-green-700",
      Medium: "bg-yellow-100 text-yellow-700",
      High: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[risk]}`}>
        {risk}
      </span>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Estimate History</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Total Estimates</div>
          <div className="text-2xl font-bold">{totalEstimates}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Avg Confidence</div>
          <div className="text-2xl font-bold flex items-center gap-2">
            {avgConfidence}%
            <Shield className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Avg Estimated Cost</div>
          <div className="text-2xl font-bold flex items-center gap-2">
            Tsh {avgCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold mb-4">Recent Estimates</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="id" />
                <YAxis />
                <Tooltip formatter={(value) => `Tsh ${value.toLocaleString()}`} />
                <Bar dataKey="cost" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Business</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Predicted Cost</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Confidence</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Risk</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No estimates yet. <a href="/estimate" className="text-blue-600 hover:underline">Create one</a>
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">#{item.id}</td>
                  <td className="px-6 py-4 text-sm capitalize">{item.business_type}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    Tsh {item.predicted_cost.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">{item.confidence_pct}%</td>
                  <td className="px-6 py-4">{getRiskBadge(item.risk_level)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default History;
