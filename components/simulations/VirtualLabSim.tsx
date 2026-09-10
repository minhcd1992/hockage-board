'use client';
import React, { useState, useEffect, useRef } from 'react';

type Point = { x: number; y: number };

export const VirtualLabSim = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waypoints, setWaypoints] = useState<Point[]>([]);
  const [isPlayingState, setIsPlayingState] = useState(false);
  
  // Real-time metrics
  const [metrics, setMetrics] = useState({ s: 0, d: 0 });

  // Animation references
  const animRef = useRef({
    progress: 0,
    lastTime: 0,
    reqId: 0,
    isPlaying: false
  });

  // Keep a ref of waypoints to ensure animation loop always has latest points
  // without dealing with complex closure dependency issues
  const waypointsRef = useRef<Point[]>([]);
  useEffect(() => {
    waypointsRef.current = waypoints;
  }, [waypoints]);

  const ANIM_SPEED = 150; // pixels per second

  // Helpers
  const calculateTotalDistance = (points: Point[], upToIndex?: number) => {
    let dist = 0;
    const limit = upToIndex !== undefined ? upToIndex : points.length - 1;
    for (let i = 0; i < limit; i++) {
      const dx = points[i+1].x - points[i].x;
      const dy = points[i+1].y - points[i].y;
      dist += Math.sqrt(dx*dx + dy*dy);
    }
    return dist;
  };

  const calculateDisplacement = (start: Point, end: Point) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.sqrt(dx*dx + dy*dy);
  };

  const getPositionAtDistance = (points: Point[], dist: number): Point | null => {
    if (points.length === 0) return null;
    if (points.length === 1 || dist <= 0) return points[0];
    
    let accumulated = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i+1];
      const segmentLen = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
      
      if (accumulated + segmentLen >= dist) {
        const remaining = dist - accumulated;
        const ratio = remaining / segmentLen;
        return {
          x: p1.x + (p2.x - p1.x) * ratio,
          y: p1.y + (p2.y - p1.y) * ratio
        };
      }
      accumulated += segmentLen;
    }
    return points[points.length - 1];
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number, color: string) => {
    const headlen = 12;
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();
    
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(tox, toy);
    ctx.fill();
  };

  const drawCar = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Simple top-down car
    ctx.fillStyle = '#ef4444'; // Red car
    ctx.fillRect(-12, -8, 24, 16);
    // Windshield
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(2, -6, 6, 12);
    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(10, -7, 3, 3);
    ctx.fillRect(10, 4, 3, 3);
    
    ctx.restore();
  };

  const drawScene = (currentDist?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support High-DPI displays to fix blurriness
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Virtual width and height
    const width = rect.width;
    const height = rect.height;

    // Apply scaling
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const pts = waypointsRef.current;
    const totalDist = calculateTotalDistance(pts);
    const renderDist = currentDist !== undefined ? currentDist : totalDist;

    ctx.clearRect(0, 0, width, height);

    // Draw grid (absolute pixels to prevent ugly scaling)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for(let i = 0; i < width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for(let i = 0; i < height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    if (pts.length === 0) {
      // Empty state
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Nhấp vào màn hình để chọn điểm xuất phát và các điểm lộ trình.', width / 2, height / 2);
      ctx.restore();
      return;
    }

    // Draw full path trace (faded)
    if (pts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const currentPos = getPositionAtDistance(pts, renderDist);

    // Draw active animated path
    if (pts.length > 1 && currentPos) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      
      let accumulated = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i+1];
        const segLen = Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2);
        if (accumulated + segLen <= renderDist) {
          ctx.lineTo(p2.x, p2.y);
          accumulated += segLen;
        } else {
          ctx.lineTo(currentPos.x, currentPos.y);
          break;
        }
      }
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Draw displacement vector
    if (pts.length > 1 && currentPos) {
      const distToCurrent = calculateDisplacement(pts[0], currentPos);
      if (distToCurrent > 5) {
        drawArrow(ctx, pts[0].x, pts[0].y, currentPos.x, currentPos.y, '#ef4444');
      }
    }

    // Draw waypoints
    pts.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === 0 ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#10b981' : '#64748b'; // Start is green
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      if (i === 0) {
        ctx.fillStyle = '#047857';
        ctx.font = 'bold 12px Inter';
        ctx.fillText('Start', p.x - 12, p.y - 12);
      }
    });

    // Draw car at current position
    if (currentPos && pts.length > 1) {
      let angle = 0;
      let accumulated = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i+1];
        const segLen = Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2);
        if (accumulated + segLen >= renderDist || i === pts.length - 2) {
          angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          break;
        }
        accumulated += segLen;
      }
      drawCar(ctx, currentPos.x, currentPos.y, angle);
    } else if (pts.length === 1) {
      drawCar(ctx, pts[0].x, pts[0].y, 0);
    }

    ctx.restore();
  };

  useEffect(() => {
    if (!animRef.current.isPlaying) {
      drawScene();
      const pts = waypointsRef.current;
      const totalS = calculateTotalDistance(pts);
      const totalD = pts.length > 0 ? calculateDisplacement(pts[0], pts[pts.length - 1]) : 0;
      setMetrics({ s: totalS, d: totalD });
    }
  }, [waypoints]);

  // Handle resizing nicely
  useEffect(() => {
    const handleResize = () => {
      if (!animRef.current.isPlaying) {
        drawScene();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const animateLoop = (currentTime: number) => {
    if (!animRef.current.isPlaying) return;
    
    const dt = (currentTime - animRef.current.lastTime) / 1000;
    animRef.current.lastTime = currentTime;

    const pts = waypointsRef.current;
    const totalDist = calculateTotalDistance(pts);
    animRef.current.progress += (ANIM_SPEED * dt);
    
    if (animRef.current.progress >= totalDist) {
      animRef.current.progress = totalDist;
      animRef.current.isPlaying = false;
      setIsPlayingState(false);
    }

    drawScene(animRef.current.progress);
    
    const currentPos = getPositionAtDistance(pts, animRef.current.progress);
    if (currentPos) {
      setMetrics({
        s: animRef.current.progress,
        d: calculateDisplacement(pts[0], currentPos)
      });
    }

    if (animRef.current.isPlaying) {
      animRef.current.reqId = requestAnimationFrame(animateLoop);
    }
  };

  const handleStart = () => {
    if (waypoints.length < 2 || animRef.current.isPlaying) return;
    animRef.current.isPlaying = true;
    setIsPlayingState(true);
    animRef.current.progress = 0;
    animRef.current.lastTime = performance.now();
    animRef.current.reqId = requestAnimationFrame(animateLoop);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (animRef.current.isPlaying) return; // Disable adding points while animating
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // We map mouse coords directly to local coords
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setWaypoints(prev => [...prev, { x, y }]);
  };

  const handleUndo = () => {
    if (animRef.current.isPlaying || waypoints.length === 0) return;
    setWaypoints(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (animRef.current.isPlaying) {
      cancelAnimationFrame(animRef.current.reqId);
      animRef.current.isPlaying = false;
      setIsPlayingState(false);
    }
    setWaypoints([]);
    setMetrics({ s: 0, d: 0 });
    // Trigger immediate clear frame
    requestAnimationFrame(() => drawScene());
  };

  // Convert pixels to display units (e.g. 10px = 1m)
  const PIXELS_PER_METER = 10;

  return (
    <div className="glass-panel rounded-2xl p-6 mb-8 border border-slate-200 shadow-xl bg-white flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <span>🎮 Sandbox: Vẽ Quỹ Đạo Bất Kỳ</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Hãy nhấp vào màn hình để tự tạo quỹ đạo di chuyển của riêng bạn!</p>
        </div>
        
        {/* Controls Panel */}
        <div className="flex gap-2 bg-slate-100 p-2 rounded-lg shrink-0">
          <button 
            onClick={handleStart} 
            disabled={isPlayingState || waypoints.length < 2}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-md shadow-sm font-bold transition flex items-center gap-2"
          >
            ▶ Chạy
          </button>
          <button 
            onClick={handleUndo} 
            disabled={isPlayingState || waypoints.length === 0}
            className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-md shadow-sm font-bold transition flex items-center gap-2"
          >
            ↺ Hoàn tác
          </button>
          <button 
            onClick={handleClear} 
            disabled={waypoints.length === 0 && !isPlayingState}
            className="bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-md shadow-sm font-bold transition flex items-center gap-2"
          >
            ✕ Xóa hết
          </button>
        </div>
      </div>

      <div className="relative border-2 border-slate-300 rounded-xl overflow-hidden bg-slate-50 cursor-crosshair group">
        
        {/* Real-time Metrics Dashboard overlay */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-slate-200 p-4 rounded-xl shadow-lg z-10 w-56 pointer-events-none transition-transform group-hover:scale-105">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-1 bg-blue-500 rounded"></div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Quãng đường (s)</span>
            </div>
            <div className="text-3xl font-black text-blue-600">
              {(metrics.s / PIXELS_PER_METER).toFixed(1)} <span className="text-lg">m</span>
            </div>
          </div>
          
          <div className="h-px w-full bg-slate-200 my-3"></div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 text-red-500 flex items-center justify-center">→</div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Độ dịch chuyển (d)</span>
            </div>
            <div className="text-3xl font-black text-red-600">
              {(metrics.d / PIXELS_PER_METER).toFixed(1)} <span className="text-lg">m</span>
            </div>
          </div>
        </div>
        
        {/* Interactive Canvas */}
        <canvas 
          ref={canvasRef} 
          onClick={handleCanvasClick}
          className="w-full h-[450px] touch-none" 
        ></canvas>
        
      </div>
      
      <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <span className="text-blue-500 text-xl">💡</span>
        <p className="text-sm text-blue-900 leading-relaxed">
          <strong>Nhận xét:</strong> Quãng đường (<span className="text-blue-600 font-bold">s</span>) luôn tăng dần và tích lũy qua từng điểm. 
          Trong khi đó, Độ dịch chuyển (<span className="text-red-600 font-bold">d</span>) phụ thuộc hoàn toàn vào đường nối thẳng từ <span className="text-emerald-600 font-bold">Start</span> đến vị trí hiện tại. 
          Hãy thử vẽ một vòng khép kín để thấy độ dịch chuyển biến mất về 0 nhé!
        </p>
      </div>
    </div>
  );
};
