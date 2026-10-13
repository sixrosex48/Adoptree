import { useEffect, useRef, useState } from 'react';

export default function TreeArt() {
  const container = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) { setProgress(1); return; }
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = container.current?.getBoundingClientRect();
        if (!bounds) return;
        const length = Math.max(bounds.height - window.innerHeight, 1);
        setProgress(Math.max(0, Math.min(1, -bounds.top / length)));
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);

  const seedOpacity = Math.max(0, 1 - progress * 5);
  const sproutOpacity = Math.max(0, Math.min(1, (progress - .12) * 6, (0.7 - progress) * 6));
  const treeOpacity = Math.max(0, Math.min(1, (progress - .48) * 3));
  const treeScale = .45 + progress * .55;

  return (
    <div ref={container} className="growth-scroll" id="historia">
      <div className="growth-sticky">
        <div className="growth-copy">
          
          <h2>De semilla<br /><em>a árbol.</em></h2>
          <p>Desliza hacia abajo para ver cómo crece. Si vuelves a subir, el árbol regresa a semilla.</p>
          <div className="growth-progress"><span style={{ width: `${progress * 100}%` }} /></div>
          <div className="growth-labels"><span>01 · Semilla</span><span>02 · Crecimiento</span><span>03 · Futuro</span></div>
        </div>
        <div className="growth-art" role="img" aria-label="Ilustración de una semilla que crece hasta convertirse en árbol al desplazarse por la página">
          <div className="growth-orbit orbit-one" /><div className="growth-orbit orbit-two" />
          <div className="growth-sun" />
          <svg viewBox="0 0 500 540" aria-hidden="true">
            <ellipse cx="250" cy="473" rx="177" ry="29" fill="#d2dfbf" opacity=".55" />
            <path d="M80 457 Q250 437 420 457 L420 499 L80 499 Z" fill="#d6a987" />
            <path d="M80 457 Q250 437 420 457" fill="none" stroke="#b8805b" strokeWidth="5" />
            <g style={{ opacity: seedOpacity, transform: `translateY(${-progress * 20}px)`, transformOrigin: '250px 444px' }}>
              <ellipse cx="250" cy="445" rx="20" ry="13" fill="#7a583b" transform="rotate(-18 250 445)" />
              <path d="M245 441 Q251 433 259 437" stroke="#b78b5d" strokeWidth="2" fill="none" />
            </g>
            <g style={{ opacity: sproutOpacity, transform: `scale(${.7 + progress * .55})`, transformOrigin: '250px 455px' }}>
              <path d="M250 455 Q251 400 250 354" fill="none" stroke="#567c3d" strokeWidth="7" strokeLinecap="round" />
              <path d="M249 400 Q218 366 198 379 Q206 408 249 414" fill="#94b46c" />
              <path d="M250 383 Q274 346 302 358 Q294 391 250 398" fill="#75a354" />
              <path d="M249 354 Q240 335 249 318 Q264 334 250 356" fill="#9abc72" />
            </g>
            <g style={{ opacity: treeOpacity, transform: `scale(${treeScale})`, transformOrigin: '250px 456px' }}>
              <path d="M235 455 C242 397 239 338 229 260 L271 260 C261 336 258 397 266 455 Z" fill="#8d5c38" />
              <path d="M250 365 Q202 320 178 260 M253 331 Q301 285 320 235" stroke="#8d5c38" strokeWidth="17" strokeLinecap="round" fill="none" />
              <circle cx="170" cy="244" r="75" fill="#77a657" />
              <circle cx="302" cy="233" r="84" fill="#5c914a" />
              <circle cx="238" cy="172" r="90" fill="#8eb86c" />
              <circle cx="209" cy="256" r="71" fill="#91ba72" />
              <circle cx="313" cy="302" r="58" fill="#76a65d" />
              <circle cx="132" cy="250" r="42" fill="#8db56c" />
              <circle cx="346" cy="197" r="43" fill="#83af60" />
              <path d="M198 167 Q214 155 230 157 M293 220 Q309 204 327 207 M150 270 Q160 257 171 259" fill="none" stroke="#abd089" strokeWidth="4" opacity=".6" strokeLinecap="round" />
            </g>
          </svg>
          <span className="art-spark spark-a">✳</span><span className="art-spark spark-b">✳</span>
        </div>
      </div>
    </div>
  );
}
