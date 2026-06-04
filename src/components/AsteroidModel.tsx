"use client";

import { useLayoutEffect } from "react";
import { Clone, useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

const MODEL_URL = "/models/asteroid.glb";

export default function AsteroidModel({ scale }: { scale: number }) {
  const { scene } = useGLTF(MODEL_URL);
  const gl = useThree((s) => s.gl);
  const rootScene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useLayoutEffect(() => {
    gl.compile(rootScene, camera);
  }, [gl, rootScene, camera, scene]);

  return (
    <group scale={scale}>
      <Clone object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
