import { fetchLyricsExact } from './engine/lyrics/lrclib';

async function runTest() {
  console.log("Fetching Kesariya from LRCLIB...");
  
  // 268 seconds is the duration of the real song
  const result = await fetchLyricsExact("Kesariya", "Arijit Singh", 268);
  
  if (result) {
    console.log("✅ Success! Found song:", result.trackName);
    console.log("Synced lyrics available?:", result.syncedLyrics ? "YES" : "NO");
  } else {
    console.log("❌ Could not find an exact match.");
  }
}

runTest();