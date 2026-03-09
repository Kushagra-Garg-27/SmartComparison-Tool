import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text, Line } from "@react-three/drei";
import * as THREE from "three";

interface NodeData {
  label: string;
  value: string;
  color: string;
  position: [number, number, number];
}

const NODES: NodeData[] = [
  { label: "Price", value: "$799", color: "#00FFE0", position: [-1.8, 1.2, 0] },
  {
    label: "Reviews",
    value: "4.8★",
    color: "#7B2FF2",
    position: [1.8, 1.2, 0],
  },
  { label: "Trust", value: "96%", color: "#00C2FF", position: [-1.8, -1.2, 0] },
  {
    label: "Deals",
    value: "3 Found",
    color: "#FF2E97",
    position: [1.8, -1.2, 0],
  },
];

const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [0, 2],
  [1, 3],
];

/* ─── Single animated node ─── */
function DataNode({ node, index }: { node: NodeData; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(t * 2 + index) * 0.08);
    }
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.12 + Math.sin(t * 3 + index * 1.5) * 0.06;
    }
  });

  return (
    <Float
      speed={1.5 + index * 0.3}
      rotationIntensity={0.1}
      floatIntensity={0.3}
    >
      <group position={node.position}>
        {/* Glow */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color={node.color} transparent opacity={0.1} />
        </mesh>

        {/* Core sphere */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.18, 32, 32]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </group>
    </Float>
  );
}

/* ─── Animated edge connector ─── */
function EdgeLine({
  from,
  to,
  index,
}: {
  from: [number, number, number];
  to: [number, number, number];
  index: number;
}) {
  const ref = useRef<any>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      ref.current.material.opacity = 0.15 + Math.sin(t * 2 + index) * 0.1;
    }
  });

  return (
    <Line
      ref={ref}
      points={[from, to]}
      color="#7B2FF2"
      lineWidth={1}
      transparent
      opacity={0.2}
      dashed
      dashScale={10}
      dashSize={0.2}
      gapSize={0.1}
    />
  );
}

/* ─── Neural Network Scene ─── */
export const NeuralNetworkScene: React.FC = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["transparent"]} />

      <ambientLight intensity={0.2} />
      <pointLight position={[3, 3, 3]} intensity={0.6} color="#7B2FF2" />
      <pointLight position={[-3, -3, 3]} intensity={0.4} color="#00C2FF" />

      {NODES.map((node, i) => (
        <DataNode key={node.label} node={node} index={i} />
      ))}

      {EDGES.map(([a, b], i) => (
        <EdgeLine
          key={`${a}-${b}`}
          from={NODES[a].position}
          to={NODES[b].position}
          index={i}
        />
      ))}
    </Canvas>
  );
};
