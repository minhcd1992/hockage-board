/* global chrome */
document.querySelector('#toggle').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('Không tìm thấy tab đang mở.');
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['mount.js'] });
    window.close();
  } catch {
    document.querySelector('#error').textContent = 'Không thể vẽ trên trang này. Hãy mở một trang HTTP/HTTPS thông thường (ví dụ trang bảng trên Vercel).';
  }
});
