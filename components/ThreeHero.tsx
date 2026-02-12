import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Stars, Float, Environment, Sparkles, ScrollControls, useScroll, Scroll, Text, MeshTransmissionMaterial, PerformanceMonitor, FogExp2 } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion as motionDOM } from 'framer-motion';

// --- Types ---
interface ThreeHeroProps {
    onFinish: () => void;
}

// --- 1. WARP PARTICLES (Speed Lines) ---
const WarpParticles = ({ count = 1000, velocity }: { count?: number, velocity: number }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Spread particles along the entire tunnel path (Z: 10 to -80)
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const x = THREE.MathUtils.randFloatSpread(120);
            const y = THREE.MathUtils.randFloatSpread(120);
            // Deep spread to cover the whole journey
            const z = THREE.MathUtils.randFloatSpread(200) - 40;
            temp.push({ x, y, z });
        }
        return temp;
    }, [count]);

    useFrame((state) => {
        if (!meshRef.current) return;

        const speed = Math.max(0.1, velocity * 2);

        particles.forEach((particle, i) => {
            let { x, y, z } = particle;

            // Move stars towards camera (positive Z direction provided camera moves negative? No, camera moves negative, stars should flow past?)
            // Actually, if camera moves 10 -> -50, and we want "speed", stars should move +Z relative to camera or just stay fixed?
            // User requested "speed lines", usually implying they fly PAST you.
            // If we move camera -Z, stars at fixed Z will naturally flow past. 
            // BUT to get " Warp Speed", we might need to move them opposite or just stretch them.
            // Let's just stretch them based on velocity for now, and let camera motion handle the "flow".

            // To make it infinite, loop them.
            // Camera is moving 10 -> -50.
            // If particle z > camera.z + 10, respawn at camera.z - 100?
            // Simpler: Just Scale Z.

            dummy.position.set(x, y, z);

            // STRETCH: Scale Z based on velocity
            const stretch = 1 + Math.min(velocity * 15, 30);
            dummy.scale.set(1, 1, stretch);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null as any, null as any, count]}>
            <boxGeometry args={[0.08, 0.08, 1]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </instancedMesh>
    );
};

// --- 2. LIQUID TUNNEL ---
const LiquidTunnel = ({ opacity, speed }: { opacity: number, speed: number }) => {
    const groupRef = useRef<THREE.Group>(null);
    const materialRef = useRef<any>(null);

    useFrame((state, delta) => {
        if (!groupRef.current || opacity < 0.01) return;

        // Spin
        groupRef.current.rotation.z += delta * (0.2 + speed * 3);

        // Distortion Pulse
        if (materialRef.current) {
            materialRef.current.distortion = 2 + speed * 6;
            materialRef.current.color.setHSL(0.6, 0.6, 0.5 + speed * 0.4); // Blue to Bright
            materialRef.current.chromaticAberration = 0.1 + speed * 0.5;
        }
    });

    return (
        <group ref={groupRef} visible={opacity > 0.01} position={[0, 0, -20]}> {/* Centered in the path */}
            {/* Liquid Wall */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[12, 12, 100, 48, 1, true]} />
                {/* @ts-ignore */}
                <MeshTransmissionMaterial
                    ref={materialRef}
                    backside
                    backsideThickness={5}
                    thickness={3}
                    roughness={0} // Glass
                    transmission={1}
                    ior={1.2}
                    anisotropicBlur={0.2}
                    distortionScale={0.5}
                    temporalDistortion={0.2}
                    color="#4f46e5"
                />
            </mesh>
            {/* Wireframe backing */}
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.98, 0.98, 1]}>
                <cylinderGeometry args={[12, 12, 100, 24, 10, true]} />
                <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.05} />
            </mesh>
        </group>
    );
};


// --- 1.2 AMBER SPHERE (The Suspension Chamber) ---
const AmberSphere = ({ opacity, scale }: { opacity: number, scale: number }) => {
    const meshRef = useRef<THREE.Mesh>(null!);

    useFrame((state, delta) => {
        if (!meshRef.current || opacity < 0.01) return;
        meshRef.current.rotation.y -= delta * 0.2;
        meshRef.current.rotation.z += delta * 0.1;
    });

    return (
        <mesh ref={meshRef} scale={scale} visible={opacity > 0.01}>
            <sphereGeometry args={[1.4, 64, 64]} />
            {/* @ts-ignore */}
            <MeshTransmissionMaterial
                backside
                backsideThickness={2}
                thickness={3}
                roughness={0.1}
                transmission={1}
                ior={1.4}
                chromaticAberration={0.4} // heavy dispersion
                anisotropicBlur={0.5}
                distortion={0.8}
                distortionScale={0.5}
                temporalDistortion={0.4}
                color="#ffae00" // Amber
                bg="#000000"
            />
        </mesh>
    );
};

// --- 3. ADJUSTABLE ASTRONAUT MODEL (Liquid Glass) ---
const AstronautModel = React.forwardRef(({ mouse, velocity, isLarge }: { mouse: React.MutableRefObject<{ x: number, y: number }>, velocity: number, isLarge: boolean }, ref: any) => {
    const { nodes } = useGLTF('/Meshy_AI_Cyber_Sentinel.glb') as any;
    const innerRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (innerRef.current) {
            // "HEAVY" Parallax Drift (Lag 1.5s -> very low lerp)
            const damp = 0.02;
            innerRef.current.position.x = THREE.MathUtils.lerp(innerRef.current.position.x, mouse.current.x * (isLarge ? 1 : 2), damp);
            innerRef.current.position.y = THREE.MathUtils.lerp(innerRef.current.position.y, mouse.current.y * (isLarge ? 1 : 1.5) - (isLarge ? 2 : 1), damp);
            innerRef.current.rotation.y = THREE.MathUtils.lerp(innerRef.current.rotation.y, mouse.current.x * 0.5, damp);
        }
    });

    // Liquid Glass Logic: Melts at speed
    const distortion = 0.4 + (velocity * 2.0); // More reactive
    const thickness = 5.0; // "Solid Crystal" look

    return (
        <group ref={ref} dispose={null}>
            <group ref={innerRef}>
                <group scale={[2.5, 2.5, 2.5]}>
                    {Object.keys(nodes).map((key) => {
                        const node = nodes[key];
                        if (node.isMesh) {
                            return (
                                <mesh key={key} geometry={node.geometry} position={node.position} rotation={node.rotation} scale={node.scale}>
                                    <MeshTransmissionMaterial
                                        backside
                                        backsideThickness={5}
                                        thickness={thickness}
                                        chromaticAberration={0.1 + velocity * 0.5} // Prism effect on speed
                                        distortion={distortion}
                                        distortionScale={0.5}
                                        temporalDistortion={0.2}
                                        roughness={0.05}
                                        transmission={1.0} // Perfect glass
                                        color="#ffffff"
                                        bg="#000000"
                                    />
                                </mesh>
                            )
                        }
                        return null;
                    })}
                </group>
            </group>
        </group>
    );
});

// --- SCENE MANAGER (NARRATIVE DIRECTOR) ---
const SceneManager = ({ aberrationOffset, mouse }: any) => {
    const scroll = useScroll();
    const { camera } = useThree();
    const astronautRef = useRef<THREE.Group>(null);

    // States
    const [velocity, setVelocity] = useState(0);
    const [bgCol, setBgCol] = useState('#000000');

    // Visibility/FX States
    const [sphereOp, setSphereOp] = useState(1);
    const [sphereScale, setSphereScale] = useState(1);
    const [tunnelOp, setTunnelOp] = useState(0);
    const [isLarge, setIsLarge] = useState(false);

    useFrame((state, delta) => {
        const offset = scroll.offset; // 0 to 1
        const deltaScroll = scroll.delta;

        // 1. PHYSICS (Momentum)
        const currentVel = Math.abs(deltaScroll) * 100;
        const smoothVel = THREE.MathUtils.lerp(velocity, currentVel, 0.1);
        setVelocity(smoothVel);

        // --- NARRATIVE TIMELINE (Strict 4-Step) ---

        // PHASE I: SUSPENSION (0% - 15%)
        // Character floating in Amber Sphere. Camera static/slow.
        if (offset < 0.15) {
            setSphereOp(1);
            setSphereScale(1);

            // Astronaut Visible
            if (astronautRef.current) {
                astronautRef.current.visible = true;
                astronautRef.current.scale.setScalar(1);
                astronautRef.current.position.z = 0;
            }
            setIsLarge(false);

            // Camera Rest
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, 10, 0.1);
            setTunnelOp(0);
        }

        // PHASE II: THE DIVE & SHATTER (15% - 30%)
        // Camera flies 10 -> -50. Sphere "Shatters".
        else if (offset >= 0.15 && offset < 0.3) {
            // Normalize this phase (0 to 1)
            const p = (offset - 0.15) / 0.15;

            // Shatter Effect: Scale UP rapidly and opacity DOWN
            setSphereScale(1 + p * 10);
            setSphereOp(1 - p);

            // Camera Dive
            const targetZ = THREE.MathUtils.lerp(10, -50, p);
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);

            // Hide Astronaut halfway through dive to avoid looking inside them
            if (astronautRef.current) {
                astronautRef.current.visible = p < 0.5;
            }
            setIsLarge(false);

            // Fade in Tunnel
            setTunnelOp(p);
        }

        // PHASE III: THE WARP (30% - 85%)
        // Tunnel Run. High Speed.
        else if (offset >= 0.3 && offset < 0.85) {
            setSphereOp(0);
            setTunnelOp(1);

            if (astronautRef.current) astronautRef.current.visible = false;
            setIsLarge(false);

            // Camera held at speed depth
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, -50, 0.1);

            // WARP FOV (35 -> 120) based on velocity + base warp
            const baseFov = 35;
            const warpFov = Math.min(120, baseFov + (smoothVel * 300));
            camera.fov = THREE.MathUtils.lerp(camera.fov, warpFov, 0.1);
            camera.updateProjectionMatrix();
        }

        // PHASE IV: THE ARRIVAL (85% - 100%)
        // Pop out. Flash.
        else if (offset >= 0.85) {
            setSphereOp(0);
            setTunnelOp(1 - (offset - 0.85) / 0.15); // Fade out tunnel

            // POP
            if (astronautRef.current) {
                astronautRef.current.visible = true;
                astronautRef.current.position.z = -60;
                astronautRef.current.scale.setScalar(5);
            }
            setIsLarge(true);

            // Snap FOV back
            camera.fov = THREE.MathUtils.lerp(camera.fov, 45, 0.1);
            camera.updateProjectionMatrix();
        }

        // ATMOSPHERE FLASH
        if (offset > 0.9) {
            setBgCol('#ffffff'); // Blinding White
        } else if (offset > 0.85) {
            setBgCol('#eff6ff'); // Blue-White Arrival
        } else {
            setBgCol('#000000'); // Void
        }

        // COMPOSER FX
        const targetAberration = 0.002 + Math.min(smoothVel * 0.2, 0.3); // Heavy aberration on speed
        aberrationOffset.x = targetAberration;
        aberrationOffset.y = targetAberration;
    });

    return (
        <PerformanceMonitor>
            <color attach="background" args={[bgCol]} />
            <fogExp2 attach="fog" args={[bgCol, 0.02]} />

            <ambientLight intensity={isLarge ? 1.5 : 0.2} />
            <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={2} color="#4f46e5" />

            {/* STAGE I: SUSPENSION */}
            <AmberSphere opacity={sphereOp} scale={sphereScale} />

            {/* STAGE III: TUNNEL */}
            <WarpParticles count={1500} velocity={velocity} />
            <LiquidTunnel opacity={tunnelOp} speed={velocity} />

            {/* STAGE IV: UI */}
            <group visible={isLarge} position={[0, 0, -70]}>
                <Text position={[0, 6, 0]} fontSize={6} color="black" anchorX="center" anchorY="middle" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff">
                    FAMLINK
                </Text>
            </group>

            <Float speed={2} rotationIntensity={isLarge ? 0.2 : 0.5} floatIntensity={0.5}>
                <AstronautModel ref={astronautRef} mouse={mouse} velocity={velocity} isLarge={isLarge} />
            </Float>

            <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.5 + velocity} radius={0.6} />
                <Noise opacity={0.05} />
                <Vignette eskil={false} offset={0.1} darkness={isLarge ? 0.5 : 1.1} />
                {/* @ts-ignore */}
                <ChromaticAberration offset={aberrationOffset as unknown as THREE.Vector2} />
            </EffectComposer>
        </PerformanceMonitor>
    );
};


// --- MAIN ENTRY ---
const ThreeHero: React.FC<ThreeHeroProps> = ({ onFinish }) => {
    const mouse = useRef({ x: 0, y: 0 });
    const aberrationOffset = useMemo(() => new THREE.Vector2(0.002, 0.002), []);

    const handleMouseMove = (e: React.MouseEvent) => {
        // Normalize -1 to 1
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        mouse.current = { x, y };
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-black z-10" onMouseMove={handleMouseMove}>
            <Canvas
                className="w-full h-full"
                shadows
                dpr={[1, 1.5]}
                gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
                // Initial camera at 10 to see model at 0
                camera={{ position: [0, 0, 10], fov: 35 }}
            >
                {/* More pages = slower, more cinematic scroll */}
                <ScrollControls pages={8} damping={0.2} style={{ scrollbarWidth: 'none' }}>
                    <SceneManager aberrationOffset={aberrationOffset} mouse={mouse} />

                    {/* UI OVERLAY */}
                    <Scroll html style={{ width: '100vw', height: '100vh' }}>
                        {/* 0%: INTRO */}
                        <div className="w-full h-screen flex flex-col items-center justify-center pointer-events-none text-white mix-blend-difference">
                            <motionDOM.h1
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                className="text-9xl font-bold tracking-tighter mb-4"
                            >
                                FamLink
                            </motionDOM.h1>
                            <p className="text-xs font-mono tracking-[1em] uppercase opacity-70">Beginning Transmission...</p>
                        </div>

                        {/* SPACER for the dive/tunnel */}
                        <div className="w-full h-[600vh]" />

                        {/* 100%: FINAL CTA */}
                        <div className="w-full h-screen flex items-center justify-center pointer-events-auto">
                            <button
                                onClick={onFinish}
                                className="px-16 py-6 bg-black text-white font-bold rounded-full text-2xl hover:scale-110 shadow-[0_0_80px_rgba(0,0,0,0.5)] transition-all duration-300 active:scale-95"
                            >
                                ENTER PLATFORM
                            </button>
                        </div>
                    </Scroll>
                </ScrollControls>
            </Canvas>
        </div>
    );
};

export default ThreeHero;
