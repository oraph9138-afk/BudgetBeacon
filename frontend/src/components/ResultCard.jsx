function ResultCard({ result, onNew }) {
  const getConfidenceColor = (pct) => {
    if (pct >= 75) return 'var(--ds-success)';
    if (pct >= 50) return 'var(--ds-warning)';
    return 'var(--ds-danger)';
  };

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

  const formatCurrency = (amount) => {
    return `Tsh ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="card card-lg">
        <div className="card-body">
          <div className="text-center mb-5">
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--ds-text-secondary)' }}>Estimated Total Cost</p>
            <p className="text-[1.75rem] font-bold" style={{ color: 'var(--ds-heading-color)' }}>{formatCurrency(result.predicted_cost)}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--ds-hover-bg)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--ds-text-secondary)' }}>Confidence Level</span>
                <span className="text-lg font-bold" style={{ color: getConfidenceColor(result.confidence_pct) }}>
                  {result.confidence_pct}%
                </span>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--ds-border)' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${result.confidence_pct}%`, backgroundColor: getConfidenceColor(result.confidence_pct) }} />
              </div>
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--ds-hover-bg)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--ds-text-secondary)' }}>Risk Level</span>
                {getRiskBadge(result.risk_level)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card card-lg">
        <div className="card-body">
          <h5 className="text-base font-semibold mb-4" style={{ color: 'var(--ds-heading-color)' }}>Cost Breakdown</h5>
          <div className="space-y-3">
            {Object.entries(result.breakdown).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-2 last:border-0" style={{ borderBottom: '1px solid var(--ds-table-border)' }}>
                <span className="text-sm capitalize" style={{ color: 'var(--ds-text-secondary)' }}>{key.replace("_", " ")}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--ds-body-color)' }}>{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--ds-primary-bg)' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[--ds-primary] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <i className="ti ti-trending-up text-white text-sm" />
          </div>
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--ds-primary-text)' }}>Insight</p>
            <p className="text-sm" style={{ color: 'var(--ds-primary-text)' }}>
              {result.confidence_pct >= 75
                ? "This estimate has high confidence. You can plan with reasonable certainty."
                : result.confidence_pct >= 50
                ? "Moderate confidence. Consider gathering more data for a more accurate estimate."
                : "Low confidence. Market conditions may be volatile. Use this estimate as a rough guide only."}
            </p>
          </div>
        </div>
      </div>

      <button onClick={onNew}
        className="w-full text-white px-5 py-2.5 rounded-lg font-bold transition-colors text-sm cursor-pointer"
        style={{ backgroundColor: 'var(--ds-primary)' }}>
        New Estimate
      </button>
    </div>
  );
}

export default ResultCard;
