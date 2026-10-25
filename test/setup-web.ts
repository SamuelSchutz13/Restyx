import '@testing-library/jest-dom';

// jsdom has no matchMedia, ResizeObserver or IntersectionObserver.
Object.defineProperty(window, 'matchMedia', {
  value: (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }),
});
class Noop {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver ??= Noop;
(globalThis as any).IntersectionObserver ??= Noop;

// Tests read the Portuguese UI unless they switch language themselves.
localStorage.setItem('restyx.lang', 'pt');
