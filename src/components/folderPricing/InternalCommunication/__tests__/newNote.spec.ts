import { expect, test } from "vitest";
import { newNoteToSend } from "../newNote";

test.each([undefined, null, "", "   ", "\n\t "])("a blank note (%j) sends nothing", (note) => {
  expect(newNoteToSend(note)).toBeNull();
});

test("a note is sent trimmed", () => {
  expect(newNoteToSend("  Cliente apurado \n")).toBe("Cliente apurado");
});
