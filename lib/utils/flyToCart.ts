// flyToCart — a cobalt droplet flies from a source element into the nav
// pint glass ([data-cart-target]). The physical "it went in the glass" moment.
//
// Pure DOM + Web Animations API: no React re-renders, self-cleaning.
// Respects prefers-reduced-motion (skips entirely).

export function flyToCart(sourceEl: HTMLElement | null): void {
  if (typeof window === "undefined" || !sourceEl) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const target = document.querySelector("[data-cart-target]") as HTMLElement | null;
  if (!target) return;

  const from = sourceEl.getBoundingClientRect();
  const to   = target.getBoundingClientRect();

  // Target hidden (mobile — pint indicator only renders ≥900px) → skip
  if (to.width === 0 || to.height === 0) return;

  // Start at the centre of the source, land at the centre of the pint glass
  const startX = from.left + from.width / 2;
  const startY = from.top + from.height / 2;
  const endX   = to.left + to.width / 2;
  const endY   = to.top + to.height / 2;

  const SIZE = 18;

  const drop = document.createElement("div");
  drop.setAttribute("aria-hidden", "true");
  Object.assign(drop.style, {
    position:      "fixed",
    left:          `${startX - SIZE / 2}px`,
    top:           `${startY - SIZE / 2}px`,
    width:         `${SIZE}px`,
    height:        `${SIZE}px`,
    borderRadius:  "50% 50% 50% 50% / 60% 60% 40% 40%", // droplet-ish
    backgroundColor: "var(--blue, #004AAD)",
    zIndex:        "90",
    pointerEvents: "none",
    boxShadow:     "0 2px 8px rgba(0,74,173,0.4)",
  } as CSSStyleDeclaration);
  document.body.appendChild(drop);

  const dx = endX - startX;
  const dy = endY - startY;

  // Arc: rise slightly first, then dive into the glass.
  // Mid-point control via two keyframes with offset easing.
  const anim = drop.animate(
    [
      { transform: "translate(0, 0) scale(1)",                              opacity: 1,   offset: 0 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.35 - 60}px) scale(0.9)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.35)`,               opacity: 0.9, offset: 1 },
    ],
    { duration: 650, easing: "cubic-bezier(.5,.05,.5,1)", fill: "forwards" }
  );

  anim.onfinish = () => {
    // Splash pulse on the pint glass itself
    target.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.25)" },
        { transform: "scale(1)" },
      ],
      { duration: 320, easing: "cubic-bezier(.34,1.56,.64,1)" }
    );
    drop.remove();
  };

  // Safety cleanup if the animation gets interrupted (route change etc.)
  setTimeout(() => drop.remove(), 1200);
}
