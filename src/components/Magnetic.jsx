import { useRef, useEffect } from 'react';

export default function Magnetic({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);

      // Magnetic pull factor
      const strength = 0.25;

      el.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
    };

    const onMouseLeave = () => {
      el.style.transform = 'translate3d(0px, 0px, 0)';
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="magnetic-wrap"
      style={{
        display: 'inline-block',
        transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  );
}
