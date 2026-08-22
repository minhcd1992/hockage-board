import { create } from 'zustand';
import { ToolType } from '../types';

export interface BoardTab {
  id: string;
  type: 'whiteboard' | 'pdf';
  title: string;
  file?: File;
  zoom?: number;
  panX?: number;
  panY?: number;
  gridEnabled?: boolean;
  viewMode?: 'continuous' | 'single-page';
  theme?: 'green' | 'white';
}

interface BoardState {
  // Tabs State
  tabs: BoardTab[];
  activeTabId: string;
  addTab: (tab: BoardTab) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;

  activeEngineRef: React.MutableRefObject<any> | null;
  setActiveEngineRef: (ref: React.MutableRefObject<any> | null) => void;

  // Toolbar State
  tool: ToolType;
  strokeColor: string;
  strokeSize: number;
  highlighterColor: string;
  highlighterSize: number;
  
  // Viewport State
  zoom: number;
  panX: number;
  panY: number;
  dpr: number;

  // Background State
  gridEnabled: boolean;
  snapToGrid: boolean;
  // Shape State
  strokeStyleType: 'solid' | 'dashed' | 'dotted';
  isFilled: boolean;
  sineWavelength: number;
  sineAmplitude: number;
  editingObjectId: string | null;
  
  // Text State
  fontFamily: string;
  fontSize: number;
  
  // UI State
  // UI State
  currentShapeTool: ToolType;
  viewMode: 'continuous' | 'single-page';
  theme: 'green' | 'white';

  setTool: (tool: ToolType) => void;
  setViewMode: (mode: 'continuous' | 'single-page') => void;
  setPan: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;
  setGridEnabled: (enabled: boolean) => void;
  setSnapToGrid: (enabled: boolean) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  setStrokeColor: (color: string) => void;
  setStrokeSize: (size: number) => void;
  setStrokeStyleType: (type: 'solid' | 'dashed' | 'dotted') => void;
  setIsFilled: (isFilled: boolean) => void;
  setSineWavelength: (val: number) => void;
  setSineAmplitude: (val: number) => void;
  setEditingObjectId: (id: string | null) => void;
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  setCurrentShapeTool: (tool: ToolType) => void;
  setTheme: (theme: 'green' | 'white') => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  tabs: [{ id: 'main', type: 'whiteboard', title: 'Bảng Trắng' }],
  activeTabId: 'main',
  
  tool: 'pen',
  strokeColor: '#ffffff',
  strokeSize: 2,
  highlighterColor: '#FFFF00',
  highlighterSize: 12,
  panX: 0,
  panY: 0,
  zoom: 1,
  dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  gridEnabled: true,
  snapToGrid: false,
  strokeStyleType: 'solid',
  isFilled: false,
  sineWavelength: 150,
  sineAmplitude: 60,
  editingObjectId: null,
  fontFamily: 'Arial',
  fontSize: 24,
  currentShapeTool: 'line',
  viewMode: 'continuous',
  theme: 'green',
  
  addTab: (tab) => set((state) => ({ tabs: [...state.tabs, tab] })),
  removeTab: (id) => set((state) => {
    const newTabs = state.tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      newTabs.push({ id: 'main', type: 'whiteboard', title: 'Bảng Trắng' });
    }
    const newActiveTabId = state.activeTabId === id ? newTabs[newTabs.length - 1].id : state.activeTabId;
    return { tabs: newTabs, activeTabId: newActiveTabId };
  }),
  setActiveTab: (id) => set((state) => {
    const newTabs = state.tabs.map(tab => {
      if (tab.id === state.activeTabId) {
        return {
          ...tab,
          zoom: state.zoom,
          panX: state.panX,
          panY: state.panY,
          gridEnabled: state.gridEnabled,
          viewMode: state.viewMode,
          theme: state.theme
        };
      }
      return tab;
    });

    const targetTab = newTabs.find(t => t.id === id);
    if (!targetTab) return { activeTabId: id };

    return { 
      tabs: newTabs,
      activeTabId: id,
      zoom: targetTab.zoom !== undefined ? targetTab.zoom : 1,
      panX: targetTab.panX !== undefined ? targetTab.panX : 0,
      panY: targetTab.panY !== undefined ? targetTab.panY : 0,
      gridEnabled: targetTab.gridEnabled !== undefined ? targetTab.gridEnabled : true,
      viewMode: targetTab.viewMode || 'continuous',
      theme: targetTab.theme || 'green',
      editingObjectId: null
    };
  }),

  activeEngineRef: null,
  setActiveEngineRef: (ref) => set({ activeEngineRef: ref }),

  setTool: (tool) => set({ tool, editingObjectId: null }),
  setViewMode: (viewMode) => set({ viewMode }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setZoom: (zoom) => set({ zoom }),
  setGridEnabled: (gridEnabled) => set({ gridEnabled }),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
  toggleGrid: () => set((state) => ({ gridEnabled: !state.gridEnabled })),
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setStrokeSize: (strokeSize) => set({ strokeSize }),
  setStrokeStyleType: (strokeStyleType) => set({ strokeStyleType }),
  setIsFilled: (isFilled) => set({ isFilled }),
  setSineWavelength: (val) => set({ sineWavelength: val }),
  setSineAmplitude: (val) => set({ sineAmplitude: val }),
  setEditingObjectId: (id) => set({ editingObjectId: id }),
  setFontFamily: (font) => set({ fontFamily: font }),
  setFontSize: (size) => set({ fontSize: size }),
  setCurrentShapeTool: (tool) => set({ currentShapeTool: tool }),
  setTheme: (theme) => set({ theme })
}));
