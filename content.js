function toggleLayerByLabel(labelText) {
  const labels = document.querySelectorAll("label");
  for (const label of labels) {
    if (label.innerText.trim() === labelText) {
      const checkbox = label.querySelector("input[type=checkbox]");
      if (checkbox) {
        // Simulate a user click (Leaflet listens to this)
        checkbox.click();
        console.log("Toggled layer:", labelText, "→", checkbox.checked);
      }
    }
  }
}

// Example: Ctrl+Shift+G toggles Google Earth OL
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.code === "KeyE") {
    toggleLayerByLabel("Google Earth OL");
  }
});
