# Fonts

## Brittany Signature

The welcome splash tagline ("Service with Humility") is set in **Brittany Signature**.

The files here were copied from the licensed copy installed at
`~/Library/Fonts/BrittanySignature.ttf`.

- `BrittanySignature.woff2` (16 KB) — served to browsers
- `BrittanySignature.ttf` (27 KB) — fallback for older browsers

The `@font-face` rule in `src/index.css` tries `local()` first, so machines with the
font installed system-wide use it with no network request; every other visitor
downloads the woff2. If neither resolves, the tagline falls back to **Sacramento**
(Google Fonts), the closest freely licensed signature script.

Vite serves everything under `public/` from the site root, so the files are reachable
at `/fonts/BrittanySignature.woff2` in both dev and the production build.

## Licensing

Brittany Signature is a commercial font. In most EULAs, **serving a font as a webfont
is a separate grant from desktop use** — confirm your licence covers webfont embedding
before deploying this publicly. If it does not, delete the two font files from this
folder and the tagline degrades cleanly to Sacramento.
