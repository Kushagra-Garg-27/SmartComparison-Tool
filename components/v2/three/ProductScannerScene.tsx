import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

/* ─── Floating product scanner orb ─── */
function ScannerOrb({ scanning }: { scanning: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ring1Ref = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const ring3Ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const speed = scanning ? 3 : 1;

    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.2 * speed;
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.3;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.5 * speed;
      ring1Ref.current.rotation.z = t * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = t * 0.4 * speed;
      ring2Ref.current.rotation.x = Math.PI / 3;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = -t * 0.3 * speed;
      ring3Ref.current.rotation.y = Math.PI / 4;
    }
  });

  const emissiveIntensity = scanning ? 1.2 : 0.5;

  return (
    <group>
      {/* Core scanner object */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh ref={meshRef} scale={0.8}>
          <octahedronGeometry args={[1, 2]} />
          <MeshDistortMaterial
            color="#00C2FF"
            emissive="#0066AA"
            emissiveIntensity={emissiveIntensity}
            roughness={0.1}
            metalness={0.95}
            distort={scanning ? 0.35 : 0.15}
            speed={scanning ? 4 : 1.5}
            transparent
            opacity={0.9}
          />
        </mesh>
      </Float>

      {/* Orbital rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.4, 0.012, 16, 80]} />
        <meshBasicMaterial color="#7B2FF2" transparent opacity={0.6} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.6, 0.008, 16, 80]} />
        <meshBasicMaterial color="#00FFE0" transparent opacity={0.35} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[1.8, 0.006, 16, 80]} />
        <meshBasicMaterial color="#FF2E97" transparent opacity={0.25} />
      </mesh>

      {/* Scan pulse */}
      {scanning && <ScanPulse />}
    </group>
  );
}

function ScanPulse() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const scale = 1 + (t % 2) * 0.8;
    const opacity = Math.max(0, 0.3 - (t % 2) * 0.15);
    if (ref.current) {
      ref.current.scale.setScalar(scale);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#00C2FF" transparent opacity={0.2} wireframe />
    </mesh>
  );
}

export const ProductScannerScene: React.FC<{ scanning?: boolean }> = ({
  scanning = false,
}) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["transparent"]} />
      <ambientLight intensity={0.15} />
      <pointLight position={[3, 3, 5]} intensity={0.7} color="#00C2FF" />
      <pointLight position={[-3, -2, 3]} intensity={0.4} color="#7B2FF2" />

      <ScannerOrb scanning={scanning} />
    </Canvas>
  );
};
