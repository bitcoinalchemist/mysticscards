# Nature Cards

Nature Cards explores birthday cards, Life Scripts, personal cycles,
relationships, and Quadrations spreads. Optional birth time and place support
planetary and solar-time calculations. No framework or build step is required.

## Package contents

| File | Purpose |
| --- | --- |
| `index.html` | Page with embedded styles, scripts, fonts, artwork, and data |
| `manifest.webmanifest` | Installation name, colours, launch URL, and icons |
| `sw.js` | Network-first page and asset caching |
| `favicon.ico`, `assets/` | Browser/app icons and social preview image |
| `LICENSE` | Original project's MIT code licence |
| `NOTICES.md`, `licenses/` | Creative-content terms and third-party notices |
| `LEGAL.md` | Privacy, browser storage, and disclaimer notes |

## Preview and deployment

Nature Cards v0.48 is the main website in this repository. Open `index.html` to
view the page. CSS, scripts, fonts, and card artwork remain embedded.

Upload the **public files in this repository root** to your web host's public root when
you are ready to replace the current site. No build or installation is needed.
The previous modular site is preserved locally in `dev/retired code/pre-standalone-root/`.

The manifest provides the app name and installation icons. The existing site
icons and social preview image are included in `assets/`; browser and Apple
icons also remain embedded in the HTML. Canonical and social links retain
the intended production domain, https://mysticscards.space/.

App installation and offline caching require HTTPS or localhost. Visit once
online before using offline. External links still require a connection.
Bump the cache name in `sw.js` after future deployable edits; add any new
external local files to its FILES list.

For a local server, run this **inside this folder**, then visit
<http://localhost:8000/>:

```sh
python3 -m http.server 8000
```

Use another port if occupied and confirm the server serves this folder.
Back up the hosted site before replacement. Upload this folder's contents,
including licence files, with `index.html` at the public root. Serve the manifest
as JSON, preferably `application/manifest+json`.

Check Finder, contacts, relationships, Cycles, Spreads, birth details, installation,
and an offline reload after service-worker activation. Test fresh and existing
browser sessions: a previous service worker may still be present. Do not clear
visitor data automatically, since it may contain contacts. See the
[release notes](LEGAL.md#before-public-release).

## Saved data

Contacts and preferences use browser storage. Export contacts for backups or
to move between browsers. Changing browser, device, or origin does not transfer
data automatically. Clearing site data can delete contacts.
See [privacy notes](LEGAL.md#privacy-and-browser-storage).

## Maintenance

- Edit `index.html` directly; use its opening `NC MAP` section labels.
- Preserve the 24 classic scripts' order and encoded assets/data payloads.
- Back up existing files before editing and preserve unrelated work.
- Update the service-worker cache name after deployable changes and maintain
  its list of local runtime files.
- Check JavaScript syntax and verify affected interactions in a browser.
- Update notices and privacy wording when dependencies or data handling change.

## Licensing and credits

Project code is [MIT licensed](LICENSE). Original readings and Quinta Essentia
Joker artwork retain the original project's **CC BY-NC 4.0** licence. The code
licence does not grant commercial permission for that creative content.
Fonts, Astronomy Engine, card figures, and datasets retain their own terms.
Read [NOTICES.md](NOTICES.md) before reusing or redistributing the package.


## Repository layout and migration

`index.html` is now the maintained source and deployment entry point.
The old external CSS, JavaScript, font, card-art, and background files are
preserved locally in `dev/retired code/pre-standalone-root/`, which is ignored
by Git. The earlier `nature-cards/` preparation copy is also ignored; edit the
root page from now on. `assets/` retains only icons and the social preview.

Review the removed old paths and new root files together in your next commit,
then push normally. The commit removes retired files from the current GitHub
branch; it does not erase earlier Git history. Do not upload `dev/`, `versions/`,
or the preparation copy to the host.

Run the current package smoke check with `node dev/tests/smoke.cjs`.
The older feature tests under `dev/tests/` target historical modular or standalone
versions and may need adapting before use with this edition.
