export function latestRequestTracker(): () => () => boolean {
  let latest = 0;
  return () => {
    const request = ++latest;
    return () => request === latest;
  };
}
