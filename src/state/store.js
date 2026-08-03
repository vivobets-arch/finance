const listeners = new Set();

const state = {
  user: null,
  cards: [],
  categories: [],
  transactions: [],
  selectedCardIndex: 0,
  selectedCategoryId: null,
  view: 'home', // home | summary
  status: 'boot', // boot | auth | loading | ready
  error: null,
  toast: null,
  needsOnboarding: false,
};

export function getState() {
  return state;
}

export function setState(partial) {
  Object.assign(state, partial);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
