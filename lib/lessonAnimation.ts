// A scheduler shared only by our lesson simulations (not the browser's global
// requestAnimationFrame). Keep pending callbacks and a clock that excludes pauses.
const callbacks = new Map<number, FrameRequestCallback>();
let nextId = 1;
let frame: number | null = null;
let paused = false;
let pauseStart = 0;
let pausedDuration = 0;

export function lessonNow() {
  return (paused ? pauseStart : performance.now()) - pausedDuration;
}

function schedule() {
  if (paused || frame !== null || !callbacks.size) return;
  frame = requestAnimationFrame(() => {
    frame = null;
    const time = lessonNow();
    for (const [id, callback] of [...callbacks]) {
      if (paused) break;
      if (!callbacks.delete(id)) continue;
      try {
        callback(time);
      } catch (error) {
        // One failed simulation must not stop all other pending animations.
        setTimeout(() => { throw error; }, 0);
      }
    }
    schedule();
  });
}

export function requestLessonFrame(callback: FrameRequestCallback) {
  const id = nextId++;
  callbacks.set(id, callback);
  schedule();
  return id;
}

export function cancelLessonFrame(id: number) {
  callbacks.delete(id);
  if (!callbacks.size && frame !== null) {
    cancelAnimationFrame(frame);
    frame = null;
  }
}

export function isLessonPaused() { return paused; }

export function setLessonPaused(value: boolean) {
  if (paused === value) return;
  if (value) {
    pauseStart = performance.now();
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  } else {
    pausedDuration += performance.now() - pauseStart;
  }
  paused = value;
  schedule();
}
