import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";
import { motion } from "framer-motion-3d";

// Placeholder Character (Walking Capsule)
function WalkingCharacter() {
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (meshRef.current) {
            // Simple Bobbing Animation to simulate walking
            const t = state.clock.getElapsedTime();
            meshRef.current.position.y = Math.sin(t * 10) * 0.1;
            meshRef.current.rotation.y = Math.sin(t * 2) * 0.1; // Gentle sway
        }
    });

    return (
        <group ref={meshRef} position={[0, -1, 0]}>
            {/* Body */}
            <mesh position={[0, 1, 0]}>
                <capsuleGeometry args={[0.3, 1, 4, 8]} />
                <meshStandardMaterial color="#ec4899" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.8, 0]}>
                <sphereGeometry args={[0.25, 32, 32]} />
                <meshStandardMaterial color="#fce7f3" roughness={0.2} />
            </mesh>
            {/* Eyes (to show direction) */}
            <mesh position={[0.1, 1.85, 0.2]}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[-0.1, 1.85, 0.2]}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshStandardMaterial color="black" />
            </mesh>
        </group>
    );
}

// Main Scene Component
export default function LoginScene() {
    return (
        <div className="h-full w-full min-h-[400px] lg:min-h-[500px]">
            <Canvas shadows>
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={50} />

                    <ambientLight intensity={0.5} />
                    <spotLight
                        position={[10, 10, 10]}
                        angle={0.15}
                        penumbra={1}
                        intensity={1}
                        castShadow
                    />
                    <pointLight position={[-10, -10, -10]} intensity={1} color="#ec4899" />

                    {/* Animated Entrance Wrapper (Framer Motion 3D) */}
                    <motion.group
                        initial={{ z: -5, opacity: 0 }}
                        animate={{ z: 0, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                        <WalkingCharacter />
                    </motion.group>

                    <Environment preset="city" />
                    <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />

                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        minPolarAngle={Math.PI / 2.2}
                        maxPolarAngle={Math.PI / 2.2}
                        autoRotate
                        autoRotateSpeed={0.5}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
