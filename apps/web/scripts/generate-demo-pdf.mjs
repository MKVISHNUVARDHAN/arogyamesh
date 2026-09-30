import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const repoRoot = path.resolve(process.cwd(), "../..");
const docsDir = path.join(repoRoot, "docs/screenshots");

const commandCenterImg = fs.readFileSync(path.join(docsDir, "command-center.png")).toString("base64");
const mobileImg = fs.readFileSync(path.join(docsDir, "mobile.png")).toString("base64");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: A4;
    margin: 10mm 14mm 10mm 14mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.45;
    font-size: 10pt;
  }
  .page {
    page-break-after: always;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .page:last-child {
    page-break-after: avoid;
  }
  
  /* Header & Branding */
  .brand-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #0d9488;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .logo-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo-badge {
    background: linear-gradient(135deg, #0d9488, #0f766e);
    color: white;
    font-weight: 800;
    font-size: 13pt;
    padding: 6px 12px;
    border-radius: 6px;
    letter-spacing: 0.5px;
  }
  .brand-text h1 {
    font-size: 16pt;
    color: #0f172a;
    font-weight: 800;
    letter-spacing: -0.3px;
  }
  .brand-text p {
    font-size: 8pt;
    color: #0d9488;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .header-meta {
    text-align: right;
    font-size: 8pt;
    color: #64748b;
  }
  .header-meta .tag {
    display: inline-block;
    background: #f1f5f9;
    color: #334155;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    margin-bottom: 3px;
  }

  /* Headings */
  h2 {
    font-size: 12pt;
    color: #0f172a;
    font-weight: 700;
    margin: 10px 0 6px 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  h2::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 14px;
    background: #0d9488;
    border-radius: 2px;
  }
  h3 {
    font-size: 10pt;
    color: #1e293b;
    font-weight: 700;
    margin-bottom: 4px;
  }

  p {
    color: #334155;
    font-size: 9.5pt;
    margin-bottom: 8px;
  }

  /* Grid & Cards */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }
  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px;
  }
  .card-highlight {
    background: #f0fdfa;
    border: 1px solid #99f6e4;
  }
  .card-title {
    font-weight: 700;
    color: #0f766e;
    font-size: 9.5pt;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  /* Metric Stat Box */
  .stat-box {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 10px;
    text-align: center;
  }
  .stat-val {
    font-size: 15pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.1;
  }
  .stat-val.teal { color: #0d9488; }
  .stat-val.blue { color: #2563eb; }
  .stat-val.amber { color: #d97706; }
  .stat-label {
    font-size: 7.5pt;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 3px;
  }

  /* Badges & Pills */
  .badge {
    display: inline-block;
    padding: 2px 7px;
    font-size: 7.5pt;
    font-weight: 700;
    border-radius: 4px;
  }
  .badge-teal { background: #ccfbf1; color: #0f766e; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-green { background: #dcfce7; color: #166534; }
  .badge-amber { background: #fef3c7; color: #92400e; }

  /* Links Bar */
  .links-bar {
    background: #0f172a;
    color: white;
    border-radius: 6px;
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8.5pt;
    margin-bottom: 12px;
  }
  .links-bar a {
    color: #5eead4;
    text-decoration: none;
    font-weight: 600;
  }

  /* Table styling */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin-bottom: 10px;
  }
  th {
    background: #f1f5f9;
    color: #475569;
    font-weight: 700;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #e2e8f0;
  }
  td {
    padding: 5px 8px;
    border: 1px solid #e2e8f0;
    color: #334155;
  }
  tr:nth-child(even) td {
    background: #f8fafc;
  }

  /* Step box */
  .step-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .step-item {
    display: flex;
    gap: 8px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 8.5pt;
  }
  .step-num {
    background: #0d9488;
    color: white;
    font-weight: 800;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8pt;
    flex-shrink: 0;
  }
  .step-content strong {
    color: #0f172a;
  }

  /* Screenshots */
  .img-container {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  .img-container img {
    width: 100%;
    display: block;
  }
  .img-caption {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 4px 8px;
    font-size: 7.5pt;
    color: #64748b;
    font-weight: 600;
    text-align: center;
  }

  /* Footer */
  .page-footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.5pt;
    color: #94a3b8;
    margin-top: 8px;
  }
</style>
</head>
<body>

<!-- PAGE 1: EXECUTIVE BRIEF & THE PROBLEM -->
<div class="page">
  <div>
    <div class="brand-header">
      <div class="logo-title">
        <div class="logo-badge">AM</div>
        <div class="brand-text">
          <h1>ArogyaMesh</h1>
          <p>Public Health Supply Chain Autopilot</p>
        </div>
      </div>
      <div class="header-meta">
        <div class="tag">AI & Public Health Hackathon</div>
        <div>Deployment & Executive Brief</div>
      </div>
    </div>

    <div class="links-bar">
      <div><strong>Live App:</strong> <a href="https://arogyamesh.vercel.app">arogyamesh.vercel.app</a></div>
      <div><strong>Backend API:</strong> <a href="https://arogyamesh-api-6o84.onrender.com/docs">arogyamesh-api.onrender.com</a></div>
      <div><strong>GitHub:</strong> <a href="https://github.com/MKVISHNUVARDHAN/arogyamesh">MKVISHNUVARDHAN/arogyamesh</a></div>
    </div>

    <h2>1. Executive Summary & Impact</h2>
    <p>
      <strong>ArogyaMesh</strong> is an AI-driven, federated resilience autopilot designed specifically for India's <strong>Primary Health Centre (PHC)</strong> network. It replaces slow, error-prone manual registers with predictive digital twins, automated peer-to-peer redistribution, multi-district epidemic simulation, and privacy-preserving federated intelligence.
    </p>

    <div class="grid-3">
      <div class="stat-box">
        <div class="stat-val teal">81</div>
        <div class="stat-label">Connected PHCs</div>
      </div>
      <div class="stat-box">
        <div class="stat-val blue">9 Districts</div>
        <div class="stat-label">AP · KA · TG Tri-Border</div>
      </div>
      <div class="stat-box">
        <div class="stat-val amber">&lt;10%</div>
        <div class="stat-label">Target Shortage Risk</div>
      </div>
    </div>

    <h2>2. The Last-Mile Public Health Problem</h2>
    <p>
      In rural Indian healthcare networks, medicine stockouts and facility overburdens cost lives. The current system suffers from three critical failure modes:
    </p>

    <div class="grid-3">
      <div class="card">
        <div class="card-title">⚠️ Delayed Visibility</div>
        <p style="font-size:8.5pt;">Stock arrives or depletes unrecorded. Manual tallying creates 24–72 hour lag, making epidemic response always reactive.</p>
      </div>
      <div class="card">
        <div class="card-title">❌ Cannibalizing Transfers</div>
        <p style="font-size:8.5pt;">Emergency medicine requests rob neighbouring PHCs of buffer stock without safety calculations, causing secondary stockouts.</p>
      </div>
      <div class="card">
        <div class="card-title">🔒 Inter-State Data Silos</div>
        <p style="font-size:8.5pt;">State health departments (Andhra, Karnataka, Telangana) cannot pool raw patient/facility data due to governance and residency mandates.</p>
      </div>
    </div>

    <h2>3. The ArogyaMesh 5-Pillar Architecture</h2>
    <div class="grid-2">
      <div class="card card-highlight">
        <div class="card-title">1. Verifiable TruthScore & Digital Twins</div>
        <p style="font-size:8.5pt;">Combines consumption patterns, attendance-to-bed capacity curves, and reporting lag into an objective 0–100 Data TruthScore. Filters phantom inventory from decision pipelines.</p>
      </div>
      <div class="card card-highlight">
        <div class="card-title">2. Guaranteed Safe Redistribution (MILP)</div>
        <p style="font-size:8.5pt;">Greedy distance-optimal algorithm with post-transfer safety guarantees. A donor PHC cannot donate if its projected stockout risk exceeds 10%. Enforces First-Expired-First-Out (FEFO).</p>
      </div>
      <div class="card card-highlight">
        <div class="card-title">3. Multi-District Emergency Sandbox</div>
        <p style="font-size:8.5pt;">Simulates epidemic surges (Dengue, Heatwave, Respiratory) with capacity overflows spilling over to nearest facilities, calculating unmet units before and after intervention.</p>
      </div>
      <div class="card card-highlight">
        <div class="card-title">4. Inter-State Federated Learning</div>
        <p style="font-size:8.5pt;">Federated Averaging (FedAvg) trains demand models locally inside state boundaries. <strong>Zero raw health data transfers</strong> across borders; only model weights and sample counts are shared.</p>
      </div>
    </div>

    <div class="card" style="background:#eff6ff; border-color:#bfdbfe;">
      <div class="card-title" style="color:#1d4ed8;">5. Offline-First PWA & Bilingual AI Copilot</div>
      <p style="font-size:8.5pt; margin:0;">
        Works seamlessly in rural low-bandwidth areas via IndexedDB client transaction queues and service workers. Includes <strong>Arogya Copilot</strong> powered by Groq (LLM) delivering sub-second, clinically grounded explanations in <strong>English and Telugu script</strong>.
      </p>
    </div>
  </div>

  <div class="page-footer">
    <span>ArogyaMesh · Public Health Intelligence Autopilot</span>
    <span>Page 1 of 4</span>
  </div>
</div>

<!-- PAGE 2: ARCHITECTURE & DEEP DIVE -->
<div class="page">
  <div>
    <div class="brand-header">
      <div class="logo-title">
        <div class="logo-badge">AM</div>
        <div class="brand-text">
          <h1>System Architecture & Core Algorithms</h1>
          <p>Production Cloud Topology & Algorithmic Rigor</p>
        </div>
      </div>
      <div class="header-meta">
        <span class="badge badge-teal">Production Deployed</span>
      </div>
    </div>

    <h2>1. Deployed Production Cloud Topology</h2>
    <table>
      <thead>
        <tr>
          <th>Layer</th>
          <th>Provider</th>
          <th>Specification</th>
          <th>Role & Responsibility</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Frontend</strong></td>
          <td>Vercel</td>
          <td>Next.js 16 (App Router), React 19, TypeScript, PWA</td>
          <td>Command Center UI, Maps, Digital Twin visualizer, offline PWA</td>
        </tr>
        <tr>
          <td><strong>Backend API</strong></td>
          <td>Render</td>
          <td>FastAPI, Uvicorn, Python 3.12 (Ohio, US East)</td>
          <td>Optimization solver, simulation sandbox, federated aggregator</td>
        </tr>
        <tr>
          <td><strong>Database</strong></td>
          <td>Neon PostgreSQL</td>
          <td>Serverless Postgres 17, PgBouncer pooler (AWS Ohio)</td>
          <td>Persistent storage: 81 PHCs, 1,620 batches, 145,000 history points</td>
        </tr>
        <tr>
          <td><strong>AI Copilot</strong></td>
          <td>Groq Cloud</td>
          <td><code>openai/gpt-oss-20b</code> inference engine</td>
          <td>Sub-second explanations in English & Telugu from structured evidence</td>
        </tr>
      </tbody>
    </table>

    <h2>2. Algorithmic Innovations in services/ml</h2>
    <div class="grid-2">
      <div class="card">
        <h3>Safe Redistribution Engine</h3>
        <p style="font-size:8pt; color:#64748b; margin-bottom:4px;">Rule: Every proposed donor must pass a post-transfer safety check.</p>
        <p style="font-size:8.5pt;">
          Computes required safety stock: <code>S = μ × H + z × σ × √H</code>. Donors are evaluated using same-district first, then cross-district based on geographical Haversine distance. If post-donation risk exceeds 10%, the donor is rejected.
        </p>
        <span class="badge badge-green">Zero Secondary Stockouts</span>
      </div>
      <div class="card">
        <h3>TruthScore Calculation</h3>
        <p style="font-size:8pt; color:#64748b; margin-bottom:4px;">Rule: Distinguish physical stock from verifiable usable stock.</p>
        <p style="font-size:8.5pt;">
          Evaluates reporting lag (hours since last sync), batch expiration windows, and footfall anomalies. Generates an objective score:
          <code>TruthScore = 100 - (LagPenalty + ExpiryPenalty + VariancePenalty)</code>.
        </p>
        <span class="badge badge-blue">Audit-Trail Verified</span>
      </div>
    </div>

    <h2>3. The Multi-District Epidemic Simulation</h2>
    <p style="font-size:9pt;">
      During an outbreak, overwhelmed PHCs overflow patients to nearest neighbour facilities within road transit range. ArogyaMesh calculates epidemic curves over a 14-day window:
    </p>

    <div class="card" style="background:#f1f5f9;">
      <div style="display:flex; justify-content:space-around; text-align:center; padding: 4px 0;">
        <div>
          <div style="font-weight:700; color:#ef4444; font-size:11pt;">63 Facilities</div>
          <div style="font-size:7.5pt; color:#64748b;">Critical Failures (No Intervention)</div>
        </div>
        <div style="font-size:16pt; color:#94a3b8; font-weight:300;">→</div>
        <div>
          <div style="font-weight:700; color:#0d9488; font-size:11pt;">23 Facilities</div>
          <div style="font-size:7.5pt; color:#64748b;">Failures (ArogyaMesh Optimized)</div>
        </div>
        <div style="font-size:16pt; color:#94a3b8; font-weight:300;">→</div>
        <div>
          <div style="font-weight:700; color:#16a34a; font-size:11pt;">63.5% Reduction</div>
          <div style="font-size:7.5pt; color:#64748b;">In Critical Medicine Shortages</div>
        </div>
      </div>
    </div>

    <h2>4. Privacy-Preserving Federated Intelligence</h2>
    <div class="step-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-content"><strong>State Siled Workers:</strong> Andhra Pradesh (AP), Karnataka (KA), and Telangana (TG) workers access only their respective state database partitions.</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-content"><strong>Local Model Training:</strong> Each state computes gradient updates on local ORS demand history (holding out final 18 days for strict validation).</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-content"><strong>Zero PII FedAvg Aggregator:</strong> The central server receives only weights vector <code>[w0, w1, w2]</code> and sample counts. Aggregated global weights reduce system-wide MAE without raw row transfers.</div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>ArogyaMesh · Public Health Intelligence Autopilot</span>
    <span>Page 2 of 4</span>
  </div>
</div>

<!-- PAGE 3: VISUAL SHOWCASE & INTERACTION -->
<div class="page">
  <div>
    <div class="brand-header">
      <div class="logo-title">
        <div class="logo-badge">AM</div>
        <div class="brand-text">
          <h1>Product Showcase & User Experience</h1>
          <p>Command Center, Digital Twin, and Offline Operator Experience</p>
        </div>
      </div>
      <div class="header-meta">
        <span class="badge badge-blue">Responsive UI / PWA</span>
      </div>
    </div>

    <h2>1. District Officer Command Center</h2>
    <div class="img-container">
      <img src="data:image/png;base64,${commandCenterImg}" alt="Command Center Dashboard" style="max-height:200px; object-fit:cover;">
      <div class="img-caption">Figure 1: Live Command Center showing the Tri-Border PHC Map, 5-day predictive stockout outlook, and facility risk ranking.</div>
    </div>

    <div class="grid-2" style="margin-top:6px;">
      <div>
        <h2>2. Rural Operator Offline Station</h2>
        <div class="img-container">
          <img src="data:image/png;base64,${mobileImg}" alt="Mobile Offline View" style="max-height:210px; object-fit:contain; background:#f8fafc;">
          <div class="img-caption">Figure 2: Mobile/PWA offline mode with local stock ledger and conflict reconciliation queue.</div>
        </div>
      </div>

      <div>
        <h2>3. Offline-First Resilience</h2>
        <div class="card" style="height:210px; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div class="card-title">⚡ Works Without Internet</div>
            <p style="font-size:8.5pt;">
              Rural PHC health workers often operate in blackouts or zero-cellular zones. ArogyaMesh caches the application shell via <strong>Service Worker</strong> and stores dispensing events locally in <strong>IndexedDB</strong>.
            </p>
            <div style="font-size:8pt; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; padding:6px; margin:6px 0;">
              <div><strong>1. Offline Dispense:</strong> Updates local count instantly.</div>
              <div><strong>2. Transaction Queue:</strong> UUID events held safely.</div>
              <div><strong>3. Reconnection:</strong> Idempotent batch sync to Neon DB.</div>
            </div>
          </div>
          <span class="badge badge-teal" style="align-self:flex-start;">Tested & Verified under Browser Offline Mode</span>
        </div>
      </div>
    </div>

    <h2>4. Arogya Copilot (Bilingual AI Supply Chain Assistant)</h2>
    <div class="card" style="background:#f8fafc; border-left:4px solid #0d9488;">
      <p style="font-size:8.5pt; margin-bottom:4px;">
        <strong>Native Groq Integration:</strong> The AI Copilot translates complex optimization math, risk forecasts, and truth score audit trails into human-readable recommendations for district officers and medical officers.
      </p>
      <div style="font-size:8pt; color:#475569; background:#ffffff; padding:6px; border-radius:4px; border:1px solid #e2e8f0;">
        <em>"గ్రామీణ కర్నూలు ప్రాథమిక ఆరోగ్య కేంద్రంలో ఓఆర్ఎస్ స్టాక్ రాబోయే 5 రోజుల్లో 92% ప్రమాదంలో ఉంది..."</em><br>
        (Answers generated in sub-second latency in both English and native Telugu script).
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>ArogyaMesh · Public Health Intelligence Autopilot</span>
    <span>Page 3 of 4</span>
  </div>
</div>

<!-- PAGE 4: JUDGE WALKTHROUGH & VERIFICATION -->
<div class="page">
  <div>
    <div class="brand-header">
      <div class="logo-title">
        <div class="logo-badge">AM</div>
        <div class="brand-text">
          <h1>Judge Walkthrough & Verification Proof</h1>
          <p>Step-by-Step Live Demonstration Script & Quality Gates</p>
        </div>
      </div>
      <div class="header-meta">
        <span class="badge badge-green">100% Quality Gates Passed</span>
      </div>
    </div>

    <h2>1. The 3-Minute Judge Demonstration Script</h2>
    <div class="step-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-content"><strong>Clean Demo Reset:</strong> Open <a href="https://arogyamesh.vercel.app">arogyamesh.vercel.app</a>, ensure role is <em>District Officer</em>, and click <strong>"Start judge demo"</strong>. Resets reproducible synthetic state (seed 42).</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-content"><strong>Command Center & Predictive Slider:</strong> PHC-A currently has 800 ORS units and looks healthy. Toggle the <strong>"+5 days"</strong> slider: shortage risk spikes past 90% as demand outpaces stock.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-content"><strong>Digital Twin Inspection:</strong> Click <strong>"Open digital twin"</strong>: verify attendance-to-bed capacity curves, consumption trends, and the 0–100 Data TruthScore ledger.</div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-content"><strong>Find Safe Redistribution:</strong> Click <strong>"Find safe redistribution"</strong>. Algorithm identifies donors. It safely splits allocations between PHC-B and cross-district PHC-C without violating either donor's safety floor.</div>
      </div>
      <div class="step-item">
        <div class="step-num">5</div>
        <div class="step-content"><strong>Approval & Dispatch:</strong> Click <strong>"Approve plan"</strong> → <strong>"Simulate dispatch"</strong>. Observe transactional inventory debits and FEFO batch deductions.</div>
      </div>
      <div class="step-item">
        <div class="step-num">6</div>
        <div class="step-content"><strong>Emergency Simulator:</strong> Go to <em>Emergency Simulator</em>, select <em>Dengue surge</em> (250% demand, 14 days), and click <strong>"Optimize response"</strong> to show dynamic overflow routing and failure mitigation.</div>
      </div>
      <div class="step-item">
        <div class="step-num">7</div>
        <div class="step-content"><strong>Federated Learning Round:</strong> In <em>Federated Intelligence</em>, click <strong>"Train federated round"</strong> to show AP, KA, TG training locally and aggregating weights with zero raw patient rows shared.</div>
      </div>
      <div class="step-item">
        <div class="step-num">8</div>
        <div class="step-content"><strong>Offline Operation:</strong> Switch to <em>PHC operations</em>, click <strong>"Go offline (demo)"</strong>, record transactions, and click <strong>"Reconnect"</strong> to observe instantaneous queue reconciliation.</div>
      </div>
    </div>

    <h2>2. Verification & Quality Gates Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Verification Test Suite</th>
          <th>Tools & Target</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Backend Integration & Models</strong></td>
          <td><code>pytest</code> (14 test cases in <code>tests/</code>)</td>
          <td><span class="badge badge-green">14 / 14 Passed (100%)</span></td>
        </tr>
        <tr>
          <td><strong>Code Formatting & Linting</strong></td>
          <td><code>Ruff</code> (PEP 8, type rules, import order)</td>
          <td><span class="badge badge-green">All checks passed</span></td>
        </tr>
        <tr>
          <td><strong>Frontend Type Safety</strong></td>
          <td><code>tsc --noEmit</code> (TypeScript 5.9)</td>
          <td><span class="badge badge-green">0 Errors</span></td>
        </tr>
        <tr>
          <td><strong>Offline Queue Unit Tests</strong></td>
          <td>Node test runner (<code>tests/queue.test.mjs</code>)</td>
          <td><span class="badge badge-green">3 / 3 Passed</span></td>
        </tr>
        <tr>
          <td><strong>Database Scale & Migration</strong></td>
          <td>Neon Serverless Postgres 17</td>
          <td><span class="badge badge-green">81 PHCs · 1,620 Batches · Seeded</span></td>
        </tr>
        <tr>
          <td><strong>End-to-End Stack Pre-check</strong></td>
          <td><code>scripts/demo-check.py</code></td>
          <td><span class="badge badge-green">4 / 4 Live Services OK</span></td>
        </tr>
      </tbody>
    </table>

    <div class="card card-highlight" style="text-align:center; padding:10px;">
      <div style="font-weight:800; font-size:11pt; color:#0f766e; margin-bottom:2px;">ArogyaMesh: Ready for Hackathon Presentation</div>
      <div style="font-size:8.5pt; color:#334155;">
        Live URLs: <strong>https://arogyamesh.vercel.app</strong> · <strong>https://arogyamesh-api-6o84.onrender.com</strong>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>ArogyaMesh · Public Health Intelligence Autopilot</span>
    <span>Page 4 of 4</span>
  </div>
</div>

</body>
</html>
`;

async function generatePdf() {
  console.log("Launching Playwright Chromium...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Setting document content...");
  await page.setContent(html, { waitUntil: "networkidle" });

  const outputPath = path.join(repoRoot, "ArogyaMesh_Demo_Brief.pdf");
  console.log(`Generating PDF to: ${outputPath}...`);
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "10mm",
      bottom: "10mm",
      left: "12mm",
      right: "12mm",
    },
  });

  await browser.close();
  const sizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`PDF generation complete! File size: ${sizeKb} KB`);
}

generatePdf().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
