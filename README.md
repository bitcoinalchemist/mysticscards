# mysticscards.space

A cardology website for exploring birthday cards, Life Scripts, personal cycles,
relationships, and Quadrations spreads. Optional birth time and place support
planetary and solar-time calculations.

**[Visit mysticscards.space](https://mysticscards.space/)**

## How it works

The site is plain HTML, CSS, and classic JavaScript with no framework or build
step. `index.html` contains the page, styling, scripts, fonts, artwork, and
reference data. The web manifest and service worker provide app installation
and offline support; `assets/` contains app icons and the social preview image.

## Local preview

Open `index.html` directly, or serve the repository root locally:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000/>. App installation and offline caching require
HTTPS or localhost, with an initial online visit before offline use.

## Saved data

Contacts and preferences are stored in the browser. Export contacts to back
them up or transfer them to another browser. Clearing site data can remove
saved contacts. See [privacy and use notes](LEGAL.md).

## Maintenance

Edit `index.html` directly, preserving embedded script order and encoded assets.
Its opening `NC MAP` comment identifies the main sections. Bump the cache key
in `sw.js` after deployable changes and update its `PRECACHE` list when adding
local files. Keep the manifest and licence notices consistent with the site.

## Licence and credits

- **Code:** [MIT](LICENSE).
- **Original readings and Quinta Essentia Joker artwork:** CC BY-NC 4.0.
- **Third-party artwork, fonts, code, and datasets:** their respective licences.

See [NOTICES.md](NOTICES.md) and [licenses/](licenses/) for credits and terms.
The site's information button contains legal notes, credits, and contact details.
