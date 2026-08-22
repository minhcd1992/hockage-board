import { Scene } from '../engine/Scene';
import { PdfObject } from '../objects/PdfObject';
import { CanvasRenderer } from '../engine/CanvasRenderer';
import { Camera } from '../engine/Camera';
import { useBoardStore } from '../store/useBoardStore';

export async function loadPDFToScene(file: File, scene: Scene, renderer: CanvasRenderer, camera: Camera) {
  // Use exact same pdf.js version as omniboard for perfect compatibility
  if (!(window as any).pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        resolve(true);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  const pdfjsLib = (window as any).pdfjsLib;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Clear existing objects
    scene.objects = [];
    scene.clearSelection();

    let currentY = 0;
    const PAGE_SPACING = 20;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      
      // We get the base viewport at scale 1.0 to determine layout size
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Create PdfObject with base dimensions. It will handle its own dynamic resolution!
      const pdfObj = new PdfObject(page, 0, currentY, viewport.width, viewport.height, i);
      
      // Add to scene
      scene.addObject(pdfObj);
      
      // Move Y down for the next page
      currentY += viewport.height + PAGE_SPACING;
    }
    // Auto-fit width logic
    if (scene.objects.length > 0) {
      const targetWidth = window.innerWidth - 100;
      const firstPage = scene.objects[0] as PdfObject;
      const scaleToFit = targetWidth / firstPage.width;
      
      const store = useBoardStore.getState();
      store.setZoom(scaleToFit);
      
      const panX = (window.innerWidth - targetWidth) / 2;
      store.setPan(panX, 20);
      
      camera.zoom = scaleToFit;
      camera.x = panX;
      camera.y = 20;
    } else {
      camera.x = 0;
      camera.y = 0;
    }
    // Force a re-render
    renderer.renderMain();
  } catch (error) {
    console.error("Error loading PDF:", error);
    alert("Failed to load PDF.");
  }
}
