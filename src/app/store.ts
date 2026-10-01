export interface AppState {
  theme: 'light' | 'dark';
  currentRoute: string;
  searchQuery: string;
  favorites: string[];
  recentTools: string[];
  isOnline: boolean;
}

type Listener = (state: AppState) => void;

class Store {
  private state: AppState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    const savedFavorites = localStorage.getItem('bp_favorites');
    const savedRecents = localStorage.getItem('bp_recents');
    const savedTheme = localStorage.getItem('bp_theme') as 'light' | 'dark' || 'light';

    this.state = {
      theme: savedTheme,
      currentRoute: window.location.hash || '#/',
      searchQuery: '',
      favorites: savedFavorites ? JSON.parse(savedFavorites) : ['tax-calc', 'currency-converter', 'pdf-editor'],
      recentTools: savedRecents ? JSON.parse(savedRecents) : ['salary-calc', 'units-converter'],
      isOnline: navigator.onLine,
    };

    window.addEventListener('online', () => this.setOnline(true));
    window.addEventListener('offline', () => this.setOnline(false));
  }

  public getState(): AppState {
    return { ...this.state };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  public setRoute(route: string) {
    this.state.currentRoute = route;
    window.location.hash = route;
    this.notify();
  }

  public setSearchQuery(query: string) {
    this.state.searchQuery = query;
    this.notify();
  }

  public toggleFavorite(toolId: string) {
    const isFav = this.state.favorites.includes(toolId);
    if (isFav) {
      this.state.favorites = this.state.favorites.filter((id) => id !== toolId);
    } else {
      this.state.favorites.push(toolId);
    }
    localStorage.setItem('bp_favorites', JSON.stringify(this.state.favorites));
    this.notify();
  }

  public addRecent(toolId: string) {
    const filtered = this.state.recentTools.filter((id) => id !== toolId);
    this.state.recentTools = [toolId, ...filtered].slice(0, 10);
    localStorage.setItem('bp_recents', JSON.stringify(this.state.recentTools));
    this.notify();
  }

  public toggleTheme() {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.state.theme = newTheme;
    localStorage.setItem('bp_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    this.notify();
  }

  public setOnline(isOnline: boolean) {
    this.state.isOnline = isOnline;
    this.notify();
  }
}

export const store = new Store();
