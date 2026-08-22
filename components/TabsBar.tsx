'use client';

import React, { useRef } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { FileUp, X, PenTool, FlaskConical } from 'lucide-react';

export function TabsBar() {
  const { tabs, activeTabId, setActiveTab, removeTab, addTab } = useBoardStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newId = crypto.randomUUID();
      addTab({
        id: newId,
        type: 'pdf',
        title: file.name,
        file
      });
      setActiveTab(newId);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      padding: '8px 16px 0 16px', // No bottom padding so tabs touch the bottom edge
      gap: '4px',
      overflowX: 'auto',
      background: 'rgba(0, 0, 0, 0.08)', // Distinct darker gray background
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      minHeight: '48px'
    }}>
      {tabs.map(tab => (
        <div
          key={tab.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: tab.id === activeTabId ? 'var(--bg-primary)' : 'rgba(255,255,255,0.4)',
            borderTop: tab.id === activeTabId ? '1px solid var(--border-color)' : '1px solid transparent',
            borderLeft: tab.id === activeTabId ? '1px solid var(--border-color)' : '1px solid transparent',
            borderRight: tab.id === activeTabId ? '1px solid var(--border-color)' : '1px solid transparent',
            borderBottom: 'none', // Safe to use now since we don't use 'border' shorthand
            borderRadius: '10px 10px 0 0',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: '120px',
            maxWidth: '220px',
            boxShadow: tab.id === activeTabId ? '0 -2px 10px rgba(0,0,0,0.05)' : 'none',
            position: 'relative',
            zIndex: tab.id === activeTabId ? 2 : 1,
            marginTop: tab.id === activeTabId ? '0' : '4px', // Active tab is taller
          }}
          onClick={() => setActiveTab(tab.id)}
          onMouseEnter={(e) => {
            if (tab.id !== activeTabId) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
          }}
          onMouseLeave={(e) => {
            if (tab.id !== activeTabId) e.currentTarget.style.background = 'transparent';
          }}
        >
          {tab.type === 'whiteboard' ? <PenTool size={16} color={tab.id === activeTabId ? 'var(--primary)' : 'var(--text-secondary)'} /> : 
           <FileText size={16} color={tab.id === activeTabId ? 'var(--primary)' : 'var(--text-secondary)'} />}
          <span style={{ 
            flex: 1, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            fontSize: '14px',
            fontWeight: tab.id === activeTabId ? 'bold' : '500',
            color: tab.id === activeTabId ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}>
            {tab.title}
          </span>
          {tab.type !== 'whiteboard' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                removeTab(tab.id);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '50%',
              }}
              className="hover:bg-red-100"
              title="Đóng tab"
            >
              <X size={14} color="var(--text-secondary)" />
            </button>
          )}
        </div>
      ))}

      {/* Add PDF "Tab" Button */}
      <div style={{ 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        background: 'transparent',
        borderRadius: '50%',
        cursor: 'pointer',
        marginLeft: '4px',
        marginBottom: '6px',
        transition: 'background 0.2s',
      }}
      title="Mở tệp PDF mới"
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <FileUp size={18} color="var(--text-secondary)" />
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange} 
          style={{ 
            opacity: 0, 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            width: '100%', 
            height: '100%',
            cursor: 'pointer'
          }} 
        />
      </div>
    </div>
  );
}
