import { useRef, useState, useEffect } from 'react';

export default function SignaturePad({ title, onClear }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const scaleCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#1F4E79'; // Primary color
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
    scaleCanvas();
    window.addEventListener('resize', scaleCanvas);
    return () => window.removeEventListener('resize', scaleCanvas);
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e) => {
    setDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    canvas.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => setDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    if(onClear) onClear();
  };

  return (
    <div className="flex flex-col gap-2 flex-1 w-full">
      <div className="flex items-center justify-between">
        <p className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-primary font-bold">
          {title}
        </p>
        <button
          type="button"
          onClick={clearSignature}
          aria-label={`Clear ${title}`}
          className="text-[10px] font-mono text-slate-500 hover:text-red-500 transition-colors focus:outline-none focus:underline"
        >
          Clear ✕
        </button>
      </div>

      <div className="relative rounded-lg overflow-hidden bg-white border-2 border-slate-200 hover:border-primary/60 focus-within:border-primary transition-colors signature-box" style={{ height: '100px' }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Signature pad"
          tabIndex="0"
          className="block w-full h-full touch-none cursor-crosshair signature-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {!hasDrawn && (
          <p
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-slate-400 pointer-events-none select-none text-center px-2"
          >
            Sign here
          </p>
        )}

        <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"></div>
        <img className="sig-print-preview hidden w-full h-full object-contain" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="Signature print preview" />
      </div>
    </div>
  );
}
