// jsdom no trae el objeto global CSS y Vuetify lo usa al importarse (CSS.supports / CSS.escape).
if (typeof globalThis.CSS === "undefined") {
  Object.defineProperty(globalThis, "CSS", {
    value: {
      supports: () => false,
      escape: (valor: string) => valor.replace(/[^\w-]/g, (c) => `\\${c}`),
    },
    configurable: true,
  });
}

// jsdom tampoco trae matchMedia (useDisplay de Vuetify y algunos componentes lo consultan)
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
    configurable: true,
  });
}

// ni ResizeObserver (v-data-table, v-slide-group de las pestañas, etc.)
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
