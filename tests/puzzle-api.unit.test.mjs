import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "../worker/index.js";

const validGroups = [
  { label: "Group One", characterIds: [1, 4, 5, 6] },
  { label: "Group Two", characterIds: [10, 11, 12, 13] },
  { label: "Group Three", characterIds: [24, 25, 26, 29] },
  { label: "Group Four", characterIds: [30, 31, 34, 35] },
];

function postPuzzle(payload) {
  return worker.fetch(new Request("http://test.local/api/puzzles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }), { DB: { prepare() { assert.fail("invalid payload must not query D1"); } } });
}

async function expectInvalid(payload, message) {
  const response = await postPuzzle(payload);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, message);
}

test("API returns 503 when puzzle storage is unavailable", async () => {
  const response = await worker.fetch(new Request("http://test.local/api/puzzles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Valid puzzle", groups: validGroups }),
  }), {});

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "Puzzle storage is unavailable." });
});

test("API rejects titles outside the supported length", async () => {
  await expectInvalid({ title: "No", groups: validGroups }, "Use a title between 3 and 80 characters.");
  await expectInvalid({ title: "x".repeat(81), groups: validGroups }, "Use a title between 3 and 80 characters.");
});

test("API requires four named groups with four distinct catalog characters each", async () => {
  await expectInvalid({ title: "Valid puzzle", groups: validGroups.slice(0, 3) }, "A puzzle needs exactly four groups.");

  const blankLabel = validGroups.map((group, index) => index === 0 ? { ...group, label: "  " } : group);
  await expectInvalid({ title: "Valid puzzle", groups: blankLabel }, "Group labels must be 1–60 characters.");

  const repeatedMember = validGroups.map((group, index) => index === 0
    ? { ...group, characterIds: [1, 1, 5, 6] }
    : group);
  await expectInvalid({ title: "Valid puzzle", groups: repeatedMember }, "Each group needs four different catalog characters.");

  const unknownCharacter = validGroups.map((group, index) => index === 0
    ? { ...group, characterIds: [1, 4, 5, 999_999] }
    : group);
  await expectInvalid({ title: "Valid puzzle", groups: unknownCharacter }, "Each group needs four different catalog characters.");
});

test("API rejects characters repeated across groups", async () => {
  const repeatedAcrossGroups = validGroups.map((group, index) => index === 1
    ? { ...group, characterIds: [1, 11, 12, 13] }
    : group);
  await expectInvalid({ title: "Valid puzzle", groups: repeatedAcrossGroups }, "Use each character only once.");
});

test("API rejects malformed JSON with a client error", async () => {
  const response = await worker.fetch(new Request("http://test.local/api/puzzles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not-json",
  }), { DB: {} });

  assert.equal(response.status, 400);
  assert.ok((await response.json()).error);
});

test("valid create request batches the puzzle and its members", async () => {
  let statementCount = 0;
  let batchCount = 0;
  const DB = {
    prepare(sql) {
      statementCount += 1;
      return { sql, bind(...values) { return { sql, values }; } };
    },
    async batch(statements) {
      batchCount += 1;
      assert.equal(statements.length, 21);
      return [];
    },
  };

  const response = await worker.fetch(new Request("http://test.local/api/puzzles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Valid puzzle", groups: validGroups }),
  }), { DB });

  assert.equal(response.status, 201);
  assert.equal(statementCount, 21);
  assert.equal(batchCount, 1);
  const result = await response.json();
  assert.match(result.slug, /^[a-z0-9]{8}$/);
  assert.equal(typeof result.manageToken, "string");
  assert.equal(result.manageToken.length, 48);
});
