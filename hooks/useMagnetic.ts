import { useRef, useState, useEffect } from 'react';

export const useMagnetic = () => {
    const ref = useRef<HTMLButtonElement | HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const { left, top, width, height } = element.getBoundingClientRect();
            const x = clientX - (left + width / 2);
            const y = clientY - (top + height / 2);
            setPosition({ x: x * 0.3, y: y * 0.3 }); // 0.3 is the magnetic strength
        };

        const handleMouseLeave = () => {
            setPosition({ x: 0, y: 0 });
        };

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return {
        ref,
        style: {
            transform: `translate(${position.x}px, ${position.y}px)`,
        }
    };
};
