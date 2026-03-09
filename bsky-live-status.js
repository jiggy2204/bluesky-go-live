#!/usr/bin/env node
/**
 * bsky-live-status.js
 * Sets or clears your Bluesky "Go Live" status.
 *
 * Usage:
 *   node bsky-live-status.js set
 *   node bsky-live-status.js clear
 *
 * Fill in the CONFIG section below, then point your bat files at this script.
 * Use a Bluesky App Password — NOT your main account password.
 * Generate one at: Bluesky → Settings → Privacy and Security → App Passwords
 */

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const HANDLE   = process.env.BSKY_HANDLE   || "yourhandle.bsky.social";  // e.g. yourname.bsky.social
const PASSWORD = process.env.BSKY_PASSWORD || "xxxx-xxxx-xxxx-xxxx";      // App Password, NOT your login password
const PDS_HOST = "https://bsky.social"; // Change only if you're on a custom PDS

// Stream info — edit these before saving:
const STREAM_URL    = "https://twitch.tv/yourchannel";  // Your Twitch (or other) stream URL
const STREAM_TITLE  = "Live Now!";                      // Shown as the link card title
const STREAM_DESC   = "Come hang!";                     // Shown as the link card description
const DURATION_MINS = 240;                              // Max is 240 (4 hrs) — enforced by Bluesky regardless of what you set.
                                                        // A value IS required for the LIVE badge to appear on your profile.
// ─────────────────────────────────────────────────────────────────────────────

const [,, mode] = process.argv;

// Pull stream info from the config section above
const streamUrl   = STREAM_URL;
const title       = STREAM_TITLE;
const description = STREAM_DESC;
const duration    = typeof DURATION_MINS === "number" && DURATION_MINS >= 1 ? DURATION_MINS : undefined;

async function createSession() {
  const res = await fetch(`${PDS_HOST}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: HANDLE, password: PASSWORD }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Auth failed: ${err.message || res.statusText}`);
  }
  const { accessJwt, did } = await res.json();
  return { accessJwt, did };
}

async function setLiveStatus({ accessJwt, did }) {
  // Build the optional external embed (your stream link)
  const embed = streamUrl
    ? {
        $type: "app.bsky.embed.external",
        external: {
          uri: streamUrl,
          title: title || "Live Now",
          description: description || "",
        },
      }
    : undefined;

  const record = {
    $type: "app.bsky.actor.status",
    status: "app.bsky.actor.status#live",
    createdAt: new Date().toISOString(),
    ...(embed && { embed }),
    ...(duration && duration >= 1 && { durationMinutes: duration }),
  };

  const res = await fetch(`${PDS_HOST}/xrpc/com.atproto.repo.putRecord`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessJwt}`,
    },
    body: JSON.stringify({
      repo: did,
      collection: "app.bsky.actor.status",
      rkey: "self",
      record,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`putRecord failed: ${err.message || res.statusText}`);
  }

  console.log("✅ Bluesky status set to LIVE");
  if (streamUrl) console.log(`   → ${streamUrl}`);
  if (duration)  console.log(`   ⏱ Duration: ${duration} min`);
}

async function clearLiveStatus({ accessJwt, did }) {
  const res = await fetch(`${PDS_HOST}/xrpc/com.atproto.repo.deleteRecord`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessJwt}`,
    },
    body: JSON.stringify({
      repo: did,
      collection: "app.bsky.actor.status",
      rkey: "self",
    }),
  });

  // 200 = deleted, 400 with RecordNotFound is also fine (already cleared)
  if (!res.ok) {
    const err = await res.json();
    if (err.error !== "RecordNotFound") {
      throw new Error(`deleteRecord failed: ${err.message || res.statusText}`);
    }
  }

  console.log("✅ Bluesky live status cleared");
}

async function main() {
  if (!mode || !["set", "clear"].includes(mode)) {
    console.error("Usage: node bsky-live-status.js [set|clear]");
    process.exit(1);
  }

  const session = await createSession();

  if (mode === "set") {
    await setLiveStatus(session);
  } else {
    await clearLiveStatus(session);
  }
}

main().catch(err => {
  console.error("❌", err.message);
  process.exit(1);
});
