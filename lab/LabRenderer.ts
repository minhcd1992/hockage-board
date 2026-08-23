import { LabEngine } from './LabEngine';

export class LabRenderer {
  engine: LabEngine;

  constructor(engine: LabEngine) {
    this.engine = engine;
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();

    // Draw objects
    this.engine.config.objects.forEach(obj => {
      if (obj.type === 'stand') {
        const pivot = obj.position || { x: 400, y: 100 };
        ctx.fillStyle = '#64748b';
        ctx.fillRect(pivot.x - 50, pivot.y - 10, 100, 10);
        ctx.fillRect(pivot.x - 5, pivot.y, 10, 20);
      } else if (obj.type === 'vector-path' && obj.vectorPath) {
        ctx.save();
        
        // Scale to preserve 800x600 aspect ratio inside width/height
        const scale = Math.min(width / 800, height / 600);
        ctx.translate((width - 800 * scale) / 2, (height - 600 * scale) / 2);
        ctx.scale(scale, scale);

        const cx = 400; const cy = 300; const pxPerUnit = 40;
        
        // Draw grid
        ctx.strokeStyle = '#e2e8f0'; // Darker grid color
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for(let x = -10; x <= 10; x++) {
            let px = cx + x * pxPerUnit;
            ctx.moveTo(px, 0);
            ctx.lineTo(px, 600);
        }
        for(let y = -7; y <= 7; y++) {
            let py = cy - y * pxPerUnit;
            ctx.moveTo(0, py);
            ctx.lineTo(800, py);
        }
        ctx.stroke();

        // Draw axes
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, cy); ctx.lineTo(800, cy);
        ctx.moveTo(cx, 0); ctx.lineTo(cx, 600);
        ctx.stroke();

        // Arrowheads for axes
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath(); ctx.moveTo(800, cy); ctx.lineTo(790, cy - 5); ctx.lineTo(790, cy + 5); ctx.fill(); // X axis
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx - 5, 10); ctx.lineTo(cx + 5, 10); ctx.fill(); // Y axis

        // Draw ticks and labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        
        // X axis labels
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for(let x = -10; x <= 10; x+=2) {
            if (x === 0) continue;
            ctx.fillText(x.toString(), cx + x * pxPerUnit, cy + 18);
        }
        
        // Y axis labels
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for(let y = -6; y <= 6; y+=2) {
            if (y === 0) continue;
            ctx.fillText(y.toString(), cx - 8, cy - y * pxPerUnit + 4);
        }

        // Axis Titles
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('x (m)', 800 - 25, cy - 10);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('y (m)', cx + 15, 20);
        ctx.fillText('O', cx - 18, cy + 22);

        const drawArrow = (from: {x: number, y: number}, to: {x: number, y: number}, color: string, width: number = 3) => {
            if (from.x === to.x && from.y === to.y) return;
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = width;
            
            const startX = cx + from.x * pxPerUnit;
            const startY = cy - from.y * pxPerUnit;
            const endX = cx + to.x * pxPerUnit;
            const endY = cy - to.y * pxPerUnit;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Arrowhead
            const angle = Math.atan2(endY - startY, endX - startX);
            ctx.save();
            ctx.translate(endX, endY);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-12, -6);
            ctx.lineTo(-12, 6);
            ctx.fill();
            ctx.restore();
        };

        // Draw component displacement vectors (path segments)
        if (obj.vectorPath.waypoints.length > 0) {
           for (let i = 0; i < obj.vectorPath.waypoints.length - 1; i++) {
              drawArrow(obj.vectorPath.waypoints[i], obj.vectorPath.waypoints[i+1], '#60a5fa');
           }
           if (obj.vectorPath.dragPos) {
              drawArrow(obj.vectorPath.waypoints[obj.vectorPath.waypoints.length - 1], obj.vectorPath.dragPos, '#60a5fa');
           }
        }

        // Draw total displacement vector (độ dịch chuyển)
        if (obj.vectorPath.waypoints.length > 0) {
           const first = obj.vectorPath.waypoints[0];
           const last = obj.vectorPath.dragPos ? obj.vectorPath.dragPos : obj.vectorPath.waypoints[obj.vectorPath.waypoints.length - 1];
           
           drawArrow(first, last, '#ef4444', 4);

           // Draw Ninja
           ctx.fillStyle = 'blue';
           const ninjaX = cx + last.x * pxPerUnit;
           const ninjaY = cy - last.y * pxPerUnit;
           ctx.beginPath();
           ctx.arc(ninjaX, ninjaY, 12, 0, Math.PI * 2);
           ctx.fill();
           ctx.fillStyle = 'white';
           ctx.fillRect(ninjaX - 8, ninjaY - 4, 16, 4); // Headband
           ctx.fillStyle = 'black';
           ctx.beginPath();
           ctx.arc(ninjaX - 4, ninjaY - 2, 2, 0, Math.PI*2);
           ctx.arc(ninjaX + 4, ninjaY - 2, 2, 0, Math.PI*2);
           ctx.fill();

           // Draw UI stats
           const distToLast = obj.vectorPath.dragPos ? Math.hypot(obj.vectorPath.dragPos.x - obj.vectorPath.waypoints[obj.vectorPath.waypoints.length - 1].x, obj.vectorPath.dragPos.y - obj.vectorPath.waypoints[obj.vectorPath.waypoints.length - 1].y) : 0;
           const totalDist = obj.vectorPath.accumulatedDistance + distToLast;
           const displacement = Math.hypot(last.x - first.x, last.y - first.y);

           // Reset textBaseline for the stats text
           ctx.textBaseline = 'alphabetic';
           ctx.textAlign = 'left';
           
           ctx.fillStyle = 'white';
           ctx.strokeStyle = '#ccc';
           ctx.lineWidth = 1;
           ctx.fillRect(10, 10, 220, 106);
           ctx.strokeRect(10, 10, 220, 106);
           
           ctx.fillStyle = 'black';
           ctx.font = '16px sans-serif';
           ctx.fillText(`Quãng đường: ${totalDist.toFixed(1)} m`, 20, 36);
           ctx.fillStyle = 'red';
           ctx.fillText(`Độ dịch chuyển: ${displacement.toFixed(1)} m`, 20, 66);

           // Draw Reset Button
           ctx.fillStyle = '#ef4444';
           ctx.fillRect(20, 80, 80, 24);
           ctx.fillStyle = 'white';
           ctx.font = 'bold 14px sans-serif';
           ctx.textBaseline = 'middle';
           ctx.fillText('Reset', 40, 92);
        }

        ctx.restore();
      } else if (obj.type === 'pendulum') {
        const bob = this.engine.bodyMap.get(obj.id + '_bob') as Matter.Body;
        const constraint = this.engine.bodyMap.get(obj.id + '_constraint') as Matter.Constraint;
        
        if (bob && constraint && constraint.pointA) {
          // Draw string
          ctx.beginPath();
          ctx.moveTo(constraint.pointA.x, constraint.pointA.y);
          ctx.lineTo(bob.position.x, bob.position.y);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw bob
          ctx.beginPath();
          ctx.arc(bob.position.x, bob.position.y, 20, 0, 2 * Math.PI);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
          ctx.strokeStyle = '#1d4ed8';
          ctx.stroke();
        }
      } else if (obj.type === 'car' || obj.type === 'particle') {
        const k = obj.kinematics;
        if (!k || !k.currentPosition) return;
        
        const pos = k.currentPosition;
        ctx.save();
        ctx.translate(pos.x, pos.y);
        
        if (obj.type === 'car') {
          // Draw a simple car using SVG path
          ctx.fillStyle = obj.color || '#ef4444';
          ctx.beginPath();
          ctx.roundRect(-30, -15, 60, 20, 4); // body
          ctx.fill();
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(-15, 5, 8, 0, Math.PI * 2); // left wheel
          ctx.arc(15, 5, 8, 0, Math.PI * 2); // right wheel
          ctx.fill();
          
          if (obj.name) {
             ctx.fillStyle = '#ffffff';
             ctx.font = 'bold 12px sans-serif';
             ctx.textAlign = 'center';
             ctx.fillText(obj.name, 0, -2);
          }
        } else {
          // Particle
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fillStyle = obj.color || '#eab308';
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // Vectors
        const drawVec = (vx: number, vy: number, color: string, label: string, scale: number) => {
           if (Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01) return;
           ctx.save();
           ctx.strokeStyle = color;
           ctx.fillStyle = color;
           ctx.lineWidth = 2;
           
           const endX = vx * scale;
           const endY = vy * scale;
           
           ctx.beginPath();
           ctx.moveTo(0, 0);
           ctx.lineTo(endX, endY);
           ctx.stroke();
           
           const angle = Math.atan2(vy, vx);
           ctx.translate(endX, endY);
           ctx.rotate(angle);
           ctx.beginPath();
           ctx.moveTo(0, 0);
           ctx.lineTo(-8, -4);
           ctx.lineTo(-8, 4);
           ctx.fill();
           
           ctx.rotate(-angle);
           ctx.font = 'bold 12px sans-serif';
           ctx.fillText(label, 10, -10);
           ctx.restore();
        };

        if (obj.showVelocityVector && k.currentVelocity) {
           drawVec(k.currentVelocity.x, k.currentVelocity.y, '#22c55e', 'v', 1);
        }
        if (obj.showAccelerationVector && k.acceleration) {
           drawVec(k.acceleration.x, k.acceleration.y, '#ef4444', 'a', 2);
        }
        
        ctx.restore();
      } else if (obj.type === 'distance-measurement' && obj.distanceMeasurement) {
        const targetA = this.engine.config.objects.find(o => o.id === obj.distanceMeasurement?.targetA);
        const targetB = this.engine.config.objects.find(o => o.id === obj.distanceMeasurement?.targetB);
        if (targetA?.kinematics?.currentPosition && targetB?.kinematics?.currentPosition) {
           const p1 = targetA.kinematics.currentPosition;
           const p2 = targetB.kinematics.currentPosition;
           const y = obj.distanceMeasurement.offsetY;
           
           ctx.save();
           ctx.strokeStyle = '#f59e0b';
           ctx.setLineDash([5, 5]);
           ctx.lineWidth = 2;
           ctx.beginPath();
           ctx.moveTo(p1.x, y);
           ctx.lineTo(p2.x, y);
           ctx.stroke();
           
           // Vertical connector lines
           ctx.strokeStyle = '#94a3b8';
           ctx.beginPath();
           ctx.moveTo(p1.x, p1.y);
           ctx.lineTo(p1.x, y);
           ctx.moveTo(p2.x, p2.y);
           ctx.lineTo(p2.x, y);
           ctx.stroke();
           
           const dist = Math.abs(p2.x - p1.x);
           ctx.fillStyle = '#f59e0b';
           ctx.font = 'bold 14px sans-serif';
           ctx.textAlign = 'center';
           ctx.fillText(`${dist.toFixed(1)} m`, (p1.x + p2.x)/2, y - 10);
           ctx.restore();
        }
      } else if (obj.type === 'graph' && obj.graph) {
        const { bounds, series, title } = obj.graph;
        ctx.save();
        ctx.translate(bounds.x, bounds.y);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, bounds.w, bounds.h);
        ctx.strokeStyle = '#cbd5e1';
        ctx.strokeRect(0, 0, bounds.w, bounds.h);
        
        // Axes
        ctx.beginPath();
        ctx.moveTo(30, 30);
        ctx.lineTo(30, bounds.h - 30);
        ctx.lineTo(bounds.w - 10, bounds.h - 30);
        ctx.stroke();
        
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        if (title) {
          ctx.fillText(title, 10, 20);
        }
        ctx.fillText('t (s)', bounds.w - 30, bounds.h - 10);
        
        // Draw series
        const maxT = Math.max(10, this.engine.time);
        
        series.forEach(s => {
          if (s.history.length > 0) {
             ctx.beginPath();
             ctx.strokeStyle = s.color;
             ctx.lineWidth = 2;
             
             let maxVal = Math.max(10, ...s.history.map(h => Math.abs(h.val)));
             if (maxVal === 0) maxVal = 10;
             
             for (let i = 0; i < s.history.length; i++) {
               const h = s.history[i];
               const px = 30 + (h.t / maxT) * (bounds.w - 40);
               const originY = bounds.h - 30;
               const py = originY - (h.val / maxVal) * (bounds.h - 60);
               if (i === 0) ctx.moveTo(px, py);
               else ctx.lineTo(px, py);
             }
             ctx.stroke();
          }
        });
        
        ctx.restore();
      }
    });

    // Draw time
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`Time: ${this.engine.time.toFixed(2)}s`, 20, height - 20);

    ctx.restore();
  }
}
