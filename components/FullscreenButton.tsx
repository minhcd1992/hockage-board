'use client';

import { useState, useSyncExternalStore } from 'react';
import { Maximize, Minimize } from 'lucide-react';

function subscribe(onChange: () => void) {
  document.addEventListener('fullscreenchange', onChange);
  return () => document.removeEventListener('fullscreenchange', onChange);
}

export function FullscreenButton() {
  const fullscreen = useSyncExternalStore(subscribe, () => !!document.fullscreenElement, () => false);
  const supported = useSyncExternalStore(subscribe, () => !!document.fullscreenEnabled, () => true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const label = fullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình';

  const toggle = async () => {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        // Include the toolbar and menus portaled to document.body.
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setError('Không thể bật/tắt toàn màn hình. Bạn có thể dùng phím F11 trên máy tính.');
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`tool-btn ${fullscreen ? 'active' : ''}`}
        onClick={toggle}
        disabled={!supported || pending}
        aria-label={label}
        aria-pressed={fullscreen}
        title={supported ? label : 'Trình duyệt không hỗ trợ toàn màn hình'}
      >
        {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
      {error && <span role="status" style={{ fontSize: 12, maxWidth: 260 }}>{error}</span>}
    </>
  );
}
