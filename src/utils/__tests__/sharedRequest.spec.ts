import { expect, test, vi } from "vitest";
import { shareWhilePending } from "@/utils/sharedRequest";

const deferred = () => {
  let settle!: (value: string) => void;
  let fail!: (error: Error) => void;
  const promise = new Promise<string>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });
  return { promise, settle, fail };
};

test("callers asking for the same thing while it loads share one load and its answer", async () => {
  const answer = deferred();
  const load = vi.fn<(id: number) => Promise<string>>(() => answer.promise);
  const shared = shareWhilePending(load);

  const first = shared(1);
  const second = shared(1);
  answer.settle("lima");

  expect(load).toHaveBeenCalledOnce();
  expect(await Promise.all([first, second])).toEqual(["lima", "lima"]);
});

test("different arguments load separately, and a later call loads again once the first has settled", async () => {
  const load = vi.fn(async (id: number) => `country ${id}`);
  const shared = shareWhilePending(load);

  await Promise.all([shared(1), shared(2)]);
  await shared(1);

  expect(load.mock.calls).toEqual([[1], [2], [1]]);
});

test("a failed load reaches every caller and does not stick", async () => {
  const answer = deferred();
  const load = vi.fn<(id: number) => Promise<string>>(() => answer.promise);
  const shared = shareWhilePending(load);

  const calls = Promise.allSettled([shared(1), shared(1)]);
  answer.fail(new Error("Network Error"));

  expect((await calls).map((call) => call.status)).toEqual(["rejected", "rejected"]);
  load.mockResolvedValueOnce("lima");
  expect(await shared(1)).toBe("lima");
  expect(load).toHaveBeenCalledTimes(2);
});
