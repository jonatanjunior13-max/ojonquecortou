import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function CustomCursor() {
  const location = useLocation();
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const mouseCoords = useRef({ x: 0, y: 0 });
  const ringCoords = useRef({ x: 0, y: 0 });

  const isAdmin = location.pathname.startsWith('/admin');

  // Determine visibility during render based on environment and context
  const isFinePointer = typeof window !== 'undefined' ? window.matchMedia('(pointer: fine)').matches : false;
  const shouldBeVisible = !isAdmin && isFinePointer;

  useEffect(() => {
    // Disable custom cursor on admin pages
    if (isAdmin) {
      document.body.classList.remove('custom-cursor-active');
      return;
    }

    if (!isFinePointer) return;

    const onMouseMove = (e) => {
      mouseCoords.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const updateRing = () => {
      // Linear interpolation (lerp) for smooth magnetic lag
      const ease = 0.15;
      ringCoords.current.x += (mouseCoords.current.x - ringCoords.current.x) * ease;
      ringCoords.current.y += (mouseCoords.current.y - ringCoords.current.y) * ease;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringCoords.current.x}px, ${ringCoords.current.y}px, 0)`;
      }
      requestAnimationFrame(updateRing);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('.interactive') ||
        target.classList?.contains('btn')
      ) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    const animId = requestAnimationFrame(updateRing);

    // Hide native cursor
    document.body.classList.add('custom-cursor-active');

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animId);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [isAdmin, isFinePointer]);

  if (!shouldBeVisible || isAdmin) return null;

  return (
    <>
      <div
        ref={dotRef}
        className={`custom-cursor-dot ${hovered ? 'hovered' : ''} ${clicked ? 'clicked' : ''}`}
      />
      <div
        ref={ringRef}
        className={`custom-cursor-ring ${hovered ? 'hovered' : ''} ${clicked ? 'clicked' : ''}`}
      />
    </>
  );
}
