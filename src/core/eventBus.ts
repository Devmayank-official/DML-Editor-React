type EventMap = {
  run: undefined;
  save: undefined;
  format: undefined;
};

type Handler<T> = (payload: T) => void;

export class EventBus {
  private handlers = new Map<keyof EventMap, Set<Handler<unknown>>>();

  on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): () => void {
    const current = this.handlers.get(event) ?? new Set();
    current.add(handler as Handler<unknown>);
    this.handlers.set(event, current);
    return () => current.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.handlers.get(event)?.forEach((h) => h(payload));
  }
}

export const appBus = new EventBus();
