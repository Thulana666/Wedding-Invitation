# Photographs

The images currently in these folders are **abstract placeholders** (warm light and bokeh, no people). Replace them with Dilki & Supun's own pre-shoot photographs — never with stock photos of other couples.

## Easiest way: replace files, keep the names

| File | Used for | Best shape |
| --- | --- | --- |
| `hero/hero.jpg` | Full-screen opening photograph | Landscape, at least 2400 px wide; keep faces near the centre/upper third |
| `story/bride.jpg` | Bride portrait (arched frame) | Portrait, about 4:5 |
| `story/groom.jpg` | Groom portrait (arched frame) | Portrait, about 4:5 |
| `story/together.jpg` | Full-width "Together" parallax photo, also the RSVP backdrop | Wide landscape |
| `story/invitation.jpg` | Photo beside the formal invitation | Portrait, about 3:4 |
| `gallery/gallery-01.jpg` … `gallery-10.jpg` | Gallery | See layouts below |

Photos are cropped to fit automatically (`object-fit: cover`) and served as optimised AVIF/WebP, so you can use high-quality JPGs straight from the photographer (aim for under ~1 MB each, 2000–3000 px on the long side).

## Adding, removing or captioning gallery photos

Edit the `gallery` list in `src/config/wedding.js`:

```js
{ src: '/images/gallery/gallery-11.jpg', layout: 'tall', caption: 'Your caption here', alt: 'Describe the photo, e.g. Dilki and Supun smiling together' },
```

`layout` is one of `feature` (full width), `tall`, `square` or `wide`. The grid is designed around repeating groups of **tall, square, square, wide**, with `feature` images between groups — keep that rhythm to avoid gaps. Always write a short `alt` description for screen readers.

Paths for the hero and story photos are under `images` in the same file.
