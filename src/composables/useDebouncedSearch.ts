// @ts-expect-error lodash ships no type declarations
import debounce from "lodash/debounce";
import { onBeforeUnmount } from "vue";

export function useDebouncedSearch<Args extends unknown[]>(
  search: (...args: Args) => unknown,
  wait = 300,
): (...args: Args) => void {
  const debounced = debounce(search, wait);
  onBeforeUnmount(() => debounced.cancel());
  return debounced;
}
