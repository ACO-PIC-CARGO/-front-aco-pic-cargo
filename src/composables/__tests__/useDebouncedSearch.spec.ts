import { afterEach, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { useDebouncedSearch } from "@/composables/useDebouncedSearch";

afterEach(() => vi.useRealTimers());

const withSearch = (search: (text: string) => void) => {
  let debounced!: (text: string) => void;
  const wrapper = mount(
    defineComponent({
      setup() {
        debounced = useDebouncedSearch(search);
        return () => h("div");
      },
    }),
  );
  return { wrapper, type: (text: string) => debounced(text) };
};

test("typing quickly searches once, for the final text, 300 ms after the last key", () => {
  vi.useFakeTimers();
  const search = vi.fn();
  const { type } = withSearch(search);

  type("C");
  vi.advanceTimersByTime(200);
  type("CA");
  type("CAL");
  vi.advanceTimersByTime(299);
  expect(search).not.toHaveBeenCalled();

  vi.advanceTimersByTime(1);
  expect(search.mock.calls).toEqual([["CAL"]]);
});

test("a search still waiting when the screen closes is never sent", () => {
  vi.useFakeTimers();
  const search = vi.fn();
  const { wrapper, type } = withSearch(search);

  type("CAL");
  wrapper.unmount();
  vi.advanceTimersByTime(1000);

  expect(search).not.toHaveBeenCalled();
});
