/**
 * Polyfills for Node.js environment to support pdfjs-dist
 * Must be imported BEFORE any pdfjs imports
 */

// Minimal DOMMatrix polyfill for pdfjs-dist
// @ts-ignore
global.DOMMatrix = class DOMMatrix {
  constructor() {
    // @ts-ignore
    this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
  }
};

// Minimal polyfills for other DOM APIs that might be needed
if (typeof global.window === 'undefined') {
  // @ts-ignore
  global.window = {};
}

if (typeof global.document === 'undefined') {
  // @ts-ignore
  global.document = {};
}

