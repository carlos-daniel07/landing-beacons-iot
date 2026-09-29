import { lazy, Suspense, useEffect, useState } from "react";

// El Canvas 3D completo (Three.js + GSAP + drei) solo se descarga si el
// visitante es desktop — este import() dinámico hace que el bundler
// (Vite/Astro) lo separe en su propio chunk, así los celulares nunca
// bajan ese peso.
const SceneCanvas = lazy(() => import("./Scenecanvas"));

function useIsDesktop(breakpointPx = 1024) {
  // null = "todavía no sabemos" (evita parpadeos/asunciones incorrectas
  // en el primer render, antes de que el navegador nos diga el ancho real)
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [breakpointPx]);

  return isDesktop;
}

// Fallback liviano para mobile/tablet chico: mismo logo con un pulso CSS,
// sin WebGL ni Three.js. Mantiene la identidad visual del beacon.
function MobileFallback() {
  return (
    <div className="w-full h-dvh relative z-0 bg-slate-50 overflow-hidden flex items-center justify-center">
      <div className="absolute top-[-10%] right-[-10%] w-[75] h-[75] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(0,190,253,0.22)_0%,transparent_70%)]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[75] h-[75] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(102,217,255,0.25)_0%,transparent_70%)]" />
      <div className="relative flex items-center justify-center opacity-25">
        <span className="absolute inline-flex h-24 w-24 rounded-full bg-brand-400/30 animate-ping" />
        <img
          src="/Logo.png"
          alt="BIT Beacon"
          className="relative w-16 h-16 object-contain drop-shadow-lg"
        />
      </div>
    </div>
  );
}

export default function Scene() {
  const isDesktop = useIsDesktop();

  if (isDesktop === null) return null;
  if (!isDesktop) return <MobileFallback />;

  return (
    <Suspense fallback={<MobileFallback />}>
      <SceneCanvas />
    </Suspense>
  );
}
