# Wilderland Explore

Student sites for Wilderland Academy, served at https://explore.wilderland.academy

- `/books/`: The Lantern Stacks
- `/challenges/`: Life Skills Challenges (moved here from the `challenges` repo)
- `/projects/`: Atlas of Sparks (moved here from the `projects` repo)

`auth.js` gives every page one shared Google sign-in (school accounts only) and saves each student's saved items to Firebase. A page joins by adding `<script type="module" src="/auth.js" data-site="NAME"></script>` and listing its localStorage keys in `ALLKEYS` inside `auth.js`.

## Shared look

Explore is four sites under one domain, with one top bar shared by all of them:
- `/`: the front door. Three choices: Students, Guides, Parents.
- **Students** (home `/students/`): Books, Challenges, Life Skills (`/lifeskills/`), Projects, Store, Ideas.
- **Guides** (home `/guides/`): Mentor Mindset (`/fieldguide/`), Behavior, Life Skills (`/guides/lifeskills/`), Parent Comms.
- **Parents** (home `/parents/`): At Home, Our Approach, Field Notes (`/parents/series/`), Life Skills (`/parents/lifeskills/`).
- Every site also links Basecamp (`https://my.wilderland.academy/`), the academic portal. It's a separate website, so its tab
  sits after a thin rule, has an arrow and opens in a new tab.

**The bar.** Every page links `/wl.css` and starts `<body>` with
`<div class="wlbar" data-wlnav="students" data-current="books"></div><script src="/wlnav.js"></script>`.
`/wlnav.js` holds every site's tabs in one list, so the bar is identical everywhere: the three-mountain logo mark (no
wordmark) and the site's name (Students, Guides or Parents; nothing on the front door), which together go to the current site's
own home; that site's tabs; Basecamp; and the sign-in slot (`data-wl-auth`, left out
with `data-auth="off"` on pages with their own account menu, like the Life Skills tracker). The site's home isn't a tab, because
the logo goes there. To add or rename a tab, edit `wlnav.js`, nowhere else. Same colors on every site: don't restyle `.wlbar`
on a page.

`projects/index.html` is built from the Atlas source (`build.js`, kept outside this repo). When you rebuild it, swap its bar for
the two-line `wlnav.js` markup above (`data-wlnav="students" data-current="projects"`).

The old `/families/` addresses forward to `/parents/` (`families/*/index.html`), keeping any `#section` link.

## Pages added Nov 16, 2026
- `/` landing page: image cards for Books, Challenges, Projects, Treebeard Library, Basecamp, Camp Store and the Suggestion Box (`img/`).
- `/store/`: Camp Store, shown only after school sign-in. 176 products in `store/products.js`, grouped into 14 interest categories (price in dollars; blazes = price × 2), one photo each in `store/img/<id>.jpg` (480×480, white background). Wishlist and blaze count live in localStorage key `wl-store` and sync through `auth.js`. The sign-in gate hides the page; the product list itself is not secret.
- `/suggest/`: Suggestion Box on Firestore collection `suggestions`, readable only by signed-in school accounts. Rules are in `firestore.rules` (paste into Firebase console → Firestore → Rules). Admin emails are listed in both `firestore.rules` and `suggest/index.html`.

## Sign-in gate

Add `data-gated class="wl-pending"` to `<body>`, put the page in an element with class `wl-gated`, and add a `.wl-gate` panel with a `data-wl-signin` button. `auth.js` sets `wl-in` or `wl-out` on the body; styles are in `wl.css`.

## Staff Field Guide (added Nov 16, 2026)
- `/fieldguide/`: Mentor Mindset Field Guide for guides. Not linked from the landing page. Staff sign in with their school account; access is the admin list plus the Firestore `staff` collection (managed on the page's Admin stop).
- Content is in `fieldguide/data.js`, logic in `fieldguide/app.js`. Each guide's students and session records live in Firestore under `mentor/{uid}/…` and are readable only by that guide.
- AI features go through the Cloudflare Worker in `relay/` (setup in `relay/README.md`). The Worker address is saved in Firestore `mentorConfig/main`, not in code.
- `firestore.rules` has new rules for all of the above; paste the file into the Firebase console to publish them.

## Wilderland at Home (`/parents/athome/`, was `/families/`)
Parent site: daily routine by grade band and schedule, reading and math at home, the Mentor Mindset for parents,
hard moments at home, links to Challenges / Atlas of Sparks / Lantern Stacks, the twelve Partnership Guide practices,
and who to ask. Static, no sign-in. `noindex`, linked from the Explore front door and the Parents home, never from a student
page. Content lives in `parents/athome/data.js`; sources are the Lower and Upper Campus Parent Handbooks, the Parent Partnership
Guide, the Parent Education Night packet and `challenges/parents.html`. Choices families make are stored in their browser only.
Full time and part time are different commitments and the "Your part at home" stop must keep them visibly different
(`WEEK` in `parents/athome/data.js`, side-by-side compare table). Full time: school runs app work and Life Skills; home is reading
and a weekly look. Part time: on home weekdays the family runs app work to target and Life Skills challenge work; school
assigns and tracks it but does not supervise it. Say "weekday" or "home weekday", never "school day".

## Behavior Trail Guide (`/behavior/`, added Nov 17, 2026)
Staff-only guide to Wilderland's behavior standards (tiers, Peace Talks, send-home, Freedom Levels), the discretionary toolkit,
neurodivergence support, composite scenarios, research cards, training badges and an AI coach (same relay as the Field Guide).
Not linked from the landing page. Same staff list as the Field Guide; school accounts only (no board guests).
- Content and the living-document lists (open questions, change log) are in `behavior/data.js`. Edit there, then add a CHANGELOG line.
- Scenarios are composites. Never put real student names in `data.js`: it is a public file.
- Firestore: `flStudents/{id}` (+ `/history`) for Freedom Levels, visible to all staff; Nature Walk Level 4 needs a second guide to confirm.
  `townhall` holds students' Town Hall items (private to the student and staff); `townhallAgenda` holds staff-written public titles.
  `behaviorProgress/{uid}` holds training badges (admins see the roster); `behaviorProposals` holds proposed changes.
- `/suggest/` now has a Town Hall mode: students send agenda items, see their own items' status and the upcoming agenda.
- `firestore.rules` has the new rules; paste the file into the Firebase console to publish them.

## Our Approach (`/parents/approach/`) and Field Notes (`/parents/series/`)
Two more parent pages beside At Home, same rules: static, no sign-in, `noindex`, not linked from student pages, shared
`parents/parents.css` and the shared bar, and the grade band a family picks (localStorage `wl-family-prof`) carries across.
- **Our Approach** is one long page with a sticky section menu (anchor links + scroll spy; the menu stays sticky on phones
  as a single scrolling row). It deliberately goes beyond the Parent Education Night packet, which most families have seen:
  pillars toggle, how guides help and give feedback, mornings up close, Life Skills with one sample challenge per band
  (copied from `challenges/data.js` by ID; update `SKILLS` if one is renamed or cut), evidence rated by strength, glossary,
  and a short refresher of the packet at the end. Only SETTLED practice from The Three Pillars goes here.
- **Field Notes** is the parent education series. "Start here" is one book, one podcast and one talk (`START`); the shelf
  below interleaves books, listens and watches so books don't stack up at the top. Then a short shelf of other books, and podcasts and talks, each a full entry in `ITEMS`: big ideas,
  where you'll see it at Wilderland (tags from `METHODS`, which must be real practices), where we part ways, worth
  knowing, questions to talk about and one thing to try. Entries open at `#<id>`. Books come only from
  wilderland.academy/inspiration, and only ones Alex has read; keep the shelf short. Podcasts and talks come from what
  the team has shared (Slack #inspiration and #alpha-inspiration). Big ideas for an episode must come from its own
  description or transcript.
- **The questions families ask most** sit right under Start here: rewards and motivation, screens with a purpose, and
  Montessori (`ASK_GROUPS` and `ASKS`, same one-card format as `READS`). Each topic keeps at least one piece that pushes back.
  These cards may point to books and sources that aren't on the Inspiration list; say whose source it is and keep facts to what it says.
- Lighter reading lives in `READS` (one linked card each, grouped by `READ_GROUPS`: the microschool movement, Alpha
  from both sides, research). Keep facts and numbers to what the article itself says, and keep the critical pieces.
  Content is in `parents/series/data.js`.

## Life Skills Tracker (`/lifeskills/`, added Nov 18, 2026)
Pass records for the Life Skills challenges, separate from academics. Built on the Wilderland Academy design system
(forest nav, white page, lime only on forest, meadow buttons on white, Uncut Sans, no borders or shadows).
Linked from Challenges ("My progress"), the parent pass-off page and the Field Guide header. `noindex`.
- **Guides and admins** (school account on the staff list): band overview with filters (no pass in 3 weeks, open
  not yets, new milestones), log a pass or not yet, every student's record, and Students and parents, where guides
  add students and match parent emails. Only guides and admins can match a parent to a child.
- **Students** (school account a guide added): their own record, their "working on" list (up to 3, can load from
  their Challenges plan), and the crew board: what everyone is working on and has passed. Not yets stay private.
- **Parents**: any confirmed email a guide put in a child's `parents` list sees that child only. Sign in with
  Google, email and password (with email confirmation), or an emailed sign-in link; password reset by email.
- Firestore: `lsStudents/{sid}` (private: name, band, grade, email, guide, parents, celebrated),
  `lsStudents/{sid}/entries/*` (each pass or not yet), `lsBoard/{sid}` (short name, working, passed; read by all
  school accounts and the child's parents). Credits, ranks and milestones (every 4 credits) are worked out in `app.js`.
- `school()` in `firestore.rules` now requires a confirmed email, because email/password accounts exist.
  `auth.js` keeps a confirmed family account signed in on other Explore pages without student features.
- Testing: `lifeskills/?emu` on localhost talks to the Firebase emulators (auth 9099, firestore 8085).

## Staff Guides hub (`/guides/`) and Parent Communication (`/guides/parents/`), added Nov 21, 2026
- `/guides/` is the one page for guides: cards for Mentor Mindset, Behavior, Life Skills and Parent Communication. Static, `noindex`,
  not linked from student pages.
- Every staff page (`/guides/`, `/fieldguide/`, `/behavior/`, `/guides/lifeskills/`, `/guides/parents/`) has the same five-tab `.wlguides`
  menu in its top bar, between `<!--guides-nav-->` markers on the new pages. Change all five together.
- `/guides/lifeskills/` is the Life Skills tracker inside the staff guides: its own `index.html` with the staff menu on top, running
  the same `/lifeskills/app.js` and `/lifeskills/styles.css`. `/lifeskills/` stays as is for students and parents. The tracker has
  its own sign-in, so `/guides/lifeskills/` does not load `auth.js`.
- **Parent Communication** is a writing coach with three modes: newsletters (model stories), customer service (replies to parent
  questions and concerns) and events. Staff only: admin list, Firestore `staff`, and Ian's three guest addresses (the guest list in `auth.js`, `worker.js`, `fieldguide/app.js`, `guides/parents/app.js` and `firestore.rules`). Guests can open `/fieldguide/`, `/guides/` and `/guides/parents/`, not the Behavior Guide or student sites.
  It uses the same AI relay. Nothing is saved to Firestore: conversations live in the browser tab (sessionStorage) and clear when it closes.
- The writing rules are `guides/parents/skill.txt`, Ian's `wilderland-parent-comms` SKILL.md copied verbatim minus its `---` header.
  To update the rules, paste the new SKILL.md body into that file. Keep it `.txt`: GitHub Pages runs Jekyll, which turns `.md` into `.html`. Mode focus, starters, the side checklists and the customer-service additions from the
  Parent Concern Protocol are in `guides/parents/data.js` (add a CHANGELOG line there when you change it).
- `relay/worker.js` now allows 3,000 output tokens (was 1,500) and returns `stop` so the coach can say when a reply was cut off.
  Paste the new worker.js into Cloudflare and Deploy for this to take effect; until then long newsletters may be cut short.

## Conversation history (`/guides/history/`) and the Lab builder (`/guides/lifeskills/builder/`), added Nov 21, 2026
- **History.** `guides/log.js` saves every AI conversation to Firestore `coachLog/{uid}/threads/{id}`: the Mentor Mindset coach's
  tent and each scored practice rep (`/fieldguide/`), the Behavior coach (`/behavior/`), the Parent Communication coach and the Lab
  builder. Only the owner can read, write or delete their threads (admins included: nobody else can). `/guides/history/` lists them
  with filters, opens one to read or copy, deletes (tap twice), and "Continue" reopens Parent Comms and Lab builder threads
  (`?t=<id>`). Session room records in the Field Guide are separate and stay where they are (`mentor/{uid}/sessions`).
- **Lab builder.** Adapted from Ian's "Wilderland Guide Builder" prototype: four ways in (a Life Skill, an idea, a challenge on the
  site, a plan to review), using the Skill Map and challenges in `challenges/data.js`. Every draft is scored on the K-8 Life Skills
  Workshop Scorecard (nine indicators, 1 to 3) and pushed toward 3s. The rules are `guides/lifeskills/builder/rules.txt`, written
  from the Scorecard, the Challenge System doc and the Valley Builders lab; replace them with Ian's `builder-rules.md` if he wants
  his exact wording (keep the Scorecard and output-order sections, which the page relies on). A "Lab builder" tab appears in the Life
  Skills sub-nav only inside the staff guides. Guests (Ian) can use it.
- **Epic Labs** (added later Nov 21): `guides/lifeskills/builder/epics.js` holds example Epic Labs for each band (three for K–1, four for 2–4 and 5–8) (weeks-long Labs that end in a real, public feat),
  each with its Skill Map abilities, how it meets high standards, high support and high autonomy, Test to Pass, showcase,
  safety and a rough cost. They appear as the first way into the Lab builder ("An epic Lab to adapt"); a guide picks one,
  sets band, time and notes, and the builder writes the full week-by-week plan and scores it. Link straight to one with
  `/guides/lifeskills/builder/?epic=<id>`. Places marked [CONFIRM] still need checking.
- `rules.txt` now defines Epic Labs and allows multi-week Labs in K–1 (a standard K–1 Lab still fits in one day).
- `firestore.rules` has the new `coachLog` rule; publish it in the Firebase console or history saves will fail.

## Parents Life Skills (`/parents/lifeskills/`) and the site restructure, added Nov 21, 2026
- The Life Skills tracker runs in all three sites with each site's bar: students `/lifeskills/`, guides `/guides/lifeskills/`,
  parents `/parents/lifeskills/`. Same `lifeskills/app.js`; it sends each signed-in person to their own site's copy (a parent
  who follows an old `/lifeskills/` link lands on `/parents/lifeskills/`), and emailed sign-in links return to the same copy.
- The student landing page moved from `/` to `/students/`; `/` is now the front door.
