type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribe(key: string, listener: Listener): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(listener);
  return () => { listeners.get(key)?.delete(listener); };
}

export function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}
