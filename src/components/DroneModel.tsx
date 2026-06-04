"use client";

import { useLayoutEffect } from "react";
import { Clone, useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

const MODEL_URL = "/models/scene-transformed.glb";

const MODEL_SCALE = 2;

export default function DroneModel() {
  const { scene } = useGLTF(MODEL_URL);
  const gl = useThree((s) => s.gl);
  const rootScene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useLayoutEffect(() => {
    gl.compile(rootScene, camera);
  }, [gl, rootScene, camera, scene]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} scale={MODEL_SCALE}>
      <Clone object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
