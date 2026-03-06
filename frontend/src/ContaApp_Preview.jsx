import { useState } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0f1117;
    --bg2:       #161922;
    --bg3:       #1e2230;
    --border:    #2a2f42;
    --border2:   #343a52;
    --accent:    #4f8ef7;
    --accent2:   #6ba3ff;
    --accentbg:  rgba(79,142,247,0.10);
    --accentbg2: rgba(79,142,247,0.18);
    --green:     #34c98a;
    --greenbg:   rgba(52,201,138,0.12);
    --yellow:    #f5c842;
    --yellowbg:  rgba(245,200,66,0.12);
    --red:       #f76060;
    --redbg:     rgba(247,96,96,0.12);
    --text:      #e8eaf2;
    --text2:     #9aa0b8;
    --text3:     #5e657e;
    --radius:    10px;
    --radius2:   16px;
    --shadow:    0 4px 24px rgba(0,0,0,0.35);
    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
    --sidebar-w:    240px;
    --topbar-h:     60px;
  }

  html, body { height: 100%; overflow-x: hidden; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 14px;
    line-height: 1.5;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

  /* ── Layout shell ── */
  .app { display: flex; min-height: 100vh; }

  /* ── Sidebar ── */
  .sidebar {
    width: var(--sidebar-w);
    min-height: 100vh;
    background: var(--bg2);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; bottom: 0;
    z-index: 200;
    transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
    overflow-y: auto;
    overflow-x: hidden;
  }

  .sidebar-logo {
    padding: 22px 18px 18px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 11px;
    flex-shrink: 0;
  }

  .logo-text { font-family: var(--font-display); font-weight: 700; font-size: 17px; color: var(--text); letter-spacing: -0.3px; }
  .logo-sub  { font-size: 10px; color: var(--text3); font-weight: 400; letter-spacing: 0.4px; margin-top: -1px; }

  .sidebar-nav { flex: 1; padding: 10px 8px; display: flex; flex-direction: column; gap: 1px; }
  .nav-section { font-size: 10px; font-weight: 600; color: var(--text3); letter-spacing: 1px; text-transform: uppercase; padding: 14px 10px 5px; }

  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: var(--radius);
    cursor: pointer; color: var(--text2);
    font-size: 13.5px; font-weight: 400;
    transition: all 0.14s ease;
    user-select: none; position: relative;
    white-space: nowrap;
  }
  .nav-item:hover  { background: var(--bg3); color: var(--text); }
  .nav-item.active { background: var(--accentbg2); color: var(--accent2); font-weight: 500; }
  .nav-item.active::before {
    content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
    width: 3px; height: 18px; background: var(--accent); border-radius: 0 3px 3px 0;
  }
  .nav-icon { width: 17px; height: 17px; flex-shrink: 0; opacity: 0.85; }
  .nav-badge {
    margin-left: auto; background: var(--red); color: #fff;
    font-size: 10px; font-weight: 700; padding: 1px 6px;
    border-radius: 99px; min-width: 18px; text-align: center;
  }

  .sidebar-footer { padding: 10px 8px; border-top: 1px solid var(--border); flex-shrink: 0; }
  .user-chip {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: var(--radius);
    cursor: pointer; transition: background 0.14s;
  }
  .user-chip:hover { background: var(--bg3); }
  .avatar {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    background: linear-gradient(135deg, var(--accent), #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px; color: #fff;
  }
  .user-info { flex: 1; min-width: 0; overflow: hidden; }
  .user-name { font-size: 13px; font-weight: 500; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .user-role { font-size: 11px; color: var(--text3); }

  /* Overlay for mobile */
  .sidebar-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.65); z-index: 190;
    backdrop-filter: blur(2px);
    transition: opacity 0.28s;
  }

  /* ── Main ── */
  .main { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; min-height: 100vh; }

  .topbar {
    height: var(--topbar-h);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center;
    padding: 0 24px 0 20px; gap: 14px;
    position: sticky; top: 0;
    background: rgba(15,17,23,0.88);
    backdrop-filter: blur(14px);
    z-index: 100; flex-shrink: 0;
  }
  .hamburger {
    display: none; width: 36px; height: 36px;
    background: transparent; border: 1px solid var(--border);
    border-radius: var(--radius); cursor: pointer;
    align-items: center; justify-content: center; color: var(--text2);
    flex-shrink: 0;
  }
  .topbar-title { font-family: var(--font-display); font-size: 15px; font-weight: 600; color: var(--text); flex: 1; }
  .topbar-actions { display: flex; align-items: center; gap: 8px; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: var(--radius);
    font-family: var(--font-body); font-size: 13px; font-weight: 500;
    cursor: pointer; border: none; transition: all 0.14s ease;
    white-space: nowrap;
  }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: var(--accent2); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(79,142,247,0.32); }
  .btn-ghost { background: transparent; color: var(--text2); border: 1px solid var(--border2); }
  .btn-ghost:hover { background: var(--bg3); color: var(--text); }
  .btn-icon {
    width: 34px; height: 34px; padding: 0;
    display: flex; align-items: center; justify-content: center;
    background: transparent; color: var(--text2);
    border: 1px solid var(--border); border-radius: var(--radius);
    cursor: pointer; transition: all 0.14s; position: relative;
  }
  .btn-icon:hover { background: var(--bg3); color: var(--text); }
  .notif-dot {
    width: 7px; height: 7px; background: var(--red);
    border-radius: 99px; position: absolute; top: 5px; right: 5px;
    border: 1.5px solid var(--bg2);
  }

  /* ── Page ── */
  .page { padding: 24px; flex: 1; overflow-x: hidden; }
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; gap: 12px; }
  .page-heading { font-family: var(--font-display); font-size: 21px; font-weight: 700; color: var(--text); }
  .page-sub { font-size: 13px; color: var(--text3); margin-top: 3px; }

  /* ── Stats grid ── */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .stat-card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius2); padding: 18px;
    position: relative; overflow: hidden;
    transition: border-color 0.2s, transform 0.2s;
  }
  .stat-card:hover { border-color: var(--border2); transform: translateY(-2px); }
  .stat-card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .stat-card.blue::after  { background: var(--accent); }
  .stat-card.green::after { background: var(--green); }
  .stat-card.yellow::after{ background: var(--yellow); }
  .stat-card.red::after   { background: var(--red); }
  .stat-label { font-size: 10.5px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
  .stat-value { font-family: var(--font-display); font-size: 26px; font-weight: 700; color: var(--text); line-height: 1; margin-bottom: 7px; }
  .stat-sub   { font-size: 11.5px; color: var(--text2); }
  .stat-icon  { position: absolute; right: 16px; top: 16px; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
  .stat-icon.blue   { background: var(--accentbg); }
  .stat-icon.green  { background: var(--greenbg); }
  .stat-icon.yellow { background: var(--yellowbg); }
  .stat-icon.red    { background: var(--redbg); }

  /* ── Grid helpers ── */
  .two-col   { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 20px; }
  .three-col { display: grid; grid-template-columns: 2fr 1fr; gap: 18px; }

  /* ── Panel ── */
  .panel { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius2); overflow: hidden; }
  .panel-header { padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .panel-title  { font-family: var(--font-display); font-size: 13.5px; font-weight: 600; color: var(--text); }
  .panel-action { font-size: 12px; color: var(--accent); cursor: pointer; white-space: nowrap; }
  .panel-action:hover { text-decoration: underline; }

  /* ── Table ── */
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th {
    text-align: left; padding: 9px 14px;
    font-size: 10.5px; font-weight: 600; color: var(--text3);
    text-transform: uppercase; letter-spacing: 0.7px;
    border-bottom: 1px solid var(--border);
    background: rgba(255,255,255,0.015);
  }
  .data-table td { padding: 11px 14px; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--text2); }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tbody tr { transition: background 0.1s; cursor: pointer; }
  .data-table tbody tr:hover td { background: rgba(255,255,255,0.025); color: var(--text); }
  .name-cell { color: var(--text) !important; font-weight: 500; }

  /* ── Badge ── */
  .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  .badge.green  { background: var(--greenbg);  color: var(--green);  }
  .badge.yellow { background: var(--yellowbg); color: var(--yellow); }
  .badge.red    { background: var(--redbg);    color: var(--red);    }
  .badge.blue   { background: var(--accentbg); color: var(--accent2);}
  .badge.gray   { background: var(--bg3);      color: var(--text3);  }

  /* ── Vencimiento list ── */
  .venc-list { display: flex; flex-direction: column; }
  .venc-item {
    display: flex; align-items: center; gap: 11px;
    padding: 11px 18px; border-bottom: 1px solid var(--border);
    transition: background 0.1s; cursor: pointer;
  }
  .venc-item:last-child { border-bottom: none; }
  .venc-item:hover { background: rgba(255,255,255,0.02); }
  .venc-dot  { width: 8px; height: 8px; border-radius: 99px; flex-shrink: 0; }
  .venc-info { flex: 1; min-width: 0; }
  .venc-name   { font-size: 13px; color: var(--text); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .venc-client { font-size: 11.5px; color: var(--text3); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ── Clients ── */
  .search-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }
  .search-input {
    flex: 1; padding: 8px 13px;
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius); color: var(--text);
    font-family: var(--font-body); font-size: 13.5px;
    outline: none; transition: border-color 0.14s; min-width: 0;
  }
  .search-input:focus { border-color: var(--accent); }
  .search-input::placeholder { color: var(--text3); }

  .client-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }
  .client-card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius2); padding: 18px;
    cursor: pointer; transition: all 0.2s;
  }
  .client-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--shadow); }
  .client-card-head { display: flex; align-items: flex-start; gap: 11px; margin-bottom: 12px; }
  .client-avatar {
    width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display); font-size: 14px; font-weight: 700; color: #fff;
  }
  .client-name { font-size: 13.5px; font-weight: 600; color: var(--text); }
  .client-meta { font-size: 11.5px; color: var(--text3); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .client-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
  .client-tag {
    font-size: 10px; font-weight: 600;
    padding: 2px 7px; border-radius: 4px;
    background: var(--accentbg); color: var(--accent2);
  }
  .client-tag.gray { background: var(--bg3); color: var(--text3); }
  .client-footer {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 12px; padding-top: 11px; border-top: 1px solid var(--border);
  }
  .client-honorario { font-size: 12px; color: var(--text3); }
  .client-honorario span { color: var(--text); font-weight: 500; }

  /* ── Login ── */
  .login-wrap {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg);
    background-image:
      radial-gradient(ellipse at 15% 50%, rgba(79,142,247,0.07) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 20%, rgba(139,92,246,0.06) 0%, transparent 50%);
    padding: 20px;
  }
  .login-card {
    width: 100%; max-width: 380px; padding: 36px;
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 20px; box-shadow: var(--shadow);
  }
  .login-logo-wrap { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; }
  .login-title { font-family: var(--font-display); font-size: 21px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .login-sub   { font-size: 13px; color: var(--text3); margin-bottom: 26px; }
  .form-group  { margin-bottom: 15px; }
  .form-label  { display: block; font-size: 12px; font-weight: 500; color: var(--text2); margin-bottom: 6px; }
  .form-input  {
    width: 100%; padding: 10px 13px;
    background: var(--bg3); border: 1px solid var(--border2);
    border-radius: var(--radius); color: var(--text);
    font-family: var(--font-body); font-size: 14px;
    outline: none; transition: border-color 0.14s;
  }
  .form-input:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--text3); }
  .login-btn {
    width: 100%; padding: 11px; margin-top: 8px;
    background: var(--accent); color: #fff;
    border: none; border-radius: var(--radius);
    font-family: var(--font-body); font-size: 14px; font-weight: 500;
    cursor: pointer; transition: all 0.14s;
  }
  .login-btn:hover { background: var(--accent2); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,142,247,0.28); }
  .login-footer { text-align: center; font-size: 11.5px; color: var(--text3); margin-top: 20px; }

  /* ── ComingSoon ── */
  .coming-soon {
    flex: 1; display: flex; align-items: center; justify-content: center;
    min-height: 50vh; padding: 40px 24px;
  }

  /* ── Animations ── */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .fi  { animation: fadeUp 0.3s ease both; }
  .fi1 { animation: fadeUp 0.3s ease 0.05s both; }
  .fi2 { animation: fadeUp 0.3s ease 0.10s both; }
  .fi3 { animation: fadeUp 0.3s ease 0.15s both; }
  .fi4 { animation: fadeUp 0.3s ease 0.20s both; }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .stats-grid   { grid-template-columns: repeat(2, 1fr); }
    .three-col    { grid-template-columns: 1fr; }
  }

  @media (max-width: 768px) {
    :root { --sidebar-w: 240px; }

    .sidebar { transform: translateX(-100%); box-shadow: none; }
    .sidebar.open { transform: translateX(0); box-shadow: 4px 0 40px rgba(0,0,0,0.5); }
    .sidebar-overlay { display: block; opacity: 0; pointer-events: none; transition: opacity 0.28s; }
    .sidebar-overlay.open { opacity: 1; pointer-events: auto; }

    .main { margin-left: 0; }
    .hamburger { display: flex; }

    .page { padding: 16px; }
    .page-header { flex-direction: column; align-items: flex-start; }
    .page-header .btn { align-self: flex-start; }

    .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .stat-value { font-size: 22px; }
    .stat-icon  { display: none; }

    .two-col    { grid-template-columns: 1fr; gap: 14px; }
    .three-col  { grid-template-columns: 1fr; }

    .client-grid { grid-template-columns: 1fr; gap: 12px; }

    .topbar { padding: 0 14px 0 10px; gap: 10px; }
    .topbar-title { font-size: 14px; }

    .data-table th, .data-table td { padding: 9px 10px; font-size: 12px; }
    /* En mobile escondemos columna menos importante */
    .data-table .hide-mobile { display: none; }

    .search-bar { flex-wrap: wrap; }
    .btn-ghost.hide-mobile { display: none; }

    .login-card { padding: 28px 22px; }
  }

  @media (max-width: 400px) {
    .stats-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .stat-label { font-size: 9px; }
    .stat-value { font-size: 20px; }
    .stat-sub   { display: none; }
    .page { padding: 12px; }
  }
`;

// ── SVG Logo ─────────────────────────────────────────────────────────────────
const Logo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Base rounded square */}
    <rect width="40" height="40" rx="10" fill="#4f8ef7"/>
    {/* Bar chart — 3 barras ascendentes representan crecimiento/contabilidad */}
    <rect x="7"  y="24" width="6" height="10" rx="2" fill="rgba(255,255,255,0.35)"/>
    <rect x="17" y="16" width="6" height="18" rx="2" fill="rgba(255,255,255,0.65)"/>
    <rect x="27" y="9"  width="6" height="25" rx="2" fill="white"/>
    {/* Línea superior de tendencia */}
    <path d="M10 22 L20 14 L30 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    {/* Punto en el top de la línea */}
    <circle cx="30" cy="7" r="2" fill="white" opacity="0.8"/>
  </svg>
);

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const p = { fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round" };
  const icons = {
    grid:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    users:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    receipt:  <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M4 2v20l3-2 2 2 2-2 2 2 2-2 3 2V2z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>,
    dollar:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    trending: <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    key:      <svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="7.5" cy="15.5" r="4.5"/><path d="M21 2l-9.6 9.6M15.5 7.5l2 2L21 6l-2-2"/></svg>,
    bell:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    search:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    plus:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M12 5v14M5 12h14"/></svg>,
    menu:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    logout:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
    x:        <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
  };
  return icons[name] || null;
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const CLIENTS = [
  { id:'1', nombre:'María',   apellido:'Fernández', razonSocial:'Fernández & Asoc.',   rut:'21.345.678-9', tipoEmpresa:'SAS',         estado:'activo',   contribuyenteIva:true,  liquidaIrae:true,  cjppu:true,  fonasa:true,  honorario:8500,  color:'#4f8ef7' },
  { id:'2', nombre:'Roberto', apellido:'Pereira',   razonSocial:'Pereira Tech SRL',    rut:'21.456.789-0', tipoEmpresa:'SRL',         estado:'activo',   contribuyenteIva:true,  liquidaIrae:true,  cjppu:false, fonasa:true,  honorario:12000, color:'#34c98a' },
  { id:'3', nombre:'Lucía',   apellido:'Suárez',    razonSocial:'Arq. Suárez',         rut:'21.567.890-1', tipoEmpresa:'Unipersonal', estado:'activo',   contribuyenteIva:false, liquidaIrae:false, cjppu:true,  fonasa:true,  honorario:5500,  color:'#f5c842' },
  { id:'4', nombre:'Carlos',  apellido:'Martínez',  razonSocial:'Dra. Martínez S.A.',  rut:'21.678.901-2', tipoEmpresa:'SA',          estado:'activo',   contribuyenteIva:true,  liquidaIrae:true,  cjppu:true,  fonasa:false, honorario:9200,  color:'#f76060' },
  { id:'5', nombre:'Ana',     apellido:'González',  razonSocial:'González Consulting', rut:'21.789.012-3', tipoEmpresa:'SAS',         estado:'inactivo', contribuyenteIva:true,  liquidaIrae:false, cjppu:false, fonasa:true,  honorario:6800,  color:'#8b5cf6' },
  { id:'6', nombre:'Diego',   apellido:'López',     razonSocial:'López & Hijos SA',    rut:'21.890.123-4', tipoEmpresa:'SA',          estado:'activo',   contribuyenteIva:true,  liquidaIrae:true,  cjppu:false, fonasa:false, honorario:15000, color:'#f97316' },
];

const VENCIMIENTOS = [
  { id:'1', tipo:'IVA',           cliente:'Fernández & Asoc.',  fecha:'2026-03-20', estado:'urgente', dias:3  },
  { id:'2', tipo:'BPS Patronal',  cliente:'Pereira Tech SRL',   fecha:'2026-03-22', estado:'proximo', dias:5  },
  { id:'3', tipo:'FONASA',        cliente:'Arq. Suárez',        fecha:'2026-03-25', estado:'proximo', dias:8  },
  { id:'4', tipo:'IRAE Anticipo', cliente:'Dra. Martínez S.A.', fecha:'2026-03-28', estado:'normal',  dias:11 },
  { id:'5', tipo:'CJPPU',         cliente:'González Consulting',fecha:'2026-04-05', estado:'normal',  dias:19 },
];

const BOLETOS = [
  { cliente:'Fernández & Asoc.',  tipo:'IVA Febrero',    monto:34200,  estado:'emitido'   },
  { cliente:'Pereira Tech SRL',   tipo:'IVA Febrero',    monto:58700,  estado:'pagado'    },
  { cliente:'López & Hijos SA',   tipo:'IRAE Anticipo',  monto:125000, estado:'pendiente' },
  { cliente:'Dra. Martínez S.A.', tipo:'BPS Patronal',   monto:22300,  estado:'emitido'   },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, open, onClose }) {
  const nav = [
    { id:'dashboard',  icon:'grid',     label:'Dashboard'      },
    { id:'clients',    icon:'users',    label:'Clientes'       },
    { id:'calendar',   icon:'calendar', label:'Vencimientos',  badge:3 },
    { id:'payments',   icon:'receipt',  label:'Boletos de Pago'},
    { id:'fees',       icon:'dollar',   label:'Honorarios'     },
    { id:'movements',  icon:'trending', label:'Movimientos'    },
    { id:'credentials',icon:'key',      label:'Credenciales'   },
  ];
  return (
    <>
      <div className={`sidebar-overlay${open?' open':''}`} onClick={onClose}/>
      <aside className={`sidebar${open?' open':''}`}>
        <div className="sidebar-logo">
          <Logo size={32}/>
          <div>
            <div className="logo-text">ContaApp</div>
            <div className="logo-sub">MK Studios</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Principal</div>
          {nav.map(item=>(
            <div key={item.id} className={`nav-item${page===item.id?' active':''}`}
              onClick={()=>{ setPage(item.id); onClose(); }}>
              <span className="nav-icon"><Icon name={item.icon} size={16}/></span>
              {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">LM</div>
            <div className="user-info">
              <div className="user-name">Lucas Martino</div>
              <div className="user-role">Contador</div>
            </div>
            <span style={{color:'var(--text3)'}}><Icon name="logout" size={14}/></span>
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ title, onMenu }) {
  return (
    <header className="topbar">
      <button className="hamburger" onClick={onMenu}><Icon name="menu" size={18}/></button>
      <div className="topbar-title">{title}</div>
      <div className="topbar-actions">
        <button className="btn-icon" style={{position:'relative'}}>
          <Icon name="bell" size={16}/>
          <span className="notif-dot"/>
        </button>
        <button className="btn btn-primary"><Icon name="plus" size={13}/> <span style={{display:'inline'}}>Nuevo</span></button>
      </div>
    </header>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const vcol = { urgente:'var(--red)', proximo:'var(--yellow)', normal:'var(--green)' };
  const vbadge= { urgente:'red',       proximo:'yellow',        normal:'green'       };
  return (
    <div className="page">
      <div className="page-header fi">
        <div>
          <div className="page-heading">Buen día, Lucas 👋</div>
          <div className="page-sub">Jueves 5 de marzo de 2026 · 3 vencimientos críticos esta semana</div>
        </div>
      </div>
      <div className="stats-grid">
        {[
          { label:'Clientes activos',        value:'18',      sub:'+2 este mes',               color:'blue',   icon:'👥' },
          { label:'Vencimientos próximos',   value:'7',       sub:'3 en los próximos 5 días',  color:'yellow', icon:'⏰' },
          { label:'Honorarios pendientes',   value:'$42.800', sub:'4 clientes deben',          color:'red',    icon:'💰' },
          { label:'Boletos emitidos',        value:'23',      sub:'Este mes',                  color:'green',  icon:'🧾' },
        ].map((s,i)=>(
          <div key={i} className={`stat-card ${s.color} fi${i+1}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
          </div>
        ))}
      </div>
      <div className="three-col">
        <div className="panel fi2">
          <div className="panel-header">
            <div className="panel-title">Últimos boletos de pago</div>
            <span className="panel-action">Ver todos</span>
          </div>
          <table className="data-table">
            <thead><tr>
              <th>Cliente</th>
              <th className="hide-mobile">Tipo</th>
              <th>Monto</th>
              <th>Estado</th>
            </tr></thead>
            <tbody>
              {BOLETOS.map((b,i)=>(
                <tr key={i}>
                  <td className="name-cell">{b.cliente}</td>
                  <td className="hide-mobile">{b.tipo}</td>
                  <td>${b.monto.toLocaleString('es-UY')}</td>
                  <td><span className={`badge ${b.estado==='pagado'?'green':b.estado==='emitido'?'blue':'yellow'}`}>
                    {b.estado==='pagado'?'Pagado':b.estado==='emitido'?'Emitido':'Pendiente'}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel fi3">
          <div className="panel-header">
            <div className="panel-title">Próximos vencimientos</div>
            <span className="panel-action">Calendario</span>
          </div>
          <div className="venc-list">
            {VENCIMIENTOS.map(v=>(
              <div key={v.id} className="venc-item">
                <div className="venc-dot" style={{background:vcol[v.estado]}}/>
                <div className="venc-info">
                  <div className="venc-name">{v.tipo}</div>
                  <div className="venc-client">{v.cliente}</div>
                </div>
                <span className={`badge ${vbadge[v.estado]}`}>{v.dias===0?'Hoy':`${v.dias}d`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Clients ───────────────────────────────────────────────────────────────────
function Clients() {
  const [search, setSearch] = useState('');
  const filtered = CLIENTS.filter(c=>
    `${c.nombre} ${c.apellido} ${c.razonSocial} ${c.rut}`.toLowerCase().includes(search.toLowerCase())
  );
  const initials = c=>`${c.nombre[0]}${c.apellido[0]}`;
  const tags = c=>{
    const t=[];
    if(c.contribuyenteIva) t.push('IVA');
    if(c.liquidaIrae)      t.push('IRAE');
    if(c.cjppu)            t.push('CJPPU');
    if(c.fonasa)           t.push('FONASA');
    return t;
  };
  return (
    <div className="page">
      <div className="page-header fi">
        <div>
          <div className="page-heading">Clientes</div>
          <div className="page-sub">{CLIENTS.filter(c=>c.estado==='activo').length} activos · {CLIENTS.length} en total</div>
        </div>
        <button className="btn btn-primary"><Icon name="plus" size={13}/> Nuevo cliente</button>
      </div>
      <div className="search-bar fi1">
        <Icon name="search" size={15}/>
        <input className="search-input" placeholder="Buscar por nombre, razón social, RUT..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <button className="btn btn-ghost hide-mobile">Filtros</button>
      </div>
      <div className="client-grid">
        {filtered.map((c,i)=>(
          <div key={c.id} className={`client-card fi${(i%4)+1}`}>
            <div className="client-card-head">
              <div className="client-avatar" style={{background:c.color}}>{initials(c)}</div>
              <div style={{flex:1, minWidth:0}}>
                <div className="client-name">{c.nombre} {c.apellido}</div>
                <div className="client-meta">{c.razonSocial}</div>
                <div className="client-meta">RUT {c.rut} · {c.tipoEmpresa}</div>
              </div>
              <span className={`badge ${c.estado==='activo'?'green':'gray'}`}>{c.estado==='activo'?'Activo':'Inactivo'}</span>
            </div>
            <div className="client-tags">
              {tags(c).map(t=><span key={t} className="client-tag">{t}</span>)}
              {tags(c).length===0 && <span className="client-tag gray">Sin perfil tributario</span>}
            </div>
            <div className="client-footer">
              <div className="client-honorario">Honorario: <span>${c.honorario.toLocaleString('es-UY')}</span></div>
              <button className="btn btn-ghost" style={{padding:'4px 10px',fontSize:12}}>Ver</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function Calendar() {
  const all = [
    ...VENCIMIENTOS,
    { id:'6', tipo:'IRPF Cat II',  cliente:'López & Hijos SA',    fecha:'2026-03-10', estado:'completado', dias:-5 },
    { id:'7', tipo:'BPS Patronal', cliente:'Dra. Martínez',       fecha:'2026-03-12', estado:'completado', dias:-3 },
    { id:'8', tipo:'IVA',          cliente:'Pereira Tech SRL',    fecha:'2026-04-10', estado:'normal',     dias:24 },
    { id:'9', tipo:'FONASA',       cliente:'González Consulting', fecha:'2026-04-15', estado:'normal',     dias:29 },
  ];
  const color = { urgente:'red', proximo:'yellow', normal:'blue', completado:'green' };
  const label = { urgente:'Urgente', proximo:'Próximo', normal:'Pendiente', completado:'Completado' };
  const dot   = { urgente:'var(--red)', proximo:'var(--yellow)', normal:'var(--accent2)', completado:'var(--green)' };
  return (
    <div className="page">
      <div className="page-header fi">
        <div>
          <div className="page-heading">Vencimientos</div>
          <div className="page-sub">Marzo – Abril 2026</div>
        </div>
        <button className="btn btn-primary"><Icon name="plus" size={13}/> Agregar</button>
      </div>
      <div className="two-col fi1">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Todos los vencimientos</div>
            <div style={{display:'flex',gap:5}}>
              {['Todos','Urgentes'].map(f=>(
                <span key={f} className={`badge ${f==='Todos'?'blue':'gray'}`} style={{cursor:'pointer'}}>{f}</span>
              ))}
            </div>
          </div>
          <table className="data-table">
            <thead><tr>
              <th>Tipo</th>
              <th className="hide-mobile">Cliente</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr></thead>
            <tbody>
              {all.map(v=>(
                <tr key={v.id}>
                  <td className="name-cell">{v.tipo}</td>
                  <td className="hide-mobile">{v.cliente}</td>
                  <td>{new Date(v.fecha).toLocaleDateString('es-UY',{day:'2-digit',month:'short'})}</td>
                  <td><span className={`badge ${color[v.estado]}`}>{label[v.estado]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="panel fi2">
            <div className="panel-header"><div className="panel-title">Resumen del mes</div></div>
            <div style={{padding:'14px 18px',display:'flex',flexDirection:'column',gap:11}}>
              {[
                { label:'Completados', val:2, color:'var(--green)',  bg:'var(--greenbg)'  },
                { label:'Pendientes',  val:5, color:'var(--accent2)',bg:'var(--accentbg)' },
                { label:'Urgentes',    val:3, color:'var(--red)',    bg:'var(--redbg)'    },
              ].map(r=>(
                <div key={r.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:13,color:'var(--text2)'}}>{r.label}</span>
                  <span style={{background:r.bg,color:r.color,fontWeight:700,fontSize:13,padding:'2px 10px',borderRadius:99}}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel fi3">
            <div className="panel-header"><div className="panel-title">Próximos 10 días</div></div>
            <div className="venc-list">
              {VENCIMIENTOS.filter(v=>v.dias<=10).map(v=>(
                <div key={v.id} className="venc-item">
                  <div className="venc-dot" style={{background:dot[v.estado]}}/>
                  <div className="venc-info">
                    <div className="venc-name">{v.tipo}</div>
                    <div className="venc-client">{v.cliente}</div>
                  </div>
                  <span className={`badge ${color[v.estado]}`}>{v.dias}d</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ComingSoon ────────────────────────────────────────────────────────────────
const ComingSoon = ({title})=>(
  <div className="coming-soon">
    <div style={{textAlign:'center'}}>
      <div style={{fontSize:44,marginBottom:14}}>🚧</div>
      <div className="page-heading" style={{marginBottom:6}}>{title}</div>
      <div className="page-sub">Módulo en desarrollo</div>
    </div>
  </div>
);

// ── Login ─────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email,   setEmail]   = useState('lucas@mkstudios.uy');
  const [pass,    setPass]    = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 900);
  };

  return (
    <div className="login-wrap">
      <div className="login-card fi">
        <div className="login-logo-wrap">
          <Logo size={36}/>
          <div>
            <div className="logo-text">ContaApp</div>
            <div className="logo-sub">MK Studios · Uruguay</div>
          </div>
        </div>
        <div className="login-title">Bienvenido de vuelta</div>
        <div className="login-sub">Ingresá a tu panel de gestión contable</div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input className="form-input" type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)}/>
        </div>
        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
        <div className="login-footer">ContaApp v1.0 · Solo para uso del contador</div>
      </div>
    </div>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────
const PAGES = {
  dashboard:   { title:'Dashboard',       comp:Dashboard                              },
  clients:     { title:'Clientes',        comp:Clients                                },
  calendar:    { title:'Vencimientos',    comp:Calendar                               },
  payments:    { title:'Boletos de Pago', comp:()=><ComingSoon title="Boletos de Pago"/> },
  fees:        { title:'Honorarios',      comp:()=><ComingSoon title="Honorarios"/>      },
  movements:   { title:'Movimientos',     comp:()=><ComingSoon title="Movimientos"/>     },
  credentials: { title:'Credenciales',   comp:()=><ComingSoon title="Credenciales"/>    },
};

export default function App() {
  const [loggedIn,     setLoggedIn]     = useState(false);
  const [page,         setPage]         = useState('dashboard');
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  const { title, comp: Page } = PAGES[page] || PAGES.dashboard;

  if (!loggedIn) return (
    <><style>{CSS}</style><Login onLogin={()=>setLoggedIn(true)}/></>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <Sidebar page={page} setPage={setPage} open={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>
        <div className="main">
          <Topbar title={title} onMenu={()=>setSidebarOpen(true)}/>
          <Page/>
        </div>
      </div>
    </>
  );
}
