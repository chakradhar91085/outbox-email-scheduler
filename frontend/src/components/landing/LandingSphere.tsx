import React, { useEffect, useRef } from 'react';

export const LandingSphere: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chars = '·:·-·+·*·%·#·@·░·▒·▓·█';
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.52;

      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const points: { x: number; y: number; z: number; char: string }[] = [];

      // Generate animated sphere points
      for (let phi = 0; phi < Math.PI * 2; phi += 0.16) {
        for (let theta = 0; theta < Math.PI; theta += 0.16) {
          const x = Math.sin(theta) * Math.cos(phi + time * 0.4);
          const y = Math.sin(theta) * Math.sin(phi + time * 0.4);
          const z = Math.cos(theta);

          // Rotate around Y axis
          const rotY = time * 0.25;
          const newX = x * Math.cos(rotY) - z * Math.sin(rotY);
          const newZ = x * Math.sin(rotY) + z * Math.cos(rotY);

          // Rotate around X axis
          const rotX = time * 0.18;
          const newY = y * Math.cos(rotX) - newZ * Math.sin(rotX);
          const finalZ = y * Math.sin(rotX) + newZ * Math.cos(rotX);

          const depth = (finalZ + 1) / 2;
          const charIndex = Math.min(
            chars.length - 1,
            Math.max(0, Math.floor(depth * (chars.length - 1)))
          );

          points.push({
            x: centerX + newX * radius,
            y: centerY + newY * radius,
            z: finalZ,
            char: chars[charIndex],
          });
        }
      }

      // Sort by Z for depth rendering
      points.sort((a, b) => a.z - b.z);

      // Draw points with subtle dark-indigo glow
      points.forEach((point) => {
        const alpha = Math.max(0.08, (point.z + 1) * 0.35);
        ctx.fillStyle = `rgba(165, 180, 252, ${alpha})`;
        ctx.fillText(point.char, point.x, point.y);
      });

      time += 0.018;
      frameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
};
