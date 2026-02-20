import React, { useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Get the button's position for the circular reveal origin
    const button = buttonRef.current;
    if (!button) {
      toggleTheme();
      return;
    }

    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Calculate the max radius needed to cover the entire screen
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      toggleTheme();
      return;
    }

    // Create the circular reveal transition
    const transition = document.startViewTransition(() => {
      toggleTheme();
    });

    try {
      await transition.ready;

      // Animate the new view with a circular clip-path
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 500,
          easing: 'ease-out',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    } catch (e) {
      // Fallback if transition fails
      console.log('View transition failed, theme still toggled');
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className="p-1.5 sm:p-3 rounded-full bg-[var(--header-icon-bg)] text-[var(--header-icon-fg)] hover:text-[var(--accent-primary)] transition-colors duration-300 hover:scale-110 active:scale-95"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM3.05 4.536a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM16.95 15.464a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414zM19 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM4 10a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggleButton;
