import { useRef, useState, useEffect } from 'react';

export default function SignaturePad({ title, onClear }) {
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const hasDrawnRef = useRef(false);
  const [dataUrl, setDataUrl] = useState('');

  const updatePreview = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      if (hasDrawnRef.current) {
        setDataUrl(canvas.toDataURL('image/png'));
      } else {
        setDataUrl('');
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let currentWidth = 0;
    let currentHeight = 0;

    const scaleCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const newWidth = Math.round(rect.width * dpr);
      const newHeight = Math.round(rect.height * dpr);

      // Only resize and clear the canvas if the physical dimensions have actually changed
      if (currentWidth === newWidth && currentHeight === newHeight) {
        return;
      }

      // If dimensions changed and there's a signature, temporarily save it
      let savedDataUrl = null;
      if (hasDrawnRef.current) {
        savedDataUrl = canvas.toDataURL();
      }

      canvas.width = newWidth;
      canvas.height = newHeight;
      currentWidth = newWidth;
      currentHeight = newHeight;

      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#1F4E79'; // Primary color
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Restore drawing on resized canvas
      if (savedDataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          updatePreview();
        };
        img.src = savedDataUrl;
      } else {
        updatePreview();
      }
    };

    scaleCanvas();

    // Use ResizeObserver for accurate sizing, fallback to window resize
    let resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        scaleCanvas();
      });
      resizeObserver.observe(canvas.parentElement || canvas);
    } else {
      window.addEventListener('resize', scaleCanvas);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', scaleCanvas);
      }
    };
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e) => {
    setDrawing(true);
    setHasDrawn(true);
    hasDrawnRef.current = true;
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

  const handlePointerUp = () => {
    setDrawing(false);
    updatePreview();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    hasDrawnRef.current = false;
    updatePreview();
    if (onClear) onClear();
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
        <img
          ref={previewRef}
          className="sig-print-preview hidden w-full h-full object-contain"
          src={dataUrl || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}
          alt="Signature print preview"
        />
      </div>
    </div>
  );
}
