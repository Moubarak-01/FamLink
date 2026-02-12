
import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css'

const SmoothScroll = () => {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 2.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });

        const raf = (time: number) => {
            lenis.raf(time);
            requestAnimationFrame(raf);
        };

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    return null;
};

export default SmoothScroll;
