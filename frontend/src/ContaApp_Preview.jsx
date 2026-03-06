import { useState } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#0f1117; --bg2:#161922; --bg3:#1e2230;
    --border:#2a2f42; --border2:#343a52;
    --accent:#4f8ef7; --accent2:#6ba3ff;
    --accentbg:rgba(79,142,247,0.10); --accentbg2:rgba(79,142,247,0.18);
    --green:#34c98a; --greenbg:rgba(52,201,138,0.12);
    --yellow:#f5c842; --yellowbg:rgba(245,200,66,0.12);
    --red:#f76060; --redbg:rgba(247,96,96,0.12);
    --purple:#a78bfa; --purplebg:rgba(167,139,250,0.12);
    --text:#e8eaf2; --text2:#9aa0b8; --text3:#5e657e;
    --radius:10px; --radius2:16px; --shadow:0 4px 24px rgba(0,0,0,0.35);
    --font-display:'Syne',sans-serif; --font-body:'DM Sans',sans-serif;
    --sidebar-w:240px; --topbar-h:60px;
  }
  html,body{height:100%;overflow-x:hidden;}
  body{background:var(--bg);color:var(--text);font-family:var(--font-body);font-size:14px;line-height:1.5;min-height:100vh;-webkit-font-smoothing:antialiased;}
  ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px;}

  .app{display:flex;min-height:100vh;}
  .sidebar{width:var(--sidebar-w);min-height:100vh;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:200;transition:transform .28s cubic-bezier(.4,0,.2,1);overflow-y:auto;}
  .sidebar-logo{padding:22px 18px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:11px;flex-shrink:0;}
  .logo-text{font-family:var(--font-display);font-weight:700;font-size:17px;color:var(--text);letter-spacing:-.3px;}
  .logo-sub{font-size:10px;color:var(--text3);margin-top:-1px;}
  .sidebar-nav{flex:1;padding:10px 8px;display:flex;flex-direction:column;gap:1px;}
  .nav-section{font-size:10px;font-weight:600;color:var(--text3);letter-spacing:1px;text-transform:uppercase;padding:14px 10px 5px;}
  .nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--radius);cursor:pointer;color:var(--text2);font-size:13.5px;transition:all .14s;user-select:none;position:relative;white-space:nowrap;}
  .nav-item:hover{background:var(--bg3);color:var(--text);}
  .nav-item.active{background:var(--accentbg2);color:var(--accent2);font-weight:500;}
  .nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:18px;background:var(--accent);border-radius:0 3px 3px 0;}
  .nav-icon{width:17px;height:17px;flex-shrink:0;opacity:.85;}
  .nav-badge{margin-left:auto;background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:99px;}
  .sidebar-footer{padding:10px 8px;border-top:1px solid var(--border);flex-shrink:0;}
  .user-chip{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--radius);cursor:pointer;transition:background .14s;}
  .user-chip:hover{background:var(--bg3);}
  .avatar{width:32px;height:32px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#fff;}
  .avatar.contador{background:linear-gradient(135deg,var(--accent),#8b5cf6);}
  .avatar.cliente{background:linear-gradient(135deg,var(--green),#0d9488);}
  .user-info{flex:1;min-width:0;overflow:hidden;}
  .user-name{font-size:13px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .user-role{font-size:11px;color:var(--text3);}
  .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:190;backdrop-filter:blur(2px);transition:opacity .28s;}

  .main{margin-left:var(--sidebar-w);flex:1;display:flex;flex-direction:column;min-height:100vh;}
  .topbar{height:var(--topbar-h);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px 0 20px;gap:14px;position:sticky;top:0;background:rgba(15,17,23,.88);backdrop-filter:blur(14px);z-index:100;flex-shrink:0;}
  .hamburger{display:none;width:36px;height:36px;background:transparent;border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;align-items:center;justify-content:center;color:var(--text2);flex-shrink:0;}
  .topbar-title{font-family:var(--font-display);font-size:15px;font-weight:600;color:var(--text);flex:1;}
  .topbar-actions{display:flex;align-items:center;gap:8px;}
  .role-badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:99px;background:var(--accentbg2);color:var(--accent2);}
  .role-badge.cliente{background:var(--greenbg);color:var(--green);}

  .btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:var(--radius);font-family:var(--font-body);font-size:13px;font-weight:500;cursor:pointer;border:none;transition:all .14s;white-space:nowrap;}
  .btn-primary{background:var(--accent);color:#fff;}
  .btn-primary:hover{background:var(--accent2);transform:translateY(-1px);box-shadow:0 4px 14px rgba(79,142,247,.32);}
  .btn-success{background:var(--green);color:#fff;}
  .btn-success:hover{opacity:.9;transform:translateY(-1px);}
  .btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--border2);}
  .btn-ghost:hover{background:var(--bg3);color:var(--text);}
  .btn-sm{padding:5px 10px;font-size:12px;}
  .btn-icon{width:34px;height:34px;padding:0;display:flex;align-items:center;justify-content:center;background:transparent;color:var(--text2);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;transition:all .14s;position:relative;}
  .btn-icon:hover{background:var(--bg3);color:var(--text);}
  .notif-dot{width:7px;height:7px;background:var(--red);border-radius:99px;position:absolute;top:5px;right:5px;border:1.5px solid var(--bg2);}

  .page{padding:24px;flex:1;overflow-x:hidden;}
  .page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px;gap:12px;}
  .page-heading{font-family:var(--font-display);font-size:21px;font-weight:700;color:var(--text);}
  .page-sub{font-size:13px;color:var(--text3);margin-top:3px;}

  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;}
  .stat-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius2);padding:18px;position:relative;overflow:hidden;transition:border-color .2s,transform .2s;}
  .stat-card:hover{border-color:var(--border2);transform:translateY(-2px);}
  .stat-card::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
  .stat-card.blue::after{background:var(--accent);}
  .stat-card.green::after{background:var(--green);}
  .stat-card.yellow::after{background:var(--yellow);}
  .stat-card.red::after{background:var(--red);}
  .stat-card.purple::after{background:var(--purple);}
  .stat-label{font-size:10.5px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;}
  .stat-value{font-family:var(--font-display);font-size:26px;font-weight:700;color:var(--text);line-height:1;margin-bottom:7px;}
  .stat-sub{font-size:11.5px;color:var(--text2);}
  .stat-icon{position:absolute;right:16px;top:16px;width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;}
  .stat-icon.blue{background:var(--accentbg);}
  .stat-icon.green{background:var(--greenbg);}
  .stat-icon.yellow{background:var(--yellowbg);}
  .stat-icon.red{background:var(--redbg);}
  .stat-icon.purple{background:var(--purplebg);}

  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px;}
  .three-col{display:grid;grid-template-columns:2fr 1fr;gap:18px;}

  .panel{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius2);overflow:hidden;}
  .panel-header{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:10px;}
  .panel-title{font-family:var(--font-display);font-size:13.5px;font-weight:600;color:var(--text);}
  .panel-action{font-size:12px;color:var(--accent);cursor:pointer;}
  .panel-action:hover{text-decoration:underline;}
  .panel-body{padding:18px;}

  .data-table{width:100%;border-collapse:collapse;}
  .data-table th{text-align:left;padding:9px 14px;font-size:10.5px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.7px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.015);}
  .data-table td{padding:11px 14px;border-bottom:1px solid var(--border);font-size:13px;color:var(--text2);}
  .data-table tr:last-child td{border-bottom:none;}
  .data-table tbody tr{transition:background .1s;cursor:pointer;}
  .data-table tbody tr:hover td{background:rgba(255,255,255,.025);color:var(--text);}
  .name-cell{color:var(--text)!important;font-weight:500;}

  .badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;white-space:nowrap;}
  .badge.green{background:var(--greenbg);color:var(--green);}
  .badge.yellow{background:var(--yellowbg);color:var(--yellow);}
  .badge.red{background:var(--redbg);color:var(--red);}
  .badge.blue{background:var(--accentbg);color:var(--accent2);}
  .badge.purple{background:var(--purplebg);color:var(--purple);}
  .badge.gray{background:var(--bg3);color:var(--text3);}

  .venc-list{display:flex;flex-direction:column;}
  .venc-item{display:flex;align-items:center;gap:11px;padding:11px 18px;border-bottom:1px solid var(--border);transition:background .1s;cursor:pointer;}
  .venc-item:last-child{border-bottom:none;}
  .venc-item:hover{background:rgba(255,255,255,.02);}
  .venc-dot{width:8px;height:8px;border-radius:99px;flex-shrink:0;}
  .venc-info{flex:1;min-width:0;}
  .venc-name{font-size:13px;color:var(--text);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .venc-client{font-size:11.5px;color:var(--text3);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

  .search-bar{display:flex;align-items:center;gap:8px;margin-bottom:18px;}
  .search-input{flex:1;padding:8px 13px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);font-family:var(--font-body);font-size:13.5px;outline:none;transition:border-color .14s;min-width:0;}
  .search-input:focus{border-color:var(--accent);}
  .search-input::placeholder{color:var(--text3);}

  .client-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px;}
  .client-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius2);padding:18px;cursor:pointer;transition:all .2s;}
  .client-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:var(--shadow);}
  .client-card-head{display:flex;align-items:flex-start;gap:11px;margin-bottom:12px;}
  .client-avatar{width:38px;height:38px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:14px;font-weight:700;color:#fff;}
  .client-name{font-size:13.5px;font-weight:600;color:var(--text);}
  .client-meta{font-size:11.5px;color:var(--text3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .client-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;}
  .client-tag{font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;background:var(--accentbg);color:var(--accent2);}
  .client-tag.gray{background:var(--bg3);color:var(--text3);}
  .client-footer{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:11px;border-top:1px solid var(--border);}
  .client-honorario{font-size:12px;color:var(--text3);}
  .client-honorario span{color:var(--text);font-weight:500;}

  /* ── Portal cliente ── */
  .portal-header{background:linear-gradient(135deg,rgba(79,142,247,.15),rgba(52,201,138,.08));border:1px solid var(--border);border-radius:var(--radius2);padding:24px;margin-bottom:22px;display:flex;align-items:center;gap:18px;}
  .portal-avatar{width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,var(--green),#0d9488);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:22px;font-weight:800;color:#fff;flex-shrink:0;}
  .portal-greeting{font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--text);}
  .portal-sub{font-size:13px;color:var(--text2);margin-top:4px;}
  .portal-contador{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:12px;color:var(--text3);background:var(--bg3);padding:4px 10px;border-radius:99px;}
  .portal-contador span{color:var(--accent2);font-weight:500;}

  .alerta-banner{display:flex;align-items:center;gap:12px;background:var(--redbg);border:1px solid rgba(247,96,96,.3);border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;}
  .alerta-text{flex:1;font-size:13px;color:var(--red);}
  .alerta-text strong{font-weight:600;}

  /* Consultas */
  .consulta-list{display:flex;flex-direction:column;gap:10px;padding:14px;}
  .consulta-item{background:var(--bg3);border-radius:var(--radius);padding:13px 15px;}
  .consulta-meta{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
  .consulta-from{font-size:11.5px;font-weight:600;color:var(--text2);}
  .consulta-date{font-size:11px;color:var(--text3);}
  .consulta-text{font-size:13px;color:var(--text);line-height:1.5;}
  .consulta-respuesta{margin-top:10px;padding:10px 12px;background:var(--accentbg);border-left:2px solid var(--accent);border-radius:0 6px 6px 0;}
  .consulta-respuesta p{font-size:12.5px;color:var(--text2);}
  .consulta-input-wrap{padding:14px;border-top:1px solid var(--border);display:flex;gap:8px;}
  .consulta-input{flex:1;padding:9px 12px;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius);color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;resize:none;}
  .consulta-input:focus{border-color:var(--accent);}

  /* IVA meter */
  .iva-meter{margin-top:12px;}
  .iva-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
  .iva-label{font-size:12px;color:var(--text2);}
  .iva-val{font-size:13px;font-weight:600;color:var(--text);}
  .progress-bar{height:6px;background:var(--bg3);border-radius:99px;overflow:hidden;margin-bottom:10px;}
  .progress-fill{height:100%;border-radius:99px;transition:width .5s ease;}

  /* Boleto confirm */
  .boleto-row{display:flex;align-items:center;gap:12px;padding:11px 18px;border-bottom:1px solid var(--border);}
  .boleto-row:last-child{border-bottom:none;}
  .boleto-info{flex:1;min-width:0;}
  .boleto-tipo{font-size:13px;font-weight:500;color:var(--text);}
  .boleto-periodo{font-size:11.5px;color:var(--text3);margin-top:2px;}
  .boleto-monto{font-size:13px;font-weight:600;color:var(--text);margin-right:12px;white-space:nowrap;}

  /* Login */
  .login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);background-image:radial-gradient(ellipse at 15% 50%,rgba(79,142,247,.07) 0%,transparent 55%),radial-gradient(ellipse at 85% 20%,rgba(139,92,246,.06) 0%,transparent 50%);padding:20px;}
  .login-card{width:100%;max-width:380px;padding:36px;background:var(--bg2);border:1px solid var(--border);border-radius:20px;box-shadow:var(--shadow);}
  .login-logo-wrap{display:flex;align-items:center;gap:12px;margin-bottom:26px;}
  .login-title{font-family:var(--font-display);font-size:21px;font-weight:700;color:var(--text);margin-bottom:4px;}
  .login-sub{font-size:13px;color:var(--text3);margin-bottom:26px;}
  .form-group{margin-bottom:15px;}
  .form-label{display:block;font-size:12px;font-weight:500;color:var(--text2);margin-bottom:6px;}
  .form-input{width:100%;padding:10px 13px;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius);color:var(--text);font-family:var(--font-body);font-size:14px;outline:none;transition:border-color .14s;}
  .form-input:focus{border-color:var(--accent);}
  .form-input::placeholder{color:var(--text3);}
  .login-btn{width:100%;padding:11px;margin-top:8px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);font-family:var(--font-body);font-size:14px;font-weight:500;cursor:pointer;transition:all .14s;}
  .login-btn:hover{background:var(--accent2);transform:translateY(-1px);box-shadow:0 6px 20px rgba(79,142,247,.28);}
  .login-footer{text-align:center;font-size:11.5px;color:var(--text3);margin-top:20px;}
  .role-switch{display:flex;gap:8px;margin-bottom:20px;}
  .role-btn{flex:1;padding:8px;border-radius:var(--radius);border:1px solid var(--border2);background:transparent;color:var(--text2);font-family:var(--font-body);font-size:12.5px;cursor:pointer;transition:all .14s;}
  .role-btn.active{background:var(--accentbg2);border-color:var(--accent);color:var(--accent2);}

  .coming-soon{flex:1;display:flex;align-items:center;justify-content:center;min-height:50vh;padding:40px 24px;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
  .fi {animation:fadeUp .3s ease both;}
  .fi1{animation:fadeUp .3s ease .05s both;}
  .fi2{animation:fadeUp .3s ease .10s both;}
  .fi3{animation:fadeUp .3s ease .15s both;}
  .fi4{animation:fadeUp .3s ease .20s both;}

  @media(max-width:1024px){.stats-grid{grid-template-columns:repeat(2,1fr);}.three-col{grid-template-columns:1fr;}}
  @media(max-width:768px){
    .sidebar{transform:translateX(-100%);}
    .sidebar.open{transform:translateX(0);box-shadow:4px 0 40px rgba(0,0,0,.5);}
    .sidebar-overlay{display:block;opacity:0;pointer-events:none;}
    .sidebar-overlay.open{opacity:1;pointer-events:auto;}
    .main{margin-left:0;}
    .hamburger{display:flex;}
    .page{padding:16px;}
    .page-header{flex-direction:column;align-items:flex-start;}
    .stats-grid{grid-template-columns:repeat(2,1fr);gap:10px;}
    .stat-value{font-size:22px;} .stat-icon{display:none;}
    .two-col,.three-col{grid-template-columns:1fr;gap:14px;}
    .client-grid{grid-template-columns:1fr;gap:12px;}
    .topbar{padding:0 14px 0 10px;}
    .topbar-title{font-size:14px;}
    .data-table th,.data-table td{padding:9px 10px;font-size:12px;}
    .data-table .hide-mobile{display:none;}
    .portal-header{flex-direction:column;align-items:flex-start;}
  }
  @media(max-width:400px){
    .stats-grid{grid-template-columns:1fr 1fr;gap:8px;}
    .stat-label{font-size:9px;} .stat-value{font-size:20px;} .stat-sub{display:none;}
    .page{padding:12px;}
  }
`;

// ── Logo SVG ──────────────────────────────────────────────────────────────────
const Logo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="10" fill="#4f8ef7"/>
    <rect x="7"  y="24" width="6" height="10" rx="2" fill="rgba(255,255,255,0.35)"/>
    <rect x="17" y="16" width="6" height="18" rx="2" fill="rgba(255,255,255,0.65)"/>
    <rect x="27" y="9"  width="6" height="25" rx="2" fill="white"/>
    <path d="M10 22 L20 14 L30 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
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
    check:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    msg:      <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    upload:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
    alert:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  };
  return icons[name] || null;
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const CLIENTS = [
  { id:'1', nombre:'María',   apellido:'Fernández', razonSocial:'Fernández & Asoc.',   rut:'21.345.678-9', tipoEmpresa:'SAS',         estado:'activo',   contribuyenteIva:true,  liquidaIrae:true,  cjppu:true,  fonasa:true,  honorario:8500,  color:'#4f8ef7', honorarioPendiente:0    },
  { id:'2', nombre:'Roberto', apellido:'Pereira',   razonSocial:'Pereira Tech SRL',    rut:'21.456.789-0', tipoEmpresa:'SRL',         estado:'activo',   contribuyenteIva:true,  liquidaIrae:true,  cjppu:false, fonasa:true,  honorario:12000, color:'#34c98a', honorarioPendiente:12000},
  { id:'3', nombre:'Lucía',   apellido:'Suárez',    razonSocial:'Arq. Suárez',         rut:'21.567.890-1', tipoEmpresa:'Unipersonal', estado:'activo',   contribuyenteIva:false, liquidaIrae:false, cjppu:true,  fonasa:true,  honorario:5500,  color:'#f5c842', honorarioPendiente:5500 },
  { id:'4', nombre:'Carlos',  apellido:'Martínez',  razonSocial:'Dra. Martínez S.A.',  rut:'21.678.901-2', tipoEmpresa:'SA',          estado:'activo',   contribuyenteIva:true,  liquidaIrae:true,  cjppu:true,  fonasa:false, honorario:9200,  color:'#f76060', honorarioPendiente:0    },
  { id:'5', nombre:'Ana',     apellido:'González',  razonSocial:'González Consulting', rut:'21.789.012-3', tipoEmpresa:'SAS',         estado:'inactivo', contribuyenteIva:true,  liquidaIrae:false, cjppu:false, fonasa:true,  honorario:6800,  color:'#8b5cf6', honorarioPendiente:6800 },
  { id:'6', nombre:'Diego',   apellido:'López',     razonSocial:'López & Hijos SA',    rut:'21.890.123-4', tipoEmpresa:'SA',          estado:'activo',   contribuyenteIva:true,  liquidaIrae:true,  cjppu:false, fonasa:false, honorario:15000, color:'#f97316', honorarioPendiente:0    },
];

const VENCIMIENTOS = [
  { id:'1', tipo:'IVA',           cliente:'Fernández & Asoc.',  fecha:'2026-03-20', estado:'urgente', dias:3  },
  { id:'2', tipo:'BPS Patronal',  cliente:'Pereira Tech SRL',   fecha:'2026-03-22', estado:'proximo', dias:5  },
  { id:'3', tipo:'FONASA',        cliente:'Arq. Suárez',        fecha:'2026-03-25', estado:'proximo', dias:8  },
  { id:'4', tipo:'IRAE Anticipo', cliente:'Dra. Martínez S.A.', fecha:'2026-03-28', estado:'normal',  dias:11 },
  { id:'5', tipo:'CJPPU',         cliente:'González Consulting',fecha:'2026-04-05', estado:'normal',  dias:19 },
];

const BOLETOS_CLIENTE = [
  { id:'1', tipo:'IVA',         periodo:'Feb 2026', monto:34200,  estado:'emitido',    vence:'2026-03-13' },
  { id:'2', tipo:'BPS',         periodo:'Feb 2026', monto:8400,   estado:'pagado',     vence:'2026-03-31' },
  { id:'3', tipo:'FONASA',      periodo:'Feb 2026', monto:2100,   estado:'emitido',    vence:'2026-03-10' },
  { id:'4', tipo:'IVA',         periodo:'Ene 2026', monto:29800,  estado:'pagado',     vence:'2026-02-13' },
  { id:'5', tipo:'IRAE Anticipo',periodo:'Mar 2026',monto:45000,  estado:'pendiente',  vence:'2026-04-11' },
];

const CONSULTAS = [
  { id:'1', de:'Lucas Martino', fecha:'Mar 3, 2026', texto:'Recordá que el IVA de febrero vence el 13/03. El monto es $34.200. Ya emití el boleto.', respuesta:null, esContador:true },
  { id:'2', de:'Fernández & Asoc.', fecha:'Mar 4, 2026', texto:'Entendido, gracias. ¿Puedo pagar por transferencia?', respuesta:'Sí, podés pagar por transferencia. Una vez realizado confirmá acá con el comprobante.', esContador:false },
  { id:'3', de:'Fernández & Asoc.', fecha:'Mar 5, 2026', texto:'¿Hay que hacer algún ajuste en la DJ de IRAE este año?', respuesta:null, esContador:false },
];

const MOVIMIENTOS_CLIENTE = [
  { id:'1', tipo:'venta',  fecha:'Mar 1',  descripcion:'Factura #0042 — Consultoría',  monto:85000, iva:22 },
  { id:'2', tipo:'venta',  fecha:'Mar 2',  descripcion:'Factura #0043 — Asesoría',     monto:42000, iva:22 },
  { id:'3', tipo:'compra', fecha:'Mar 3',  descripcion:'Proveedor materiales',         monto:18000, iva:22 },
  { id:'4', tipo:'gasto',  fecha:'Mar 4',  descripcion:'FONASA Feb 2026',              monto:2100,  iva:0  },
  { id:'5', tipo:'gasto',  fecha:'Mar 5',  descripcion:'CJPPU Feb 2026',              monto:3200,  iva:0  },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, open, onClose, role }) {
  const navContador = [
    { id:'dashboard',   icon:'grid',     label:'Dashboard'       },
    { id:'clients',     icon:'users',    label:'Clientes'        },
    { id:'calendar',    icon:'calendar', label:'Vencimientos',   badge:3 },
    { id:'payments',    icon:'receipt',  label:'Boletos de Pago' },
    { id:'fees',        icon:'dollar',   label:'Honorarios'      },
    { id:'movements',   icon:'trending', label:'Movimientos'     },
    { id:'credentials', icon:'key',      label:'Credenciales'    },
  ];
  const navCliente = [
    { id:'portal',      icon:'grid',     label:'Mi Panel'        },
    { id:'mis-boletos', icon:'receipt',  label:'Mis Impuestos'   },
    { id:'mis-movs',    icon:'trending', label:'Mis Movimientos' },
    { id:'consultas',   icon:'msg',      label:'Consultas'       },
  ];
  const nav = role === 'cliente' ? navCliente : navContador;

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
          <div className="nav-section">{role === 'cliente' ? 'Mi Cuenta' : 'Principal'}</div>
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
            <div className={`avatar ${role}`}>
              {role === 'cliente' ? 'MF' : 'LM'}
            </div>
            <div className="user-info">
              <div className="user-name">{role === 'cliente' ? 'María Fernández' : 'Lucas Martino'}</div>
              <div className="user-role">{role === 'cliente' ? 'Portal Cliente' : 'Contador'}</div>
            </div>
            <span style={{color:'var(--text3)'}}><Icon name="logout" size={14}/></span>
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ title, onMenu, role }) {
  return (
    <header className="topbar">
      <button className="hamburger" onClick={onMenu}><Icon name="menu" size={18}/></button>
      <div className="topbar-title">{title}</div>
      <div className="topbar-actions">
        <span className={`role-badge ${role}`}>{role === 'cliente' ? 'Portal Cliente' : 'Contador'}</span>
        <button className="btn-icon" style={{position:'relative'}}>
          <Icon name="bell" size={16}/>
          <span className="notif-dot"/>
        </button>
        {role !== 'cliente' && (
          <button className="btn btn-primary"><Icon name="plus" size={13}/> Nuevo</button>
        )}
      </div>
    </header>
  );
}

// ── Dashboard Contador ────────────────────────────────────────────────────────
function Dashboard() {
  const vcol  = { urgente:'var(--red)', proximo:'var(--yellow)', normal:'var(--green)' };
  const vbadge= { urgente:'red',        proximo:'yellow',        normal:'green'        };
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
          { label:'Clientes activos',      value:'18',      sub:'+2 este mes',              color:'blue',   icon:'👥' },
          { label:'Vencimientos próximos', value:'7',       sub:'3 en los próximos 5 días', color:'yellow', icon:'⏰' },
          { label:'Honorarios pendientes', value:'$42.800', sub:'4 clientes deben',         color:'red',    icon:'💰' },
          { label:'Boletos emitidos',      value:'23',      sub:'Este mes',                 color:'green',  icon:'🧾' },
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
            <div className="panel-title">Honorarios — Marzo 2026</div>
            <span className="panel-action">Ver todos</span>
          </div>
          <table className="data-table">
            <thead><tr><th>Cliente</th><th>Acordado</th><th>Cobrado</th><th>Estado</th></tr></thead>
            <tbody>
              {CLIENTS.filter(c=>c.estado==='activo').slice(0,4).map((c,i)=>(
                <tr key={i}>
                  <td className="name-cell">{c.nombre} {c.apellido}</td>
                  <td>${c.honorario.toLocaleString('es-UY')}</td>
                  <td>${(c.honorario - c.honorarioPendiente).toLocaleString('es-UY')}</td>
                  <td><span className={`badge ${c.honorarioPendiente>0?'red':'green'}`}>
                    {c.honorarioPendiente>0?'Pendiente':'Al día'}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel fi3">
          <div className="panel-header">
            <div className="panel-title">Próximos vencimientos</div>
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
      </div>
      <div className="client-grid">
        {filtered.map((c,i)=>(
          <div key={c.id} className={`client-card fi${(i%4)+1}`}>
            <div className="client-card-head">
              <div className="client-avatar" style={{background:c.color}}>{initials(c)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="client-name">{c.nombre} {c.apellido}</div>
                <div className="client-meta">{c.razonSocial}</div>
                <div className="client-meta">RUT {c.rut} · {c.tipoEmpresa}</div>
              </div>
              <span className={`badge ${c.estado==='activo'?'green':'gray'}`}>{c.estado==='activo'?'Activo':'Inactivo'}</span>
            </div>
            <div className="client-tags">
              {tags(c).map(t=><span key={t} className="client-tag">{t}</span>)}
            </div>
            <div className="client-footer">
              <div className="client-honorario">
                Honorario: <span>${c.honorario.toLocaleString('es-UY')}</span>
                {c.honorarioPendiente>0 && <span style={{color:'var(--red)',marginLeft:6}}>⚠ Debe ${c.honorarioPendiente.toLocaleString('es-UY')}</span>}
              </div>
              <button className="btn btn-ghost btn-sm">Ver</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function Calendar() {
  const all=[...VENCIMIENTOS,
    { id:'6', tipo:'IRPF Cat II',  cliente:'López & Hijos SA',    fecha:'2026-03-10', estado:'completado', dias:-5 },
    { id:'7', tipo:'BPS Patronal', cliente:'Dra. Martínez',       fecha:'2026-03-12', estado:'completado', dias:-3 },
    { id:'8', tipo:'IVA',          cliente:'Pereira Tech SRL',    fecha:'2026-04-10', estado:'normal',     dias:24 },
  ];
  const color={ urgente:'red', proximo:'yellow', normal:'blue', completado:'green' };
  const label={ urgente:'Urgente', proximo:'Próximo', normal:'Pendiente', completado:'Completado' };
  const dot  ={ urgente:'var(--red)', proximo:'var(--yellow)', normal:'var(--accent2)', completado:'var(--green)' };
  return (
    <div className="page">
      <div className="page-header fi">
        <div><div className="page-heading">Vencimientos</div><div className="page-sub">Marzo – Abril 2026</div></div>
        <button className="btn btn-primary"><Icon name="plus" size={13}/> Agregar</button>
      </div>
      <div className="two-col fi1">
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Todos los vencimientos</div></div>
          <table className="data-table">
            <thead><tr><th>Tipo</th><th className="hide-mobile">Cliente</th><th>Fecha</th><th>Estado</th></tr></thead>
            <tbody>{all.map(v=>(
              <tr key={v.id}>
                <td className="name-cell">{v.tipo}</td>
                <td className="hide-mobile">{v.cliente}</td>
                <td>{new Date(v.fecha).toLocaleDateString('es-UY',{day:'2-digit',month:'short'})}</td>
                <td><span className={`badge ${color[v.estado]}`}>{label[v.estado]}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="panel fi2">
            <div className="panel-header"><div className="panel-title">Resumen del mes</div></div>
            <div style={{padding:'14px 18px',display:'flex',flexDirection:'column',gap:11}}>
              {[{label:'Completados',val:2,color:'var(--green)',bg:'var(--greenbg)'},{label:'Pendientes',val:5,color:'var(--accent2)',bg:'var(--accentbg)'},{label:'Urgentes',val:3,color:'var(--red)',bg:'var(--redbg)'}].map(r=>(
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
                  <div className="venc-info"><div className="venc-name">{v.tipo}</div><div className="venc-client">{v.cliente}</div></div>
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

// ── Portal del Cliente ────────────────────────────────────────────────────────
function PortalCliente() {
  const debitoIva  = 127000 * 0.18;   // aprox 22% sobre ventas netas
  const creditoIva = 18000  * 0.18;
  const saldoIva   = debitoIva - creditoIva;
  return (
    <div className="page">
      {/* Header personalizado */}
      <div className="portal-header fi">
        <div className="portal-avatar">MF</div>
        <div>
          <div className="portal-greeting">Hola, María 👋</div>
          <div className="portal-sub">Fernández & Asoc. · RUT 21.345.678-9 · SAS</div>
          <div className="portal-contador">
            Contadora: <span>Lucas Martino</span> · lucas@mkstudios.uy
          </div>
        </div>
      </div>

      {/* Alerta deuda honorarios */}
      <div className="fi1">
        {/* No hay deuda para este cliente, mostramos una alerta de vencimiento */}
        <div className="alerta-banner">
          <Icon name="alert" size={16}/>
          <div className="alerta-text"><strong>IVA Febrero 2026</strong> — Boleto emitido por $34.200. Vence el 13/03. ¡Quedan 8 días!</div>
          <button className="btn btn-ghost btn-sm">Ver boleto</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid fi2">
        {[
          { label:'IVA a pagar',       value:'$'+Math.round(saldoIva).toLocaleString('es-UY'),  sub:'Período Feb 2026', color:'blue',   icon:'🧾' },
          { label:'Honorarios mes',    value:'$8.500',   sub:'Pagado ✓',                         color:'green',  icon:'✅' },
          { label:'Ventas del mes',    value:'$127.000', sub:'3 comprobantes',                   color:'purple', icon:'📈' },
          { label:'Próximo vencimiento',value:'8 días',  sub:'IVA Feb — 13/03',                  color:'yellow', icon:'⏰' },
        ].map((s,i)=>(
          <div key={i} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="two-col fi3">
        {/* Mis impuestos pendientes */}
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Mis impuestos — Marzo 2026</div></div>
          {BOLETOS_CLIENTE.slice(0,4).map(b=>(
            <div key={b.id} className="boleto-row">
              <div className="boleto-info">
                <div className="boleto-tipo">{b.tipo}</div>
                <div className="boleto-periodo">{b.periodo} · Vence {new Date(b.vence).toLocaleDateString('es-UY',{day:'2-digit',month:'short'})}</div>
              </div>
              <div className="boleto-monto">${b.monto.toLocaleString('es-UY')}</div>
              <span className={`badge ${b.estado==='pagado'?'green':b.estado==='emitido'?'yellow':'gray'}`}>
                {b.estado==='pagado'?'Pagado':b.estado==='emitido'?'Emitido':'Pendiente'}
              </span>
              {b.estado==='emitido' && (
                <button className="btn btn-success btn-sm" style={{marginLeft:8}}>
                  <Icon name="check" size={12}/> Pagué
                </button>
              )}
            </div>
          ))}
        </div>

        {/* IVA del mes */}
        <div className="panel">
          <div className="panel-header"><div className="panel-title">Situación IVA — Feb 2026</div></div>
          <div className="panel-body">
            <div className="iva-meter">
              <div className="iva-row"><span className="iva-label">IVA Débito (ventas)</span><span className="iva-val" style={{color:'var(--red)'}}>+${Math.round(debitoIva).toLocaleString('es-UY')}</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{width:'100%',background:'var(--red)'}}/></div>
              <div className="iva-row"><span className="iva-label">IVA Crédito (compras)</span><span className="iva-val" style={{color:'var(--green)'}}>-${Math.round(creditoIva).toLocaleString('es-UY')}</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{width:`${(creditoIva/debitoIva)*100}%`,background:'var(--green)'}}/></div>
              <div style={{borderTop:'1px solid var(--border)',paddingTop:12,marginTop:4}}>
                <div className="iva-row">
                  <span className="iva-label" style={{fontWeight:600,color:'var(--text)'}}>Saldo a pagar DGI</span>
                  <span className="iva-val" style={{color:'var(--yellow)',fontSize:16}}>${ Math.round(saldoIva).toLocaleString('es-UY')}</span>
                </div>
              </div>
            </div>
            <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:8}}>
              <div style={{fontSize:12,color:'var(--text3)'}}>Movimientos del mes</div>
              {MOVIMIENTOS_CLIENTE.slice(0,3).map((m,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,marginRight:8}}>{m.descripcion}</span>
                  <span style={{color:m.tipo==='venta'?'var(--green)':'var(--red)',fontWeight:600,whiteSpace:'nowrap'}}>
                    {m.tipo==='venta'?'+':'−'}${m.monto.toLocaleString('es-UY')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mis Boletos (portal cliente) ─────────────────────────────────────────────
function MisBoletos() {
  return (
    <div className="page">
      <div className="page-header fi"><div><div className="page-heading">Mis Impuestos</div><div className="page-sub">Boletos emitidos y pendientes</div></div></div>
      <div className="panel fi1">
        <div className="panel-header"><div className="panel-title">Todos los períodos</div></div>
        {BOLETOS_CLIENTE.map(b=>(
          <div key={b.id} className="boleto-row">
            <div className="boleto-info">
              <div className="boleto-tipo">{b.tipo}</div>
              <div className="boleto-periodo">{b.periodo} · Vence {new Date(b.vence).toLocaleDateString('es-UY',{day:'2-digit',month:'short'})}</div>
            </div>
            <div className="boleto-monto">${b.monto.toLocaleString('es-UY')}</div>
            <span className={`badge ${b.estado==='pagado'?'green':b.estado==='emitido'?'yellow':'gray'}`}>
              {b.estado==='pagado'?'Pagado ✓':b.estado==='emitido'?'Emitido':'Pendiente'}
            </span>
            {b.estado==='emitido' && (
              <button className="btn btn-success btn-sm" style={{marginLeft:8}}>
                <Icon name="check" size={12}/> Confirmar pago
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mis Movimientos (portal cliente) ─────────────────────────────────────────
function MisMovimientos() {
  const [nueva, setNueva] = useState({ descripcion:'', monto:'', tipo:'venta' });
  const colTipo = { venta:'green', compra:'red', gasto:'yellow' };
  return (
    <div className="page">
      <div className="page-header fi"><div><div className="page-heading">Mis Movimientos</div><div className="page-sub">Ventas, compras y gastos del mes</div></div></div>
      <div className="two-col">
        <div className="panel fi1">
          <div className="panel-header"><div className="panel-title">Marzo 2026</div></div>
          <table className="data-table">
            <thead><tr><th>Fecha</th><th>Descripción</th><th>Tipo</th><th>Monto</th></tr></thead>
            <tbody>{MOVIMIENTOS_CLIENTE.map((m,i)=>(
              <tr key={i}>
                <td>{m.fecha}</td>
                <td className="name-cell">{m.descripcion}</td>
                <td><span className={`badge ${colTipo[m.tipo]}`}>{m.tipo.charAt(0).toUpperCase()+m.tipo.slice(1)}</span></td>
                <td style={{color:m.tipo==='venta'?'var(--green)':'var(--red)',fontWeight:600}}>
                  {m.tipo==='venta'?'+':'−'}${m.monto.toLocaleString('es-UY')}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="panel fi2">
          <div className="panel-header"><div className="panel-title">Cargar venta</div></div>
          <div className="panel-body" style={{display:'flex',flexDirection:'column',gap:12}}>
            <div>
              <div className="form-label">Tipo</div>
              <div style={{display:'flex',gap:8}}>
                {['venta','compra','gasto'].map(t=>(
                  <button key={t} onClick={()=>setNueva(n=>({...n,tipo:t}))}
                    className={`btn btn-sm ${nueva.tipo===t?'btn-primary':'btn-ghost'}`}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="form-label">Descripción</div>
              <input className="form-input" placeholder="Factura #0044 — ..." value={nueva.descripcion} onChange={e=>setNueva(n=>({...n,descripcion:e.target.value}))}/>
            </div>
            <div>
              <div className="form-label">Monto (con IVA)</div>
              <input className="form-input" type="number" placeholder="0" value={nueva.monto} onChange={e=>setNueva(n=>({...n,monto:e.target.value}))}/>
            </div>
            <button className="btn btn-primary" style={{marginTop:4}}>
              <Icon name="upload" size={14}/> Cargar movimiento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Consultas (portal cliente) ────────────────────────────────────────────────
function Consultas() {
  const [msg, setMsg] = useState('');
  return (
    <div className="page">
      <div className="page-header fi"><div><div className="page-heading">Consultas</div><div className="page-sub">Mensajes con tu contador</div></div></div>
      <div className="panel fi1" style={{maxWidth:680}}>
        <div className="consulta-list">
          {CONSULTAS.map(c=>(
            <div key={c.id} className="consulta-item">
              <div className="consulta-meta">
                <span className="consulta-from">{c.de}</span>
                <span className="consulta-date">{c.fecha}</span>
              </div>
              <div className="consulta-text">{c.texto}</div>
              {c.respuesta && (
                <div className="consulta-respuesta">
                  <div style={{fontSize:10.5,fontWeight:600,color:'var(--accent2)',marginBottom:4}}>Lucas Martino respondió</div>
                  <p>{c.respuesta}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="consulta-input-wrap">
          <textarea className="consulta-input" rows={2} placeholder="Escribí tu consulta..." value={msg} onChange={e=>setMsg(e.target.value)}/>
          <button className="btn btn-primary btn-sm" disabled={!msg.trim()}>
            <Icon name="msg" size={13}/> Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email,   setEmail]   = useState('lucas@mkstudios.uy');
  const [pass,    setPass]    = useState('');
  const [role,    setRole]    = useState('contador');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(()=>{ setLoading(false); onLogin(role); }, 800);
  };

  return (
    <div className="login-wrap">
      <div className="login-card fi">
        <div className="login-logo-wrap"><Logo size={36}/><div><div className="logo-text">ContaApp</div><div className="logo-sub">MK Studios · Uruguay</div></div></div>
        <div className="login-title">Bienvenido de vuelta</div>
        <div className="login-sub">Ingresá a tu panel de gestión contable</div>
        <div className="role-switch">
          <button className={`role-btn ${role==='contador'?'active':''}`} onClick={()=>{ setRole('contador'); setEmail('lucas@mkstudios.uy'); }}>🏢 Contador</button>
          <button className={`role-btn ${role==='cliente'?'active':''}`}  onClick={()=>{ setRole('cliente');  setEmail('maria@fernandez.uy'); }}>👤 Portal Cliente</button>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input className="form-input" type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)}/>
        </div>
        <button className="login-btn" onClick={handleLogin} disabled={loading}>{loading?'Ingresando...':'Ingresar'}</button>
        <div className="login-footer">ContaApp v1.0 · {role==='cliente'?'Portal cliente — María Fernández':'Panel del contador'}</div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
const PAGES_CONTADOR = {
  dashboard:   { title:'Dashboard',       comp:Dashboard                              },
  clients:     { title:'Clientes',        comp:Clients                                },
  calendar:    { title:'Vencimientos',    comp:Calendar                               },
  payments:    { title:'Boletos de Pago', comp:()=><div className="coming-soon"><div style={{textAlign:'center'}}><div style={{fontSize:44,marginBottom:14}}>🚧</div><div className="page-heading">Boletos de Pago</div><div className="page-sub">En desarrollo</div></div></div> },
  fees:        { title:'Honorarios',      comp:()=><div className="coming-soon"><div style={{textAlign:'center'}}><div style={{fontSize:44,marginBottom:14}}>🚧</div><div className="page-heading">Honorarios</div><div className="page-sub">En desarrollo</div></div></div> },
  movements:   { title:'Movimientos',     comp:()=><div className="coming-soon"><div style={{textAlign:'center'}}><div style={{fontSize:44,marginBottom:14}}>🚧</div><div className="page-heading">Movimientos</div><div className="page-sub">En desarrollo</div></div></div> },
  credentials: { title:'Credenciales',   comp:()=><div className="coming-soon"><div style={{textAlign:'center'}}><div style={{fontSize:44,marginBottom:14}}>🚧</div><div className="page-heading">Credenciales</div><div className="page-sub">En desarrollo</div></div></div> },
};

const PAGES_CLIENTE = {
  portal:      { title:'Mi Panel',        comp:PortalCliente  },
  'mis-boletos':{ title:'Mis Impuestos',  comp:MisBoletos     },
  'mis-movs':  { title:'Mis Movimientos', comp:MisMovimientos },
  consultas:   { title:'Consultas',       comp:Consultas      },
};

export default function App() {
  const [loggedIn,    setLoggedIn]    = useState(false);
  const [role,        setRole]        = useState('contador');
  const [page,        setPage]        = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (r) => {
    setRole(r);
    setPage(r === 'cliente' ? 'portal' : 'dashboard');
    setLoggedIn(true);
  };

  const pages = role === 'cliente' ? PAGES_CLIENTE : PAGES_CONTADOR;
  const { title, comp: Page } = pages[page] || Object.values(pages)[0];

  if (!loggedIn) return <><style>{CSS}</style><Login onLogin={handleLogin}/></>;

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <Sidebar page={page} setPage={setPage} open={sidebarOpen} onClose={()=>setSidebarOpen(false)} role={role}/>
        <div className="main">
          <Topbar title={title} onMenu={()=>setSidebarOpen(true)} role={role}/>
          <Page/>
        </div>
      </div>
    </>
  );
}
