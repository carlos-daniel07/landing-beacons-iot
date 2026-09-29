import { useRef, useLayoutEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  RoundedBox,
  Image,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type SignalState = { active: boolean; target: THREE.Vector3 };

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
          color="#00BEFD"
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
        <meshBasicMaterial color="#00BEFD" />
      </mesh>
      <mesh ref={ringRef} position={[0, 0, -0.001]}>
        <ringGeometry args={[0.08, 0.1, 32]} />
        <meshBasicMaterial color="#00BEFD" transparent />
      </mesh>
    </group>
  );
}

// 3. El Beacon S8 Sólido — con movimiento propio (respiración + balanceo),
// independiente del scroll, para que nunca se vea congelado.
function BrandedBeacon() {
  const idleRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!idleRef.current) return;
    const t = state.clock.elapsedTime;
    idleRef.current.position.y = Math.sin(t * 0.8) * 0.08;
    idleRef.current.rotation.y = Math.sin(t * 0.4) * 0.12;
    idleRef.current.rotation.x = Math.sin(t * 0.6) * 0.03;
  });

  return (
    <group ref={idleRef}>
      <RoundedBox args={[1.5, 2.2, 0.4]} radius={0.15} smoothness={4}>
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.15}
          metalness={0.15}
        />
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

// 3.5 Señal animada: un punto de luz que viaja del beacon hacia un
// "target" (el dashboard en Enlace Azul, el celular en BeaconNAV).
// No usa React state para el on/off (evita re-renders): lee un ref
// mutable que las ScrollTrigger de ScrollAnimationManager actualizan.

function SignalTrail({
  fromRef,
  signalRef,
}: {
  fromRef: React.RefObject<THREE.Group | null>;
  signalRef: React.RefObject<SignalState>;
}) {
  const dotRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Objetos reutilizables: se crean una sola vez, no en cada frame
  const mid = useMemo(() => new THREE.Vector3(), []);
  const point = useMemo(() => new THREE.Vector3(), []);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]),
    [],
  );

  useFrame((state) => {
    const signal = signalRef.current;
    if (!dotRef.current || !glowRef.current || !fromRef.current || !signal)
      return;

    dotRef.current.visible = signal.active;
    glowRef.current.visible = signal.active;
    if (!signal.active) return;

    const start = fromRef.current.position;
    const end = signal.target;

    mid.set(
      (start.x + end.x) / 2,
      Math.max(start.y, end.y) + 1.4,
      (start.z + end.z) / 2,
    );
    curve.points[0].copy(start);
    curve.points[1].copy(mid);
    curve.points[2].copy(end);
    curve.updateArcLengths();

    const t = (state.clock.elapsedTime * 0.35) % 1;
    curve.getPointAt(t, point);

    dotRef.current.position.copy(point);
    glowRef.current.position.copy(point);

    const pulse = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.15;
    dotRef.current.scale.setScalar(pulse);
  });

  return (
    <>
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color="#66d9ff" />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#00BEFD" transparent opacity={0.25} />
      </mesh>
    </>
  );
}

// 4. Cerebro GSAP: una fase por cada sección real de la página, más dos
// ScrollTrigger simples que prenden/apagan la señal animada según en qué
// sección esté el usuario. Necesita los ids "hero", "blue-link" y
// "beacon-nav" que ya están en tu index.astro.
function ScrollAnimationManager() {
  const beaconRef = useRef<THREE.Group>(null);
  const networkRef = useRef<THREE.Group>(null);
  const signalRef = useRef<SignalState>({
    active: false,
    target: new THREE.Vector3(),
  });

  useLayoutEffect(() => {
    if (!beaconRef.current || !networkRef.current) return;

    const heroEl = document.getElementById("hero");
    const blueLinkEl = document.getElementById("blue-link");
    const beaconNavEl = document.getElementById("beacon-nav");

    if (!heroEl || !blueLinkEl || !beaconNavEl) {
      console.warn(
        "ScrollAnimationManager: falta alguno de los ids hero/blue-link/beacon-nav en el DOM.",
      );
      return;
    }

    // ESTADO INICIAL (Hero)
    beaconRef.current.position.set(1.5, 0.2, 0);
    beaconRef.current.rotation.set(0, -0.25, 0);
    beaconRef.current.scale.set(1, 1, 1);

    const ctx = gsap.context(() => {
      // FASE 1: Hero → Enlace Azul.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: heroEl,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        })
        .to(networkRef.current!.position, { y: -10 }, 0)
        // Movido a la izquierda (x: -2.5) y un poco más abajo (y: 0)
        .to(beaconRef.current!.position, { x: 0.3, y: 0.6, z: 1.5 }, 0)
        .to(beaconRef.current!.rotation, { x: -0.1, y: 0.2, z: 0 }, 0)
        .to(beaconRef.current!.scale, { x: 0.4, y: 0.4, z: 0.4 }, 0);

      // FASE 2: Enlace Azul → BeaconNAV.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: blueLinkEl,
            start: "bottom bottom",
            end: "bottom top",
            scrub: 1,
          },
        })
        .to(beaconRef.current!.position, { x: 1.3, y: 0.6, z: -0.9 }, 0)
        .to(beaconRef.current!.scale, { x: 0.5, y: 0.5, z: 0.5 }, 0)
        .to(beaconRef.current!.rotation, { x: 0, y: 0.2, z: 0 }, 0);

      // FASE 3: BeaconNAV → Hardware.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: beaconNavEl,
            start: "bottom bottom",
            end: "bottom left",
            scrub: 1,
          },
        })
        .to(beaconRef.current!.position, { y: -5 }, 0)
        .to(beaconRef.current!.scale, { x: 0.1, y: 0.1, z: 0.1 }, 0);

      // SEÑAL 1: mientras el usuario está DENTRO de Enlace Azul, el beacon
      // "dispara" hacia el dashboard. Ajusta este target (x,y,z) a dónde
      // cae visualmente tu mockup del dashboard en la pantalla.
      ScrollTrigger.create({
        trigger: blueLinkEl,
        start: "top center",
        end: "bottom center",
        onEnter: () => {
          signalRef.current.active = true;
          signalRef.current.target.set(2, -0.4, 0.2);
        },
        onEnterBack: () => {
          signalRef.current.active = true;
          signalRef.current.target.set(2, -0.4, 0.2);
        },
        onLeave: () => (signalRef.current.active = false),
        onLeaveBack: () => (signalRef.current.active = false),
      });

      // SEÑAL 2: dentro de BeaconNAV, la señal ahora viaja hacia el
      // celular. Mismo comentario: ajusta el target a tu mockup real.
      ScrollTrigger.create({
        trigger: beaconNavEl,
        start: "top center",
        end: "bottom center",
        onEnter: () => {
          signalRef.current.active = true;
          signalRef.current.target.set(2.4, -0.8, -0.3);
        },
        onEnterBack: () => {
          signalRef.current.active = true;
          signalRef.current.target.set(2.4, -0.8, -0.3);
        },
        onLeave: () => (signalRef.current.active = false),
        onLeaveBack: () => (signalRef.current.active = false),
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <group ref={networkRef}>
        <TechNetwork />
      </group>
      <group ref={beaconRef}>
        <BrandedBeacon />
      </group>
      <SignalTrail fromRef={beaconRef} signalRef={signalRef} />
    </>
  );
}

// Controlador de Cámara Interactivo (Parallax + leve drift automático)
function CameraRig() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const idleX = Math.sin(t * 0.15) * 0.15;
    const idleY = Math.cos(t * 0.12) * 0.1;
    const mouseX = state.mouse.x * 0.3;
    const mouseY = state.mouse.y * 0.3;
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      mouseX + idleX,
      0.05,
    );
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      mouseY + idleY,
      0.05,
    );
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function SceneCanvas() {
  return (
    <div className="w-full h-dvh relative z-0 bg-slate-50 overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(0,190,253,0.22)_0%,transparent_70%)]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-125 h-125 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(102,217,255,0.25)_0%,transparent_70%)]"></div>

      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ alpha: true, powerPreference: "high-performance" }}
      >
        <Environment preset="city" />

        {/* <ContactShadows
          position={[0, -2, 0]}
          opacity={0.3}
          scale={15}
          blur={2.5}
          far={4}
          color="#1e293b"
        /> */}

        <CameraRig />
        <ScrollAnimationManager />
      </Canvas>
    </div>
  );
}
