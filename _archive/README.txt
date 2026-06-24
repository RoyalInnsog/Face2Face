_archive — NOT part of the live site
=====================================

These files were moved here so they don't ship with the production site and
aren't served by the dev server (server.mjs blocks this folder). Nothing was
deleted — you can remove this whole folder anytime, or restore a file.

Contents
--------
- Face2Face Salon.dc.html   Original visual-builder export (superseded by index.html)
- support.js                Runtime that the old export depended on (no longer used)
- Screenshot_..._WhatsApp Business.png
                            Your requirements chat with the salon owner. Kept here
                            (out of the web root) because it's a private conversation
                            and should never be publicly served.

Useful info found in the screenshot (for filling the owner-content gaps):
- Confirms 82+ Google reviews and a 4.6★ rating (already reflected in the stats).
- Chat header showed +91 72320 90008 — now wired in as the public phone + WhatsApp
  number (CONFIG in app.js, plus visible text and JSON-LD). If that was wrong,
  change CONFIG.phone / CONFIG.whatsapp in app.js.
- Owner still owes: service price list, logo, 10-15 salon photos, exact address +
  Google Maps link, opening hours, and Instagram/Facebook links.
