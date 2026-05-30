// Tiny pub/sub toast bus (same singleton shape as lib/sfx).
// Components call toast.error(...) / toast.success(...); <ToastHost> renders them.
let listeners = [];
let counter = 0;

export const toast = {
  subscribe(fn) {
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  },
  show(message, type = 'info') {
    const entry = { id: ++counter, message, type };
    listeners.forEach(l => l(entry));
  },
  error(message) { this.show(message, 'error'); },
  success(message) { this.show(message, 'success'); },
};
