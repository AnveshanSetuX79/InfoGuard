document.addEventListener("DOMContentLoaded", () => {
  const yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear().toString();
  }

  const floatingAction = document.querySelector(".floating-action");
  if (floatingAction) {
    floatingAction.addEventListener("click", () => {
      window.alert("InfoGuard assistant coming soon. Stay tuned!");
    });
  }

  const heroButtons = document.querySelectorAll(
    ".hero-actions .btn, .card .cta, .demo-controls button"
  );
  heroButtons.forEach((element) => {
    element.addEventListener("click", () => {
      element.classList.add("button-pressed");
      window.setTimeout(() => element.classList.remove("button-pressed"), 320);
    });
  });
});
