# Wilderland Explore

Student sites for Wilderland Academy, served at https://explore.wilderland.academy

- `/books/`: The Lantern Stacks
- `/challenges/`: Life Skills Challenges (moved here from the `challenges` repo)
- `/projects/`: Atlas of Sparks (moved here from the `projects` repo)

`auth.js` gives every page one shared Google sign-in (school accounts only) and saves each student's saved items to Firebase. A page joins by adding `<script type="module" src="/auth.js" data-site="NAME"></script>` and listing its localStorage keys in `ALLKEYS` inside `auth.js`.

## Shared look

Every page links `/wl.css` in its `<head>` and starts `<body>` with the same `.wlbar` markup: the Wilderland logo (links to this home page), the Books / Challenges / Projects tabs, and the sign-in slot (`data-wl-auth`). Mark the current site's tab with `aria-current="page"`. Give each site's own name the `wl-title` class so the names match. Keep one `data-wl-auth` per page, inside the bar.

`projects/index.html` is built from the Atlas source (`build.js`), which adds the bar itself.

## Pages added Nov 16, 2026
- `/` landing page: image cards for Books, Challenges, Projects, Treebeard Library, Basecamp, Camp Store and the Suggestion Box (`img/`).
- `/store/`: Camp Store, shown only after school sign-in. 100 products in `store/products.js` (price in dollars; blazes = price × 2), one photo each in `store/img/<id>.jpg` (480×480, white background). Wishlist and blaze count live in localStorage key `wl-store` and sync through `auth.js`. The sign-in gate hides the page; the product list itself is not secret.
- `/suggest/`: Suggestion Box on Firestore collection `suggestions`, readable only by signed-in school accounts. Rules are in `firestore.rules` (paste into Firebase console → Firestore → Rules). Admin emails are listed in both `firestore.rules` and `suggest/index.html`.

## Sign-in gate

Add `data-gated class="wl-pending"` to `<body>`, put the page in an element with class `wl-gated`, and add a `.wl-gate` panel with a `data-wl-signin` button. `auth.js` sets `wl-in` or `wl-out` on the body; styles are in `wl.css`.

## Staff Field Guide (added Nov 16, 2026)
- `/fieldguide/`: Mentor Mindset Field Guide for guides. Not linked from the landing page. Staff sign in with their school account; access is the admin list plus the Firestore `staff` collection (managed on the page's Admin stop).
- Content is in `fieldguide/data.js`, logic in `fieldguide/app.js`. Each guide's students and session records live in Firestore under `mentor/{uid}/…` and are readable only by that guide.
- AI features go through the Cloudflare Worker in `relay/` (setup in `relay/README.md`). The Worker address is saved in Firestore `mentorConfig/main`, not in code.
- `firestore.rules` has new rules for all of the above; paste the file into the Firebase console to publish them.
