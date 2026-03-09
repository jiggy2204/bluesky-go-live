#!/usr/bin/env node
/**
 * post-to-bluesky.mjs
 * Posts to your Bluesky feed when you go live.
 * URLs and hashtags in your post text are automatically made clickable.
 *
 * Run with: node post-to-bluesky.mjs
 *
 * Fill in the CONFIG section below.
 * Use a Bluesky App Password — NOT your main account password.
 * Generate one at: Bluesky → Settings → Privacy and Security → App Passwords
 */

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BLUESKY_HANDLE       = "yourhandle.bsky.social";  // e.g. yourname.bsky.social
const BLUESKY_APP_PASSWORD = "xxxx-xxxx-xxxx-xxxx";     // App Password, NOT your login password

/**
 * Your stream announcement post text.
 * - URLs and #hashtags will automatically be made clickable.
 * - Keep it under 300 characters (Bluesky's post limit).
 * - Edit this whenever your stream content changes.
 */
const POST_TEXT = "https://twitch.tv/yourchannel Come hang! #YourHashtag";
// ─────────────────────────────────────────────────────────────────────────────

/** DO NOT EDIT ANYTHING BELOW THIS LINE */

async function createBlueskyPost() {
  try {
    // Step 1: Authenticate and get session
    const authResponse = await fetch(
      "https://bsky.social/xrpc/com.atproto.server.createSession",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: BLUESKY_HANDLE,
          password: BLUESKY_APP_PASSWORD,
        }),
      }
    );

    if (!authResponse.ok) {
      throw new Error(`Auth failed: ${authResponse.status}`);
    }

    const session = await authResponse.json();

    // Step 2: Detect facets (make URLs and hashtags clickable)
    const facets = [];
    const encoder = new TextEncoder();

    // Find all URLs in the text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let match;

    while ((match = urlRegex.exec(POST_TEXT)) !== null) {
      const url = match[0];
      const byteStart = encoder.encode(POST_TEXT.substring(0, match.index)).length;
      const byteEnd = byteStart + encoder.encode(url).length;

      facets.push({
        index: { byteStart, byteEnd },
        features: [{ $type: "app.bsky.richtext.facet#link", uri: url }],
      });
    }

    // Find all hashtags in the text
    const hashtagRegex = /#\w+/g;

    while ((match = hashtagRegex.exec(POST_TEXT)) !== null) {
      const hashtag = match[0];
      const byteStart = encoder.encode(POST_TEXT.substring(0, match.index)).length;
      const byteEnd = byteStart + encoder.encode(hashtag).length;

      facets.push({
        index: { byteStart, byteEnd },
        features: [{ $type: "app.bsky.richtext.facet#tag", tag: hashtag.substring(1) }],
      });
    }

    // Step 3: Build and send the post
    const postResponse = await fetch(
      "https://bsky.social/xrpc/com.atproto.repo.createRecord",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessJwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo: session.did,
          collection: "app.bsky.feed.post",
          record: {
            $type: "app.bsky.feed.post",
            text: POST_TEXT,
            createdAt: new Date().toISOString(),
            facets,
          },
        }),
      }
    );

    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      throw new Error(`Post failed: ${postResponse.status} - ${errorText}`);
    }

    const result = await postResponse.json();
    console.log("✅ Post created successfully!");
    console.log(`   → ${result.uri}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createBlueskyPost();
