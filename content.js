function toggleLayerByLabel(labelText) {
  const labels = document.querySelectorAll("label");
  for (const label of labels) {
    if (label.innerText.trim() === labelText) {
      const checkbox = label.querySelector("input[type=checkbox]");
      if (checkbox) {
        checkbox.click();
        console.log("Toggled layer:", labelText);
      }
    }
  }
}

let hotkeys = [];

// Load hotkeys initially
chrome.storage.sync.get({ hotkeys: [] }, (result) => {
  hotkeys = result.hotkeys;
  console.log("Loaded hotkeys:", hotkeys);
});

// Update hotkeys live when popup saves new config
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.hotkeys) {
    hotkeys = changes.hotkeys.newValue || [];
    console.log("Hotkeys updated:", hotkeys);
  }
});

// Handle key presses
document.addEventListener("keydown", (e) => {
  for (const hk of hotkeys) {
    if (
      e.key.toUpperCase() === hk.key &&
      e.ctrlKey === !!hk.ctrl &&
      e.shiftKey === !!hk.shift &&
      e.altKey === !!hk.alt
    ) {
      console.log("Match found → toggling:", hk.layer);
      toggleLayerByLabel(hk.layer);
      e.preventDefault();
    }
  }
});
