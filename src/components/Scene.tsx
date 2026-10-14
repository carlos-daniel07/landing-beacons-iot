import { lazy, Suspense, useEffect, useState } from "react";

// El Canvas 3D se carga solo en pantallas grandes; en celular no bajamos Three.js.
const SceneCanvas = lazy(() => import("./Scenecanvas"));

function useIsDesktop(breakpointPx = 1024) {
  // Esperamos a conocer el ancho real para no mostrar un fallback equivocado al cargar.
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

// En pantallas pequeñas mostramos el beacon con CSS, sin levantar WebGL.
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
