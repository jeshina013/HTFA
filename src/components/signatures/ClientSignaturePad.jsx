import { useRef, useState, useEffect } from 'react';

export default function ClientSignaturePad() {
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
      ctx.strokeStyle = '#34d399'; // emerald-400
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
  };

  return (
    <div className="flex flex-col gap-3 flex-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">
          Customer Signature
        </p>
        <button
          type="button"
          onClick={clearSignature}
          aria-label="Clear customer signature"
          className="text-xs font-mono text-slate-500 hover:text-red-400 transition-colors focus:outline-none focus:underline"
        >
          Clear ✕
        </button>
      </div>

      <div className="relative rounded-lg overflow-hidden bg-slate-900 border-2 border-slate-600 hover:border-emerald-500/60 focus-within:border-emerald-400 transition-colors signature-box">
        <canvas
          ref={canvasRef}
          id="client-signature-canvas"
          role="img"
          aria-label="Signature pad"
          tabIndex="0"
          className="block w-full touch-none cursor-crosshair"
          style={{ height: '180px' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {!hasDrawn && (
          <p
            id="sig-placeholder"
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-xs font-mono text-slate-600 pointer-events-none select-none"
          >
            Sign here with finger, stylus, or mouse
          </p>
        )}

        <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"></div>
        <img id="sig-print-preview" src="" alt="Signature print preview" className="hidden w-full h-[180px] object-contain" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="customer-name" className="text-xs text-slate-400 font-mono">
          Customer Name
        </label>
        <input
          id="customer-name"
          type="text"
          name="customer_name"
          autoComplete="name"
          className="h-10 px-3 rounded-md bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          placeholder="Customer full name"
        />
      </div>
    </div>
  );
}
