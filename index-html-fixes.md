# Two exact fixes to paste into index.html

## Fix 1 — the broken "Open an issue" button
FIND:
<a class="btn btn-secondary" href="https://github.com/">Open an issue on GitHub</a>

REPLACE WITH:
<a class="btn btn-secondary" href="https://github.com/the-jopetnah-foundation-tjf/the-jopetnah-foundation/issues/new/choose">Open an issue on GitHub</a>

## Fix 2 — JSON-LD structured data (sameAs field, near the top of the file in the <script type="application/ld+json"> block)
FIND:
"https://github.com/JopetnahInternationalLimited/the-jopetnah-foundation"

REPLACE WITH:
"https://github.com/the-jopetnah-foundation-tjf/the-jopetnah-foundation"

## Also double-check these lines in the same JSON-LD block use the new URL (not the old jopetnahinternationallimited.github.io one):
"url": "..."
"logo": "..."
