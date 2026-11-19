document.addEventListener("DOMContentLoaded", () => {
  const anchor = document.querySelector(".back-to-top-anchor");
  if (!anchor) return;

  const button = document.createElement("button");

  button.type = "button";
  button.className = "back-to-top";
  button.setAttribute("aria-label", "Trở về đầu trang");
  button.title = "Trở về đầu trang";

  button.innerHTML = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="12 9 40 45"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M30.5 46V22.5
           C27 27.3 22.6 30.4 17 32
           C23.5 26.3 28.3 20.2 32 12.5
           C35.7 20.2 40.5 26.3 47 32
           C41.4 30.4 37 27.3 33.5 22.5
           V46
           C33.5 48.6 32.9 50.4 32 51.5
           C31.1 50.4 30.5 48.6 30.5 46Z"
        fill="currentColor"
      />
    </svg>
  `;

  anchor.appendChild(button);

  const updateVisibility = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    const shouldShow = scrollTop > 400;

    button.classList.toggle("is-visible", shouldShow);
  };

  window.addEventListener("scroll", updateVisibility, {
    passive: true,
  });

  window.addEventListener("pageshow", updateVisibility);

  updateVisibility();

  button.addEventListener("click", () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  });
});
