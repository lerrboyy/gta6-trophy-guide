const STORAGE_KEY = "leonida-trophies";
let trophies = [];
let earned = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const q = (sel) => document.querySelector(sel);
const qa = (sel) => document.querySelectorAll(sel);

async function init() {
  const res = await fetch("./data/trophies.json");
  const data = await res.json();
  trophies = data.trophies;

  const params = new URLSearchParams(location.search);
  if (params.has("grade")) {
    q("#grade-filter").value = params.get("grade");
  }
  if (params.has("detail")) {
    const id = Number(params.get("detail"));
    const t = trophies.find(x => x.id === id);
    if (t) showDetail(t);
  }

  setupListeners();
  render();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
      if (params.has("scroll")) {
        window.scrollTo(0, Number(params.get("scroll")));
      }
    });
  });
}

function saveEarned() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(earned));
  renderProgress();
}

function renderProgress() {
  const count = earned.length;
  q("#progress-text").textContent = `${count} / 55 earned`;
  q("#progress-fill").style.width = `${(count / 55) * 100}%`;
}

function render() {
  renderProgress();
  const search = q("#search").value.toLowerCase();
  const activeFilter = q("#filters button.active")?.dataset.filter || "all";
  const gradeFilter = q("#grade-filter").value;
  const spoilerChecked = q("#spoiler").checked;

  const list = q("#trophies");
  list.innerHTML = "";

  const filtered = trophies.filter(t => {
    const isEarned = earned.includes(t.id);
    if (gradeFilter !== "all" && t.grade !== gradeFilter) return false;
    if (activeFilter === "story" && t.kind !== "story") return false;
    if (activeFilter === "missable" && !t.missable) return false;
    if (activeFilter === "collectible" && t.kind !== "collectible") return false;
    if (activeFilter === "activity" && t.kind !== "activity") return false;
    if (activeFilter === "earned" && !isEarned) return false;
    if (activeFilter === "unearned" && isEarned) return false;

    if (search) {
      const matchName = t.name.toLowerCase().includes(search);
      const matchDesc = t.description.toLowerCase().includes(search);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  filtered.forEach(t => {
    const isEarned = earned.includes(t.id);
    const hideSpoiler = spoilerChecked && t.kind === "story" && !isEarned;
    const name = hideSpoiler ? "Hidden trophy" : t.name;
    const desc = hideSpoiler ? "Complete story missions to reveal." : t.description;

    const li = document.createElement("li");
    li.className = t.grade;
    li.innerHTML = `
      <input type="checkbox" data-id="${t.id}" ${isEarned ? "checked" : ""}>
      <div class="trophy-content">
        <div class="trophy-header">
          <strong>#${t.id} ${name}</strong>
          <span class="grade-badge">${t.grade}</span>
          <span class="kind-badge">${t.kind}</span>
          ${t.missable ? '<span class="badge-missable">MISSABLE</span>' : ""}
        </div>
        <p>${desc}</p>
      </div>
    `;

    li.querySelector("input").addEventListener("change", (e) => {
      e.stopPropagation();
      if (e.target.checked) {
        if (!earned.includes(t.id)) earned.push(t.id);
      } else {
        earned = earned.filter(id => id !== t.id);
      }
      saveEarned();
      render();
    });

    li.addEventListener("click", (e) => {
      if (e.target.tagName === "INPUT") return;
      showDetail(t);
    });

    list.appendChild(li);
  });
}

function showDetail(t) {
  q("#detail-name").textContent = `#${t.id} — ${t.name} (${t.grade})`;
  q("#detail-desc").textContent = t.description;
  q("#detail-guide").textContent = t.guide;
  q("#detail-sources").textContent = "Sources: " + t.sources.join("; ");
}

function setupListeners() {
  q("#search").addEventListener("input", render);
  q("#grade-filter").addEventListener("change", render);
  q("#spoiler").addEventListener("change", render);

  qa("#filters button").forEach(btn => {
    btn.addEventListener("click", () => {
      qa("#filters button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  });

  q("#export").addEventListener("click", () => {
    const data = JSON.stringify({ earned, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leonida-trophies.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  q("#import").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        if (Array.isArray(json.earned) && json.earned.every(n => typeof n === "number" && n >= 1 && n <= 55)) {
          earned = json.earned;
          saveEarned();
          render();
        } else {
          alert("Invalid import format");
        }
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  });

  q("#reset").addEventListener("click", () => {
    if (confirm("Reset all progress?")) {
      earned = [];
      localStorage.removeItem(STORAGE_KEY);
      render();
    }
  });
}

init();
