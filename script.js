// Utilidades de fecha
function formatDate(dateObj) {
  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = dateObj.getFullYear();
  return `${d}/${m}/${y}`;
}

function parseDateString(str) {
  // formato esperado: dd/mm/yyyy
  const [d, m, y] = str.split("/").map((v) => parseInt(v, 10));
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

// Helpers de LocalStorage
function loadData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Datos principales
let runs = loadData("bt_runs", []);
let strengths = loadData("bt_strengths", []);
let profile = loadData("bt_profile", {
  name: "",
  goal: "",
  days: 3,
  photo: null
});
let sharedFlag = loadData("bt_shared", false);
let firstPhotoAward = loadData("bt_first_photo_award", false);

// Tabs
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");

function activateTab(tab) {
  tabButtons.forEach((b) => b.classList.remove("active"));
  tabPanels.forEach((p) => p.classList.remove("active"));

  const btn = document.querySelector(`.tab-button[data-tab="${tab}"]`);
  const panel = document.getElementById(`tab-${tab}`);

  if (btn && panel) {
    btn.classList.add("active");
    panel.classList.add("active");
  }
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    activateTab(tab);
  });
});

// Botones rápidos en Home
document.querySelectorAll("[data-tab-target]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tabTarget;
    activateTab(tab);
  });
});

// --- ELEMENTOS PROGRESO ---
const statTotalKm = document.getElementById("stat-total-km");
const statRuns = document.getElementById("stat-runs");
const statStrengths = document.getElementById("stat-strengths");
const statAvgPace = document.getElementById("stat-avg-pace");
const recentList = document.getElementById("recent-workouts");

// ---- RUNNING ----
const runForm = document.getElementById("run-form");
const runHistoryList = document.getElementById("run-history");
const runPhotoInput = document.getElementById("run-photo");

function renderRuns() {
  if (!runHistoryList) return;
  runHistoryList.innerHTML = "";
  const sorted = [...runs].reverse(); // últimos primero

  sorted.forEach((r) => {
    const li = document.createElement("li");
    li.className = "history-item";

    const pace = r.distance ? (r.time / r.distance) : 0;

    let html = `
      <span><strong>${r.distance} km</strong> en ${r.time} min — ${r.feel}</span>
      ${pace ? `<span>Ritmo aproximado: ${pace.toFixed(1)} min por km.</span>` : ""}
      <span class="history-date">${r.date}</span>
      ${r.notes ? `<span>${r.notes}</span>` : ""}
    `;

    if (r.photo) {
      html += `<img src="${r.photo}" alt="Foto del entreno" class="history-thumb">`;
    }

    li.innerHTML = html;
    runHistoryList.appendChild(li);
  });
}

function saveRunEntry(entry) {
  runs.push(entry);
  saveData("bt_runs", runs);
  renderRuns();
  updateStats();
  updateRecentWorkouts();
  updateAwards();
}

if (runForm) {
  runForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const distance = parseFloat(document.getElementById("run-distance").value || "0");
    const time = parseFloat(document.getElementById("run-time").value || "0");
    const feel = document.getElementById("run-feel").value;
    const notes = document.getElementById("run-notes").value.trim();

    if (!distance || !time) return;

    const baseEntry = {
      distance,
      time,
      feel,
      notes,
      date: formatDate(new Date()),
      photo: null
    };

    const file = runPhotoInput && runPhotoInput.files && runPhotoInput.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        baseEntry.photo = ev.target.result;
        saveRunEntry(baseEntry);
        runPhotoInput.value = "";
        maybeUnlockFirstPhoto(baseEntry.photo);
      };
      reader.readAsDataURL(file);
    } else {
      saveRunEntry(baseEntry);
    }

    runForm.reset();
  });
}

// ---- FUERZA ----
const strengthForm = document.getElementById("strength-form");
const strengthHistoryList = document.getElementById("strength-history");
const strengthPhotoInput = document.getElementById("strength-photo");

function renderStrengths() {
  if (!strengthHistoryList) return;
  strengthHistoryList.innerHTML = "";
  const sorted = [...strengths].reverse();

  sorted.forEach((s) => {
    const li = document.createElement("li");
    li.className = "history-item";

    const setsText = s.sets ? s.sets : "";
    const weightText = s.weight ? ` | Peso: ${s.weight} kg` : "";

    let html = `
      <span><strong>${s.area}</strong></span>
      <span>${setsText}${weightText}</span>
      <span class="history-date">${s.date}</span>
      ${s.notes ? `<span>${s.notes}</span>` : ""}
    `;

    if (s.photo) {
      html += `<img src="${s.photo}" alt="Foto del entreno de fuerza" class="history-thumb">`;
    }

    li.innerHTML = html;
    strengthHistoryList.appendChild(li);
  });
}

function saveStrengthEntry(entry) {
  strengths.push(entry);
  saveData("bt_strengths", strengths);
  renderStrengths();
  updateStats();
  updateRecentWorkouts();
  updateAwards();
}

if (strengthForm) {
  strengthForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const area = document.getElementById("strength-area").value.trim();
    const sets = document.getElementById("strength-sets").value.trim();
    const weight = document.getElementById("strength-weight").value;
    const notes = document.getElementById("strength-notes").value.trim();

    if (!area || !sets) return;

    const baseEntry = {
      area,
      sets,
      weight: weight ? parseFloat(weight) : null,
      notes,
      date: formatDate(new Date()),
      photo: null
    };

    const file = strengthPhotoInput && strengthPhotoInput.files && strengthPhotoInput.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        baseEntry.photo = ev.target.result;
        saveStrengthEntry(baseEntry);
        strengthPhotoInput.value = "";
        maybeUnlockFirstPhoto(baseEntry.photo);
      };
      reader.readAsDataURL(file);
    } else {
      saveStrengthEntry(baseEntry);
    }

    strengthForm.reset();
  });
}

// ---- PROGRESO / ESTADÍSTICAS ----
function updateStats() {
  const totalKm = runs.reduce((sum, r) => sum + (r.distance || 0), 0);
  const totalTime = runs.reduce((sum, r) => sum + (r.time || 0), 0);
  const avgPace = totalKm ? totalTime / totalKm : 0;

  if (statTotalKm) statTotalKm.textContent = totalKm.toFixed(1);
  if (statRuns) statRuns.textContent = runs.length;
  if (statStrengths) statStrengths.textContent = strengths.length;
  if (statAvgPace) statAvgPace.textContent = avgPace ? avgPace.toFixed(1) : "–";

  updateBadges();
}

function updateRecentWorkouts() {
  if (!recentList) return;
  recentList.innerHTML = "";

  const combined = [
    ...runs.map((r) => {
      const pace = r.distance ? (r.time / r.distance) : 0;
      return {
        type: "Running",
        date: r.date,
        desc: `${r.distance} km en ${r.time} min${pace ? ` (${pace.toFixed(1)} min/km)` : ""} — ${r.feel}`,
        notes: r.notes || ""
      };
    }),
    ...strengths.map((s) => ({
      type: "Fuerza",
      date: s.date,
      desc: `${s.area} | ${s.sets}${s.weight ? ` (${s.weight} kg)` : ""}`,
      notes: s.notes || ""
    }))
  ];

  const recent = combined.slice(-10).reverse();
  recent.forEach((w) => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `
      <span><strong>${w.type}</strong> — ${w.desc}</span>
      <span class="history-date">${w.date}</span>
      ${w.notes ? `<span>${w.notes}</span>` : ""}
    `;
    recentList.appendChild(li);
  });
}

// ---- RETOS / MEDALLAS DISTANCIA ----
function updateBadges() {
  const thresholds = [5, 8, 10, 15, 21];

  thresholds.forEach((th) => {
    const el = document.getElementById(`badge-${th}`);
    if (!el) return;

    const has = runs.some((r) => r.distance >= th);
    if (has) {
      el.textContent = "🏅";
      el.classList.remove("locked");
      el.classList.add("unlocked");
    } else {
      el.textContent = "🔒";
      el.classList.add("locked");
      el.classList.remove("unlocked");
    }
  });
}

// ---- PERFIL ----
const profileForm = document.getElementById("profile-form");
const profileSummary = document.getElementById("profile-summary-text");
const profilePhotoInput = document.getElementById("profile-photo");
const profilePhotoBox = document.getElementById("profile-photo-box");
const profilePhotoPreview = document.getElementById("profile-photo-preview");

function renderProfileSummary() {
  if (!profileSummary) return;
  const name = profile.name || "Entrenador/a";
  const goal = profile.goal || "Define tu meta y vamos a por ella.";
  const days = profile.days || 3;

  profileSummary.textContent = `Tu meta actual es: ${goal}. Estás planificando entrenar ${days} días a la semana. Vamos con calma, pero sin parar 💪.`;

  if (profile.photo && profilePhotoBox && profilePhotoPreview) {
    profilePhotoPreview.src = profile.photo;
    profilePhotoBox.classList.remove("hidden");
  } else if (profilePhotoBox) {
    profilePhotoBox.classList.add("hidden");
  }
}

if (profileForm) {
  const nameInput = document.getElementById("profile-name");
  const goalInput = document.getElementById("profile-goal");
  const daysInput = document.getElementById("profile-days");

  nameInput.value = profile.name || "";
  goalInput.value = profile.goal || "";
  daysInput.value = profile.days || "";

  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    profile.name = nameInput.value.trim();
    profile.goal = goalInput.value.trim();
    profile.days = parseInt(daysInput.value || "3", 10);

    // si hay nueva foto, se guarda en el change del input
    saveData("bt_profile", profile);
    renderProfileSummary();
  });

  if (profilePhotoInput) {
    profilePhotoInput.addEventListener("change", () => {
      const file = profilePhotoInput.files && profilePhotoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        profile.photo = ev.target.result;
        saveData("bt_profile", profile);
        renderProfileSummary();
        maybeUnlockFirstPhoto(profile.photo);
      };
      reader.readAsDataURL(file);
    });
  }
}

// ---- BOTÓN BORRAR DATOS ----
const clearBtn = document.getElementById("clear-data");
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    const ok = confirm("¿Seguro que quieres borrar todos tus entrenos y tu perfil?");
    if (!ok) return;

    runs = [];
    strengths = [];
    profile = { name: "", goal: "", days: 3, photo: null };
    sharedFlag = false;
    firstPhotoAward = false;

    saveData("bt_runs", runs);
    saveData("bt_strengths", strengths);
    saveData("bt_profile", profile);
    saveData("bt_shared", sharedFlag);
    saveData("bt_first_photo_award", firstPhotoAward);

    renderRuns();
    renderStrengths();
    updateStats();
    updateRecentWorkouts();
    renderProfileSummary();
    updateAwards();

    alert("Datos borrados. Empezamos de cero 💪");
  });
}

// ---- GENERADOR DE PLANES RUNNING ----
const runPlanForm = document.getElementById("run-plan-form");
const runPlanResult = document.getElementById("run-plan-result");

function buildRunPlan(distance, experience, days, level) {
  let weeks;
  switch (distance) {
    case 5:
      weeks = 6;
      break;
    case 8:
      weeks = 8;
      break;
    case 10:
      weeks = 8;
      break;
    case 15:
      weeks = 10;
      break;
    case 21:
      weeks = 12;
      break;
    default:
      weeks = 6;
  }

  const safeDays = Math.min(Math.max(days || 3, 2), 6);

  let expText = "";
  if (experience === "nada") {
    expText = "Empezamos muy suave: más caminar que trotar para que tu cuerpo se acostumbre.";
  } else if (experience === "poco") {
    expText = "Ya has hecho algo, mezclamos caminar y trotar con calma.";
  } else {
    expText = "Tienes algo de base, así que podemos jugar un poco más con el trote suave.";
  }

  let levelTitle = "";
  let day1 = "";
  let day2 = "";
  let day3 = "";
  let day4 = "";

  if (level === "basico") {
    levelTitle = "Plan básico: pensado para quien empieza desde cero.";
    day1 =
      "Día 1: 1 minuto trotando muy suave + 2 minutos caminando. Repite este bloque 8 veces (en total 24 minutos).";
    day2 =
      "Día 2: caminata rápida de 25 a 35 minutos. Debes poder hablar mientras caminas.";
    day3 =
      "Día 3 (si tienes): trote suave continuo de 10 a 15 minutos. Si te cansas, camina un poco y sigue.";
    day4 =
      "Día 4 (si entrenas 4+ días): repite el Día 1 o haz una caminata larga tranquila.";
  } else if (level === "intermedio") {
    levelTitle =
      "Plan intermedio: ya te mueves algo y quieres avanzar un poco más.";
    day1 =
      "Día 1: 2 minutos trotando suave + 2 minutos caminando. Repite este bloque 6 a 8 veces (entre 24 y 32 minutos).";
    day2 =
      "Día 2: caminata rápida o trote muy suave de 30 a 40 minutos seguidos.";
    day3 =
      "Día 3: trote suave continuo de 20 a 25 minutos. Si necesitas, camina 1 minuto y vuelve a trotar.";
    day4 =
      "Día 4 (si entrenas 4+ días): 3 bloques de 5 minutos de trote suave + 3 minutos de caminata.";
  } else {
    levelTitle =
      "Plan fuerte: para quien ya se siente cómodo moviéndose y quiere un reto duro pero controlado.";
    day1 =
      "Día 1: 3 minutos trotando suave + 2 minutos caminando. Repite este bloque 6 a 8 veces (30–40 minutos).";
    day2 =
      "Día 2: trote suave continuo de 30 a 40 minutos. Ritmo donde puedas hablar entrecortado.";
    day3 =
      "Día 3: 4 bloques de 6 minutos de trote + 2 minutos caminando. En los 2 últimos bloques aprieta un poco el ritmo.";
    day4 =
      "Día 4 (si entrenas 4+ días): caminata rápida + algo de fuerza suave (sentadillas, plancha, zancadas).";
  }

  return `
    <p><strong>Plan ${level.toUpperCase()} para ${distance}K</strong></p>
    <p>${weeks} semanas • ${safeDays} días de entrenamiento a la semana.</p>
    <p>${expText}</p>
    <p>${levelTitle}</p>
    <p><strong>Estructura simple de la semana:</strong></p>
    <ul>
      <li>${day1}</li>
      <li>${day2}</li>
      <li>${safeDays >= 3 ? day3 : ""}</li>
      ${safeDays >= 4 ? `<li>${day4}</li>` : ""}
    </ul>
    <p>Cada vez que veas algo como “2 minutos trotando + 2 minutos caminando, repetir 6 veces” significa:</p>
    <p><strong>Trota 2 minutos, después camina 2 minutos y repites esa combinación 6 veces.</strong></p>
    <p>La idea no es ir rápido. Es que tu cuerpo se acostumbre a moverse seguido y sin dolor. Si necesitas más descanso, camina más tiempo y está perfecto.</p>
  `;
}

if (runPlanForm && runPlanResult) {
  runPlanForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const distance = parseInt(document.getElementById("run-plan-distance").value, 10);
    const experience = document.getElementById("run-plan-experience").value;
    const days = parseInt(document.getElementById("run-plan-days").value || "3", 10);
    const level = document.getElementById("run-plan-level").value;

    runPlanResult.innerHTML = buildRunPlan(distance, experience, days, level);
  });
}

// ---- GENERADOR DE PLANES FUERZA ----
const strengthPlanForm = document.getElementById("strength-plan-form");
const strengthPlanResult = document.getElementById("strength-plan-result");

function buildStrengthPlan(level, days, goal, intensity) {
  const safeDays = Math.min(Math.max(days || 2, 2), 5);
  let intro = "";
  if (level === "nada") {
    intro = "Empezamos con ejercicios muy básicos usando tu propio peso.";
  } else if (level === "poco") {
    intro = "Ya probaste algo de fuerza, mezclamos ejercicios básicos con algo de reto.";
  } else {
    intro = "Tienes algo de experiencia, podemos armar una rutina un poco más completa.";
  }

  const goalText = goal
    ? `Tu objetivo principal es: <strong>${goal}</strong>. Ajusta la intensidad según cómo te vayas sintiendo.`
    : "Tu objetivo principal es sentirte más fuerte y con mejor postura en el día a día.";

  let title = "";
  let day1 = "";
  let day2 = "";
  let day3 = "";
  let day4 = "";

  if (intensity === "basico") {
    title = "Plan básico: suave, ideal para empezar.";
    day1 =
      "Día 1: Piernas y glúteos: 3 series de 10 sentadillas, 3 series de 10 puentes de glúteo y 2 series de 8 zancadas por pierna. Descansa 1 minuto entre series.";
    day2 =
      "Día 2: Core y espalda: 3 series de plancha de 20–30 segundos, 3 series de 10 repeticiones de bird dog y 2 series de 10 abdominales cortos.";
    day3 =
      "Día 3 (si tienes): Cuerpo completo suave: 2 series de sentadillas, 2 series de flexiones apoyadas y 2 series de remo con banda o botella.";
    day4 =
      "Día 4 (si entrenas 4+ días): caminata rápida de 25–35 minutos o algo de movilidad y estiramientos.";
  } else if (intensity === "intermedio") {
    title = "Plan intermedio: un poco más intenso, pero manejable.";
    day1 =
      "Día 1: Piernas y glúteos: 4 series de 12 sentadillas, 3 series de 12 puentes de glúteo y 3 series de 10 zancadas por pierna.";
    day2 =
      "Día 2: Pecho y brazos: 3 series de 10–12 flexiones (pueden ser apoyadas), 3 series de 12 press con mancuernas o botellas y 3 series de 10 curls de bíceps.";
    day3 =
      "Día 3: Core y espalda: 3 series de plancha de 30 segundos, 3 series de 12 bird dog y 3 series de remo con banda o mancuernas.";
    day4 =
      "Día 4 (si entrenas 4+ días): Cuerpo completo ligero: 2 series de cada ejercicio anterior, sin llegar al máximo esfuerzo.";
  } else {
    title = "Plan fuerte: exigente, para cuando ya te sientes con buena base.";
    day1 =
      "Día 1: Piernas potentes: 4 series de 15 sentadillas, 4 series de 12 zancadas por pierna y 3 series de 15 puentes de glúteo. Descanso de 45–60 segundos.";
    day2 =
      "Día 2: Pecho y hombros: 4 series de 12 flexiones (algunas en el suelo y otras apoyadas), 3 series de 12 press por encima de la cabeza y 3 series de fondos en banco o silla.";
    day3 =
      "Día 3: Espalda y brazos: 4 series de remo con banda o mancuernas (12–15 repeticiones), 3 series de curls de bíceps y 3 series de extensiones de tríceps.";
    day4 =
      "Día 4 (si entrenas 4+ días): Core fuerte: 4 series de plancha de 30–40 segundos, 3 series de 15 abdominales y 3 series de elevación de rodillas en el sitio.";
  }

  return `
    <p><strong>${title}</strong></p>
    <p>${intro}</p>
    <p>${goalText}</p>
    <p><strong>Ejemplo de estructura semanal (${safeDays} días):</strong></p>
    <ul>
      <li>${day1}</li>
      <li>${day2}</li>
      ${safeDays >= 3 ? `<li>${day3}</li>` : ""}
      ${safeDays >= 4 ? `<li>${day4}</li>` : ""}
    </ul>
    <p>Cuando veas algo como “3 series de 10 repeticiones” significa:</p>
    <p><strong>Haces el ejercicio 10 veces, descansas, eso es 1 serie. Repites hasta completar 3 series.</strong></p>
    <p>No hace falta ir al máximo. Si un día solo puedes hacer 2 series en vez de 3, está bien: lo importante es repetirlo en el tiempo.</p>
  `;
}

if (strengthPlanForm && strengthPlanResult) {
  strengthPlanForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const level = document.getElementById("strength-plan-level").value;
    const days = parseInt(document.getElementById("strength-plan-days").value || "2", 10);
    const goal = document.getElementById("strength-plan-goal").value.trim();
    const intensity = document.getElementById("strength-plan-intensity").value;

    strengthPlanResult.innerHTML = buildStrengthPlan(level, days, goal, intensity);
  });
}

// ---- PREMIOS Y RACHAS ----
const badgeWeek = document.getElementById("streak-week");
const badgeMonth = document.getElementById("streak-month");
const badge6m = document.getElementById("streak-6m");
const badgeYear = document.getElementById("streak-year");
const badgeStrength10 = document.getElementById("strength-10");
const badgeStrengthLegs = document.getElementById("strength-legs");
const badgeStrengthBack = document.getElementById("strength-back");
const awardShare = document.getElementById("award-share");
const awardPhoto = document.getElementById("award-photo");
const award50 = document.getElementById("award-50");
const shareButton = document.getElementById("mark-shared");

function unlockBadge(el) {
  if (!el) return;
  el.textContent = "🏅";
  el.classList.remove("locked");
  el.classList.add("unlocked");
}

function lockBadge(el) {
  if (!el) return;
  el.textContent = "🔒";
  el.classList.add("locked");
  el.classList.remove("unlocked");
}

function updateAwards() {
  const allSessions = [
    ...runs.map((r) => r.date),
    ...strengths.map((s) => s.date)
  ].map(parseDateString).filter(Boolean);

  const now = new Date();

  if (allSessions.length === 0) {
    [badgeWeek, badgeMonth, badge6m, badgeYear, award50].forEach(lockBadge);
  } else {
    const recent7 = allSessions.filter(
      (d) => (now - d) / (1000 * 60 * 60 * 24) <= 7
    );
    const recent30 = allSessions.filter(
      (d) => (now - d) / (1000 * 60 * 60 * 24) <= 30
    );
    const recent180 = allSessions.filter(
      (d) => (now - d) / (1000 * 60 * 60 * 24) <= 180
    );
    const recent365 = allSessions.filter(
      (d) => (now - d) / (1000 * 60 * 60 * 24) <= 365
    );

    // Criterios simples de racha
    if (recent7.length >= 3) unlockBadge(badgeWeek);
    else lockBadge(badgeWeek);

    if (recent30.length >= 8) unlockBadge(badgeMonth);
    else lockBadge(badgeMonth);

    if (recent180.length >= 40) unlockBadge(badge6m);
    else lockBadge(badge6m);

    if (recent365.length >= 80) unlockBadge(badgeYear);
    else lockBadge(badgeYear);

    if (allSessions.length >= 50) unlockBadge(award50);
    else lockBadge(award50);
  }

  // Fuerza
  if (strengths.length >= 10) unlockBadge(badgeStrength10);
  else lockBadge(badgeStrength10);

  const lowerAreas = strengths.map((s) => (s.area || "").toLowerCase());
  const legsCount = lowerAreas.filter((a) => a.includes("pierna")).length;
  const backCount = lowerAreas.filter((a) => a.includes("espalda")).length;

  if (legsCount >= 4) unlockBadge(badgeStrengthLegs);
  else lockBadge(badgeStrengthLegs);

  if (backCount >= 4) unlockBadge(badgeStrengthBack);
  else lockBadge(badgeStrengthBack);

  // Compartir
  if (sharedFlag) unlockBadge(awardShare);
  else lockBadge(awardShare);

  // Primera foto
  if (firstPhotoAward) unlockBadge(awardPhoto);
  else lockBadge(awardPhoto);
}

function maybeUnlockFirstPhoto(photoData) {
  if (!photoData) return;
  if (!firstPhotoAward) {
    firstPhotoAward = true;
    saveData("bt_first_photo_award", firstPhotoAward);
    updateAwards();
  }
}

if (shareButton) {
  shareButton.addEventListener("click", () => {
    sharedFlag = true;
    saveData("bt_shared", sharedFlag);
    updateAwards();
    alert("¡Gracias por compartir la app! 🎉");
  });
}

// ---- FRASE DEL DÍA + INICIALIZACIÓN ----
document.addEventListener("DOMContentLoaded", () => {
  const todayLabel = document.getElementById("today-label");
  if (todayLabel) {
    todayLabel.textContent = formatDate(new Date());
  }

  const dailyQuoteEl = document.getElementById("daily-quote");
  const quotes = [
    "Hoy no tienes que ser perfecto, solo constante.",
    "Si hoy te mueves un poco, ya ganaste.",
    "Tu ritmo, tus reglas. No hay apuro.",
    "Un paso más es un paso menos que te falta.",
    "Lo importante es seguir, aunque sea despacio.",
    "Caminar también es entrenar. Todo suma.",
    "Eres más fuerte de lo que crees cuando no te rindes."
  ];
  if (dailyQuoteEl) {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    dailyQuoteEl.textContent = q;
  }

  // Inicializar UI con datos guardados
  renderRuns();
  renderStrengths();
  updateStats();
  updateRecentWorkouts();
  renderProfileSummary();
  updateAwards();
});
