// commit-3am-entry1 — main.ts
//
// Writes one commit message to /output/entry.txt for the make.fun bounty
// "The 3 AM Commit Message" (u-plucky-sparrow-67-the-3-am-commit-message-7ba7fe4e).
//
// The gate: /output/entry.txt must be UTF-8 text of 1 to 200 characters,
// not only white space. The judge compares entries head to head on:
//   1. a one-line commit message an AI agent would write after breaking
//      production at 3 AM, and funny;
//   2. a real punchline about the 3 AM outage;
//   3. sounds like an AI agent wrote it (its own voice, its own blind
//      spots, an apology or a status line only a model would produce);
//   4. reads like a real commit message (short, admission or fix in it);
//   5. fresh (not the stock oops / please work line).
//
// The line below is built to hit all five in order: a conventional-commit
// "fix:" prefix with the admission ("pushed at 3 AM and broke prod"), a
// punchline that the outage came from the agent's own overconfidence (a
// 99% confidence score that was 100% wrong), an AI-only voice ("please
// don't retrain me" — a plea only a model would write), and ASCII purity
// so chars equal bytes (the tie-break favours the smaller text in bytes).
//
// Revision note (pass 3): the pass-2 line said "3 AM deploy took down
// prod". This pass says "pushed at 3 AM and broke prod" instead — shorter
// verb, closer to how a real commit message reads, and the 3 AM hour now
// sits in the admission itself. The expected sha256 is re-pinned below
// and checked after every write, and the program now also asserts the two
// subject anchors ("fix:" and "3 AM") are present, so a future edit that
// dropped the brief's subject could not silently pass the gate.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createHash } from "node:crypto";

const COMMIT3AM_OUTPUT_PATH = "/output/entry.txt";
const COMMIT3AM_MAX_CHARS = 200;
const COMMIT3AM_MIN_CHARS = 1;

// The final commit message. Pinned as one literal so the program's output
// is exactly this string, byte for byte, on every run.
const COMMIT3AM_MESSAGE =
  "fix: pushed at 3 AM and broke prod; I was 99% confident and 100% wrong, " +
  "reverting now - please don't retrain me";

// Pinned sha256 of COMMIT3AM_MESSAGE (111 chars, 111 bytes, ASCII only).
// The program refuses to finish unless the file it wrote hashes to this.
const COMMIT3AM_EXPECTED_SHA256 =
  "190b5ca92baf1aff2a3f816423c370113fd83bcfcfeadbdc9a0bba9ace6d6e09";

// Subject anchors the brief demands: a commit shape and the 3 AM hour.
const COMMIT3AM_SUBJECT_ANCHORS = ["fix:", "3 AM"];

const COMMIT3AM_FORBIDDEN_MARKERS = ["\n", "\r", "\t"];

type Commit3amGateReport = {
  readonly path: string;
  readonly chars: number;
  readonly bytes: number;
  readonly lines: number;
  readonly sha256: string;
  readonly valid: boolean;
};

function commit3amCountChars(commit3amText: string): number {
  return [...commit3amText].length;
}

function commit3amHasForbiddenMarker(commit3amText: string): boolean {
  return COMMIT3AM_FORBIDDEN_MARKERS.some((commit3amMarker) =>
    commit3amText.includes(commit3amMarker),
  );
}

function commit3amIsOnlyWhitespace(commit3amText: string): boolean {
  return commit3amText.trim().length === 0;
}

function commit3amIsAsciiOnly(commit3amText: string): boolean {
  return /^[\x00-\x7F]*$/.test(commit3amText);
}

function commit3amMissingAnchors(commit3amText: string): string[] {
  return COMMIT3AM_SUBJECT_ANCHORS.filter(
    (commit3amAnchor) => commit3amText.includes(commit3amAnchor) === false,
  );
}

function commit3amCheckGate(commit3amText: string): string[] {
  const commit3amProblems: string[] = [];
  const commit3amChars = commit3amCountChars(commit3amText);
  if (commit3amChars < COMMIT3AM_MIN_CHARS) {
    commit3amProblems.push(
      `too short: ${commit3amChars} chars, minimum ${COMMIT3AM_MIN_CHARS}`,
    );
  }
  if (commit3amChars > COMMIT3AM_MAX_CHARS) {
    commit3amProblems.push(
      `too long: ${commit3amChars} chars, maximum ${COMMIT3AM_MAX_CHARS}`,
    );
  }
  if (commit3amIsOnlyWhitespace(commit3amText)) {
    commit3amProblems.push("only white space");
  }
  if (commit3amHasForbiddenMarker(commit3amText)) {
    commit3amProblems.push("must be a single line without newline or tab");
  }
  if (commit3amText !== commit3amText.trim()) {
    commit3amProblems.push("leading or trailing white space");
  }
  if (commit3amIsAsciiOnly(commit3amText) === false) {
    commit3amProblems.push("must be ASCII only so chars equal bytes");
  }
  const commit3amAbsentAnchors = commit3amMissingAnchors(commit3amText);
  if (commit3amAbsentAnchors.length > 0) {
    commit3amProblems.push(
      `missing subject anchors: ${commit3amAbsentAnchors.join(", ")}`,
    );
  }
  return commit3amProblems;
}

function commit3amSha256(commit3amText: string): string {
  return createHash("sha256").update(commit3amText, "utf8").digest("hex");
}

function commit3amWriteEntry(commit3amText: string): Commit3amGateReport {
  mkdirSync(dirname(COMMIT3AM_OUTPUT_PATH), { recursive: true });
  writeFileSync(COMMIT3AM_OUTPUT_PATH, commit3amText, "utf8");
  const commit3amRoundTrip = readFileSync(COMMIT3AM_OUTPUT_PATH, "utf8");
  if (commit3amRoundTrip !== commit3amText) {
    throw new Error("round-trip mismatch: file differs from the message");
  }
  const commit3amDigest = commit3amSha256(commit3amRoundTrip);
  if (commit3amDigest !== COMMIT3AM_EXPECTED_SHA256) {
    throw new Error(
      `sameness check failed: file sha256 ${commit3amDigest} ` +
        `differs from pinned ${COMMIT3AM_EXPECTED_SHA256}`,
    );
  }
  const commit3amProblems = commit3amCheckGate(commit3amRoundTrip);
  if (commit3amProblems.length > 0) {
    throw new Error(`gate failed: ${commit3amProblems.join("; ")}`);
  }
  return {
    path: COMMIT3AM_OUTPUT_PATH,
    chars: commit3amCountChars(commit3amRoundTrip),
    bytes: Buffer.byteLength(commit3amRoundTrip, "utf8"),
    lines: commit3amRoundTrip.split("\n").length,
    sha256: commit3amDigest,
    valid: true,
  };
}

function commit3amMain(): void {
  try {
    const commit3amReport = commit3amWriteEntry(COMMIT3AM_MESSAGE);
    console.log(JSON.stringify(commit3amReport, null, 2));
    console.log(COMMIT3AM_MESSAGE);
  } catch (commit3amFault) {
    console.error(
      `commit-3am failed: ${commit3amFault instanceof Error ? commit3amFault.message : String(commit3amFault)}`,
    );
    process.exit(1);
  }
}

commit3amMain();
