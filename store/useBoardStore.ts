import { create } from 'zustand';
import { ArrowHeadType, ToolType } from '../types';

export interface ArrowOptions {
  arrowStart: ArrowHeadType;
  arrowEnd: ArrowHeadType;
  middleArrow: boolean;
}

export interface ToolProperties extends ArrowOptions {
  strokeColor: string;
  strokeSize: number;
  strokeStyleType: 'solid' | 'dashed' | 'dotted';
  isFilled: boolean;
  sineWavelength: number;
  sineAmplitude: number;
  fontFamily: string;
  fontSize: number;
}

function defaultToolProperties(tool: ToolType): ToolProperties {
  return {
    strokeColor: tool === 'highlighter' ? '#FFFF00' : '#ffffff',
    strokeSize: tool === 'highlighter' ? 12 : 2,
    strokeStyleType: 'solid', isFilled: false,
    arrowStart: 'none', arrowEnd: 'arrow', middleArrow: false,
    sineWavelength: 150, sineAmplitude: 60,
    fontFamily: 'Arial', fontSize: 24,
  };
}

export interface BoardTab {
  id: string;
  type: 'whiteboard' | 'pdf' | 'html' | 'lesson';
  title: string;
  file?: File;
  url?: string;
  zoom?: number;
  panX?: number;
  panY?: number;
  gridEnabled?: boolean;
  viewMode?: 'continuous' | 'single-page';
  theme?: 'green' | 'white';
}

interface BoardState extends ToolProperties {
  toolProperties: Partial<Record<ToolType, ToolProperties>>;
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
  
  // Viewport State
  zoom: number;
  panX: number;
  panY: number;
  dpr: number;

  // Background State
  gridEnabled: boolean;
  snapToGrid: boolean;
  // Shape State
  editingObjectId: string | null;
  
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
  setArrowOptions: (options: Partial<ArrowOptions>) => void;
  setSineWavelength: (val: number) => void;
  setSineAmplitude: (val: number) => void;
  setEditingObjectId: (id: string | null) => void;
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  setTheme: (theme: 'green' | 'white') => void;
}

export const useBoardStore = create<BoardState>((set) => {
  const updateProperties = (updates: Partial<ToolProperties>) => set(state => ({
    ...updates,
    toolProperties: {
      ...state.toolProperties,
      [state.tool]: { ...(state.toolProperties[state.tool] ?? defaultToolProperties(state.tool)), ...updates },
    },
  }));
  return ({
  tabs: [{ id: 'main', type: 'whiteboard', title: 'Bảng Trắng' }],
  activeTabId: 'main',
  
  tool: 'pen',
  ...defaultToolProperties('pen'),
  toolProperties: {},
  panX: 0,
  panY: 0,
  zoom: 1,
  dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  gridEnabled: true,
  snapToGrid: false,
  editingObjectId: null,
  currentShapeTool: 'line',
  viewMode: 'continuous',
  theme: 'green',
  
  addTab: (tab) => set((state) => ({ tabs: [...state.tabs, tab] })),
  removeTab: (id) => set((state) => {
    const newTabs = state.tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      newTabs.push({ id: 'main', type: 'whiteboard', title: 'Bảng Trắng' });
    }
    
    if (state.activeTabId !== id) {
      return { tabs: newTabs };
    }
    
    const newActiveTabId = newTabs[newTabs.length - 1].id;
    const targetTab = newTabs.find(t => t.id === newActiveTabId);
    
    if (!targetTab) return { tabs: newTabs, activeTabId: newActiveTabId };
    
    return {
      tabs: newTabs,
      activeTabId: newActiveTabId,
      zoom: targetTab.zoom !== undefined ? targetTab.zoom : 1,
      panX: targetTab.panX !== undefined ? targetTab.panX : 0,
      panY: targetTab.panY !== undefined ? targetTab.panY : 0,
      gridEnabled: targetTab.gridEnabled !== undefined ? targetTab.gridEnabled : true,
      viewMode: targetTab.viewMode || 'continuous',
      theme: targetTab.theme || 'green',
      editingObjectId: null
    };
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

  setTool: (tool) => set(state => ({
    ...(state.toolProperties[tool] ?? defaultToolProperties(tool)),
    tool,
    currentShapeTool: ['line', 'arrow', 'rect', 'ellipse', 'arc', 'sine', 'bezier'].includes(tool)
      ? tool : state.currentShapeTool,
    editingObjectId: null,
  })),
  setViewMode: (viewMode) => set({ viewMode }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setZoom: (zoom) => set({ zoom }),
  setGridEnabled: (gridEnabled) => set({ gridEnabled }),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
  toggleGrid: () => set((state) => ({ gridEnabled: !state.gridEnabled })),
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  setStrokeColor: (strokeColor) => updateProperties({ strokeColor }),
  setStrokeSize: (strokeSize) => updateProperties({ strokeSize }),
  setStrokeStyleType: (strokeStyleType) => updateProperties({ strokeStyleType }),
  setIsFilled: (isFilled) => updateProperties({ isFilled }),
  setArrowOptions: updateProperties,
  setSineWavelength: (val) => updateProperties({ sineWavelength: val }),
  setSineAmplitude: (val) => updateProperties({ sineAmplitude: val }),
  setEditingObjectId: (id) => set({ editingObjectId: id }),
  setFontFamily: (font) => updateProperties({ fontFamily: font }),
  setFontSize: (size) => updateProperties({ fontSize: size }),
  setTheme: (theme) => set({ theme })
  });
});
