import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { formatCurrency, convertFromTZS } from "../utils/currency";

const TIP_ICONS = {
  success: "ti ti-circle-check",
  info: "ti ti-info-circle",
  warning: "ti ti-alert-triangle",
};

function ResultCard({ result, onNew }) {
  const quoteRef = useRef(null);
  const cur = result.displayCurrency || "TZS";

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

  const fmtAmount = (tzs) => formatCurrency(convertFromTZS(tzs, cur), cur);

  const handleDownloadPDF = async () => {
    const el = quoteRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save("BudgetBeacon_Quote.pdf");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* PDF Quote Template (hidden) */}
      <div ref={quoteRef} className="p-8" style={{ fontFamily: "'Public Sans', sans-serif", backgroundColor: '#ffffff', color: '#1c252e', display: 'none' }}>
        <div className="flex items-center gap-2 mb-6" style={{ borderBottom: '2px solid #00a76f', paddingBottom: 16 }}>
          <img src="/logo-icon.svg" alt="" style={{ width: 28, height: 28 }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1c252e' }}>BudgetBeacon</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#1c252e' }}>Cost Estimate Quote</h2>
        <p style={{ fontSize: 11, color: '#637381', marginBottom: 20 }}>Generated on {new Date().toLocaleDateString()}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 12 }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f6f8' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Item</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(result.breakdown).map(([key, val]) => (
              <tr key={key} style={{ borderBottom: '1px solid #e5e8eb' }}>
                <td style={{ padding: '8px 10px', textTransform: 'capitalize' }}>{key.replace("_", " ")}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtAmount(val)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ padding: '10px', fontWeight: 700, fontSize: 14 }}>Estimated Total Cost</td>
              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: '#00a76f' }}>{fmtAmount(result.predicted_cost)}</td>
            </tr>
          </tfoot>
        </table>
        <div style={{ fontSize: 11, color: '#637381', marginBottom: 6 }}>Confidence: {result.confidence_pct}% &middot; Risk: {result.risk_level}</div>
        <div style={{ fontSize: 11, color: '#637381', marginTop: 24, borderTop: '1px solid #e5e8eb', paddingTop: 12 }}>
          Powered by BudgetBeacon &mdash; AI-Powered Cost Estimation
        </div>
      </div>

      {/* Result Card */}
      <div className="card card-lg">
        <div className="card-body">
          <div className="text-center mb-5">
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--ds-text-secondary)' }}>Estimated Total Cost</p>
            <p className="text-[1.75rem] font-bold" style={{ color: 'var(--ds-heading-color)' }}>{fmtAmount(result.predicted_cost)}</p>
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

      {/* Cost Breakdown */}
      <div className="card card-lg">
        <div className="card-body">
          <h5 className="text-base font-semibold mb-4" style={{ color: 'var(--ds-heading-color)' }}>Cost Breakdown</h5>
          <div className="space-y-3">
            {Object.entries(result.breakdown).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-2 last:border-0" style={{ borderBottom: '1px solid var(--ds-table-border)' }}>
                <span className="text-sm capitalize" style={{ color: 'var(--ds-text-secondary)' }}>{key.replace("_", " ")}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--ds-body-color)' }}>{fmtAmount(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Tips */}
      {result.tips && result.tips.length > 0 && (
        <div className="card card-lg">
          <div className="card-body">
            <h5 className="text-base font-semibold mb-4" style={{ color: 'var(--ds-heading-color)' }}>
              <i className="ti ti-bulb text-base mr-1.5" style={{ color: 'var(--ds-warning)' }} />
              Smart Insights
            </h5>
            <div className="space-y-3">
              {result.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--ds-hover-bg)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'var(--ds-primary-bg)' }}>
                    <i className="ti ti-bulb text-sm" style={{ color: 'var(--ds-primary-text)' }} />
                  </div>
                  <p className="text-xs leading-relaxed mb-0" style={{ color: 'var(--ds-body-color)' }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Insight */}
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

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onNew}
          className="flex-1 text-white px-5 py-2.5 rounded-lg font-bold transition-colors text-sm cursor-pointer"
          style={{ backgroundColor: 'var(--ds-primary)' }}>
          New Estimate
        </button>
        <button onClick={handleDownloadPDF}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm cursor-pointer transition-colors"
          style={{ border: '1px solid var(--ds-primary)', color: 'var(--ds-primary)' }}>
          <i className="ti ti-file-download" />
          PDF
        </button>
      </div>
    </div>
  );
}

export default ResultCard;
