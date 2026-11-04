import { expect, test } from "vitest";
import { serverSearchText } from "@/utils/serverSearch";

const ports = [{ name: "ALEMANIA-BREMEN" }, { name: "PERU-CALLAO" }];
const title = (port: { name: string }) => port.name;

test("the title the autocomplete writes back after a choice does not filter the list", () => {
  expect(serverSearchText("ALEMANIA-BREMEN", ports, title)).toBeNull();
});

test("text the user types still filters the list", () => {
  expect(serverSearchText("brem", ports, title)).toBe("brem");
});

test("an empty search asks for the whole list", () => {
  expect(serverSearchText("", ports, title)).toBeNull();
  expect(serverSearchText(null, ports, title)).toBeNull();
});
