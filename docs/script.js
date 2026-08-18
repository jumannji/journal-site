// Retro visitor counter, done the old-fashioned way (localStorage, per-browser).
(function () {
  var el = document.getElementById("counter");
  if (!el) return;
  var count = parseInt(localStorage.getItem("visitorCount") || "133700", 10) + 1;
  localStorage.setItem("visitorCount", String(count));
  el.textContent = String(count).padStart(6, "0");
})();
