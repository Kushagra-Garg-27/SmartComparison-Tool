import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  MeshTransmissionMaterial,
  Environment,
  Stars,
} from "@react-three/drei";
import * as THREE from "three";

/* ─── Floating Orb (main hero object) ─── */
function HeroOrb({
  mouse,
}: {
  mouse: React.RefObject<{ x: number; y: number }>;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const mx = mouse.current?.x ?? 0;
    const my = mouse.current?.y ?? 0;

    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.2 + my * 0.3;
      meshRef.current.rotation.y = t * 0.15 + mx * 0.3;
      meshRef.current.position.y = Math.sin(t * 0.5) * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.8 + Math.sin(t * 1.5) * 0.1);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.08 + Math.sin(t * 2) * 0.03;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.4) * 0.1;
      ringRef.current.rotation.z = t * 0.2;
    }
  });

  return (
    <group>
      {/* Glow backdrop */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#7B2FF2" transparent opacity={0.06} />
      </mesh>

      {/* Main distorted orb */}
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh ref={meshRef} scale={1.1}>
          <icosahedronGeometry args={[1, 8]} />
          <MeshDistortMaterial
            color="#7B2FF2"
            emissive="#3B1A8F"
            emissiveIntensity={0.6}
            roughness={0.15}
            metalness={0.9}
            distort={0.25}
            speed={2}
            transparent
            opacity={0.85}
          />
        </mesh>
      </Float>

      {/* Orbital ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.8, 0.015, 16, 100]} />
        <meshBasicMaterial color="#00C2FF" transparent opacity={0.5} />
      </mesh>

      {/* Inner glow core */}
      <mesh scale={0.4}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#00FFE0" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

/* ─── Particle field ─── */
function ParticleField() {
  const count = 300;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null!);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      ref.current.rotation.x =
        Math.sin(state.clock.getElapsedTime() * 0.01) * 0.1;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#00C2FF"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Camera rig that follows mouse ─── */
function CameraRig({
  mouse,
}: {
  mouse: React.RefObject<{ x: number; y: number }>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const mx = mouse.current?.x ?? 0;
    const my = mouse.current?.y ?? 0;
    camera.position.x += (mx * 0.5 - camera.position.x) * 0.02;
    camera.position.y += (my * 0.3 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ─── Main exported scene ─── */
export const HeroScene: React.FC<{
  mouse: React.RefObject<{ x: number; y: number }>;
}> = ({ mouse }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#05060F"]} />
      <fog attach="fog" args={["#05060F", 5, 25]} />

      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#7B2FF2" />
      <pointLight position={[-5, -3, 3]} intensity={0.4} color="#00C2FF" />
      <pointLight position={[0, 3, -5]} intensity={0.3} color="#FF2E97" />

      <HeroOrb mouse={mouse} />
      <ParticleField />
      <Stars
        radius={50}
        depth={50}
        count={800}
        factor={3}
        saturation={0.5}
        fade
        speed={0.5}
      />
      <CameraRig mouse={mouse} />
    </Canvas>
  );
};
