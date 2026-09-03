import { useState } from "react";
import Preloader from "./Preloader";

interface WrapperProps {
  children: React.ReactNode;
}

export default function PreloaderWrapper({ children }: WrapperProps) {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && <Preloader onComplete={() => setLoading(false)} />}

      {/* El fondo 3D se renderiza y se queda fijo atrás */}
      <div className="fixed inset-0 z-0">{children}</div>
    </>
  );
}
