# Wilderland Explore

Student sites for Wilderland Academy, served at https://explore.wilderland.academy

- `/books/`: The Lantern Stacks
- `/challenges/`: Life Skills Challenges (moved here from the `challenges` repo)
- `/projects/`: Atlas of Sparks (moved here from the `projects` repo)

`auth.js` gives every page one shared Google sign-in (school accounts only) and saves each student's saved items to Firebase. A page joins by adding `<script type="module" src="/auth.js" data-site="NAME"></script>` and listing its localStorage keys in `ALLKEYS` inside `auth.js`.

## Shared look

Every page links `/wl.css` in its `<head>` and starts `<body>` with the same `.wlbar` markup: the Wilderland logo (links to this home page), the Books / Challenges / Projects tabs, and the sign-in slot (`data-wl-auth`). Mark the current site's tab with `aria-current="page"`. Give each site's own name the `wl-title` class so the names match. Keep one `data-wl-auth` per page, inside the bar.

`projects/index.html` is built from the Atlas source (`build.js`), which adds the bar itself.
