# Content and third-party notices

## Content license

The **source code** of this project is under the MIT License (see `LICENSE`).

The project's **creative content** is licensed under **Creative Commons
Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**. The copyright
owner may also grant separate commercial licenses or assign rights to this
content outside the CC BY-NC 4.0 license.

### What this covers

- The cardology **reading texts** (the "Sage voice"), including the per-card,
  per-planet, and period readings.
- The original **"Quinta Essentia" Joker artwork** (`assets/cards/JOKER.webp`).
- An inactive **magnetism-inspired Joker concept** (`assets/cards/JOKER-magnetism.jpg`),
  retained as a design draft and not used on the site.

It does **not** cover the source code (MIT, see `LICENSE`) or the third-party
material below.

### CC BY-NC 4.0 in short

You may share and adapt the covered content with appropriate attribution, a
license link, and an indication of changes, but not for commercial purposes.
This is a human-readable summary, not the license.

Full deed: <https://creativecommons.org/licenses/by-nc/4.0/>

Full legal code: <https://creativecommons.org/licenses/by-nc/4.0/legalcode>

## Third-party notices

### Playing-card figures

The twelve court-card figures in `assets/cards/JC.webp` through
`assets/cards/KS.webp` are based on Byron Knoll's playing-card artwork,
identified by the source listing as CC0.

Source: <https://opengameart.org/content/playing-cards-vector-png>

### Richmond source material

`js/richmonddata.js` identifies its source as Olney H. Richmond's *Mystic
Test Book* (1893), treated here as public-domain historical source material.
The Card Elements Olney reading uses the original planetary source wording.
The site links to a Library of Congress scan of a historical edition:
<https://tile.loc.gov/storage-services/public/gdcmassbookdig/mystictestbook01rich/mystictestbook01rich.pdf>

Modern scans, editions, annotations, or transcriptions may carry separate
rights and are not intended to be reproduced here.

### Astronomy Engine

The Solar Time feature uses `js/astronomy.js`, a vendored browser build of
Astronomy Engine by Don Cross.

- Project: <https://github.com/cosinekitty/astronomy>
- License: MIT License
- Copyright: Copyright (c) 2019-2023 Don Cross

The MIT notice is retained at the top of `js/astronomy.js`.

### IANA timezone reference coordinates

`js/tzcoords.js` contains IANA timezone reference-city coordinates generated
from the tz database's `zone.tab` material. The tz database is public-domain
style reference material maintained for timezone identification. The site uses
these coordinates to approximate longitude for the birth-place selector and
solar-time calculations.

Timezone database project: <https://www.iana.org/time-zones>

### Gate and hexagram calculations

`js/sun-gate.js` and `js/chart-table.js` calculate Human Design-style gate
positions from ecliptic longitude and display the corresponding I Ching
hexagram figures/names. These modules contain calculation tables and labels
used for positional display; they do not include third-party interpretive
reading text.

### Locally bundled fonts

The site serves Inter and Lora from the font files in `assets/fonts/`; it does
not request these families from a third-party font service. Both families are
available under the SIL Open Font License 1.1.

- Inter license: <https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt>
- Lora license: <https://github.com/google/fonts/blob/main/ofl/lora/OFL.txt>
