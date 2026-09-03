import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Html } from "@react-three/drei";
import * as THREE from "three";

// 1. El modelo procedural del Beacon S8 con UI Flotante
function ProceduralS8Beacon({
  onClick,
  isZoomed,
}: {
  onClick: () => void;
  isZoomed: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current) {
      // Si NO está zoomeado, flota y gira. Si SÍ está zoomeado, se queda quieto para leer la info.
      if (!isZoomed) {
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
        if (!hovered) groupRef.current.rotation.y += 0.005;
      } else {
        // Suaviza la rotación para que quede de frente al leer
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          0,
          0.05,
        );
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          0,
          0.05,
        );
      }
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={onClick}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Cuerpo principal */}
      <RoundedBox args={[1.5, 2.2, 0.4]} radius={0.15} smoothness={4}>
        <meshStandardMaterial
          color={hovered && !isZoomed ? "#f0f8ff" : "#ffffff"}
          roughness={0.3}
          metalness={0.1}
        />
      </RoundedBox>

      {/* Hueco trasero Anti-Tamper */}
      <RoundedBox
        args={[1.1, 1.6, 0.45]}
        radius={0.1}
        smoothness={4}
        position={[0, 0, -0.05]}
      >
        <meshStandardMaterial color="#cccccc" roughness={0.4} metalness={0.5} />
      </RoundedBox>

      {/* Botón negro */}
      <mesh position={[0, 0.4, -0.28]}>
        <boxGeometry args={[0.2, 0.3, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>

      {/* LA MAGIA: Interfaz HTML anclada al modelo 3D (Solo aparece al hacer zoom) */}
      {isZoomed && (
        <Html position={[1.2, 0, 0]} center zIndexRange={[100, 0]}>
          <div className="w-64 sm:w-80 p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,119,255,0.2)] text-left pointer-events-none opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
            <div className="flex items-center space-x-2 mb-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <h3 className="text-xl font-black text-white tracking-wide">
                S8 Anti-Tamper
              </h3>
            </div>

            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              Beacon de seguridad avanzada con sensor antimanipulación. Diseñado
              para rastreo de activos críticos en entornos industriales.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <div className="bg-white/5 px-2 py-1.5 rounded-lg border border-white/5 text-blue-300">
                BLE 5.0
              </div>
              <div className="bg-white/5 px-2 py-1.5 rounded-lg border border-white/5 text-green-300">
                Batería 5 Años
              </div>
              <div className="bg-white/5 px-2 py-1.5 rounded-lg border border-white/5 text-purple-300">
                IP67 Waterproof
              </div>
              <div className="bg-white/5 px-2 py-1.5 rounded-lg border border-white/5 text-red-300">
                Alerta Tamper
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-gray-500 uppercase tracking-widest font-bold">
              Click para cerrar
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// 2. Controlador de la Cámara
function CameraRig({ zoomed }: { zoomed: boolean }) {
  useFrame((state) => {
    // Ajustamos la posición de la cámara: si hay zoom, la movemos un poco a la izquierda para darle espacio a la UI
    const targetPosition = zoomed
      ? new THREE.Vector3(-0.8, 0, 3)
      : new THREE.Vector3(0, 0, 6);
    state.camera.position.lerp(targetPosition, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

// 3. Escena Principal
export default function Scene() {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleBeaconClick = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="w-full h-dvh">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.5}
          color="#ffffff"
          castShadow
        />
        <directionalLight
          position={[-5, -10, -5]}
          intensity={2}
          color="#0077ff"
        />
        <spotLight position={[0, 5, -5]} intensity={2} color="#8a2be2" />

        <CameraRig zoomed={isZoomed} />
        <ProceduralS8Beacon onClick={handleBeaconClick} isZoomed={isZoomed} />
      </Canvas>
    </div>
  );
}
