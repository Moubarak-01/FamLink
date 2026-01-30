import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../contexts/ThemeContext';

// Placeholder 3D Character (Procedural Robot)
// In the future, replace this component's contents with:
// const { scene, animations } = useGLTF('/path/to/character.glb');
// const { actions } = useAnimations(animations, group);
const BreathingCharacter = () => {
    const group = useRef<THREE.Group>(null);
    const leftArm = useRef<THREE.Group>(null);
    const rightArm = useRef<THREE.Group>(null);
    const head = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!group.current || !leftArm.current || !rightArm.current || !head.current) return;

        const t = state.clock.getElapsedTime();

        // 1. Breathing / Floating (Gentle vertical bob)
        group.current.position.y = Math.sin(t * 1.5) * 0.08 - 0.2;

        // 2. Greeting Wave (Right Arm)
        // Gentle wave motion: composite waves for natural feel
        const waveBase = Math.sin(t * 2) * 0.1;
        const waveHand = Math.sin(t * 4) * 0.2;
        if (rightArm.current) rightArm.current.rotation.z = -0.5 + waveBase + waveHand;

        // 3. Relaxed Left Arm
        if (leftArm.current) leftArm.current.rotation.z = 0.5 + Math.sin(t * 1.5 + 1) * 0.05;

        // 4. Subtle Look Around (Head)
        head.current.rotation.y = Math.sin(t * 0.8) * 0.15;
        head.current.rotation.x = Math.sin(t * 0.5) * 0.05;
    });

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Warmer Materials for "Family-Centric" feel
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? "#6366f1" : "#e0e7ff", // Indigo-500 vs Indigo-100 base
        roughness: 0.3,
        metalness: 0.6,
        emissive: isDark ? "#4338ca" : "#ffffff", // Warmer deep glow
        emissiveIntensity: 0.15
    });

    const jointMaterial = new THREE.MeshStandardMaterial({
        color: isDark ? "#f472b6" : "#fbcfe8", // Pink-400 vs Pink-200 (Rose/Warm highlights)
        roughness: 0.4,
        metalness: 0.4
    });

    return (
        <group ref={group} dispose={null} scale={2}>
            {/* Head */}
            <mesh ref={head} position={[0, 1.5, 0]} material={bodyMaterial}>
                <sphereGeometry args={[0.28, 32, 32]} />
            </mesh>

            {/* Torso */}
            <mesh position={[0, 0.9, 0]} material={bodyMaterial}>
                <capsuleGeometry args={[0.22, 0.6, 4, 8]} />
            </mesh>

            {/* Arms - Pivot Groups for better rotation */}
            <group ref={leftArm} position={[-0.25, 1.25, 0]}>
                <mesh position={[-0.1, -0.25, 0]} material={jointMaterial} rotation={[0, 0, 0.2]}>
                    <capsuleGeometry args={[0.07, 0.55, 4, 8]} />
                </mesh>
            </group>

            <group ref={rightArm} position={[0.25, 1.25, 0]}>
                <mesh position={[0.1, -0.25, 0]} material={jointMaterial} rotation={[0, 0, -0.2]}>
                    <capsuleGeometry args={[0.07, 0.55, 4, 8]} />
                </mesh>
            </group>

            {/* Legs (Static/Relaxed) */}
            <group position={[-0.15, 0.5, 0]} rotation={[0, 0, 0.1]}>
                <mesh position={[0, -0.35, 0]} material={jointMaterial}>
                    <capsuleGeometry args={[0.09, 0.7, 4, 8]} />
                </mesh>
            </group>

            <group position={[0.15, 0.5, 0]} rotation={[0, 0, -0.1]}>
                <mesh position={[0, -0.35, 0]} material={jointMaterial}>
                    <capsuleGeometry args={[0.09, 0.7, 4, 8]} />
                </mesh>
            </group>
        </group>
    );
};

interface ThreeDCharacterProps {
    className?: string;
}

const ThreeDCharacter: React.FC<ThreeDCharacterProps> = ({ className }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`w-full h-full min-h-[500px] ${className}`}>
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 1, 5]} />

                {/* Lighting match for Glassmorphism */}
                <ambientLight intensity={isDark ? 0.4 : 0.7} />
                <spotLight
                    position={[10, 10, 10]}
                    angle={0.15}
                    penumbra={1}
                    intensity={isDark ? 1 : 0.5}
                    color={isDark ? "#a855f7" : "#fbcfe8"} /* Purple vs Pink */
                />
                <pointLight
                    position={[-10, -10, -10]}
                    intensity={0.5}
                    color={isDark ? "#2dd4bf" : "#fff"} /* Teal vs White */
                />

                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                    <BreathingCharacter />
                </Float>

                <ContactShadows
                    resolution={512}
                    scale={10}
                    blur={2}
                    opacity={0.2}
                    far={10}
                    color="#000000"
                />

                <Environment preset="city" />
            </Canvas>
        </div>
    );
};

export default ThreeDCharacter;
