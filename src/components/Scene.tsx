import { useRef, useLayoutEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Float, Image } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// 1. Red de Datos (Fondo)
function TechNetwork() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current)
      meshRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
  });
  return (
    <group position={[0, -2, -4]} rotation={[-Math.PI / 2.2, 0, 0]}>
      <mesh ref={meshRef}>
        <planeGeometry args={[40, 40, 40, 40]} />
        <meshBasicMaterial
          color="#0044ff"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
}

// 2. Efecto LED (El Radar del Beacon)
function BlinkingLED({ position }: { position: [number, number, number] }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ringRef.current) {
      const scale = (state.clock.elapsedTime * 1.5) % 1;
      ringRef.current.scale.set(1 + scale * 4, 1 + scale * 4, 1);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        (1 - scale) * 0.8;
    }
  });
  return (
    <group position={position}>
      <mesh>
        <circleGeometry args={[0.06, 32]} />
        <meshBasicMaterial color="#0077ff" />
      </mesh>
      <mesh ref={ringRef} position={[0, 0, -0.001]}>
        <ringGeometry args={[0.08, 0.1, 32]} />
        <meshBasicMaterial color="#0077ff" transparent />
      </mesh>
    </group>
  );
}

// 3. El Beacon S8 Sólido
function BrandedBeacon() {
  return (
    <group>
      <RoundedBox args={[1.5, 2.2, 0.4]} radius={0.15} smoothness={4}>
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
      </RoundedBox>
      <Image
        url="/Logo.png"
        position={[0, 0.2, 0.21]}
        scale={[0.8, 0.8]}
        transparent
      />
      <BlinkingLED position={[0, -0.6, 0.211]} />
    </group>
  );
}

// 4. Cerebro GSAP: Limpio y Elegante
function ScrollAnimationManager() {
  const beaconRef = useRef<THREE.Group>(null);
  const networkRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    if (!beaconRef.current || !networkRef.current) return;

    // ESTADO INICIAL (Hero)
    beaconRef.current.position.set(1.5, 0.2, 0);
    beaconRef.current.rotation.set(0, -0.25, 0);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      },
    });

    // FASE 1: Enlace Azul (El 3D cede el espacio a la interfaz HTML)
    tl.to(networkRef.current.position, { y: -10, duration: 1 }, 0) // La red baja y se esconde
      .to(beaconRef.current.position, { x: -2.5, y: 0, z: 1.5, duration: 1 }, 0) // El Beacon va a la izquierda
      .to(
        beaconRef.current.rotation,
        { x: 0.1, y: 0.8, z: -0.1, duration: 1 },
        0,
      ); // Rota para lucir imponente

    // PAUSA LARGA: Congelamos el 3D para que el usuario lea las tarjetas HTML tranquilo
    tl.to({}, { duration: 3 });

    // SOLUCIÓN AL ERROR DE TYPESCRIPT:
    // Usamos llaves {} para que la función no retorne el objeto timeline
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <>
      <group ref={networkRef}>
        <TechNetwork />
      </group>
      <group ref={beaconRef}>
        <Float speed={2} rotationIntensity={0.05} floatIntensity={0.2}>
          <BrandedBeacon />
        </Float>
      </group>
    </>
  );
}

export default function Scene() {
  return (
    <div className="w-full h-dvh relative z-0">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <color attach="background" args={["#05070a"]} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.5}
          color="#ffffff"
        />
        <directionalLight
          position={[-5, -10, -5]}
          intensity={1}
          color="#0077ff"
        />

        <ScrollAnimationManager />
      </Canvas>
    </div>
  );
}
