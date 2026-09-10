'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBoardStore } from '../store/useBoardStore';
import { FileUp, X, PenTool, FlaskConical, FileText, Code, BookOpen } from 'lucide-react';

export function TabsBar() {
  const { tabs, activeTabId, setActiveTab, removeTab, addTab } = useBoardStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newId = crypto.randomUUID();
      const isHtml = file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm');
      addTab({
        id: newId,
        type: isHtml ? 'html' : 'pdf',
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
           tab.type === 'html' ? <Code size={16} color={tab.id === activeTabId ? 'var(--primary)' : 'var(--text-secondary)'} /> :
           tab.type === 'lesson' ? <BookOpen size={16} color={tab.id === activeTabId ? 'var(--primary)' : 'var(--text-secondary)'} /> :
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
      title="Mở tệp PDF hoặc HTML mới"
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <FileUp size={18} color="var(--text-secondary)" />
        <input 
          type="file" 
          accept="application/pdf, text/html" 
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

      {/* Add Lesson Button */}
      <div 
        style={{ 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          background: showLessonModal ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
          borderRadius: '50%',
          cursor: 'pointer',
          marginBottom: '6px',
          transition: 'background 0.2s',
        }}
        title="Mở bài học"
        onClick={() => setShowLessonModal(true)}
        onMouseEnter={(e) => {
          if (!showLessonModal) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          if (!showLessonModal) e.currentTarget.style.background = 'transparent';
        }}
      >
        <BookOpen size={18} color="var(--text-secondary)" />
      </div>

      {showLessonModal && typeof document !== 'undefined' && createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={() => setShowLessonModal(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#111827', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOpen size={28} className="text-blue-500" />
                Thư viện Bài giảng
              </h2>
              <button 
                onClick={() => setShowLessonModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {[
                { 
                  id: 'bai-1', 
                  title: 'Bài 1: Khái quát về Vật lí', 
                  url: '/lesson/bai-1',
                  desc: 'Mở đầu về Vật Lí, tìm hiểu các khái niệm cơ bản và làm quen với phương pháp nghiên cứu khoa học.' 
                },
                { 
                  id: 'bai-2', 
                  title: 'Bài 2: Tốc độ và Vận tốc', 
                  url: '/lesson/bai-2',
                  desc: 'Tìm hiểu về vận tốc, tốc độ, phân biệt quãng đường và độ dịch chuyển thông qua các mô phỏng trực quan.' 
                }
              ].map(lesson => (
                <div
                  key={lesson.id}
                  onClick={() => {
                    const newId = crypto.randomUUID();
                    addTab({
                      id: newId,
                      type: 'lesson',
                      title: lesson.title.split(':')[0],
                      url: lesson.url
                    });
                    setActiveTab(newId);
                    setShowLessonModal(false);
                  }}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: '#f9fafb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>{lesson.title}</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>{lesson.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
