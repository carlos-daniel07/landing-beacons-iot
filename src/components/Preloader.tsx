import { useEffect, useRef } from "react";
import gsap from "gsap";

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();

    gsap.set(path, {
      strokeDasharray: length,
      strokeDashoffset: length,
      fill: "transparent", // Aseguramos que arranque sin relleno
    });

    const tl = gsap.timeline({
      onComplete: () => {
        onComplete();
      },
    });

    // 1. Dibujar el trazo del logo suavemente estilo láser
    tl.to(path, {
      strokeDashoffset: 0,
      duration: 1.6,
      ease: "power2.inOut",
    })
      // 2. Encender un brillo suave en el interior de las letras
      .to(
        path,
        {
          fill: "rgba(0, 119, 255, 0.12)", // Un azul eléctrico sutil muy clean & tech
          stroke: "#3b82f6", // El borde brilla en azul corporativo
          duration: 0.6,
        },
        "-=0.4",
      )
      // 3. Pausa dramática
      .to({}, { duration: 0.5 })
      // 4. Cortina cinematográfica hacia arriba
      .to(preloaderRef.current, {
        yPercent: -100,
        duration: 1.2,
        ease: "power4.inOut",
      });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={preloaderRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090e] select-none overflow-hidden"
    >
      {/* Resplandor ambiental trasero muy sutil estilo cinematic */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Contenedor del Logotipo Vectorial */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center"
      >
        <svg
          className="w-72 sm:w-96 h-auto drop-shadow-[0_0_20px_rgba(0,119,255,0.2)]"
          viewBox="0 0 220 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Trazos vectoriales precisos para formar la silueta "BTT" minimalista */}
          <path
            ref={pathRef}
            d="M30 20 H55 C65 20 65 35 55 35 H30 V20 Z M30 35 H58 C68 35 68 50 58 50 H30 V35 Z M85 20 H125 M105 20 V50 M135 20 H175 M155 20 V50"
            stroke="#8a99ad"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
