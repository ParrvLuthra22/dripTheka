// StreetScene — the 1536×864 theka scene (+ the mobile letterbox backdrop).
// Server-renderable markup only; Entry finds the pieces by data-e and moves them.
//
//   store_cut.webp   the shopfront, with a TRANSPARENT doorway (694,240 → 1114,736)
//   tube             flickering tube-light glow over the sign
//   #opening         the cold-cobalt glare (#blue) + the rolling shutter, exactly over the doorway
//   spill / bloom    cobalt light cast on the street / a big screen-blended glow around the gap
//   scooter          the parked scooter
//
// There is no picture of the Wall here: the doorway is a hole, and the real <TheWall>
// is rendered underneath the whole Entry at 1:1.

import s from "./entry.module.css";

const SRC = "/theka/entry";

export function StreetScene() {
  return (
    <div className={`${s.layer} ${s.street}`} data-e="street">
      {/* mobile letterbox backdrop — Entry cuts the doorway hole out of it (doorwayHoleClip) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={s.streetBg} data-e="streetBg" src={`${SRC}/store_cut.webp`} alt="" fetchPriority="low" decoding="async" />
      <div className={s.scene} data-e="streetScene">
        {/* eslint-disable @next/next/no-img-element */}
        <img src={`${SRC}/store_cut.webp`} alt="" width={1536} height={864} fetchPriority="low" decoding="async" style={{ left: 0, top: 0, width: 1536, height: 864 }} />
        <div className={s.tube} />
        <div className={s.opening}>
          <div className={s.blue} data-e="blue" />
          <div className={s.shutterwrap} data-e="shutterwrap">
            <img className={s.shutter} src={`${SRC}/shutter.jpg`} alt="" fetchPriority="low" decoding="async" />
            <div className={s.shutterEdge} data-e="edge" />
          </div>
        </div>
        <div className={s.spill} data-e="spill" />
        <div className={s.bloom} data-e="bloom" />
        <img className={s.scooter} data-e="scooter" src={`${SRC}/scooter.png`} alt="" width={490} height={385} fetchPriority="low" decoding="async" />
        {/* eslint-enable @next/next/no-img-element */}
      </div>
    </div>
  );
}
