/* =========================
   Orions Darts Club — app.js
   JSON-driven Members & Schedule
   ========================= */

const $ = (sel) => document.querySelector(sel);

function toast(title, body){
  const t = $("#toast");
  $("#toastTitle").textContent = title;
  $("#toastBody").textContent = body;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

function setTheme(next){
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("odc_theme", next);
}

function initTheme(){
  const saved = localStorage.getItem("odc_theme");
  if(saved) setTheme(saved);
  else document.documentElement.setAttribute("data-theme", "dark");

  $("#themeBtn").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(cur === "dark" ? "light" : "dark");
  });
}

function initClock(){
  const nowEl = $("#now");
  const tick = () => nowEl.textContent = new Date().toLocaleString("ja-JP");
  tick();
  setInterval(tick, 1000);
}

async function loadJson(path){
  const res = await fetch(path, { cache: "no-store" });
  if(!res.ok) throw new Error(`${path} load failed: ${res.status}`);
  return res.json();
}

function renderKpis(members, schedule){
  const kpis = $("#kpis");
  const next = schedule?.highlight || "—";
  const countMembers = members?.length ?? 0;
  const countItems = schedule?.items?.length ?? 0;

  const blocks = [
    { big: next, lbl: "Latest" },
    { big: String(countMembers), lbl: "Members" },
    { big: String(countItems), lbl: "Schedule items" },
    { big: "Email", lbl: "Primary contact" }
  ];

  kpis.innerHTML = "";
  blocks.forEach(b => {
    const div = document.createElement("div");
    div.className = "kpi";
    div.innerHTML = `
      <div class="kpiBig">${escapeHtml(b.big)}</div>
      <div class="kpiLbl">${escapeHtml(b.lbl)}</div>
    `;
    kpis.appendChild(div);
  });
}

function renderQuickList(members, schedule){
  const root = $("#quickList");
  const lead = members?.[0];
  const highlight = schedule?.highlight || "—";
  const nextItem = schedule?.items?.[0];

  root.innerHTML = "";

  root.appendChild(makeQuickItem("Recruit", highlight, "Now"));
  if(lead){
    root.appendChild(makeQuickItem("Lead", `${lead.initial} — ${lead.role}`, "Leadership"));
  }
  if(nextItem){
    root.appendChild(makeQuickItem("Next", nextItem.title, nextItem.when || "TBD"));
  }
}

function makeQuickItem(title, value, sub){
  const div = document.createElement("div");
  div.className = "qitem";
  div.innerHTML = `
    <div class="qtitle">${escapeHtml(title)}</div>
    <div style="font-weight:900; margin-top:6px">${escapeHtml(value)}</div>
    <div class="qsub">${escapeHtml(sub)}</div>
  `;
  return div;
}

function renderMembers(members){
  const grid = $("#membersGrid");
  grid.innerHTML = "";

  members.forEach(m => {
    const card = document.createElement("div");
    card.className = "memberCard";
    card.innerHTML = `
      <div class="memberTop">
        <div>
          <div class="memberName">${escapeHtml(m.initial)}</div>
          <div class="memberRole">${escapeHtml(m.role)}</div>
        </div>
        <div class="memberTag">${escapeHtml(m.teamTag || "Orions")}</div>
      </div>

      ${m.tagline ? `<div class="muted" style="margin-top:8px; font-size:12px">${escapeHtml(m.tagline)}</div>` : ""}

      <div class="memberMeta">
        ${Array.isArray(m.skills) ? m.skills.map(s => `<span class="memberTag">${escapeHtml(s)}</span>`).join("") : ""}
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderSchedule(schedule){
  $("#headline").textContent = schedule.highlight || "部員募集中";
  $("#recruitText").textContent = schedule.highlight || "部員募集中";
  $("#scheduleBadge").textContent = schedule.highlight || "部員募集中";

  const list = $("#scheduleList");
  list.innerHTML = "";

  schedule.items.forEach(item => {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div class="itemLeft">
        <div class="itemTitle">${escapeHtml(item.title)}</div>
        <div class="itemSub">${escapeHtml(item.note || "")}</div>
      </div>
      <div class="itemRight">
        <div class="mono" style="font-size:12px">${escapeHtml(item.when || "—")}</div>
        <div class="itemSub">${escapeHtml(item.location || "TBD")}</div>
      </div>
    `;
    list.appendChild(row);
  });
}

function initContactActions(){
  const email = $("#emailText").textContent.trim();

  $("#copyEmailBtn").addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(email);
      toast("Copied", "メールアドレスをコピーしました。");
    }catch{
      toast("Copy failed", "ブラウザ権限の都合でコピーできませんでした。");
    }
  });

  $("#copyPageBtn").addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(location.href);
      toast("Copied", "ページURLをコピーしました。");
    }catch{
      toast("Copy failed", "ブラウザ権限の都合でコピーできませんでした。");
    }
  });

  // last updated (client-side)
  $("#lastUpdated").textContent = new Date().toLocaleString("ja-JP");
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function boot(){
  $("#year").textContent = new Date().getFullYear();
  initTheme();
  initClock();
  initContactActions();

  try{
    const [members, schedule] = await Promise.all([
      loadJson("./data/members.json"),
      loadJson("./data/schedule.json")
    ]);

    renderMembers(members);
    renderSchedule(schedule);
    renderKpis(members, schedule);
    renderQuickList(members, schedule);

  }catch(err){
    console.error(err);
    toast("Load error", "JSONの読み込みに失敗しました。パスとJSON文法を確認してください。");
  }
}

document.addEventListener("DOMContentLoaded", boot);
