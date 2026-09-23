/* global chrome */
(() => {
  const key = '__hockageInkOverlayV1';
  if (globalThis[key]?.host.isConnected) {
    globalThis[key].toggle();
    return;
  }
  if (globalThis[key]) globalThis[key].dispose();
  const host = document.createElement('div');
  host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:2147483647!important;display:block!important;';
  const shadow = host.attachShadow({ mode: 'closed' });
  const frame = document.createElement('iframe');
  frame.src = chrome.runtime.getURL('overlay.html');
  frame.title = 'Hockage Ink — lớp vẽ độc lập';
  frame.style.cssText = 'display:block;width:100%;height:100%;border:0;background:transparent;color-scheme:normal;';
  shadow.append(frame);
  document.documentElement.append(host);
  let visible = true;
  const show = value => {
    visible = value;
    host.style.setProperty('display', value ? 'block' : 'none', 'important');
    frame.contentWindow?.postMessage({ type: 'hockage-ink-visibility', visible: value }, new URL(frame.src).origin);
    if (value) frame.focus();
  };
  const message = event => {
    if (event.source !== frame.contentWindow || event.origin !== new URL(frame.src).origin) return;
    if (event.data?.type === 'hockage-ink-hide') show(false);
  };
  window.addEventListener('message', message);
  frame.addEventListener('load', () => { if (visible) frame.focus(); });
  globalThis[key] = {
    host,
    toggle: () => show(!visible),
    dispose: () => window.removeEventListener('message', message),
  };
})();
