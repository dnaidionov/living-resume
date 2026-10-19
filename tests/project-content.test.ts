import test from "node:test";
import assert from "node:assert/strict";
import { buildDocuments, loadProjects } from "@/lib/content/store";

const recentIds = ["ask-ohny", "library-shelf", "school-lunch-ordering"];

test("projects follow the requested editorial order without duplicate entries", async () => {
  const projects = await loadProjects();
  assert.deepEqual(projects.map(({ id }) => id), [
    "ask-ohny", "library-shelf", "research-assistant", "school-lunch-ordering",
    "mybrain", "living-resume", "dalek"
  ]);
  assert.equal(new Set(projects.map(({ name }) => name.toLowerCase())).size, projects.length);
});

test("recent projects have complete website narratives and indexed evidence", async () => {
  const projects = await loadProjects();
  const documents = await buildDocuments();
  for (const id of recentIds) {
    const project = projects.find((item) => item.id === id);
    assert.ok(project, `Missing ${id}`);
    assert.equal(project.projectType, "product_system");
    for (const field of ["summary", "context", "build", "significance", "status", "link"] as const) {
      assert.ok(project[field]?.trim(), `Missing ${id}.${field}`);
    }
    assert.ok(project.keyDecisions && project.keyDecisions.length >= 2);
    for (const section of ["summary", "context", "build", "significance", "status"]) {
      assert.ok(documents.some((doc) => doc.id === `project-${id}-${section}`));
    }
    assert.deepEqual(project.relatedRoleIds, [], "Personal projects must not imply employer provenance");
    assert.ok(documents.filter((doc) => doc.id.startsWith(`project-${id}-`)).every((doc) => !doc.metadata?.company));
  }
});

test("recent descriptions preserve source limitations and payment boundaries", async () => {
  const projects = await loadProjects();
  const text = (id: string) => JSON.stringify(projects.find((item) => item.id === id));
  assert.match(text("ask-ohny"), /unofficial/i);
  assert.doesNotMatch(text("ask-ohny"), /approval|directory listing|pending/i);
  assert.match(text("library-shelf"), /snapshot/i);
  assert.match(text("library-shelf"), /matching.*imperfect/i);
  assert.match(text("school-lunch-ordering"), /does not add funds.*make payments/i);
  assert.match(text("school-lunch-ordering"), /own account/i);
});

test("project descriptions explain the practical benefits requested during proofreading", async () => {
  const projects = await loadProjects();
  const ohny = projects.find(({ id }) => id === "ask-ohny")!;
  assert.match(ohny.summary, /on the go/i);
  assert.match(ohny.build!, /install.*ChatGPT.*Claude.*Gemini/i);
  assert.match(ohny.build!, /voice.*ChatGPT.*Claude/i);
  assert.match(ohny.build!, /Gemini.*text/i);

  const library = projects.find(({ id }) => id === "library-shelf")!;
  assert.match(library.context!, /available.*right now/i);
  assert.match(library.context!, /waiting list/i);
  assert.match(library.significance!, /available right now/i);
  assert.doesNotMatch(library.context!, /which books you can borrow/i);

  const lunch = projects.find(({ id }) => id === "school-lunch-ordering")!;
  assert.match(lunch.context!, /multiple clicks/i);
  assert.match(lunch.context!, /defaults/i);
  assert.match(lunch.context!, /repeat.*custom/i);
});
