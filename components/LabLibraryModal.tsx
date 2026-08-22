import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LabSceneConfig } from '../lab/types';
import { pendulumExperiment } from '../lab/experiments/pendulum';
import { freeFallExperiment } from '../lab/experiments/freeFall';
import { uniformMotion2CarsExperiment } from '../lab/experiments/uniformMotion2Cars';
import { acceleratedMotionExperiment } from '../lab/experiments/acceleratedMotion';
import { X, FlaskConical, Car, ArrowDown, TrendingUp, Search } from 'lucide-react';

interface LabLibraryModalProps {
  onClose: () => void;
  onSelect: (config: LabSceneConfig) => void;
}

const experiments = [
  { config: pendulumExperiment, icon: <FlaskConical size={24} />, desc: 'Mô phỏng dao động của con lắc đơn bằng Matter.js' },
  { config: freeFallExperiment, icon: <ArrowDown size={24} />, desc: 'Khảo sát rơi tự do với gia tốc trọng trường g' },
  { config: uniformMotion2CarsExperiment, icon: <Car size={24} />, desc: 'Bài toán 2 xe chuyển động ngược chiều, gặp nhau' },
  { config: acceleratedMotionExperiment, icon: <TrendingUp size={24} />, desc: 'Chuyển động thẳng biến đổi đều (nhanh dần/chậm dần)' }
];

export function LabLibraryModal({ onClose, onSelect }: LabLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExperiments = experiments.filter(exp => 
    exp.config.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    exp.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        color: '#f3f4f6',
        borderRadius: '12px',
        width: '800px',
        maxWidth: '90vw',
        maxHeight: '85vh',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #333'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px', color: '#60a5fa' }}>
            <FlaskConical size={24} />
            Thư viện Bài Thí Nghiệm
          </h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ccc' }}>
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #333', backgroundColor: '#252525' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm bài thí nghiệm..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                borderRadius: '6px',
                border: '1px solid #444',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* List of Experiments */}
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', overflowY: 'auto' }}>
          {filteredExperiments.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              Không tìm thấy bài thí nghiệm nào phù hợp.
            </div>
          ) : (
            filteredExperiments.map(exp => (
              <div 
                key={exp.config.id}
              onClick={() => onSelect(exp.config)}
              style={{
                border: '1px solid #333',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#60a5fa';
                e.currentTarget.style.backgroundColor = '#333333';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.backgroundColor = '#2a2a2a';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#60a5fa' }}>
                {exp.icon}
                <strong style={{ fontSize: '16px', color: '#f3f4f6' }}>{exp.config.title}</strong>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af', lineHeight: 1.5 }}>
                {exp.desc}
              </p>
            </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
