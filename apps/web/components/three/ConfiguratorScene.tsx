'use client';

import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { CatalogModule, PlacedModule } from '@harper/core';

interface SceneProps {
  placements: PlacedModule[];
  modules: Map<string, CatalogModule>;
  heightM: number;
  color: string;
}

/** 单个模块的近似沙发几何：底座 + 座垫（P0 用几何体代替 GLB，资产 W2 替换） */
function SofaModule({
  mod,
  placement,
  color,
}: {
  mod: CatalogModule;
  placement: PlacedModule;
  color: string;
}) {
  const { w, d, h } = mod.dimensionsM;
  const ry = (placement.rotationY * Math.PI) / 180;
  const y = h / 2;

  const cushionH = Math.max(0.06, h * 0.28);
  return (
    <group position={[placement.x, 0, placement.z]} rotation={[0, ry, 0]}>
      {/* 底座 */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* 座垫 */}
      <mesh position={[0, h - cushionH / 2 - 0.005, 0]} castShadow>
        <boxGeometry args={[w * 0.92, cushionH, d * 0.9]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
    </group>
  );
}

function Floor({ widthM, depthM }: { widthM: number; depthM: number }) {
  const pad = 0.6;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <planeGeometry args={[widthM + pad * 2, depthM + pad * 2]} />
      <meshStandardMaterial color="#ece5da" roughness={1} />
    </mesh>
  );
}

export default function ConfiguratorScene({
  placements,
  modules,
  heightM,
  color,
}: SceneProps) {
  const bounds = useMemo(() => {
    if (placements.length === 0) return { w: 2.5, d: 1.5 };
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const p of placements) {
      const m = modules.get(p.moduleCode);
      if (!m) continue;
      const w = m.dimensionsM.w;
      const d = m.dimensionsM.d;
      minX = Math.min(minX, p.x - w / 2);
      maxX = Math.max(maxX, p.x + w / 2);
      minZ = Math.min(minZ, p.z - d / 2);
      maxZ = Math.max(maxZ, p.z + d / 2);
    }
    return { w: maxX - minX, d: maxZ - minZ };
  }, [placements, modules]);

  const fit = Math.max(bounds.w, bounds.d, 1.5) + 1.2;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [fit, fit * 0.9, fit], fov: 42 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#f4efe7']} />
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Floor widthM={bounds.w} depthM={bounds.d} />

      {placements.map((p) => {
        const mod = modules.get(p.moduleCode);
        if (!mod) return null;
        return <SofaModule key={p.index} mod={mod} placement={p} color={color} />;
      })}

      <gridHelper
        args={[Math.ceil(fit) * 2, 20, new THREE.Color('#c8bda9'), new THREE.Color('#d8cebc')]}
        position={[0, 0.002, 0]}
      />
      <OrbitControls enableDamping dampingFactor={0.12} makeDefault />
    </Canvas>
  );
}