const container = document.getElementById("config-container");
const addBtn = document.getElementById("add-line");
const clearBtn = document.getElementById("clear-lines");
const saveBtn = document.getElementById("save-config");
const exportBtn = document.getElementById("export-config");
const importBtn = document.getElementById("import-config");
const importFile = document.getElementById("import-file");
const statusDiv = document.getElementById("status");
const currentBody = document.getElementById("current-body");

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function makeRow(data = {}) {
  const row = document.createElement("div");
  row.className = "row";

  row.innerHTML = `
    <div class="field">
      <label>Layer:</label>
      <input type="text" class="layer-name" value="${escapeHtml(data.layer || "")}">
    </div>
    <div class="field">
      <label>Modifiers:</label>
      <label><input type="checkbox" class="mod-ctrl" ${data.ctrl ? "checked" : ""}>Ctrl</label>
      <label><input type="checkbox" class="mod-shift" ${data.shift ? "checked" : ""}>Shift</label>
      <label><input type="checkbox" class="mod-alt" ${data.alt ? "checked" : ""}>Alt</label>
    </div>
    <div class="field">
      <label>Key:</label>
      <input type="text" maxlength="1" class="key" value="${escapeHtml(data.key || "")}">
    </div>
    <div class="field">
      <button type="button" class="delete-line">🗑 Delete Layer</button>
    </div>
  `;
  row.querySelector(".delete-line").addEventListener("click", () => {
    row.remove();
    if (!container.querySelector(".row")) makeRow();
  });
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
    const tableRow = document.createElement("tr");
    const layerCell = document.createElement("td");
    const hotkeyCell = document.createElement("td");
    layerCell.textContent = hk.layer;
    hotkeyCell.textContent = combo;
    tableRow.append(layerCell, hotkeyCell);
    currentBody.appendChild(tableRow);
  });
}

function showStatus(message, duration = 2000) {
  statusDiv.textContent = message;
  setTimeout(() => statusDiv.textContent = "", duration);
}

function loadIntoEditor(config) {
  container.innerHTML = "";
  if (config.length) config.forEach(makeRow);
  else makeRow();
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
  chrome.storage.sync.set({ hotkeys: [] }, () => {
    loadIntoEditor([]);
    renderCurrent([]);
    showStatus("✅ All hotkeys cleared");
  });
});

exportBtn.addEventListener("click", () => {
  chrome.storage.sync.get({ hotkeys: [] }, ({ hotkeys }) => {
    const backup = {
      format: "brouter-layer-hotkeys",
      version: 1,
      exportedAt: new Date().toISOString(),
      hotkeys
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    link.download = `brouter-layer-hotkeys-backup-${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showStatus("✅ Backup exported");
  });
});

importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", async () => {
  const file = importFile.files[0];
  importFile.value = "";
  if (!file) return;

  try {
    const backup = JSON.parse(await file.text());
    if (backup.format !== "brouter-layer-hotkeys" || backup.version !== 1 || !Array.isArray(backup.hotkeys)) {
      throw new Error("not a BRouter Layer Hotkeys backup");
    }
    const hotkeys = backup.hotkeys.filter(item =>
      item && typeof item.layer === "string" && item.layer.trim() &&
      typeof item.key === "string" && item.key.trim().length === 1
    ).map(item => ({
      layer: item.layer.trim(), key: item.key.trim().toUpperCase(),
      ctrl: !!item.ctrl, shift: !!item.shift, alt: !!item.alt
    }));
    chrome.storage.sync.set({ hotkeys }, () => {
      loadIntoEditor(hotkeys);
      renderCurrent(hotkeys);
      showStatus(`✅ Imported ${hotkeys.length} layer${hotkeys.length === 1 ? "" : "s"}`);
    });
  } catch (error) {
    showStatus(`❌ Import failed: ${error.message}`, 4000);
  }
});

// Restore saved config
chrome.storage.sync.get({ hotkeys: [] }, (result) => {
  renderCurrent(result.hotkeys);
  loadIntoEditor(result.hotkeys);
});
