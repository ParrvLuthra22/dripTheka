// The acrylic ledge under a fit: glow · top face (clip-path trapezoid) · wall
// shadow · edge. The amber hover state is driven by `[data-on="true"]` on the
// parent .item (see wall.module.css).

import s from "./wall.module.css";

export function Ledge() {
  return (
    <div className={s.ledge} aria-hidden="true">
      <div className={s.glow} />
      <div className={s.top} />
      <div className={s.wsh} />
      <div className={s.edge} />
    </div>
  );
}
