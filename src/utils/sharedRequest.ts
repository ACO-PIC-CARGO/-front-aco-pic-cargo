export function shareWhilePending<Args extends unknown[], Result>(
  load: (...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Result> {
  const pending = new Map<string, Promise<Result>>();
  return (...args) => {
    const key = JSON.stringify(args);
    const running = pending.get(key);
    if (running) return running;
    const request = load(...args).finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}
