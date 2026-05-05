import { Shield, AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";

function ResultCard({ result, onNew }) {
  const getConfidenceColor = (pct) => {
    if (pct >= 75) return "text-green-600";
    if (pct >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBg = (pct) => {
    if (pct >= 75) return "bg-green-600";
    if (pct >= 50) return "bg-yellow-600";
    return "bg-red-600";
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case "Low":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Medium":
        return <Shield className="w-5 h-5 text-yellow-600" />;
      case "High":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount) => {
    return `Tsh ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 mb-1">Estimated Total Cost</p>
          <p className="text-4xl font-bold text-gray-900">
            {formatCurrency(result.predicted_cost)}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Confidence Level</span>
              <span className={`text-lg font-bold ${getConfidenceColor(result.confidence_pct)}`}>
                {result.confidence_pct}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getConfidenceBg(result.confidence_pct)}`}
                style={{ width: `${result.confidence_pct}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {getRiskIcon(result.risk_level)}
              <span className="text-sm font-medium text-gray-600">Risk Level</span>
            </div>
            <p className="text-lg font-bold">{result.risk_level}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(result.breakdown).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600 capitalize">{key.replace("_", " ")}</span>
              <span className="font-medium">{formatCurrency(value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingDown className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Insight</p>
            <p className="text-sm text-blue-700">
              {result.confidence_pct >= 75
                ? "This estimate has high confidence. You can plan with reasonable certainty."
                : result.confidence_pct >= 50
                ? "Moderate confidence. Consider gathering more data for a more accurate estimate."
                : "Low confidence. Market conditions may be volatile. Use this estimate as a rough guide only."}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onNew}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        New Estimate
      </button>
    </div>
  );
}

export default ResultCard;
