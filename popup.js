const container = document.getElementById("config-container");
const addBtn = document.getElementById("add-line");
const clearBtn = document.getElementById("clear-lines");
const saveBtn = document.getElementById("save-config");
const statusDiv = document.getElementById("status");
const currentBody = document.getElementById("current-body");

function makeRow(data = {}) {
  const row = document.createElement("div");
  row.className = "row";

  row.innerHTML = `
    <div class="field">
      <label>Layer:</label>
      <input type="text" class="layer-name" value="${data.layer || ""}">
    </div>
    <div class="field">
      <label>Modifiers:</label>
      <label><input type="checkbox" class="mod-ctrl" ${data.ctrl ? "checked" : ""}>Ctrl</label>
      <label><input type="checkbox" class="mod-shift" ${data.shift ? "checked" : ""}>Shift</label>
      <label><input type="checkbox" class="mod-alt" ${data.alt ? "checked" : ""}>Alt</label>
    </div>
    <div class="field">
      <label>Key:</label>
      <input type="text" maxlength="1" class="key" value="${data.key || ""}">
    </div>
  `;
  container.appendChild(row);
}

function collectConfig() {
  const rows = container.querySelectorAll(".row");
  const config = [];
  rows.forEach(r => {
    const layer = r.querySelector(".layer-name").value.trim();
    const key = r.querySelector(".key").value.trim().toUpperCase();
    if (layer && key) {
      config.push({
        layer,
        key,
        ctrl: r.querySelector(".mod-ctrl").checked,
        shift: r.querySelector(".mod-shift").checked,
        alt: r.querySelector(".mod-alt").checked
      });
    }
  });
  return config;
}

function renderCurrent(config) {
  currentBody.innerHTML = "";
  if (config.length === 0) {
    currentBody.innerHTML = `<tr><td colspan="2"><em>No hotkeys set</em></td></tr>`;
    return;
  }
  config.forEach(hk => {
    const mods = [
      hk.ctrl ? "Ctrl" : "",
      hk.shift ? "Shift" : "",
      hk.alt ? "Alt" : ""
    ].filter(Boolean).join("+");
    const combo = (mods ? mods + "+" : "") + hk.key;
    currentBody.innerHTML += `<tr><td>${hk.layer}</td><td>${combo}</td></tr>`;
  });
}

// Save config
saveBtn.addEventListener("click", () => {
  const cfg = collectConfig();
  chrome.storage.sync.set({ hotkeys: cfg }, () => {
    statusDiv.textContent = "✅ Saved!";
    renderCurrent(cfg);
    setTimeout(() => statusDiv.textContent = "", 1500);
  });
});

// Add line
addBtn.addEventListener("click", () => makeRow());

// Clear lines
clearBtn.addEventListener("click", () => {
  container.innerHTML = "";
  makeRow();
});

// Restore saved config
chrome.storage.sync.get({ hotkeys: [] }, (result) => {
  renderCurrent(result.hotkeys);
  if (result.hotkeys.length) {
    result.hotkeys.forEach(cfg => makeRow(cfg));
  } else {
    makeRow(); // one empty line by default
  }
});
