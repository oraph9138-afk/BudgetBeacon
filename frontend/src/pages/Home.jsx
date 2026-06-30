import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHistory } from "../services/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const PIE_COLORS = ["var(--ds-primary)", "var(--ds-warning)", "var(--ds-info)", "var(--ds-danger)", "var(--ds-success)"];

function Home() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then((data) => {
        const total = data.length;
        const avgConf = total
          ? (data.reduce((s, e) => s + e.confidence_pct, 0) / total).toFixed(1)
          : 0;
        const avgCost = total
          ? data.reduce((s, e) => s + e.predicted_cost, 0) / total
          : 0;
        setStats({ total, avgConf, avgCost, latest: data[0] || null });
        setHistory(data);
      })
      .catch(() => {
        setStats({ total: 0, avgConf: 0, avgCost: 0, latest: null });
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount) =>
    `Tsh ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const chartData = history.slice(0, 10).map((item, i) => ({
    name: `#${item.id}`,
    cost: item.predicted_cost,
    confidence: item.confidence_pct,
  })).reverse();

  const businessTypes = history.reduce((acc, item) => {
    acc[item.business_type] = (acc[item.business_type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(businessTypes).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const confRanges = [
    { name: "High (75-100%)", value: history.filter(e => e.confidence_pct >= 75).length, color: "var(--ds-success)" },
    { name: "Medium (50-74%)", value: history.filter(e => e.confidence_pct >= 50 && e.confidence_pct < 75).length, color: "var(--ds-warning)" },
    { name: "Low (0-49%)", value: history.filter(e => e.confidence_pct < 50).length, color: "var(--ds-danger)" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {!loading && (
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
                <div className="text-[1.75rem] font-bold" style={{ color: 'var(--ds-heading-color)' }}>{stats.total}</div>
              </div>
            </div>
          </div>
          <div className="card card-lg">
            <div className="card-body d-flex flex-column gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--ds-success-bg)' }}>
                  <i className="ti ti-shield text-xl" style={{ color: 'var(--ds-success-text)' }} />
                </div>
                <div className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>Avg Confidence</div>
              </div>
              <div className="flex items-end justify-between lh-1">
                <div className="text-[1.75rem] font-bold" style={{ color: 'var(--ds-heading-color)' }}>{stats.avgConf}%</div>
              </div>
            </div>
          </div>
          <div className="card card-lg">
            <div className="card-body d-flex flex-column gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--ds-info-bg)' }}>
                  <i className="ti ti-coin text-xl" style={{ color: 'var(--ds-info-text)' }} />
                </div>
                <div className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>Avg Estimated Cost</div>
              </div>
              <div className="flex items-end justify-between lh-1">
                <div className="text-[1.75rem] font-bold" style={{ color: 'var(--ds-heading-color)' }}>
                  {stats.total > 0 ? formatCurrency(stats.avgCost) : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Estimate */}
      {stats?.latest && (
        <div className="card card-lg">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-base font-semibold mb-0" style={{ color: 'var(--ds-heading-color)' }}>Latest Estimate</h5>
              <Link to="/dashboard/history" className="text-sm font-medium no-underline" style={{ color: 'var(--ds-primary)' }}>
                View All <i className="ti ti-arrow-right align-middle" />
              </Link>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs mb-0" style={{ color: 'var(--ds-text-muted)' }}>Business</p>
                <p className="text-sm font-medium mb-0 capitalize" style={{ color: 'var(--ds-body-color)' }}>{stats.latest.business_type}</p>
              </div>
              <div>
                <p className="text-xs mb-0" style={{ color: 'var(--ds-text-muted)' }}>Cost</p>
                <p className="text-sm font-medium mb-0" style={{ color: 'var(--ds-body-color)' }}>{formatCurrency(stats.latest.predicted_cost)}</p>
              </div>
              <div>
                <p className="text-xs mb-0" style={{ color: 'var(--ds-text-muted)' }}>Confidence</p>
                <p className="text-sm font-medium mb-0" style={{ color: 'var(--ds-body-color)' }}>{stats.latest.confidence_pct}%</p>
              </div>
              <div>
                <p className="text-xs mb-0" style={{ color: 'var(--ds-text-muted)' }}>Date</p>
                <p className="text-sm font-medium mb-0" style={{ color: 'var(--ds-body-color)' }}>{new Date(stats.latest.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      {history.length > 0 && (
        <div className="grid md:grid-cols-3 gap-5">
          {/* Cost Trends Area Chart */}
          <div className="md:col-span-2 card card-lg">
            <div className="card-body">
              <h5 className="text-base font-semibold mb-4" style={{ color: 'var(--ds-heading-color)' }}>Cost Trends</h5>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ds-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--ds-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--ds-text-muted)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--ds-text-muted)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), "Cost"]}
                    contentStyle={{ backgroundColor: 'var(--ds-card-bg)', border: '1px solid var(--ds-border)', borderRadius: '0.5rem', color: 'var(--ds-body-color)' }}
                  />
                  <Area type="monotone" dataKey="cost" stroke="var(--ds-primary)" strokeWidth={2} fill="url(#costGradient)" dot={{ fill: 'var(--ds-primary)', stroke: 'var(--ds-card-bg)', strokeWidth: 2, r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Business Mix Donut */}
          <div className="card card-lg">
            <div className="card-body">
              <h5 className="text-base font-semibold mb-4" style={{ color: 'var(--ds-heading-color)' }}>Business Mix</h5>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--ds-card-bg)', border: '1px solid var(--ds-border)', borderRadius: '0.5rem', color: 'var(--ds-body-color)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span style={{ color: 'var(--ds-text-secondary)' }}>{item.name}</span>
                    </div>
                    <span className="font-medium" style={{ color: 'var(--ds-body-color)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confidence Distribution */}
      {confRanges.length > 0 && (
        <div className="card card-lg">
          <div className="card-body">
            <h5 className="text-base font-semibold mb-4" style={{ color: 'var(--ds-heading-color)' }}>Confidence Distribution</h5>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={confRanges} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--ds-text-muted)' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--ds-text-secondary)' }} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--ds-card-bg)', border: '1px solid var(--ds-border)', borderRadius: '0.5rem', color: 'var(--ds-body-color)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {confRanges.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className="card card-lg">
          <div className="card-body d-flex flex-column gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--ds-primary-bg)' }}>
                <i className="ti ti-trending-up text-xl" style={{ color: 'var(--ds-primary-text)' }} />
              </div>
              <div className="font-semibold" style={{ color: 'var(--ds-heading-color)' }}>Accurate Predictions</div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-sm leading-relaxed mb-0" style={{ color: 'var(--ds-text-secondary)' }}>
                Machine learning models trained on real business data to provide reliable cost estimates.
              </p>
            </div>
          </div>
        </div>
        <div className="card card-lg">
          <div className="card-body d-flex flex-column gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--ds-success-bg)' }}>
                <i className="ti ti-shield text-xl" style={{ color: 'var(--ds-success-text)' }} />
              </div>
              <div className="font-semibold" style={{ color: 'var(--ds-heading-color)' }}>Confidence Scores</div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-sm leading-relaxed mb-0" style={{ color: 'var(--ds-text-secondary)' }}>
                Know how reliable each estimate is with our unique certainty prediction system.
              </p>
            </div>
          </div>
        </div>
        <div className="card card-lg">
          <div className="card-body d-flex flex-column gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--ds-info-bg)' }}>
                <i className="ti ti-bolt text-xl" style={{ color: 'var(--ds-info-text)' }} />
              </div>
              <div className="font-semibold" style={{ color: 'var(--ds-heading-color)' }}>Fast & Accessible</div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-sm leading-relaxed mb-0" style={{ color: 'var(--ds-text-secondary)' }}>
                Get results in seconds via web app or USSD. No smartphone required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="card card-lg">
        <div className="card-body">
          <h5 className="text-base font-semibold mb-6 text-center" style={{ color: 'var(--ds-heading-color)' }}>How It Works</h5>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Enter Data", desc: "Input your business costs and details" },
              { step: "2", title: "AI Analysis", desc: "Our models process your data instantly" },
              { step: "3", title: "Get Estimate", desc: "Receive cost prediction and confidence" },
              { step: "4", title: "Make Decisions", desc: "Use insights to plan your business" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-[--ds-primary] text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-sm">
                  {item.step}
                </div>
                <h6 className="font-semibold mb-1 text-sm" style={{ color: 'var(--ds-heading-color)' }}>{item.title}</h6>
                <p className="text-xs mb-0" style={{ color: 'var(--ds-text-secondary)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
