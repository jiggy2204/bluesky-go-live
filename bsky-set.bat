:: bsky-set.bat
:: Fires when your stream starts. Point this at your copy of bsky-live-status.js.
:: Replace the paths below with YOUR Node.js path and YOUR script path.
:: To find your Node path, open Command Prompt and run: where node
@echo off
"C:\Program Files\nodejs\node.exe" "C:\Users\YourName\path\to\bsky-live-status.js" set
