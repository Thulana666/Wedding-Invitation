# Background music

`wedding-theme.mp3` — **"Ivory & Gold"**, an original ~110-second piano and soft-strings theme generated from scratch for this website (no samples, no third-party recordings), so it is free of copyright restrictions. It loops seamlessly.

## Replacing it with another track

1. Choose a romantic instrumental (piano, soft strings, gentle orchestral or acoustic) that you are **licensed** to use on a public website. Good sources of properly licensed music:
   - Pixabay Music (free licence, no attribution required)
   - YouTube Audio Library (check each track's licence)
   - Free Music Archive (use tracks marked CC BY or CC0 and credit as required)
   - A paid licence from Artlist, Epidemic Sound or Musicbed
   - A recording commissioned from a musician

   Do not use commercial songs (film soundtracks, popular wedding songs, covers) without written permission from the rights holders.
2. Export as **MP3**, 128–192 kbps, ideally under 4 MB so it loads quickly on mobile data.
3. Save it in this folder — either overwrite `wedding-theme.mp3`, or use a new name and update `music.src` in `src/config/wedding.js`.
4. Update `music.title` and `music.artist` in the same file (and add any attribution the licence requires).

Music never autoplays: it starts only when a guest opens the invitation with "Open with music" switched on, or presses play in the floating player. The choice is remembered for the browser session.
