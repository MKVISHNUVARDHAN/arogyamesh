"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GoogleMap } from "../lib/google-map";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bot,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FlaskConical,
  Globe2,
  HeartPulse,
  LayoutDashboard,
  MapPin,
  Network,
  Package,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import type {
  Alert,
  District,
  Facility,
  Federation,
  Forecast,
  Plan,
  Simulation,
} from "../lib/types";
import {
  archiveConflicts,
  rebaseQueue,
  queued,
  readState,
  recordLocal,
  saveState,
  syncQueue,
} from "../lib/queue.mjs";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const number = (n: number) => Math.round(n).toLocaleString("en-IN");
const links = [
  ["/command-center", "Command center", LayoutDashboard],
  ["/alerts", "Risk & alerts", Bell],
  ["/redistribution", "Redistribution", Network],
  ["/simulator", "Emergency simulator", FlaskConical],
  ["/federation", "Federated intelligence", Globe2],
  ["/phc-mode", "PHC operations", ClipboardList],
  ["/model-health", "Model health", Activity],
] as const;
async function api<T>(
  path: string,
  body?: unknown,
  role = "observer",
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", "X-Demo-Role": role },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(
      typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail),
    );
  }
  return response.json();
}
function Risk({ value }: { value: number }) {
  return (
    <span
      className={`badge ${value > 0.7 ? "red" : value > 0.25 ? "amber" : "green"}`}
    >
      <i />
      {pct(value)}
    </span>
  );
}
function Stat({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Activity;
}) {
  return (
    <div className="stat">
      <div className="stat-label">
        {label}
        <Icon size={17} />
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

export default function Dashboard() {
  const path = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState("district");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copilot, setCopilot] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [question, setQuestion] = useState("Why is PHC-A at risk?");
  const [answer, setAnswer] = useState("");
  const [language, setLanguage] = useState("English");
  const [state, setState] = useState("AP");
  const [district, setDistrict] = useState("");
  const [day, setDay] = useState(0);
  const [selected, setSelected] = useState("PHC-001");
  const [metric, setMetric] = useState("ors");
  const load = useCallback(async () => {
    try {
      const [phcs, regions] = await Promise.all([
        api<Facility[]>("/phcs"),
        api<District[]>("/districts"),
      ]);
      setFacilities(phcs);
      setDistricts(regions);
    } catch (e) {
      if (path !== "/phc-mode") setError(String(e));
    }
  }, [path]);
  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load, refresh]);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js")
        .catch((e) => setError(`Offline cache unavailable: ${e.message}`));
  }, []);
  async function act(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  const filtered = facilities.filter(
    (p) =>
      (!state || p.state_id === state) &&
      (!district || p.district_id === district),
  );
  const chosen = facilities.find((p) => p.id === selected);
  const chosenRisk =
    chosen?.ors.horizons.find((h) => h.days === (day || 1))?.risk || 0;
  const title =
    links.find((l) => l[0] === path)?.[1] ||
    (path.startsWith("/phc/")
      ? "PHC digital twin"
      : "A healthier network. A safer tomorrow.");
  const reset = () =>
    act(async () => {
      if ((await queued()).length)
        throw new Error(
          "Synchronize pending PHC events before resetting the judge demo.",
        );
      await api("/demo/reset", {}, role);
      await saveState("stock", null);
      setRefresh((x) => x + 1);
      setDay(0);
      setSelected("PHC-001");
      router.push("/command-center");
    });
  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <HeartPulse size={25} />
          </span>
          <span>
            Arogya<span className="brand-light">Mesh</span>
            <small>PUBLIC HEALTH INTELLIGENCE</small>
          </span>
        </Link>
        <div className="workspace">
          <span className="workspace-icon">IN</span>
          <div>
            India PHC network<small>Synthetic demonstration</small>
          </div>
          <ChevronRight size={15} />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {links.map(([href, label, Icon]) => (
            <Link
              href={href}
              key={href}
              className={path === href ? "active" : ""}
            >
              <Icon size={18} />
              {label}
              {href === "/alerts" && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="trust-note">
            <ShieldCheck size={20} />
            <strong>Built on trust.</strong>
            <p>Verify the data. Predict the need. Protect every facility.</p>
          </div>
          <label className="role-label">
            Demo role
            <select
              aria-label="Demo role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="district">District officer</option>
              <option value="operator">PHC operator</option>
              <option value="medical">Medical officer</option>
              <option value="observer">State observer</option>
            </select>
          </label>
          <div className="profile">
            <span>DO</span>
            <div>
              Demo workspace<small>Aggregated synthetic data only</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <span>
            <span className="muted">Workspace</span>
            <ChevronRight size={14} />
            {title}
          </span>
          <div className="top-actions">
            <span className="live-dot" />
            Demo network live
            <button
              className="icon-button"
              aria-label="Open copilot"
              onClick={() => setCopilot(true)}
            >
              <CircleHelp size={19} />
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                VERIFY · PREDICT · SIMULATE · REDISTRIBUTE · LEARN
              </div>
              <h1>{title}</h1>
              <p>
                {path === "/command-center"
                  ? "See tomorrow’s shortages. Take action today."
                  : "A federated resilience layer for India’s Primary Health Centres."}
              </p>
            </div>
            <div className="heading-actions">
              <button
                className="button secondary"
                disabled={busy || role !== "district"}
                onClick={reset}
              >
                <RefreshCw size={15} />
                Start judge demo
              </button>
              <button className="button" onClick={() => setCopilot(true)}>
                <Sparkles size={16} />
                Arogya Copilot
              </button>
            </div>
          </div>
          {error && (
            <div role="alert" className="error">
              <strong>Action needs attention</strong>
              <span>{error}</span>
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {busy && (
            <div className="loading-line" role="status">
              Calculating from live application data…
            </div>
          )}
          {path === "/" && (
            <>
              <section className="hero">
                <div>
                  <span className="badge green">
                    A connected network. A collective response.
                  </span>
                  <h2>
                    Anticipate a shortage.
                    <br />
                    Protect an entire network.
                  </h2>
                  <p>
                    ArogyaMesh verifies resource data, predicts future needs,
                    and finds safe transfers before a shortage reaches patients.
                  </p>
                  <Link className="button" href="/command-center">
                    Enter Command Center
                    <ArrowRight size={17} />
                  </Link>
                </div>
                <div className="hero-diagram">
                  <ShieldCheck size={56} />
                  <strong>Every donor stays safe.</strong>
                  <span>Data trust → Forecast → Human review</span>
                  <div className="hero-nodes">
                    <span>PHC B</span>
                    <ArrowRight />
                    <span>PHC A</span>
                    <ArrowDown />
                    <span>PHC C</span>
                  </div>
                </div>
              </section>
              <div className="stats">
                <Stat
                  label="Connected facilities"
                  value={number(facilities.length)}
                  note="3 states · 9 districts"
                  icon={Network}
                />
                <Stat
                  label="Medicines monitored"
                  value="20"
                  note="90 days of synthetic history"
                  icon={Package}
                />
                <Stat
                  label="Data sovereignty"
                  value="3 state nodes"
                  note="Federated parameter aggregation"
                  icon={ShieldCheck}
                />
                <Stat
                  label="Decision workflow"
                  value="Human-led"
                  note="Officer approval before dispatch"
                  icon={Users}
                />
              </div>
              <div className="notice">
                Hackathon decision-support prototype. Synthetic estimates are
                not validated for real clinical or logistics decisions.
              </div>
            </>
          )}
          {path === "/command-center" && (
            <>
              <div className="stats">
                <Stat
                  label="Connected PHCs"
                  value={number(filtered.length)}
                  note={`${state || "All states"} · ${district ? "Selected district" : "All districts"}`}
                  icon={Network}
                />
                <Stat
                  label="7-day medicine risks"
                  value={number(
                    filtered.filter((p) => p.ors.risk > 0.7).length,
                  )}
                  note="ORS shortage probability above 70%"
                  icon={Bell}
                />
                <Stat
                  label="Mean data TruthScore"
                  value={`${Math.round(filtered.reduce((s, p) => s + p.ors.truth.score, 0) / Math.max(1, filtered.length))}/100`}
                  note="Data confidence, separate from forecast"
                  icon={ShieldCheck}
                />
                <Stat
                  label="Available beds"
                  value={number(
                    filtered.reduce((s, p) => s + p.beds.available, 0),
                  )}
                  note="Current network capacity"
                  icon={HeartPulse}
                />
              </div>
              <div className="command-grid">
                <section className="panel map-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Network outlook</h2>
                      <p>Facility-level risk · synthetic geography</p>
                    </div>
                    <span className="badge neutral">
                      <Radio size={12} /> Live API
                    </span>
                  </div>
                  <div className="map-toolbar">
                    <select
                      aria-label="State filter"
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        setDistrict("");
                      }}
                    >
                      <option value="">All states</option>
                      <option value="AP">Andhra Pradesh</option>
                      <option value="KA">Karnataka</option>
                      <option value="TG">Telangana</option>
                    </select>
                    <select
                      aria-label="District filter"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    >
                      <option value="">All districts</option>
                      {districts
                        .filter((d) => !state || d.state_id === state)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                    <select
                      aria-label="Resource layer"
                      value={metric}
                      onChange={(e) => setMetric(e.target.value)}
                    >
                      <option value="ors">ORS stock</option>
                      <option value="beds">Bed utilization</option>
                      <option value="capacity">Service capacity</option>
                    </select>
                  </div>
                  <GoogleMap
                    facilities={filtered}
                    day={day}
                    metric={metric}
                    select={setSelected}
                    fallback={
                      <NetworkMap
                        facilities={filtered}
                        districts={districts}
                        selected={selected}
                        select={setSelected}
                        day={day}
                        metric={metric}
                      />
                    }
                  />
                  <div className="map-footer">
                    <div className="segmented">
                      {[0, 3, 5, 7].map((d) => (
                        <button
                          key={d}
                          className={day === d ? "selected" : ""}
                          onClick={() => setDay(d)}
                        >
                          {d === 0 ? "Today" : `+${d} days`}
                        </button>
                      ))}
                    </div>
                    <div className="legend">
                      <span>
                        <i className="good" />
                        Stable
                      </span>
                      <span>
                        <i className="warn" />
                        Watch
                      </span>
                      <span>
                        <i className="bad" />
                        High risk
                      </span>
                    </div>
                  </div>
                </section>
                <section className="panel focus-panel">
                  <div className="panel-header">
                    <h2>Facility spotlight</h2>
                    <MapPin size={17} />
                  </div>
                  {chosen ? (
                    <>
                      <div className="focus-title">
                        <span className="eyebrow">
                          {chosen.id} · {chosen.district}
                        </span>
                        <h3>{chosen.name}</h3>
                        <span
                          className={`badge ${chosenRisk > 0.7 ? "red" : chosenRisk > 0.25 ? "amber" : "green"}`}
                        >
                          {day === 0
                            ? chosenRisk < 0.25
                              ? "Current stock appears healthy"
                              : "Current stock needs attention"
                            : `+${day} day outlook`}
                        </span>
                      </div>
                      <div className="risk-hero">
                        <span>ORS shortage probability</span>
                        <strong>
                          {pct(
                            chosen.ors.horizons.find(
                              (h) => h.days === (day || 1),
                            )?.risk || 0,
                          )}
                        </strong>
                        <small>
                          {day === 0 ? "Next 24 hours" : `Within ${day} days`} ·
                          statistical forecast
                        </small>
                      </div>
                      <div className="mini-grid">
                        <div>
                          <small>Recorded stock</small>
                          <strong>
                            {number(chosen.ors.recorded)} <em>units</em>
                          </strong>
                        </div>
                        <div>
                          <small>Days of cover</small>
                          <strong>{chosen.ors.days_cover}</strong>
                        </div>
                        <div>
                          <small>Data TruthScore</small>
                          <strong>
                            {chosen.ors.truth.score}
                            <em>/100</em>
                          </strong>
                        </div>
                        <div>
                          <small>Forecast confidence</small>
                          <strong>
                            {chosen.ors.forecast_confidence}
                            <em>%</em>
                          </strong>
                        </div>
                        <div>
                          <small>Beds available</small>
                          <strong>
                            {chosen.beds.available}
                            <em>/{chosen.beds.total}</em>
                          </strong>
                        </div>
                        <div>
                          <small>Service capacity</small>
                          <strong>
                            {chosen.capacity.score}
                            <em>%</em>
                          </strong>
                        </div>
                      </div>
                      <div className="insight">
                        <Activity size={17} />
                        <span>
                          {chosen.ors.daily_demand} units/day predicted demand.
                          Shortage expected {chosen.ors.shortage_date} without
                          replenishment.
                        </span>
                      </div>
                      <Link className="button full" href={`/phc/${chosen.id}`}>
                        Open digital twin
                        <ArrowUpRight size={16} />
                      </Link>
                    </>
                  ) : (
                    <Empty>Loading facility data…</Empty>
                  )}
                </section>
              </div>
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Prioritize before patients are affected</h2>
                    <p>ORS outlook sorted by future shortage probability</p>
                  </div>
                  <Link href="/alerts" className="text-link">
                    All resource alerts
                    <ArrowRight size={14} />
                  </Link>
                </div>
                <FacilityTable
                  facilities={[...filtered]
                    .sort((a, b) => b.ors.risk - a.ors.risk)
                    .slice(0, 7)}
                />
              </section>
            </>
          )}
          {path.startsWith("/phc/") && (
            <Twin id={path.split("/")[2]} refresh={refresh} />
          )}
          {path === "/alerts" && <Alerts />}
          {path === "/redistribution" && (
            <Redistribution
              recipient={params.get("phc") || "PHC-001"}
              medicine={params.get("medicine") || "ors"}
              facilities={facilities}
              role={role}
              act={act}
              busy={busy}
              refresh={() => setRefresh((x) => x + 1)}
            />
          )}
          {path === "/simulator" && (
            <Simulator districts={districts} act={act} busy={busy} />
          )}
          {path === "/federation" && <FederationView act={act} busy={busy} />}
          {path === "/phc-mode" && (
            <Operator role={role} onSync={() => setRefresh((x) => x + 1)} />
          )}
          {path === "/model-health" && <ModelHealth />}
          <footer>
            ArogyaMesh · Hackathon prototype
            <span>
              Synthetic aggregated data · Human-approved interventions
            </span>
          </footer>
        </main>
      </div>
      {copilot && (
        <div className="copilot-backdrop">
          <aside className="copilot">
            <div className="panel-header">
              <div>
                <h2>
                  <Bot size={21} /> Arogya Copilot
                </h2>
                <p>Explanations grounded in model evidence</p>
              </div>
              <button
                className="icon-button"
                aria-label="Close copilot"
                onClick={() => setCopilot(false)}
              >
                <X />
              </button>
            </div>
            <div className="copilot-content">
              <div className="insight">
                The forecasting engine calculates numbers. Copilot explains
                them. No inventory changes are made through chat.
              </div>
              <label>
                Facility
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {facilities.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Language
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option>English</option>
                  <option>Telugu</option>
                </select>
              </label>
              <label>
                Officer question
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                />
              </label>
              <button
                className="button full"
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    const r = await api<{ answer: string; provider: string }>(
                      "/copilot/query",
                      { question, phc_id: selected, language },
                    );
                    setAnswer(`${r.answer}\n\nSource: ${r.provider}`);
                  })
                }
              >
                <Sparkles size={16} />
                Explain from evidence
              </button>
              {answer && <div className="answer">{answer}</div>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function NetworkMap({
  facilities,
  districts,
  selected,
  select,
  day,
  metric,
}: {
  facilities: Facility[];
  districts: District[];
  selected: string;
  select: (id: string) => void;
  day: number;
  metric: string;
}) {
  const minLon = Math.min(...facilities.map((p) => p.lon), 77.4) - 0.12,
    maxLon = Math.max(...facilities.map((p) => p.lon), 78.6) + 0.12;
  const minLat = Math.min(...facilities.map((p) => p.lat), 14.7) - 0.12,
    maxLat = Math.max(...facilities.map((p) => p.lat), 16.1) + 0.12;
  const xy = (lat: number, lon: number) => [
    45 + ((lon - minLon) / (maxLon - minLon)) * 710,
    355 - ((lat - minLat) / (maxLat - minLat)) * 310,
  ];
  return (
    <div className="map">
      <svg
        viewBox="0 0 800 400"
        role="img"
        aria-label="Schematic PHC map; district rings are illustrative, not administrative boundaries"
      >
        <defs>
          <pattern
            id="grid"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 28 0 L 0 0 0 28"
              fill="none"
              stroke="#dfe7df"
              strokeWidth=".6"
            />
          </pattern>
        </defs>
        <rect width="800" height="400" fill="#eef2e9" />
        <rect width="800" height="400" fill="url(#grid)" />
        <path
          d="M0 230 Q150 210 250 280 T500 220 T800 200"
          fill="none"
          stroke="#cadfdf"
          strokeWidth="12"
        />
        <path
          d="M0 80 Q180 120 270 90 T510 140 T800 70 M120 400 Q190 280 350 170 T610 0"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
        />
        {districts
          .filter((d) => facilities.some((p) => p.district_id === d.id))
          .map((d) => {
            const [x, y] = xy(d.lat, d.lon);
            return (
              <g key={d.id}>
                <ellipse
                  cx={x}
                  cy={y}
                  rx="86"
                  ry="57"
                  fill="none"
                  stroke="#a6b7a4"
                  strokeDasharray="5 5"
                />
                <text
                  x={x}
                  y={y - 62}
                  textAnchor="middle"
                  className="district-label"
                >
                  {d.name.toUpperCase()}
                </text>
              </g>
            );
          })}
        {facilities.map((p) => {
          const [x, y] = xy(p.lat, p.lon);
          const riskValue =
            metric === "capacity"
              ? 1 - p.capacity.score / 100
              : metric === "beds"
                ? (day === 0
                    ? p.beds.occupied
                    : p.beds.forecast.find(
                        (f) => f.days === (day === 5 ? 7 : day),
                      )?.occupancy || p.beds.occupied) / p.beds.total
                : p.ors.horizons.find((h) => h.days === (day || 1))?.risk || 0;
          const color =
            riskValue > 0.7
              ? "#c8504a"
              : riskValue > 0.25
                ? "#c48b35"
                : "#348f70";
          return (
            <g
              key={p.id}
              role="button"
              tabIndex={0}
              aria-label={`Select ${p.name}`}
              onClick={() => select(p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") select(p.id);
              }}
              style={{ cursor: "pointer" }}
            >
              {p.id === selected && (
                <circle cx={x} cy={y} r="15" fill={color} opacity=".16" />
              )}
              <circle
                cx={x}
                cy={y}
                r={p.id === selected ? 7 : 4.8}
                fill={color}
                stroke="white"
                strokeWidth="2"
              />
              <title>
                {p.name} · {pct(riskValue)}
              </title>
            </g>
          );
        })}
        <text x="22" y="380" fill="#708375" fontSize="10">
          LOCAL MAP · APPROXIMATE DISTRICT ZONES · NOT FOR NAVIGATION
        </text>
        <text x="763" y="30" fill="#496454" fontSize="12">
          N ↑
        </text>
      </svg>
    </div>
  );
}

function FacilityTable({ facilities }: { facilities: Facility[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Facility</th>
            <th>District</th>
            <th>7-day risk</th>
            <th>Cover</th>
            <th>TruthScore</th>
            <th>Service capacity</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {facilities.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/phc/${p.id}`}>
                  <strong>{p.name}</strong>
                  <small>{p.id}</small>
                </Link>
              </td>
              <td>{p.district}</td>
              <td>
                <Risk value={p.ors.risk} />
              </td>
              <td>{p.ors.days_cover} days</td>
              <td>
                <span className="score">
                  {p.ors.truth.score}
                  <small>/100</small>
                </span>
              </td>
              <td>
                <div className="meter">
                  <i style={{ width: `${p.capacity.score}%` }} />
                </div>
                {p.capacity.score}%
              </td>
              <td>
                <Link aria-label={`Open ${p.name}`} href={`/phc/${p.id}`}>
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Twin({ id, refresh }: { id: string; refresh: number }) {
  const [p, setP] = useState<Facility>();
  const [error, setError] = useState("");
  const [events, setEvents] = useState<
    {
      id: string;
      kind: string;
      quantity: number;
      medicine_id: string;
      timestamp: string;
    }[]
  >([]);
  const [resource, setResource] = useState("ors");
  useEffect(() => {
    Promise.all([
      api<Facility>(`/phcs/${id}`),
      api<typeof events>(`/phcs/${id}/events`),
    ])
      .then(([p, e]) => {
        setP(p);
        setEvents(e);
      })
      .catch((e) => setError(e.message));
  }, [id, refresh]);
  if (error) return <div className="error">{error}</div>;
  if (!p) return <Empty>Loading digital twin…</Empty>;
  const f = p.inventory.find((f) => f.medicine_id === resource) || p.ors;
  return (
    <>
      <div className="twin-heading">
        <div>
          <span className="eyebrow">
            {p.id} / {p.district} / {p.state_id}
          </span>
          <h2>{p.name}</h2>
          <p>
            Population served {number(p.population)} · {p.connectivity}{" "}
            connectivity
          </p>
        </div>
        <Link
          href={`/redistribution?phc=${p.id}&medicine=${resource}`}
          className="button"
        >
          Find safe redistribution
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="stats">
        <Stat
          label="Expected footfall"
          value={number(p.capacity.predicted_footfall)}
          note="Patients/day · 14-day historical mean"
          icon={Users}
        />
        <Stat
          label="Beds available"
          value={`${p.beds.available}/${p.beds.total}`}
          note={`${p.beds.occupied} occupied today`}
          icon={HeartPulse}
        />
        <Stat
          label="Service capacity"
          value={`${p.capacity.score}%`}
          note={`${p.capacity.overflow} expected overflow patients`}
          icon={Activity}
        />
        <Stat
          label="Medicine demand"
          value={`${f.daily_demand}/day`}
          note={`${f.days_cover} days of usable stock`}
          icon={Package}
        />
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Demand & depletion</h2>
              <p>Numerical model · synthetic historical data</p>
            </div>
            <select
              aria-label="Medicine forecast"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
            >
              {p.inventory.map((f) => (
                <option value={f.medicine_id} key={f.medicine_id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="panel-body">
            <div className="mini-grid">
              <div>
                <small>Recorded stock</small>
                <strong>{number(f.recorded)}</strong>
              </div>
              <div>
                <small>Estimated usable stock</small>
                <strong>{number(f.usable)}</strong>
              </div>
              <div>
                <small>7-day risk</small>
                <Risk value={f.risk} />
              </div>
              <div>
                <small>Forecast confidence</small>
                <strong>{f.forecast_confidence}%</strong>
              </div>
            </div>
            <div className="forecast-chart">
              {f.horizons.map((h) => (
                <div key={h.days}>
                  <span>{number(h.predicted_demand)}</span>
                  <div className="bar-track">
                    <i
                      style={{
                        height: `${(h.predicted_demand / f.horizons.at(-1)!.predicted_demand) * 100}%`,
                      }}
                    />
                  </div>
                  <small>Day {h.days}</small>
                </div>
              ))}
            </div>
            <p className="muted">
              Expected cumulative demand; stock exhaustion {f.shortage_date}.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Horizon</th>
                  <th>Demand</th>
                  <th>90% interval</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {f.horizons.map((h) => (
                  <tr key={h.days}>
                    <td>{h.days} days</td>
                    <td>{number(h.predicted_demand)}</td>
                    <td>
                      {number(h.lower)}–{number(h.upper)}
                    </td>
                    <td>
                      <Risk value={h.risk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="insight">
              Shadow demand: observed {f.observed_dispensing} · estimated{" "}
              {f.estimated_demand} · unmet {f.estimated_unmet} units on latest
              historical day. Intervals are model estimates, not clinically
              calibrated.
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>Can we trust this stock?</h2>
            <ShieldCheck size={20} />
          </div>
          <div className="panel-body">
            <div className="truth-score">
              <strong>
                {f.truth.score}
                <small>/100</small>
              </strong>
              <span>
                Data TruthScore <b>{f.truth.level} confidence</b>
              </span>
            </div>
            {Object.entries(f.truth.components).map(([name, value]) => (
              <div className="component" key={name}>
                <span>{name.replace(/([A-Z])/g, " $1")}</span>
                <strong>{value}</strong>
                <div className="meter">
                  <i style={{ width: `${(value / 30) * 100}%` }} />
                </div>
              </div>
            ))}
            <ul className="reasons">
              {f.truth.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <div className="metadata">
              <span>Source: {f.source}</span>
              <span>
                Last sync: {new Date(f.last_sync + "Z").toLocaleString()}
              </span>
              <span>
                Anomalies: {f.anomaly_flags.join(", ") || "None detected"}
              </span>
              <span>
                Updated: {new Date(f.last_update + "Z").toLocaleString()}
              </span>
              <span>
                Physical count:{" "}
                {new Date(f.last_reconciliation + "Z").toLocaleString()}
              </span>
            </div>
            <div className="insight">
              Low data confidence widens forecast intervals and can disqualify a
              donor. Forecast confidence is reported separately.
            </div>
          </div>
        </section>
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="panel-header">
            <h2>Attendance → service capacity</h2>
            <Users size={19} />
          </div>
          <div className="panel-body">
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Present / required</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(p.capacity.staff).map(([role, count]) => (
                  <tr key={role}>
                    <td className="capitalize">{role}</td>
                    <td>
                      {count[0]} / {count[1]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted">
              Assumed daily throughput: doctor 80, nurse 60, pharmacist 160. The
              limiting role determines capacity.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Horizon</th>
                  <th>Patients</th>
                  <th>Capacity</th>
                  <th>Overflow</th>
                </tr>
              </thead>
              <tbody>
                {p.capacity.forecast.map((c) => (
                  <tr key={c.days}>
                    <td>{c.days} days</td>
                    <td>{c.patients}</td>
                    <td>{c.capacity}</td>
                    <td>{c.expected_overflow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <details>
              <summary>Recent footfall history</summary>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patients</th>
                  </tr>
                </thead>
                <tbody>
                  {p.history.slice(-14).map((h) => (
                    <tr key={h.date}>
                      <td>{h.date}</td>
                      <td>{h.footfall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>Bed outlook</h2>
            <HeartPulse size={19} />
          </div>
          <div className="panel-body">
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Admissions</th>
                  <th>Discharges*</th>
                  <th>Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {p.beds.forecast.map((b) => (
                  <tr key={b.days}>
                    <td>+{b.days}</td>
                    <td>{b.admissions}</td>
                    <td>{b.discharges}</td>
                    <td>
                      {b.occupancy} / {p.beds.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <small>
              *Discharges from current occupied beds; constant-arrival model.
            </small>
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panel-header">
          <h2>Inventory · 20 monitored resources</h2>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Recorded</th>
                <th>Usable</th>
                <th>Daily demand</th>
                <th>Cover</th>
                <th>Risk</th>
                <th>TruthScore</th>
              </tr>
            </thead>
            <tbody>
              {p.inventory.map((f) => (
                <tr key={f.medicine_id}>
                  <td>{f.name}</td>
                  <td>{f.recorded}</td>
                  <td>{f.usable}</td>
                  <td>{f.daily_demand}</td>
                  <td>{f.days_cover}d</td>
                  <td>
                    <Risk value={f.risk} />
                  </td>
                  <td>{f.truth.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2>Inventory event history</h2>
        </div>
        {events.length ? (
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Medicine</th>
                <th>Quantity</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{e.kind}</td>
                  <td>{e.medicine_id}</td>
                  <td>{e.quantity}</td>
                  <td>{e.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>No operator transactions since the synthetic seed.</Empty>
        )}
      </section>
    </>
  );
}

function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    api<Alert[]>("/alerts")
      .then(setAlerts)
      .catch((e) => setError(e.message))
      .finally(() => setLoaded(true));
  }, []);
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Intervention queue</h2>
          <p>Weighted risk, criticality, population, urgency and confidence</p>
        </div>
        <span className="badge amber">{alerts.length} resource signals</span>
      </div>
      {error ? (
        <div className="error">{error}</div>
      ) : !loaded ? (
        <Empty>Evaluating all 1,620 resource records…</Empty>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Facility / resource</th>
                <th>Shortage risk</th>
                <th>Cover</th>
                <th>Data trust</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={`${a.phc_id}-${a.medicine_id}`}>
                  <td>
                    <strong>{a.priority}</strong>
                    <details>
                      <summary>Why this rank?</summary>
                      {Object.entries(a.components).map(([k, v]) => (
                        <div key={k}>
                          {k}: {v.toFixed(1)}
                        </div>
                      ))}
                    </details>
                  </td>
                  <td>
                    <Link href={`/phc/${a.phc_id}`}>
                      <strong>{a.name}</strong>
                      <small>{a.medicine}</small>
                    </Link>
                  </td>
                  <td>
                    <Risk value={a.risk} />
                  </td>
                  <td>{a.days_cover} days</td>
                  <td>{a.truth}/100</td>
                  <td>
                    <Link
                      className="text-link"
                      href={`/redistribution?phc=${a.phc_id}&medicine=${a.medicine_id}`}
                    >
                      Plan intervention
                      <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

type Act = (work: () => Promise<void>) => Promise<void>;
function Redistribution({
  recipient,
  medicine,
  facilities,
  role,
  act,
  busy,
  refresh,
}: {
  recipient: string;
  medicine: string;
  facilities: Facility[];
  role: string;
  act: Act;
  busy: boolean;
  refresh: () => void;
}) {
  const [pid, setPid] = useState(recipient);
  const [mid, setMid] = useState(medicine);
  const [meds, setMeds] = useState<{ id: string; name: string }[]>([]);
  const [plan, setPlan] = useState<Plan>();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    Promise.all([
      api<typeof meds>("/medicines"),
      api<Plan[]>("/redistribution"),
    ])
      .then(([m, p]) => {
        setMeds(m);
        setPlans(p);
      })
      .catch((e) => setLoadError(e.message));
  }, []);
  const transition = (action: string) =>
    act(async () => {
      if (!plan) return;
      setPlan(
        await api<Plan>(`/redistribution/${plan.id}/${action}`, {}, role),
      );
      refresh();
    });
  return (
    <>
      {loadError && (
        <div className="error" role="alert">
          {loadError}
        </div>
      )}
      <div className="notice">
        <ShieldCheck size={21} />
        <div>
          <strong>
            We don’t solve one village’s shortage by creating another.
          </strong>
          <p>
            Every donor is simulated after transfer. Approval and dispatch
            recheck live stock, data confidence and risk.
          </p>
        </div>
      </div>
      <section className="panel">
        <div className="planner-form">
          <label>
            Recipient PHC
            <select value={pid} onChange={(e) => setPid(e.target.value)}>
              {facilities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Medicine
            <select value={mid} onChange={(e) => setMid(e.target.value)}>
              {meds.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button"
            disabled={busy}
            onClick={() =>
              act(async () =>
                setPlan(
                  await api<Plan>("/redistribution/recommend", {
                    recipient_id: pid,
                    medicine_id: mid,
                  }),
                ),
              )
            }
          >
            <Network size={17} />
            Find safe redistribution
          </button>
        </div>
      </section>
      {plan ? (
        <>
          <div className="stats">
            <Stat
              label="Recipient risk · before"
              value={pct(plan.risk_before)}
              note="If no intervention is made"
              icon={Bell}
            />
            <Stat
              label="Recipient risk · after"
              value={pct(plan.risk_after)}
              note="Projected once all stock arrives"
              icon={ShieldCheck}
            />
            <Stat
              label="Required transfer"
              value={number(plan.required)}
              note={`${plan.unfilled} units remain unfilled`}
              icon={Package}
            />
            <Stat
              label="Review status"
              value={plan.status}
              note="Simulated logistics only"
              icon={ClipboardList}
            />
          </div>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Safe transfer plan</h2>
                <p>
                  {plan.recipient_name} · {plan.medicine_id.toUpperCase()}
                </p>
              </div>
              <span className="badge green">Donor threshold ≤10%</span>
            </div>
            <div className="donor-cards">
              {plan.donors.map((d) => (
                <div className="donor-card" key={d.id}>
                  <div>
                    <span className="badge neutral">
                      {d.cross_district ? "Cross-district" : "Same district"}
                    </span>
                    <h3>{d.name}</h3>
                    <p>
                      {d.district} · {d.distance_km} km straight-line
                    </p>
                  </div>
                  <div className="transfer-arrow">
                    <strong>{number(d.quantity)}</strong>
                    <span>units</span>
                    <ArrowRight />
                  </div>
                  <div className="donor-risk">
                    <small>Donor risk before → after</small>
                    <div>
                      <Risk value={d.risk_before} />
                      <ArrowRight size={14} />
                      <Risk value={d.risk_after} />
                    </div>
                    <p>
                      Remaining {d.stock_after} · safety floor {d.safety_floor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="approval-bar">
              <span>
                <ShieldCheck size={16} />
                Officer review required · {plan.status}
              </span>
              <div>
                {plan.status === "PROPOSED" && (
                  <>
                    <button
                      className="button secondary"
                      disabled={busy || role !== "district"}
                      onClick={() => transition("reject")}
                    >
                      Reject
                    </button>
                    <button
                      className="button"
                      disabled={
                        busy ||
                        role !== "district" ||
                        plan.unfilled > 0 ||
                        !plan.donors.length
                      }
                      onClick={() => transition("approve")}
                    >
                      <Check size={16} />
                      Approve plan
                    </button>
                  </>
                )}
                {plan.status === "APPROVED" && (
                  <button
                    className="button"
                    disabled={busy || role !== "district"}
                    onClick={() => transition("dispatch")}
                  >
                    Simulate dispatch
                  </button>
                )}
                {plan.status === "DISPATCHED" && (
                  <button
                    className="button"
                    disabled={busy || role !== "district"}
                    onClick={() => transition("complete")}
                  >
                    Confirm simulated receipt
                  </button>
                )}
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Why not send everything from the closest donor?</h2>
                <p>
                  Rejected full-transfer alternatives; partial safe
                  contributions may still be selected.
                </p>
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Naive transfer</th>
                    <th>Resulting risk</th>
                    <th>Safe quantity</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.rejected.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.naive_quantity}</td>
                      <td>
                        <Risk value={r.naive_risk} />
                      </td>
                      <td>{r.safe_quantity}</td>
                      <td>{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p className="muted">{plan.assumptions}</p>
        </>
      ) : (
        <Empty>
          Select a facility and calculate a plan from current inventory and
          predicted demand.
        </Empty>
      )}
      {plans.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h2>Saved plans</h2>
          </div>
          <div className="panel-body saved-plans">
            {plans.map((p) => (
              <button
                key={p.id}
                className="button secondary"
                onClick={() => setPlan(p)}
              >
                {p.recipient_name} · {p.status}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Simulator({
  districts,
  act,
  busy,
}: {
  districts: District[];
  act: Act;
  busy: boolean;
}) {
  const [district, setDistrict] = useState("AP-1"),
    [event, setEvent] = useState("dengue"),
    [severity, setSeverity] = useState(2.5),
    [duration, setDuration] = useState(14),
    [run, setRun] = useState<Simulation>(),
    [optimized, setOptimized] = useState(false);
  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Simulate health emergency</h2>
            <p>
              Staff shortage → overflow → neighboring demand → medicine and bed
              pressure
            </p>
          </div>
          <span className="badge amber">Simulation sandbox</span>
        </div>
        <div className="planner-form">
          <label>
            Scenario
            <select value={event} onChange={(e) => setEvent(e.target.value)}>
              <option value="dengue">Dengue surge</option>
              <option value="heatwave">Heatwave / dehydration</option>
              <option value="respiratory">Respiratory outbreak</option>
            </select>
          </label>
          <label>
            Affected district
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Demand increase
            <input
              type="number"
              value={severity * 100}
              min="0"
              max="500"
              step="25"
              onChange={(e) => setSeverity(+e.target.value / 100)}
            />
          </label>
          <label>
            Duration (days)
            <input
              type="number"
              min="1"
              max="30"
              value={duration}
              onChange={(e) => setDuration(+e.target.value)}
            />
          </label>
          <button
            className="button"
            disabled={busy}
            onClick={() =>
              act(async () => {
                setRun(
                  await api<Simulation>("/simulations", {
                    district,
                    event,
                    severity,
                    duration,
                    staffing: 0.75,
                  }),
                );
                setOptimized(false);
              })
            }
          >
            <FlaskConical size={17} />
            Run scenario
          </button>
        </div>
      </section>
      {run ? (
        <>
          <div className="notice">
            {run.label}. Includes a 25% staffing reduction in the affected
            district.
          </div>
          <div className="stats">
            <Stat
              label="Without intervention"
              value={number(run.before.critical_failures)}
              note="Facilities failing ≥1 resource on final day"
              icon={Bell}
            />
            <Stat
              label="Unmet resource units"
              value={number(run.before.unmet_units)}
              note="Cumulative unmet medicine units"
              icon={Package}
            />
            <Stat
              label="With optimized response"
              value={optimized ? number(run.after.critical_failures) : "—"}
              note="Final-day failures; staff/bed limits remain"
              icon={ShieldCheck}
            />
            <Stat
              label="Unmet units after"
              value={optimized ? number(run.after.unmet_units) : "—"}
              note={
                optimized
                  ? `${run.after.transfers.length} simulated stock transfers`
                  : "Generate response to compare"
              }
              icon={Network}
            />
          </div>
          {!optimized && (
            <button className="button" onClick={() => setOptimized(true)}>
              <Network size={17} />
              Optimize response
            </button>
          )}
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Network stress over time</h2>
                <p>
                  Daily medicine, bed and service failures with neighbor
                  spillover
                </p>
              </div>
            </div>
            <div className="timeline-chart">
              {run.before.timeline.map((t, i) => (
                <div key={t.day}>
                  <div className="timeline-bars">
                    <i
                      title={`${t.critical_failures} failures without intervention`}
                      style={{
                        height: `${(t.critical_failures / 81) * 150}px`,
                      }}
                    />
                    {optimized && (
                      <i
                        title={`${run.after.timeline[i].critical_failures} failures with response`}
                        className="after"
                        style={{
                          height: `${(run.after.timeline[i].critical_failures / 81) * 150}px`,
                        }}
                      />
                    )}
                  </div>
                  <small>{t.day}</small>
                </div>
              ))}
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Medicine failures</th>
                    <th>Bed overload</th>
                    <th>Service overload</th>
                    <th>Spillover patients</th>
                    {optimized && <th>Medicine failures after</th>}
                  </tr>
                </thead>
                <tbody>
                  {run.before.timeline.map((t, i) => (
                    <tr key={t.day}>
                      <td>{t.day}</td>
                      <td>{t.medicine_failures}</td>
                      <td>{t.bed_failures}</td>
                      <td>{t.capacity_failures}</td>
                      <td>{t.spillover_patients}</td>
                      {optimized && (
                        <td>{run.after.timeline[i].medicine_failures}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p className="muted">{run.assumptions}</p>
        </>
      ) : (
        <Empty>
          Choose an emergency and run the seeded PHC network forward in time.
        </Empty>
      )}
    </>
  );
}

function FederationView({ act, busy }: { act: Act; busy: boolean }) {
  const [data, setData] = useState<Federation>({
    round: 0,
    states: [],
    raw_rows_transferred: 0,
  });
  const [error, setError] = useState("");
  useEffect(() => {
    api<Federation>("/federation/status")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      {error && <div className="error">{error}</div>}
      <div className="notice">
        <Globe2 size={24} />
        <div>
          <strong>Local knowledge. Shared intelligence.</strong>
          <p>
            Each state trains on its own dataset. Only model parameters and
            sample counts reach the weighted FedAvg aggregator.
          </p>
        </div>
      </div>
      <div className="stats">
        <Stat
          label="Global model"
          value={`v${data.round}`}
          note="Federated linear ORS experiment"
          icon={Network}
        />
        <Stat
          label="Training nodes"
          value="3 states"
          note="Logically separated on this demo host"
          icon={Globe2}
        />
        <Stat
          label="Raw rows transferred"
          value={number(data.raw_rows_transferred)}
          note="Aggregator consumes weights and counts"
          icon={ShieldCheck}
        />
        <Stat
          label="Federation round"
          value={String(data.round)}
          note="Persisted model parameters"
          icon={RefreshCw}
        />
      </div>
      <div className="federation-nodes">
        {[
          ["AP", "Andhra Pradesh"],
          ["KA", "Karnataka"],
          ["TG", "Telangana"],
        ].map(([id, name]) => {
          const s = data.states.find((s) => s.state === id);
          return (
            <section className="panel" key={id}>
              <div className="panel-header">
                <h2>{name}</h2>
                <span className="node-icon">
                  <Globe2 size={20} />
                </span>
              </div>
              <div className="panel-body">
                <span className={`badge ${s ? "green" : "neutral"}`}>
                  {s ? "Trained locally" : "Ready to train"}
                </span>
                <h3>
                  {s ? number(s.samples) : "—"}{" "}
                  <small>local training rows</small>
                </h3>
                <div className="metadata">
                  <span>Holdout rows: {s?.validation_samples || "—"}</span>
                  <span>
                    Local MAE before: {s?.mae_before.toFixed(2) || "—"}
                  </span>
                  <span>Local MAE after: {s?.mae_after.toFixed(2) || "—"}</span>
                  <span>
                    Redistributed global MAE: {s?.global_mae.toFixed(2) || "—"}
                  </span>
                </div>
              </div>
            </section>
          );
        })}
      </div>
      <div className="federation-aggregate">
        <ArrowDown />
        <div>
          <Network size={30} />
          <h2>Weighted parameter aggregation</h2>
          <p>
            State sample counts determine each model’s contribution. Updated
            parameters are evaluated locally.
          </p>
          <button
            className="button"
            disabled={busy}
            onClick={() =>
              act(async () =>
                setData(await api<Federation>("/federation/train-round", {})),
              )
            }
          >
            <RefreshCw size={16} />
            Train federated round
          </button>
        </div>
      </div>
      <p className="muted">
        Federated-learning prototype. Logical isolation on one host; no
        differential privacy or secure aggregation. This experimental model is
        evaluated separately from the operational forecasting engine.
      </p>
    </>
  );
}

function Operator({ role, onSync }: { role: string; onSync: () => void }) {
  const [online, setOnline] = useState(true),
    [forced, setForced] = useState(false),
    [stock, setStock] = useState<{
      quantity: number;
      version: number;
      synced_at?: string;
    }>(),
    [count, setCount] = useState(0),
    [kind, setKind] = useState("DISPENSE"),
    [quantity, setQuantity] = useState(50),
    [expiry, setExpiry] = useState(""),
    [error, setError] = useState(""),
    [syncing, setSyncing] = useState(false),
    [conflict, setConflict] = useState(false);
  const isOnline = online && !forced;
  async function reload() {
    const events = await queued();
    setCount(events.length);
    const cached = await readState("stock");
    if (cached) setStock(cached);
    if (navigator.onLine && !events.length) {
      try {
        const data = await api<Forecast[]>("/phcs/PHC-001/inventory");
        const f = data.find((x) => x.medicine_id === "ors")!;
        const s = {
          quantity: f.recorded,
          version: f.version,
          synced_at: new Date().toISOString(),
        };
        setStock(s);
        await saveState("stock", s);
      } catch (e) {
        setError(String(e));
      }
    }
  }
  useEffect(() => {
    setOnline(navigator.onLine);
    reload();
    const on = () => setOnline(true),
      off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  const sync = useCallback(async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    setError("");
    try {
      await syncQueue((event: unknown) =>
        api("/inventory/events", event, role),
      );
      setConflict(false);
      await reload();
      onSync();
    } catch (e) {
      setError(String(e));
      setConflict(String(e).includes("Stock changed"));
      setCount((await queued()).length);
    } finally {
      setSyncing(false);
    }
  }, [isOnline, syncing, role]);
  useEffect(() => {
    if (isOnline && count > 0 && !conflict) void sync();
  }, [isOnline, count]);
  async function record() {
    if (!stock) return;
    setError("");
    try {
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > 1000000)
        throw new Error("Enter a whole quantity between 0 and 1,000,000.");
      if (kind === "DISPENSE" && quantity > stock.quantity)
        throw new Error("Dispense exceeds local recorded stock.");
      if (
        kind !== "DISPENSE" &&
        (!expiry || new Date(expiry).getTime() <= Date.now())
      )
        throw new Error(
          "Enter the future expiry of the received or counted batch.",
        );
      const event = {
        id: crypto.randomUUID(),
        sequence: Date.now(),
        phc_id: "PHC-001",
        medicine_id: "ors",
        kind,
        quantity,
        version: stock.version,
        timestamp: new Date().toISOString(),
        ...(kind === "DISPENSE"
          ? {}
          : { expiry: new Date(expiry).toISOString() }),
      };
      const updated = {
        ...stock,
        quantity:
          kind === "DISPENSE"
            ? stock.quantity - quantity
            : kind === "RECEIVE"
              ? stock.quantity + quantity
              : quantity,
        version: stock.version + 1,
      };
      await recordLocal(event, updated);
      setStock(updated);
      setCount((await queued()).length);
    } catch (e) {
      setError(String(e));
    }
  }
  async function resolve() {
    setError("");
    try {
      const data = await api<Forecast[]>("/phcs/PHC-001/inventory");
      const live = data.find((f) => f.medicine_id === "ors")!;
      let q = live.recorded,
        v = live.version;
      const rebased = [];
      for (const event of await queued()) {
        if (event.kind === "RECONCILIATION")
          throw new Error(
            "A conflicting physical count needs a fresh count. Export/review the queued count before retrying; automatic rebasing is disabled.",
          );
        q = event.kind === "DISPENSE" ? q - event.quantity : q + event.quantity;
        if (q < 0)
          throw new Error(
            "Queued dispensing exceeds current server stock. Reconcile physically before continuing.",
          );
        rebased.push({ ...event, version: v++ });
      }
      await rebaseQueue(rebased, { quantity: q, version: v });
      setStock({ quantity: q, version: v });
      setConflict(false);
      await sync();
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <>
      <div className="operator-status">
        <span className={`badge ${isOnline ? "green" : "amber"}`}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}{" "}
          {isOnline ? "Online" : "Offline"}
          {syncing ? " · synchronizing" : ""}
        </span>
        <button
          className="button secondary"
          onClick={() => setForced((v) => !v)}
        >
          {forced ? "Reconnect" : "Go offline (demo)"}
        </button>
        <span>{count} unsynced events</span>
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>PHC-A · Kurnool Rural</h2>
              <p>ORS inventory · offline-first operator station</p>
            </div>
            <Package size={21} />
          </div>
          <div className="panel-body">
            <div className="stock-total">
              <small>Local recorded stock</small>
              <strong data-testid="local-stock">
                {stock ? number(stock.quantity) : "—"} <em>units</em>
              </strong>
              <span>
                Version {stock?.version || "—"} ·{" "}
                {count ? "Pending synchronization" : "Server acknowledged"}
              </span>
            </div>
            <div className="operator-form">
              <label>
                Transaction
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="DISPENSE">Dispense stock</option>
                  <option value="RECEIVE">Receive stock</option>
                  <option value="RECONCILIATION">
                    Physical reconciliation
                  </option>
                </select>
              </label>
              <label>
                {kind === "RECONCILIATION"
                  ? "Physical counted quantity"
                  : "Quantity"}
                <input
                  aria-label="Transaction quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(+e.target.value)}
                />
              </label>
              {kind !== "DISPENSE" && (
                <label>
                  Batch expiry
                  <input
                    type="date"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                </label>
              )}
              <button
                className="button full"
                disabled={
                  !stock ||
                  syncing ||
                  !["operator", "district", "medical"].includes(role)
                }
                onClick={record}
              >
                Record transaction
              </button>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>Synchronization</h2>
            <RefreshCw size={19} />
          </div>
          <div className="panel-body">
            <div className="sync-count">
              {count}
              <small>events safely stored in IndexedDB</small>
            </div>
            <p>
              Last sync:{" "}
              {stock?.synced_at
                ? new Date(stock.synced_at).toLocaleString()
                : "Not yet synchronized"}
            </p>
            <p className="muted">
              Queued events keep their unique ID until the server acknowledges
              them. Version conflicts pause the queue for review.
            </p>
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            {conflict && (
              <div className="conflict-actions">
                <button
                  className="button secondary"
                  disabled={!isOnline}
                  onClick={resolve}
                >
                  Review & retry deltas on latest stock
                </button>
                <p className="muted">
                  For a conflicting physical count, archive the pending records
                  locally, reload server stock, then enter a fresh count.
                </p>
                <button
                  className="button secondary"
                  disabled={!isOnline}
                  onClick={async () => {
                    try {
                      await archiveConflicts();
                      setConflict(false);
                      await reload();
                      setError(
                        "Conflicting events retained in the local archive. Enter a fresh physical count before recording further dispensing.",
                      );
                    } catch (e) {
                      setError(String(e));
                    }
                  }}
                >
                  Archive conflicts & reload stock
                </button>
              </div>
            )}
            <button
              className="button"
              disabled={!isOnline || syncing || !count}
              onClick={sync}
            >
              <RefreshCw size={16} />
              Sync now
            </button>
            <div className="insight">
              {count
                ? "Local data is provisional until synchronized. Offline delay will reduce server TruthScore after sync."
                : "Changes are reflected in the command center on its next refresh."}
            </div>
          </div>
        </section>
      </div>
      <div className="notice">
        Open this page once while online to cache the app. This prototype
        operator station is bound to PHC-A and ORS. Physical reconciliation
        treats the counted stock as a single batch.
      </div>
    </>
  );
}

function ModelHealth() {
  const [data, setData] = useState<{
    model: string;
    evaluation: string;
    phcs: number;
    mae: number;
    rmse: number;
    samples: number;
    limitations: string[];
  }>();
  const [error, setError] = useState("");
  useEffect(() => {
    api<NonNullable<typeof data>>("/model-health")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return error ? (
    <div className="error">{error}</div>
  ) : data ? (
    <>
      <div className="stats">
        <Stat
          label="Mean absolute error"
          value={String(data.mae)}
          note="ORS units/day · synthetic holdout"
          icon={Activity}
        />
        <Stat
          label="Root mean squared error"
          value={String(data.rmse)}
          note="One-day rolling forecasts"
          icon={Activity}
        />
        <Stat
          label="Evaluation samples"
          value={number(data.samples)}
          note={`${data.phcs} facilities`}
          icon={ClipboardList}
        />
        <Stat label="Model" value="v1" note={data.model} icon={Network} />
      </div>
      <section className="panel">
        <div className="panel-header">
          <h2>Evaluation & assumptions</h2>
        </div>
        <div className="panel-body">
          <p>{data.evaluation}</p>
          <ul className="reasons">
            {data.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p>
            Operational forecast: recent 14-day mean after latent-demand
            correction, weekly variation and conservative correlated
            uncertainty. No accuracy claims are made for real health-system
            data.
          </p>
        </div>
      </section>
    </>
  ) : (
    <Empty>Evaluating rolling holdout predictions…</Empty>
  );
}
