// ── Config ───────────────────────────────────────────────────────────────────
const ADMIN_CODE = "cousi2027";
const VISITOR_CODE = "famille2027";
const DOC_ID = "cousinade2027";

// ── Default data ──────────────────────────────────────────────────────────────
const DEFAULT_DATA = {
  edition: "Cousinade 2027",
  date: "2027-05-08",
  lieu: "Salle à louer",
  tasks: [
    { id:1, label:"Constituer le comité orga", done:false, deadline:"2026-06-30", categorie:"Organisation" },
    { id:2, label:"Lister tous les cousins + contacts", done:false, deadline:"2026-06-30", categorie:"Organisation" },
    { id:3, label:"Réserver la salle", done:false, deadline:"2026-08-31", categorie:"Logistique" },
    { id:4, label:"Envoyer le save the date", done:false, deadline:"2026-08-31", categorie:"Communication" },
    { id:5, label:"Ouvrir le groupe de discussion familial", done:false, deadline:"2026-09-30", categorie:"Communication" },
    { id:6, label:"Envoyer les invitations officielles", done:false, deadline:"2026-10-31", categorie:"Communication" },
    { id:7, label:"Décider de la formule restauration", done:false, deadline:"2026-10-31", categorie:"Logistique" },
    { id:8, label:"Clôturer les inscriptions", done:false, deadline:"2026-12-31", categorie:"Organisation" },
    { id:9, label:"Préparer quiz & animations", done:false, deadline:"2027-03-31", categorie:"Animations" },
    { id:10, label:"Confirmer tous les prestataires", done:false, deadline:"2027-04-30", categorie:"Logistique" },
  ],
  participants: [
    { id:1, nom:"Marie Dupont", email:"marie@example.com", personnes:2, hebergement:"Oui", regime:"Végétarien", confirme:true },
    { id:2, nom:"Paul Martin", email:"paul@example.com", personnes:4, hebergement:"Non", regime:"Aucun", confirme:true },
  ],
  budget: [
    { id:1, label:"Location salle", prevu:400, reel:0, categorie:"Lieu" },
    { id:2, label:"Repas / traiteur", prevu:600, reel:0, categorie:"Restauration" },
    { id:3, label:"Boissons", prevu:150, reel:0, categorie:"Restauration" },
    { id:4, label:"Animations & jeux", prevu:80, reel:0, categorie:"Animations" },
    { id:5, label:"Décoration", prevu:50, reel:0, categorie:"Déco" },
    { id:6, label:"Photos / souvenirs", prevu:30, reel:0, categorie:"Souvenirs" },
  ],
  programme: [
    { id:1, jour:"Samedi 8 mai", heure:"10:00", activite:"Accueil des familles", icone:"👋" },
    { id:2, jour:"Samedi 8 mai", heure:"11:00", activite:"Apéritif & retrouvailles", icone:"🥂" },
    { id:3, jour:"Samedi 8 mai", heure:"12:30", activite:"Déjeuner commun", icone:"🍽️" },
    { id:4, jour:"Samedi 8 mai", heure:"14:30", activite:"Arbre généalogique & photos", icone:"🌳" },
    { id:5, jour:"Samedi 8 mai", heure:"15:30", activite:"Activités & jeux pour tous", icone:"🎮" },
    { id:6, jour:"Samedi 8 mai", heure:"17:00", activite:"Goûter & quiz famille", icone:"🎯" },
    { id:7, jour:"Samedi 8 mai", heure:"19:00", activite:"Apéritif dînatoire", icone:"🌅" },
    { id:8, jour:"Dimanche 9 mai", heure:"09:00", activite:"Brunch du dimanche", icone:"☀️" },
    { id:9, jour:"Dimanche 9 mai", heure:"11:00", activite:"Activité libre / balade", icone:"🚶" },
    { id:10, jour:"Dimanche 9 mai", heure:"12:30", activite:"Déjeuner & clôture", icone:"🎉" },
  ],
  annonces: [
    { id:1, titre:"Bienvenue sur l'espace Cousinade 2027 !", contenu:"Retrouvez ici toutes les infos sur notre prochaine réunion de famille.\n\nN'hésitez pas à confirmer votre présence auprès des organisateurs.", date:"2026-06-01", auteur:"Les organisateurs" },
  ],
};

const CAT_COLORS = {
  Organisation:"#e07b54", Logistique:"#5b8dd9", Communication:"#6abf69",
  Animations:"#c97dd4", Lieu:"#5b8dd9", Restauration:"#e07b54",
  Déco:"#c97dd4", Souvenirs:"#6abf69", Autre:"#999"
};

// ── State ─────────────────────────────────────────────────────────────────────
let state = {
  role: null,       // null | 'admin' | 'visitor'
  tab: "annonces",
  data: JSON.parse(JSON.stringify(DEFAULT_DATA)),
  db: null,
  unsubscribe: null,
  syncing: false,
  fbReady: false,
  fbConfigured: false,
};

// ── Firebase ──────────────────────────────────────────────────────────────────
function loadFirebaseConfig() {
  try {
    const raw = localStorage.getItem("fb_config");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function initFirebase(config) {
  const { initializeApp, getFirestore, doc, onSnapshot, setDoc } = window._firebaseModules;
  try {
    const app = initializeApp(config);
    state.db = getFirestore(app);
    state.fbConfigured = true;
    localStorage.setItem("fb_config", JSON.stringify(config));

    // Real-time listener
    const ref = doc(state.db, "cousinade", DOC_ID);
    state.unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        state.data = snap.data();
        if (state.role) renderApp();
      }
    }, () => {});

    return true;
  } catch (e) {
    console.error("Firebase init error", e);
    return false;
  }
}

async function saveToFirebase() {
  if (!state.db) return;
  const { doc, setDoc } = window._firebaseModules;
  state.syncing = true;
  updateSyncDot();
  try {
    await setDoc(doc(state.db, "cousinade", DOC_ID), state.data);
    state.syncing = false;
    updateSyncDot();
  } catch (e) {
    state.syncing = false;
    updateSyncDot();
    showToast("Erreur de synchronisation", "error");
  }
}

function updateSyncDot() {
  const dot = document.querySelector(".sync-dot");
  if (!dot) return;
  dot.className = "sync-dot" + (state.syncing ? " syncing" : "");
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return Date.now() + Math.floor(Math.random() * 1000); }

function fmtDate(str) {
  if (!str) return "";
  try {
    return new Date(str).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });
  } catch { return str; }
}

function fmtDateLong(str) {
  if (!str) return "";
  try {
    return new Date(str).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  } catch { return str; }
}

let toastTimer;
function showToast(msg, type="success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = (type==="error"?"❌ ":"✅ ") + msg;
  t.className = "toast show" + (type==="error"?" error":"");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = "toast"; }, 3000);
}

function isAdmin() { return state.role === "admin"; }

function update(key, val) {
  state.data[key] = val;
  saveToFirebase();
  renderApp();
}

// ── PDF Export ────────────────────────────────────────────────────────────────
function exportPDF() {
  const d = state.data;
  const totalPrevu = d.budget.reduce((s,b)=>s+Number(b.prevu),0);
  const totalParticipants = d.participants.reduce((s,p)=>s+Number(p.personnes),0);
  const jours = [...new Set(d.programme.map(p=>p.jour))];
  const w = window.open("","_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${d.edition}</title>
  <style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#3a2010;padding:0 20px}
  h1{font-size:30px;color:#c96a30;border-bottom:3px solid #f0d8b8;padding-bottom:12px;margin-bottom:8px}
  h2{font-size:18px;color:#c96a30;margin-top:28px;margin-bottom:12px}
  h3{font-size:15px;color:#8a6a4a;margin:16px 0 8px}
  .meta{color:#8a6a4a;font-size:14px;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f5ece0;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
  td{padding:8px 10px;border-bottom:1px solid #f5ece0}
  .tl{display:flex;gap:12px;margin-bottom:8px;font-size:14px}
  .tl-h{color:#c96a30;font-weight:bold;min-width:55px}
  .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:bold}
  .ok{background:#e8f5e9;color:#2e7d32}.wait{background:#fff3e0;color:#e65100}
  .footer{margin-top:40px;color:#b09070;font-size:11px;text-align:center;border-top:1px solid #f0d8b8;padding-top:14px}
  @media print{.no-print{display:none}}</style></head><body>
  <button class="no-print" onclick="window.print()" style="background:#c96a30;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;margin-bottom:20px;">🖨️ Imprimer / PDF</button>
  <h1>🌻 ${d.edition}</h1>
  <div class="meta">📅 ${fmtDateLong(d.date)} &nbsp;·&nbsp; 📍 ${d.lieu} &nbsp;·&nbsp; 👥 ${totalParticipants} personnes</div>
  <h2>Programme</h2>
  ${jours.map(j=>`<h3>${j}</h3>${d.programme.filter(p=>p.jour===j).map(p=>`<div class="tl"><span class="tl-h">${p.heure}</span><span>${p.icone} ${p.activite}</span></div>`).join("")}`).join("")}
  <h2>Participants</h2>
  <table><tr><th>Famille</th><th>Email</th><th>Nb</th><th>Héberg.</th><th>Régime</th><th>Statut</th></tr>
  ${d.participants.map(p=>`<tr><td><b>${p.nom}</b></td><td style="color:#888;font-size:12px">${p.email||"—"}</td><td>${p.personnes}</td><td>${p.hebergement}</td><td>${p.regime}</td><td><span class="badge ${p.confirme?"ok":"wait"}">${p.confirme?"✓ Confirmé":"En attente"}</span></td></tr>`).join("")}
  </table>
  <h2>Budget</h2>
  <table><tr><th>Poste</th><th>Catégorie</th><th>Prévu</th><th>Réel</th></tr>
  ${d.budget.map(b=>`<tr><td>${b.label}</td><td>${b.categorie}</td><td>${b.prevu}€</td><td>${b.reel>0?b.reel+"€":"—"}</td></tr>`).join("")}
  <tr style="background:#f5ece0;font-weight:bold"><td colspan="2">TOTAL</td><td>${totalPrevu}€</td><td>${d.budget.reduce((s,b)=>s+Number(b.reel),0)}€</td></tr></table>
  <div class="footer">Généré le ${new Date().toLocaleDateString("fr-FR")} · ${d.edition}</div>
  </body></html>`);
  w.document.close();
}

// ── Backup ────────────────────────────────────────────────────────────────────
function exportBackup() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type:"application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `cousinade-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  showToast("Backup exporté !");
}

function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      state.data = d;
      saveToFirebase();
      renderApp();
      showToast("Données restaurées !");
    } catch { showToast("Fichier invalide", "error"); }
  };
  r.readAsText(file);
  e.target.value = "";
}

// ── Render helpers ────────────────────────────────────────────────────────────
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function inp(type, placeholder, value, cls="inp") {
  const i = document.createElement("input");
  i.type = type||"text"; i.placeholder = placeholder||""; i.value = value||""; i.className = cls;
  return i;
}

function sel(opts, value, cls="inp") {
  const s = document.createElement("select");
  s.className = cls;
  opts.forEach(o => {
    const opt = document.createElement("option");
    opt.value = o; opt.textContent = o; if (o===value) opt.selected = true;
    s.appendChild(opt);
  });
  return s;
}

// ── Setup Screen (Firebase config) ───────────────────────────────────────────
function renderSetup() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  const wrap = el("div","setup-screen");
  const card = el("div","setup-card");
  card.innerHTML = `
    <h2>⚙️ Configuration Firebase</h2>
    <p>Pour synchroniser les données entre tous les appareils, cette app utilise <strong>Firebase Firestore</strong> (gratuit).</p>
    <ol>
      <li>Va sur <a href="https://console.firebase.google.com" target="_blank" style="color:#c96a30">console.firebase.google.com</a></li>
      <li>Crée un projet (ex: <code>cousinade2027</code>)</li>
      <li>Ajoute une app Web → copie l'objet <code>firebaseConfig</code></li>
      <li>Active <strong>Firestore Database</strong> en mode test</li>
      <li>Colle le JSON de config ci-dessous :</li>
    </ol>
    <textarea class="inp" id="fb-config-input" placeholder='{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}'></textarea>
    <button class="btn-primary" id="fb-save-btn">Connecter Firebase →</button>
    <p style="margin-top:16px;font-size:12px;color:#b09070">Sans Firebase, l'app fonctionne en mode local (données non partagées entre appareils).</p>
    <button id="fb-skip-btn" style="background:none;border:none;color:#b09070;font-size:13px;text-decoration:underline;margin-top:8px;cursor:pointer">Continuer sans Firebase (local uniquement)</button>
  `;
  wrap.appendChild(card);
  app.appendChild(wrap);

  document.getElementById("fb-save-btn").onclick = () => {
    const raw = document.getElementById("fb-config-input").value.trim();
    try {
      const config = JSON.parse(raw);
      const ok = initFirebase(config);
      if (ok) { renderLogin(); showToast("Firebase connecté !"); }
      else showToast("Config invalide", "error");
    } catch { showToast("JSON invalide", "error"); }
  };

  document.getElementById("fb-skip-btn").onclick = () => {
    state.fbConfigured = false;
    renderLogin();
  };
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function renderLogin() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  const d = state.data;
  const wrap = el("div","","");
  wrap.id = "login-screen";

  const dateStr = d.date ? fmtDateLong(d.date) : "";
  const syncStatus = state.fbConfigured
    ? `<span class="sync-dot"></span> Synchronisation cloud active`
    : `⚠️ Mode local — données non partagées`;

  wrap.innerHTML = `
    <div class="login-card fade-up">
      <div class="login-icon">🌻</div>
      <h1 class="login-title">${d.edition}</h1>
      <p class="login-sub">${dateStr}${d.lieu ? " · " + d.lieu : ""}</p>
      <div class="login-box">
        <p class="login-hint">Entrez votre code d'accès</p>
        <input type="password" class="login-input" id="code-input" placeholder="••••••••" autocomplete="off" />
        <div class="login-error" id="login-error"></div>
      </div>
      <button class="login-btn" id="login-btn">Accéder →</button>
      <div class="login-codes">
        <div>Code <strong>admin</strong> : pour les organisateurs</div>
        <div>Code <strong>famille</strong> : pour tous les participants</div>
        <div style="margin-top:10px;font-size:11px">${syncStatus}</div>
      </div>
    </div>
  `;
  app.appendChild(wrap);

  const go = () => {
    const code = document.getElementById("code-input").value.trim();
    if (code === ADMIN_CODE) { state.role = "admin"; state.tab = "annonces"; renderApp(); }
    else if (code === VISITOR_CODE) { state.role = "visitor"; state.tab = "annonces"; renderApp(); }
    else document.getElementById("login-error").textContent = "Code incorrect. Demandez-le aux organisateurs.";
  };

  document.getElementById("login-btn").onclick = go;
  document.getElementById("code-input").addEventListener("keydown", e => { if (e.key==="Enter") go(); });
  setTimeout(() => document.getElementById("code-input")?.focus(), 300);
}

// ── Main App ──────────────────────────────────────────────────────────────────
const ADMIN_TABS = [
  { id:"annonces", label:"Annonces", icon:"📣" },
  { id:"programme", label:"Programme", icon:"📅" },
  { id:"participants", label:"Participants", icon:"👥" },
  { id:"retro", label:"Planning", icon:"✅" },
  { id:"budget", label:"Budget", icon:"💰" },
  { id:"parametres", label:"Réglages", icon:"⚙️" },
];
const VISITOR_TABS = [
  { id:"annonces", label:"Annonces", icon:"📣" },
  { id:"programme", label:"Programme", icon:"📅" },
  { id:"participants", label:"Participants", icon:"👥" },
];

function renderApp() {
  const app = document.getElementById("app");
  const tabs = isAdmin() ? ADMIN_TABS : VISITOR_TABS;
  const d = state.data;
  const totalP = d.participants.reduce((s,p)=>s+Number(p.personnes),0);
  const confirmes = d.participants.filter(p=>p.confirme).length;
  const totalPrevu = d.budget.reduce((s,b)=>s+Number(b.prevu),0);
  const doneT = d.tasks.filter(t=>t.done).length;
  const pct = d.tasks.length ? Math.round(doneT/d.tasks.length*100) : 0;
  const dateStr = d.date ? new Date(d.date).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}) : "";

  app.innerHTML = `
    <div id="main-app" class="visible">
      <!-- Header -->
      <div class="app-header">
        <div class="header-top">
          <div class="header-brand">
            <span class="header-emoji">🌻</span>
            <div>
              <div class="header-title">${d.edition}</div>
              <div class="header-sub">${dateStr}${d.lieu?" · "+d.lieu:""}</div>
            </div>
          </div>
          <div class="header-actions">
            <div class="header-stats">
              ${isAdmin()?`<div class="stat"><div class="stat-val">${doneT}/${d.tasks.length}</div><div class="stat-lbl">Tâches</div></div>`:""}
              <div class="stat"><div class="stat-val">${confirmes}/${d.participants.length}</div><div class="stat-lbl">Familles</div></div>
              <div class="stat"><div class="stat-val">${totalP}</div><div class="stat-lbl">Personnes</div></div>
              ${isAdmin()?`<div class="stat"><div class="stat-val">${totalPrevu}€</div><div class="stat-lbl">Budget</div></div>`:""}
            </div>
            <div class="role-badge">${isAdmin()?"👑 Admin":"👁 Famille"}</div>
            <button class="logout-btn" id="logout-btn">⬅</button>
          </div>
        </div>
        ${isAdmin()?`<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div><div class="progress-lbl"><span class="sync-dot${state.syncing?" syncing":""}"></span> ${pct}% des tâches · sync auto</div>`:""}
      </div>

      <!-- Desktop tabs -->
      <div class="tabs">
        ${tabs.map(t=>`<button class="tab-btn${state.tab===t.id?" active":""}" data-tab="${t.id}">${t.icon} ${t.label}</button>`).join("")}
      </div>

      <!-- Content -->
      <div class="content" id="content"></div>

      <!-- Mobile bottom nav -->
      <nav class="bottom-nav">
        <div class="bottom-nav-inner">
          ${tabs.map(t=>`<button class="bottom-nav-btn${state.tab===t.id?" active":""}" data-tab="${t.id}"><span class="nav-icon">${t.icon}</span>${t.label}</button>`).join("")}
        </div>
      </nav>
    </div>
    <div class="toast" id="toast"></div>
  `;

  // Tab click handlers
  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.onclick = () => { state.tab = btn.dataset.tab; renderApp(); };
  });

  document.getElementById("logout-btn").onclick = () => { state.role = null; renderLogin(); };

  // Render active tab
  renderTab();
}

function renderTab() {
  const content = document.getElementById("content");
  if (!content) return;
  content.innerHTML = "";
  content.classList.add("fade-up");

  switch(state.tab) {
    case "annonces": renderAnnonces(content); break;
    case "programme": renderProgramme(content); break;
    case "participants": renderParticipants(content); break;
    case "retro": renderRetro(content); break;
    case "budget": renderBudget(content); break;
    case "parametres": renderParametres(content); break;
  }
}

// ── Tab: Annonces ─────────────────────────────────────────────────────────────
function renderAnnonces(c) {
  const d = state.data;
  const header = el("div","section-header");
  const title = el("h2","section-title","📣 Annonces");
  header.appendChild(title);

  if (isAdmin()) {
    const btn = el("button","btn-primary","+ Nouvelle annonce");
    header.appendChild(btn);
    btn.onclick = () => {
      const existing = document.getElementById("annonce-form");
      if (existing) { existing.remove(); return; }
      const form = makeAnnonceForm();
      header.after(form);
    };
  }
  c.appendChild(header);

  if (!d.annonces?.length) { c.appendChild(el("div","empty","Aucune annonce pour l'instant.")); return; }

  (d.annonces||[]).forEach(a => {
    const card = el("div","annonce-card");
    card.innerHTML = `
      <div class="annonce-header">
        <div class="annonce-title">${a.titre}</div>
        ${isAdmin()?`<button class="del-btn" data-id="${a.id}">✕</button>`:""}
      </div>
      <div class="annonce-body">${a.contenu}</div>
      <div class="annonce-meta">✍️ ${a.auteur} · ${fmtDate(a.date)}</div>
    `;
    if (isAdmin()) {
      card.querySelector(".del-btn").onclick = () => {
        update("annonces", d.annonces.filter(x=>x.id!==a.id));
      };
    }
    c.appendChild(card);
  });
}

function makeAnnonceForm() {
  const form = el("div","add-form"); form.id="annonce-form";
  const titre = inp("text","Titre de l'annonce","");
  const contenu = document.createElement("textarea");
  contenu.className="inp"; contenu.placeholder="Contenu du message…"; contenu.style.minHeight="80px"; contenu.style.resize="vertical";
  const auteur = inp("text","Auteur","Les organisateurs");
  const actions = el("div","add-form-actions");
  const save = el("button","btn-save","Publier"); save.type="button";
  const cancel = el("button","btn-cancel","Annuler"); cancel.type="button";
  actions.append(save, cancel);
  form.append(titre, contenu, auteur, actions);

  save.onclick = () => {
    if (!titre.value.trim() || !contenu.value.trim()) return showToast("Remplissez titre et contenu","error");
    const a = { id:uid(), titre:titre.value.trim(), contenu:contenu.value.trim(), auteur:auteur.value.trim()||"Les organisateurs", date:new Date().toISOString().slice(0,10) };
    update("annonces", [a, ...(state.data.annonces||[])]);
    showToast("Annonce publiée !");
  };
  cancel.onclick = () => form.remove();
  return form;
}

// ── Tab: Programme ────────────────────────────────────────────────────────────
function renderProgramme(c) {
  const d = state.data;
  const header = el("div","section-header");
  header.style.flexWrap="wrap";
  const title = el("h2","section-title","📅 Programme");
  header.appendChild(title);
  const btns = el("div",""); btns.style.display="flex"; btns.style.gap="8px";
  const pdfBtn = el("button","btn-primary btn-blue","🖨️ PDF");
  pdfBtn.onclick = exportPDF;
  btns.appendChild(pdfBtn);
  if (isAdmin()) {
    const addBtn = el("button","btn-primary","+ Ajouter");
    addBtn.onclick = () => {
      const ex = document.getElementById("prog-form");
      if (ex) { ex.remove(); return; }
      const form = makeProgrammeForm();
      header.after(form);
    };
    btns.appendChild(addBtn);
  }
  header.appendChild(btns);
  c.appendChild(header);

  const jours = [...new Set(d.programme.map(p=>p.jour))];
  jours.forEach(jour => {
    const items = d.programme.filter(p=>p.jour===jour);
    const jtitle = el("div","jour-title",jour);
    c.appendChild(jtitle);
    const tl = el("div","timeline");
    items.forEach((p,i) => {
      const item = el("div","tl-item");
      const left = el("div","tl-left");
      left.innerHTML = `<div class="tl-time">${p.heure}</div>${i<items.length-1?'<div class="tl-line"></div>':""}`;
      const card = el("div","tl-card");
      card.innerHTML = `<span class="tl-icon">${p.icone}</span><span class="tl-label">${p.activite}</span>`;
      if (isAdmin()) {
        const del = el("button","del-btn","✕");
        del.onclick = () => update("programme", d.programme.filter(x=>x.id!==p.id));
        card.appendChild(del);
      }
      item.append(left, card);
      tl.appendChild(item);
    });
    c.appendChild(tl);
  });
}

function makeProgrammeForm() {
  const form = el("div","add-form"); form.id="prog-form";
  const row = el("div","add-form-row");
  const jourSel = sel(["Samedi 8 mai","Dimanche 9 mai"],"Samedi 8 mai","inp inp-md");
  const heureInp = inp("time","","10:00","inp inp-sm");
  const activiteInp = inp("text","Activité","");
  const iconeInp = inp("text","Emoji","🎉","inp inp-sm");
  iconeInp.style.minWidth="60px";
  row.append(jourSel, heureInp, activiteInp, iconeInp);
  const actions = el("div","add-form-actions");
  const save = el("button","btn-save","Ajouter"); save.type="button";
  const cancel = el("button","btn-cancel","Annuler"); cancel.type="button";
  actions.append(save, cancel);
  form.append(row, actions);

  save.onclick = () => {
    if (!activiteInp.value.trim()) return showToast("Saisissez une activité","error");
    const item = { id:uid(), jour:jourSel.value, heure:heureInp.value, activite:activiteInp.value.trim(), icone:iconeInp.value||"🎉" };
    const sorted = [...state.data.programme, item].sort((a,b)=>a.jour.localeCompare(b.jour)||a.heure.localeCompare(b.heure));
    update("programme", sorted);
    form.remove();
    showToast("Ajouté au programme !");
  };
  cancel.onclick = () => form.remove();
  return form;
}

// ── Tab: Participants ─────────────────────────────────────────────────────────
function renderParticipants(c) {
  const d = state.data;
  const total = d.participants.reduce((s,p)=>s+Number(p.personnes),0);
  const header = el("div","section-header");
  const title = el("h2","section-title",`👥 Participants — ${total} pers.`);
  header.appendChild(title);
  if (isAdmin()) {
    const btn = el("button","btn-primary","+ Ajouter");
    btn.onclick = () => {
      const ex = document.getElementById("part-form");
      if (ex) { ex.remove(); return; }
      header.after(makeParticipantForm());
    };
    header.appendChild(btn);
  }
  c.appendChild(header);

  d.participants.forEach(p => {
    const card = el("div","participant-card");
    card.style.borderTop = `3px solid ${p.confirme?"#6abf69":"#e0c080"}`;
    const top = el("div","participant-top");
    const info = el("div","");
    info.innerHTML = `<div class="participant-name">${p.nom}</div>${p.email?`<div class="participant-email">✉️ ${p.email}</div>`:""}`;
    const right = el("div",""); right.style.display="flex"; right.style.gap="6px"; right.style.alignItems="center";

    if (isAdmin()) {
      const badge = el("button","status-badge "+(p.confirme?"status-ok":"status-wait"), p.confirme?"✓ Confirmé":"En attente");
      badge.onclick = () => update("participants", d.participants.map(x=>x.id===p.id?{...x,confirme:!x.confirme}:x));
      right.appendChild(badge);
      const del = el("button","del-btn","✕");
      del.onclick = () => update("participants", d.participants.filter(x=>x.id!==p.id));
      right.appendChild(del);
    } else {
      right.innerHTML = `<span class="status-badge ${p.confirme?"status-ok":"status-wait"}">${p.confirme?"✓ Confirmé":"En attente"}</span>`;
    }
    top.append(info, right);
    const meta = el("div","participant-meta");
    meta.innerHTML = `<span class="participant-tag">👥 ${p.personnes} pers.</span><span class="participant-tag">🏠 ${p.hebergement}</span>${p.regime&&p.regime!=="Aucun"?`<span class="participant-tag">🥗 ${p.regime}</span>`:""}`;
    card.append(top, meta);
    c.appendChild(card);
  });

  const summary = el("div","summary-box");
  summary.innerHTML = `
    <span class="summary-item"><strong>${total}</strong> personnes</span>
    <span class="summary-item"><strong>${d.participants.filter(p=>p.confirme).length}/${d.participants.length}</strong> confirmées</span>
    <span class="summary-item"><strong>${d.participants.filter(p=>p.hebergement==="Oui").length}</strong> hébergements</span>
    <span class="summary-item"><strong>${d.participants.filter(p=>p.regime&&p.regime!=="Aucun").length}</strong> régimes spéciaux</span>
  `;
  c.appendChild(summary);
}

function makeParticipantForm() {
  const form = el("div","add-form"); form.id="part-form";
  const row1 = el("div","add-form-row");
  const nom = inp("text","Nom de famille","");
  const email = inp("email","Email","");
  row1.append(nom, email);
  const row2 = el("div","add-form-row");
  const nbInp = inp("number","Nb","1","inp inp-sm"); nbInp.min="1";
  const heberg = sel(["Non","Oui","À prévoir"],"Non","inp inp-sm");
  const regime = inp("text","Régime alimentaire","");
  const confirmLbl = el("label","");
  confirmLbl.style.cssText="font-size:13px;color:#8a6a4a;display:flex;align-items:center;gap:6px;white-space:nowrap";
  const confirmCb = document.createElement("input"); confirmCb.type="checkbox";
  confirmLbl.append(confirmCb," Confirmé");
  row2.append(nbInp, heberg, regime, confirmLbl);
  const actions = el("div","add-form-actions");
  const save = el("button","btn-save","Ajouter"); save.type="button";
  const cancel = el("button","btn-cancel","Annuler"); cancel.type="button";
  actions.append(save, cancel);
  form.append(row1, row2, actions);

  save.onclick = () => {
    if (!nom.value.trim()) return showToast("Saisissez un nom","error");
    const p = { id:uid(), nom:nom.value.trim(), email:email.value.trim(), personnes:parseInt(nbInp.value)||1, hebergement:heberg.value, regime:regime.value.trim()||"Aucun", confirme:confirmCb.checked };
    update("participants", [...state.data.participants, p]);
    form.remove();
    showToast("Participant ajouté !");
  };
  cancel.onclick = () => form.remove();
  return form;
}

// ── Tab: Rétroplanning ────────────────────────────────────────────────────────
function renderRetro(c) {
  if (!isAdmin()) return;
  const d = state.data;
  const header = el("div","section-header");
  const title = el("h2","section-title","✅ Rétroplanning");
  const btn = el("button","btn-primary","+ Ajouter");
  btn.onclick = () => {
    const ex = document.getElementById("task-form");
    if (ex) { ex.remove(); return; }
    header.after(makeTaskForm());
  };
  header.append(title, btn);
  c.appendChild(header);

  const cats = ["Organisation","Logistique","Communication","Animations"];
  cats.forEach(cat => {
    const tasks = d.tasks.filter(t=>t.categorie===cat);
    if (!tasks.length) return;
    const col = CAT_COLORS[cat]||"#999";
    const catLbl = el("div","cat-label",cat);
    catLbl.style.cssText=`background:${col}22;color:${col};border-left:3px solid ${col}`;
    c.appendChild(catLbl);
    tasks.forEach(t => {
      const row = el("div","task-row"+(t.done?" done":""));
      const cb = document.createElement("input"); cb.type="checkbox"; cb.checked=t.done; cb.className="task-check";
      cb.onchange = () => update("tasks", d.tasks.map(x=>x.id===t.id?{...x,done:!x.done}:x));
      const lbl = el("div","");
      lbl.innerHTML = `<div class="task-label${t.done?" done":""}">${t.label}</div>${t.deadline?`<div class="task-deadline">📅 ${fmtDate(t.deadline)}</div>`:""}`;
      const del = el("button","del-btn","✕");
      del.onclick = () => update("tasks", d.tasks.filter(x=>x.id!==t.id));
      row.append(cb, lbl, del);
      c.appendChild(row);
    });
  });
}

function makeTaskForm() {
  const form = el("div","add-form"); form.id="task-form";
  const row = el("div","add-form-row");
  const label = inp("text","Intitulé de la tâche","");
  const deadline = inp("date","","","inp inp-md");
  const catSel = sel(["Organisation","Logistique","Communication","Animations"],"Organisation","inp inp-md");
  row.append(label, deadline, catSel);
  const actions = el("div","add-form-actions");
  const save = el("button","btn-save","Ajouter"); save.type="button";
  const cancel = el("button","btn-cancel","Annuler"); cancel.type="button";
  actions.append(save, cancel);
  form.append(row, actions);

  save.onclick = () => {
    if (!label.value.trim()) return showToast("Saisissez un intitulé","error");
    const t = { id:uid(), label:label.value.trim(), deadline:deadline.value, categorie:catSel.value, done:false };
    update("tasks", [...state.data.tasks, t]);
    form.remove();
    showToast("Tâche ajoutée !");
  };
  cancel.onclick = () => form.remove();
  return form;
}

// ── Tab: Budget ───────────────────────────────────────────────────────────────
function renderBudget(c) {
  if (!isAdmin()) return;
  const d = state.data;
  const totalPrevu = d.budget.reduce((s,b)=>s+Number(b.prevu),0);
  const totalReel = d.budget.reduce((s,b)=>s+Number(b.reel),0);
  const totalP = d.participants.reduce((s,p)=>s+Number(p.personnes),0);

  const header = el("div","section-header");
  const title = el("h2","section-title","💰 Budget");
  const btn = el("button","btn-primary","+ Ajouter");
  btn.onclick = () => {
    const ex = document.getElementById("budget-form");
    if (ex) { ex.remove(); return; }
    header.after(makeBudgetForm());
  };
  header.append(title, btn);
  c.appendChild(header);

  d.budget.forEach(b => {
    const pct = b.prevu ? Math.min(100,Math.round(b.reel/b.prevu*100)) : 0;
    const over = b.reel > b.prevu && b.prevu > 0;
    const col = CAT_COLORS[b.categorie]||"#999";
    const card = el("div","budget-card");

    const top = el("div","budget-top");
    const nameWrap = el("div","");
    const nameLbl = el("div","budget-name",b.label);
    const catTag = el("div","cat-label",b.categorie);
    catTag.style.cssText=`background:${col}22;color:${col};border-left:2px solid ${col};margin-top:4px`;
    nameWrap.append(nameLbl, catTag);
    const del = el("button","del-btn","✕");
    del.onclick = () => update("budget", d.budget.filter(x=>x.id!==b.id));
    top.append(nameWrap, del);

    const amounts = el("div","budget-amounts");
    const prevuBlock = el("div","amount-block");
    prevuBlock.innerHTML = `<label>Prévu</label><div class="amount-val">${b.prevu}€</div>`;
    const reelBlock = el("div","amount-block");
    const reelInp = inp("number","0",b.reel,"inp amount-inp");
    reelInp.style.color = over?"#c05020":"#3a6a3a";
    reelInp.onchange = () => {
      update("budget", d.budget.map(x=>x.id===b.id?{...x,reel:parseFloat(reelInp.value)||0}:x));
    };
    reelBlock.innerHTML = `<label>Réel</label>`;
    reelBlock.appendChild(reelInp);
    amounts.append(prevuBlock, reelBlock);

    const barBg = el("div","bar-bg");
    const barFill = el("div","bar-fill");
    barFill.style.cssText=`width:${pct}%;background:${over?"#c05020":"#6abf69"}`;
    barBg.appendChild(barFill);

    const barLbl = el("div","bar-lbl",over?`⚠ +${b.reel-b.prevu}€ dépassement`:`${pct}% utilisé`);
    barLbl.style.color = over?"#c05020":"#8a6a4a";

    card.append(top, amounts, barBg, barLbl);
    c.appendChild(card);
  });

  const summary = el("div","summary-box");
  summary.innerHTML = `
    <span class="summary-item">Total prévu : <strong>${totalPrevu}€</strong></span>
    <span class="summary-item">Total réel : <strong style="color:${totalReel>totalPrevu?"#c05020":"#3a6a3a"}">${totalReel}€</strong></span>
    ${totalP>0?`<span class="summary-item">Par personne : <strong>${Math.round(totalPrevu/totalP)}€</strong></span>`:""}
  `;
  c.appendChild(summary);
}

function makeBudgetForm() {
  const form = el("div","add-form"); form.id="budget-form";
  const row = el("div","add-form-row");
  const label = inp("text","Intitulé","");
  const prevu = inp("number","Prévu €","0","inp inp-sm");
  const catSel = sel(["Lieu","Restauration","Animations","Déco","Souvenirs","Autre"],"Lieu","inp inp-md");
  row.append(label, prevu, catSel);
  const actions = el("div","add-form-actions");
  const save = el("button","btn-save","Ajouter"); save.type="button";
  const cancel = el("button","btn-cancel","Annuler"); cancel.type="button";
  actions.append(save, cancel);
  form.append(row, actions);

  save.onclick = () => {
    if (!label.value.trim()) return showToast("Saisissez un intitulé","error");
    const b = { id:uid(), label:label.value.trim(), prevu:parseFloat(prevu.value)||0, reel:0, categorie:catSel.value };
    update("budget", [...state.data.budget, b]);
    form.remove();
    showToast("Poste ajouté !");
  };
  cancel.onclick = () => form.remove();
  return form;
}

// ── Tab: Paramètres ───────────────────────────────────────────────────────────
function renderParametres(c) {
  if (!isAdmin()) return;
  const d = state.data;

  // Edition info
  const s1 = el("div","params-section");
  s1.innerHTML = `<div class="params-title">📋 Informations de l'édition</div>`;
  const f1 = el("div","params-field"); f1.innerHTML=`<label>Nom de l'édition</label>`;
  const edInp = inp("text","Nom","","inp"); edInp.value=d.edition||"";
  f1.appendChild(edInp);
  const f2 = el("div","params-field"); f2.innerHTML=`<label>Date</label>`;
  const dtInp = inp("date","","","inp inp-md"); dtInp.value=d.date||"";
  f2.appendChild(dtInp);
  const f3 = el("div","params-field"); f3.innerHTML=`<label>Lieu</label>`;
  const lieuInp = inp("text","Lieu","","inp"); lieuInp.value=d.lieu||"";
  f3.appendChild(lieuInp);
  const saveParamsBtn = el("button","btn-primary","Sauvegarder");
  saveParamsBtn.style.marginTop="8px";
  saveParamsBtn.onclick = () => {
    update("edition", edInp.value.trim());
    state.data.date = dtInp.value;
    state.data.lieu = lieuInp.value.trim();
    saveToFirebase();
    renderApp();
    showToast("Paramètres sauvegardés !");
  };
  s1.append(f1,f2,f3,saveParamsBtn);
  c.appendChild(s1);

  // Codes d'accès
  const s2 = el("div","params-section");
  s2.innerHTML = `
    <div class="params-title">🔐 Codes d'accès à partager</div>
    <div class="code-box">
      <div class="code-label">👑 Code Admin (organisateurs)</div>
      <div class="code-val" style="color:#c96a30">${ADMIN_CODE}</div>
      <div class="code-hint">Accès complet — modification autorisée</div>
    </div>
    <div class="code-box">
      <div class="code-label">👁 Code Famille (participants)</div>
      <div class="code-val" style="color:#5b8dd9">${VISITOR_CODE}</div>
      <div class="code-hint">Lecture seule — à partager avec toute la famille</div>
    </div>
  `;
  c.appendChild(s2);

  // Firebase
  const s3 = el("div","params-section");
  s3.innerHTML = `<div class="params-title">🔥 Synchronisation Firebase</div>`;
  const fbStatus = el("div","");
  fbStatus.style.cssText="font-size:13px;color:#8a6a4a;margin-bottom:12px;line-height:1.6";
  fbStatus.innerHTML = state.fbConfigured
    ? `<span class="sync-dot"></span> Firebase connecté — données synchronisées en temps réel sur tous les appareils.`
    : `⚠️ Firebase non configuré — les données ne sont sauvegardées que sur cet appareil.<br><br><a href="#" id="config-fb-link" style="color:#c96a30;font-weight:bold">→ Configurer Firebase maintenant</a>`;
  s3.appendChild(fbStatus);
  if (!state.fbConfigured) {
    s3.querySelector("#config-fb-link")?.addEventListener("click", e => { e.preventDefault(); state.role=null; renderSetup(); });
  }
  c.appendChild(s3);

  // Backup
  const s4 = el("div","params-section");
  s4.innerHTML = `<div class="params-title">💾 Sauvegarde & restauration</div>`;
  const bDiv = el("div",""); bDiv.style.display="flex"; bDiv.style.gap="10px"; bDiv.style.flexWrap="wrap";
  const expBtn = el("button","btn-primary btn-blue","⬇️ Exporter backup JSON");
  expBtn.onclick = exportBackup;
  const impBtn = el("button","btn-primary btn-green","⬆️ Importer backup JSON");
  const fileInp = document.createElement("input"); fileInp.type="file"; fileInp.accept=".json"; fileInp.style.display="none";
  fileInp.onchange = importBackup;
  impBtn.onclick = () => fileInp.click();
  bDiv.append(expBtn, impBtn, fileInp);
  s4.appendChild(bDiv);
  s4.innerHTML += `<div class="backup-hint">💡 <strong>Astuce :</strong> Exportez un backup en fin d'édition. L'année suivante, importez-le et changez la date pour repartir d'une base propre !</div>`;
  // Re-attach after innerHTML
  s4.querySelector(".btn-blue").onclick = exportBackup;
  s4.querySelector(".btn-green").onclick = () => s4.querySelector('input[type=file]').click();
  s4.querySelector('input[type=file]').onchange = importBackup;
  c.appendChild(s4);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
function boot() {
  // Hide splash after load animation
  setTimeout(() => {
    const splash = document.getElementById("splash");
    if (splash) { splash.classList.add("hide"); setTimeout(()=>splash.remove(),500); }
  }, 1800);

  // Wait for Firebase modules
  const start = () => {
    state.fbReady = true;
    const config = loadFirebaseConfig();
    if (config) {
      initFirebase(config);
      renderLogin();
    } else {
      renderSetup();
    }
  };

  if (window._firebaseModules) { start(); }
  else { window.addEventListener("firebase-ready", start, { once:true }); }
}

document.addEventListener("DOMContentLoaded", boot);
