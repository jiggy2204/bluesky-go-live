# Bluesky Auto Live Status for Streamers

Automatically set your Bluesky profile to **LIVE** when you start streaming, and clear it when you're done — using Mix It Up and OBS.

No coding experience needed. Just fill in a few fields and you're good to go.

---

## What This Does

When you go live, a script fires that sets your Bluesky profile badge to LIVE with a link to your stream. When you end your stream, another script clears the badge automatically.

---

## What You'll Need

- [Node.js](https://nodejs.org/) (v18 or higher) — free, just install it
- [Mix It Up](https://mixitupapp.com/) — free streaming bot software
- [OBS](https://obsproject.com/) or Streamlabs OBS
- A [Bluesky](https://bsky.app) account

---

## Step 1 — Install Node.js

Download and install Node.js from [nodejs.org](https://nodejs.org/). The **LTS** version is fine.

After installing, find the full path to Node on your machine:
1. Open **Command Prompt** (search "cmd" in your Start menu)
2. Type `where node` and hit Enter
3. Copy the result — it'll look something like `C:\Program Files\nodejs\node.exe`
4. Keep this handy, you'll need it in Step 4

---

## Step 2 — Get a Bluesky App Password

You'll use an **App Password** instead of your real Bluesky password. This keeps your account safe — if the password is ever exposed, you just delete it and make a new one without changing your login.

1. Log into Bluesky
2. Go to **Settings → Privacy and Security → App Passwords**
3. Click **Add App Password**, give it a name like `stream-bot`
4. Copy the password it gives you (format: `xxxx-xxxx-xxxx-xxxx`)

---

## Step 3 — Set Up the Scripts

You'll need three files, all in the same folder (somewhere stable, like `C:\Users\YourName\streaming\bluesky\`):

- `bsky-live-status.js` — the main script
- `bsky-set.bat` — fires when your stream starts
- `bsky-clear.bat` — fires when your stream ends

### bsky-live-status.js

Open the file and fill in the **CONFIG section** at the top:

```js
const HANDLE        = "yourhandle.bsky.social";  // Your Bluesky handle
const PASSWORD      = "xxxx-xxxx-xxxx-xxxx";     // Your App Password from Step 2
const STREAM_URL    = "https://twitch.tv/yourchannel"; // Your stream URL
const STREAM_TITLE  = "Live Now!";               // Title shown on the link card
const STREAM_DESC   = "Come hang!";              // Description shown on the link card
const DURATION_MINS = 240;                       // Leave this as 240 (the maximum Bluesky allows)
```

**Do not change anything else in the file.**

### bsky-set.bat and bsky-clear.bat

Open each `.bat` file and update the two paths:
1. Replace the Node.js path with the one you found in Step 1
2. Replace the script path with wherever you saved `bsky-live-status.js`

Example:
```bat
"C:\Program Files\nodejs\node.exe" "C:\Users\YourName\streaming\bluesky\bsky-live-status.js" set
```

---

## Step 4 — Test the Scripts

Before wiring anything up to Mix It Up, test that the scripts work:

1. Open your scripts folder in File Explorer
2. Double-click `bsky-set.bat`
3. A command prompt window should open, run, and show a success message
4. Check your Bluesky profile — the LIVE badge should appear (you may need to refresh)
5. Double-click `bsky-clear.bat` to remove the badge when done

If the window flashes and closes too fast to read, open `bsky-set.bat` in Notepad and add `pause` as a third line. That'll keep the window open so you can see any error messages.

---

## Step 5 — Wire Up to Mix It Up

1. Open **Mix It Up** and connect it to your streaming account if you haven't already
2. In the left sidebar, go to **Events**
3. Find the **Streaming** category
4. Click **Stream Started**:
   - Add an action → **External Programs** (or "Run Program")
   - Set the **Program** field to your full Node.js path (e.g. `C:\Program Files\nodejs\node.exe`)
   - Set the **Arguments** field to the full path to `bsky-live-status.js` followed by `set`
   - Example arguments: `"C:\Users\YourName\streaming\bluesky\bsky-live-status.js" set`
   - Alternatively, just point the Program field directly at `bsky-set.bat`
5. Repeat for **Stream Stopped**, using `bsky-clear.bat` or the `clear` argument

Mix It Up has a **test button** (▶) next to each event — use it to verify the action fires correctly without needing to go live.

---

## Troubleshooting

**The badge never shows up**
Make sure `DURATION_MINS` is set to a number (240) and not left blank or as `undefined`. Bluesky requires a duration value to display the LIVE badge.

**Auth failed error**
Double-check that your handle and App Password are correct in `bsky-live-status.js`. Make sure you're using an App Password, not your regular login password.

**Command prompt flashes and nothing happens**
Add `pause` to the last line of your `.bat` file to keep the window open and read the error.

**The window says "node is not recognized"**
The path to Node.js in your `.bat` file is wrong. Run `where node` in Command Prompt to find the correct path.

---

## Notes

- Bluesky enforces a maximum status duration of **4 hours** regardless of what you set. The `clear` script on stream end is what actually removes the badge in real time.
- Each streamer needs their own copy of `bsky-live-status.js` with their own credentials and stream URL.
- If your App Password is ever accidentally shared or exposed, revoke it immediately in Bluesky settings and generate a new one.

---

## Also Included — Auto Post on Stream Start

`post-to-bluesky.mjs` is a companion script that posts to your Bluesky feed when you go live, complete with clickable URLs and hashtags. Set it up the same way — fill in your handle, App Password, and post text at the top of the file, then wire it to your Stream Started event in Mix It Up alongside the live status script.

---

*Built using the [AT Protocol](https://atproto.com/) and [Bluesky lexicons](https://github.com/bluesky-social/atproto/tree/main/lexicons/app/bsky/actor).*
