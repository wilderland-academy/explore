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
- **Guides** (home `/guides/`): Mentor Mindset (`/fieldguide/`), Behavior, Life Skills (`/guides/lifeskills/`), Student Roster (`/guides/roster/`), Parent Comms.
  Life Skills has its own sub-menu: Overview, Challenges (`/guides/challenges/`), Labs schedule, Log, Crew board, Lab builder.
- **Parents** (home `/parents/`): At Home, Our Approach, Field Notes (`/parents/series/`), Life Skills (`/parents/lifeskills/`).
  Life Skills' sub-menu: one tab per child, Challenges (`/parents/challenges/`), Labs schedule, Passing off at home.
- The Life Skills sub-menu for both sites is one list in `/lifeskills/subnav.js`. Edit it there.
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

## Who sees what: the site switcher and student bands, added Nov 21, 2026

- **Roles.** `/auth.js` works out who is signed in and announces it as a `wl-role` event (`{ role, band }`): **staff** (the admins in `auth.js`, anyone with a `staff/{email}` record, and the team guests), **student** (any other school account; their band comes from their Life Skills tracker record, matched by school email), or **parent** (a confirmed personal email). The Life Skills tracker pages announce the same event from their own sign-in. The role is remembered on the device as `wl-role` so the next page draws at once, and cleared on sign-out.
- **Switcher.** In `/wlnav.js`, staff get a menu on the site name to switch between Students, Guides and Parents. Parents get Parents and Students. Students get no switcher.
- **Where each role may be.** Students are sent to the Students site from the front door, the Guides site and the Parents site. Parents are sent to the Parents site from the front door and the Guides site. Signed-out visitors see what they saw before.
- **Bands.** A signed-in student always starts in their own band and can look up at older bands, never down. On Challenges, the band buttons show their band and the older ones; saved picks from a younger band are kept but not shown. The tracker's Crew board works the same way. On Books, nothing is hidden, but a K–1 or 2–4 student who hasn't set their age and Lexile starts with band picks (Dog Man first for 2–4) in "Or tap one" and a "Good places to start" shelf (`BANDSTART` in `books/index.html`). A student not yet in the tracker has no band, so they see everything as before.
- **Pages that only need the role** (front door, Parents pages, Students home) load `/auth.js` with `data-site="home" | "parents" | "students"`. These never sign anyone out, and show no sign-in chip when the bar has `data-auth="off"`.
- **Limits.** This steers the screen only. All challenge text is still in `/challenges/data.js`, so a determined student could read it. Private things (tracker records, coaching history, staff tools) are protected by `firestore.rules`, not by these redirects.

## Challenges in all three sites, student progress, and the home page art, added Nov 21, 2026

- **One page, three sites.** The Challenges page lives in `_includes/challenges.html`. GitHub Pages (Jekyll) builds it into `/challenges/` (Students), `/guides/challenges/` (Guides) and `/parents/challenges/` (Parents); each of those `index.html` files is only front matter plus a one-line Jekyll include of `challenges.html` with its site name. Edit the include, not the three pages. Asset paths in the include and in `challenges/app.js` are absolute (`/challenges/...`) so the copies work from any folder. Guides and parents get the full map with no student plan; students also get My progress and the Crew board.
- **Students no longer have a Life Skills tab.** Their progress is in Challenges: `challenges/progress.js` shows their trail (credits, rank, year goal, working on, not yets with what to practice, feats), marks passed challenges on the map, lets them set up to 3 "working on" challenges from any challenge's sheet, and shows the Crew board (their band and older). It reads `lsStudents/{sid}`, its entries and `lsBoard` through the same Firestore rules as the tracker; `/auth.js` now includes the student's tracker record id (`sid`) in the `wl-role` event. A student who opens `/lifeskills/` is sent to `/challenges/#progress`.
- **Home pages.** Each card on `/guides/` and `/parents/` has a small inline SVG illustration in its own color (no image files).

## Student AI Coach, staff Students page, and the parents' safety page, added Nov 21, 2026

- **Students** (grades 2–8, signed in): an "AI Coach" tab (`/coach/`, their own conversations and a first lesson on using AI), plus the coach inside every challenge sheet ("Ask the AI Coach") and every project spark ("Plan it with your AI Coach"). The chat panel is `coach/coach.js`: a four-point intro the first time, starter buttons, suggested replies after each answer, and short "Coach tip" lines that teach good AI habits. The old copy-a-prompt boxes are gone for students; guides still get the copyable prompts on `/guides/challenges/`.
- **Every safeguard runs in the relay Worker**, not the browser: see "The student AI Coach" in `relay/README.md` for the full list and order. Research and rules it follows: Anthropic's requirements for organizations serving minors (moderation, monitoring and reporting, education on safe use, AI disclosure, a public compliance statement), Khanmigo's model (screening, teacher-visible chat history, alerts with a severity tier, daily limits), California SB 243's crisis-protocol and AI-disclosure ideas, Common Sense Media's findings against companion-style and mental-health chatbots for minors, Utah Code 80-2-602 (everyone must report suspected abuse to DCFS, 1-855-323-3237), and Bastani et al., PNAS 2025 (guardrailed AI tutors avoid the learning loss that answer-giving AI causes).
- **Data** (Firestore, rules in `firestore.rules`): `aiChats` (one per conversation), `aiTurns` (every message, signed by the Worker), `aiAlerts`, `aiStudents` (daily counts). Students read only their own and can't edit or delete; every staff member reads everything; admins can delete.
- **Staff: Guides › Students** (`/guides/students/`, now the Student Roster at `/guides/roster/`, see below): Alerts (with what to do for urgent ones, and a note when marked reviewed), every AI conversation, and each student's saved challenges, project sparks and books. Admins see all students; other staff see the grade bands of the students they guide (the `guide` field in the tracker). The Students tab shows a count of open alerts on every Guides page.
- **Parents:** `/parents/ai/` explains the coach, the safeguards and the data, and is linked from the Parents home and the coach page.

## Coach beside the page, academics, Student Roster, saved challenges and the Labs schedule, added Nov 22, 2026

- **The AI Coach opens beside the page, not over it.** `coach/coach.js` docks the panel on the right (the page narrows to make
  room; no dark backdrop) on screens wider than 860px, and as a bottom panel on phones (with a button to make it taller). A sheet
  that was open, like a challenge, stays open in the space next to the coach. While the coach is open, `showModal()` is swapped
  for a plain `show()` (a modal dialog would freeze the coach), and sheets go back to modal when it closes.
- **Why a coach, and academics.** The first-time intro and `/coach/` explain why to ask the coach (always there, knows something
  about almost everything, the guide still passes you). Students can now get hint-only help with academics from the subject
  buttons on `/coach/`. The rules and the #alerts Slack notice for every academics conversation are in `relay/README.md`.
  Bumping `INTRO_VERSION` in `coach.js` shows the intro again to everyone once.
- **Any challenge, anywhere, opens as a modal.** `/challenges/modal.js` turns any `<a data-wl-ch="EN-03.2" href="/challenges/#c=EN-03.2">`
  into a modal over the current page (`WLChallenge.open(id)`, `WLChallenge.link(id, text)`). It's used in the tracker, the Labs
  schedule, the Student Roster, the coach's header, Our Approach and the Lab builder. On the Challenges page it opens the page's
  own sheet. `/challenges/#c=ID` (all three sites) opens that challenge.
- **Student Roster** (`/guides/roster/`, top-level Guides tab, replaces Guides › Students and the tracker's "Students and parents";
  old links forward): every student and their parents (add, edit, CSV import, delete for admins), Alerts, and every AI
  conversation (filter: academics, not reviewed yet). A student's page has their parents, conversations, alerts and saved sparks
  and books. Writes go through Firestore's `:commit` endpoint, so a student and their crew-board record save together.
- **Saved challenges are on the Life Skills overview.** Show: "Saved to plan" turns each cell into saved/goal for that life skill
  (challenges in the student's Challenges plan they haven't passed). With a mouse, pointing at (or clicking, or tabbing to) a
  count lists those challenges as links. On phones and touch screens the overview is one card per student and each life skill
  opens with a tap, so nothing needs hover. "Plan short of the goal" finds students whose passes plus saves don't reach the year
  goal in some life skill. A student's record also lists what they saved. Read from `students/{uid}/sites/challenges` (staff can).
- **Life Skill Labs schedule** (`#schedule` in the tracker: guides at `/guides/lifeskills/#schedule`, parents at
  `/parents/lifeskills/#schedule`). Guides add, edit and delete Labs: date (and last day for multi-day Labs), times, bands, place,
  guides, what students do, up to 8 challenges, and for parents optional notes, files (up to 20 MB each) and links. Month grid on
  wide screens, a list on phones, plus Coming up and Past. Parents see only their children's bands and which child each Lab is for.
  - Firestore `labs/{id}`; files in Firebase Storage under `labs/{id}/` (`storage.rules`, new). **Storage needs the Blaze plan**
    (no-cost usage still applies). Without it, uploads fail with a message to use a Google Drive link instead; links always work.
    When publishing `storage.rules`, the console asks to let Storage read Firestore (the rules check the staff list): allow it.
  - Parents can read Labs only once a guide has linked them to a child: `lsParents/{email}` (children, bands), which the Student
    Roster rebuilds from the student records every time a staff member opens it and after every save. **After deploying, open the
    Student Roster once** so existing parents get their records.
- `firestore.rules` has new rules for `labs` and `lsParents`; publish it, and `storage.rules`, in the Firebase console.

## Coach updates, the Guide Mentor 🐲, the Staff Handbook and books from outside the Stacks, added Nov 22, 2026

- **The coach is a fox 🦊.** `coach/coach.js` shows 🦊 in its header and beside its replies. Bumping `INTRO_VERSION` shows the
  first-time intro to everyone once.
- **Finding a challenge or a project with the coach.** The AI Coach page's cards open `/challenges/?coach=find` and
  `/projects/?coach=find`; each page opens the coach (kinds `find-challenge`, `find-project`) once the student's sign-in is
  confirmed, and both pages have a "🦊 Find … with your AI Coach" button. The coach asks what the student is into, then suggests
  challenges as `[EN-03.2]` or kinds of projects as `[[paint]]`; the chat turns those into links (a challenge opens beside the coach;
  a project kind moves the map there via `window.WLCoachLinks` in `projects/index.html`). The Worker builds the list itself from
  `/challenges/data.js` (the student's band) and the `W(...)` lines in `/projects/`, so a student can't edit it.
  `projects/index.html` is built from the Atlas source outside this repo: copy the `coachfind` button and the `WLCoachLinks`
  block into that source before the next rebuild.
- **Conflict coach** (kind `conflict`, the "Work out a conflict" card on `/coach/`): walks a student through the Behavior Policy:
  take a beat (RULER), describe what happened without labels, feelings and needs, see their side, plan the talk with Nonviolent
  Communication ("When I…, I felt…, because I need…, would you be willing…?"), talk privately, own their part, and the 10 "Handle It
  Yourself" steps. A student saying they're being bullied is the topic here, so the coach still answers, and staff get a high
  alert (and #alerts). Everything urgent still gets the fixed crisis replies.
- **Academics is gated (a pilot).** The coach says it doesn't help with academic work. Students can tap "I'm interested" on
  `/coach/` (Worker mode `interest`: one `academic_interest` alert and one #alerts notice per student). Admins turn the pilot on per
  student on the Student Roster ("Academics coach pilot", `coachAcademic: true` on the tracker record, or "Turn on the academics
  pilot" on the interest alert). Only then do the subject buttons show and the Worker accept `kind: "academic"`. A conversation
  keeps the kind it started with.
- **Reply check fix.** The academics test failed because the reply checker had only 120 tokens and its JSON got cut off. It now
  gets 400, is told to answer with JSON only, and the parser takes the last JSON object (or `"ok": true/false`) from the answer.
  Failures are logged in Cloudflare (Workers → mentor-relay → Logs).
- **Guide Mentor 🐲** (`guides/mentor/mentor.js`, Worker mode `mentor`, school staff only): one AI that answers from the Staff
  Handbook and Behavior Policy (stored in Cloudflare KV, binding `DOCS`, keys `handbook` and `behavior-policy`, never in this public
  repo) plus `/fieldguide/data.js`, `/parents/approach/data.js`, `/parents/athome/data.js`, `/guides/parents/skill.txt` and
  `/guides/lifeskills/builder/rules.txt` (fetched by the Worker). The documents are sent with prompt caching, so repeat questions are
  cheap. Open it from the 🐲 button in the Guides top bar on every staff page, the box at the top of `/guides/`, the front door
  for staff, or `/guides/?mentor`. Conversations save to Your conversations (`coachLog` site `guide`; `?mentor=<id>` continues one).
  To update the handbook or policy text: Cloudflare → Storage & Databases → KV → the DOCS namespace → edit the key.
- **Staff Handbook** (`/guides/handbook/`, staff only): the handbook text from the Worker (mode `doc`), with sections, search and
  "Ask about this 🐲". Admins can upload the original PDF (Firebase Storage `staff/handbook.pdf`, staff-only, rules in
  `storage.rules`); then everyone gets "Open the original PDF".
- **Books from outside the Stacks** (`/books/#outside`): searching a title that isn't on the shelves offers "Find books like …".
  The student names the book; signed in, the Worker (mode `booktags`, school accounts) tags it with the Stacks' own labels (only
  labels come back, checked against the list the page sends), and the page's own `recs()` finds similar books. Students can also
  tap what it's like themselves. "I loved it" keeps it on their shelf under "From outside the Stacks" (`ext` in `lantern-stacks`).
- **Deploy:** paste `relay/worker.js` into the Worker; create the KV namespace, add the two keys, bind it as `DOCS`; publish
  `firestore.rules` (adds `guide` to coachLog sites) and `storage.rules` (adds `staff/`).

## Test accounts, band defaults, Labs and Validate, added Nov 22, 2026
- **Test view (testers only).** Alex, Shanan, Sarah, Courtney and Ian (all three of his addresses) get a 🧪 **Test view** button in
  the top bar. It switches this device to the **test guide**, **test student** or **test parent**, in a band you pick; a yellow strip
  says so on every page, with "Back to my account". The three are linked: `lsStudents/test-student` (guide
  `test.guide@wilderland.academy`, parent `test.parent@example.com`), its `lsBoard` copy and `lsParents/test.parent@example.com`,
  all with `test: true`. `/auth.js` makes them the first time someone switches. Every page leaves `test` records out for everyone
  else (tracker, roster, crew boards, alert badge, Labs added in a test view), and a test view sees only test records, so nothing
  real changes: real Labs are read-only there. The test student's saved things live in `testStudents/{uid}/sites/{site}`; their AI
  Coach chats go through the relay with `as: "student"` and are marked `test` (never posted to Slack). The lists of testers are in
  `/wlnav.js` (pages), `relay/worker.js` and `firestore.rules` (`tester()`); keep them in step. Shared staff tools (Behavior, Field
  Guide) are still the real ones in the test guide view.
- **Bands.** Every K–1 / 2–4 / 5–8 choice starts on the visitor's band: guides from `STAFF_BANDS` in `/wlnav.js` (Chelse and Jessica
  K–1, Shanan and April 2–4, Scott and Sarah 5–8), students from their tracker record, parents from their children (the youngest
  first, via `lsParents`). Admins and guests without a band start on All where a page has it, otherwise 5–8. Pages read it with
  `window.wlBand({ all: true })`; a band picked on a page holds until the visitor leaves it.
- **Labs.** In Guides › Life Skills, **Labs** holds the schedule and the Lab builder (tabs at the top of each). The month shows
  school days only (Monday to Friday); a Lab over several days is one bar with its name once, breaking only at a weekend. Labs
  can't start or end on a Saturday or Sunday. A Lab can introduce challenges that aren't on the map (`lab.custom`, ids `LB-…`).
- **Validate** (was Log): one student, or **a group, one challenge**, for the end of a Lab: pick the challenge (the Labs of the last
  two weeks are one tap, and search includes Lab challenges), tap the students who passed (or "Everyone shown passed"), mark any
  not yets, save once. Entries for Lab challenges carry `ct` (title) and `k` (life skill), and the crew board copy carries `t` and
  `k`, so students and families see them by name. Old `#log` links still open Validate.
