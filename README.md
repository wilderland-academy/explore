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
- `/tools/` (students) and `/guides/tools/` (guides): the Tool & Materials Library, both built from `_includes/tools.html`. The catalog is `tools/catalog.js` (247 tools, machines and materials in 18 categories, each with access level, starting grade and loan type; `have` is what we know we own, `want` what a project school our size should have). Logic in `tools/app.js`. Firestore: `toolInventory/{item}` (what guides counted; overrides the catalog's `have`), `toolLoans` (requests and checkouts, like a book library: a student asks, a guide hands it out and checks it back in), `toolBadges/{sid}` (tools a student was taught), `toolItems/{id}` (tools and materials guides added from the page; merged into the catalog). `toolHolds/{loan id}` (a reservation's place on the calendar, no names; see below). `toolReports/{id}` ("running low" reports on materials). Students can request anything, including things not in the catalog (`toolLoans` kind `new`); guides add those to the catalog and mark items stocked from each item's sheet, and the students who asked are told. Rules are in `firestore.rules`. The guides' Shopping list tab is everything below `want` after counting.
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
  Life Skill Lab Scorecard (nine indicators, 1 to 3) and pushed toward 3s. The rules are `guides/lifeskills/builder/rules.txt`, written
  from the Scorecard, the Challenge System doc and the Valley Builders lab; replace them with Ian's `builder-rules.md` if he wants
  his exact wording (keep the Scorecard and output-order sections, which the page relies on). A "Lab builder" tab appears in the Life
  Skills sub-nav only inside the staff guides. Guests (Ian) can use it.
- **Epic Labs** (added later Nov 21): `guides/lifeskills/builder/epics.js` holds example Epic Labs for each band (three for K–1, four for 2–4 and 5–8) (weeks-long Labs that end in a real, public feat),
  each with its Skill Map abilities, how it meets high standards, high support and high autonomy, Skill Validation, showcase,
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
- **Students no longer have a Life Skills tab.** Their progress is in Challenges: `challenges/progress.js` shows their trail (credits, rank, what's expected this year, working on, not yets with what to practice, feats), marks passed challenges on the map, lets them set up to 3 "working on" challenges from any challenge's sheet, and shows the Crew board (their band and older). It reads `lsStudents/{sid}`, its entries and `lsBoard` through the same Firestore rules as the tracker; `/auth.js` now includes the student's tracker record id (`sid`) in the `wl-role` event. A student who opens `/lifeskills/` is sent to `/challenges/#progress`.
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
- **Saved challenges are on the Life Skills overview.** Show: "Saved to plan" turns each cell into saved/expected for that life skill
  (challenges in the student's Challenges plan they haven't passed). With a mouse, pointing at (or clicking, or tabbing to) a
  count lists those challenges as links. On phones and touch screens the overview is one card per student and each life skill
  opens with a tap, so nothing needs hover. "Plan short of expected" finds students whose passes plus saves don't reach the year
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

## Search (⌘K / Ctrl+K), added Nov 22, 2026
Every page has a 🔍 **Search** button in the top bar; ⌘K (Mac) or Ctrl+K opens it anywhere, and "/" opens it when you're not
typing. `/wlnav.js` loads `/search.js` the first time. It finds pages, challenges, books and project ideas for everyone (read
from `/challenges/data.js`, `/books/` and `/projects/`, so new items show up without any extra step), plus, for staff, students
(to their Student Roster page), Labs, Behavior Guide topics and Staff Handbook sections by their full text (read from the relay,
never stored in the site); parents also find their children's Labs. Students see only Students pages and their own band and
older; test accounts show only in test views. Staff can send what they typed to the Guide Mentor. Add a page to the search in
the `PAGES` list at the top of `/search.js`.

## Mr. Fox, and Life Skills for parents, added Nov 22, 2026
- The student AI Coach is now **Mr. Fox** 🦊 everywhere (menus, pages, alerts, Slack notices, and its own replies). It still
  says plainly that it's an AI, not a person.
- **Parents › Life Skills** now has, for each child: their record, plus **Supporting them at home**: their next Labs with the
  guides' notes for home, and challenges they can pass off at home (what they're working on first, then the life skills
  furthest from what's expected this year). Staff who open Parents › Life Skills get a **parent preview** (pick any student to see
  their family's view) instead of being sent to the Guides copy.
- The guides' AI is now **Trail Partner** 🐲 ("Think it through with a fellow guide"). Its instructions treat guides as
  experienced colleagues: ask what they've tried, offer options and evidence rather than verdicts.
- **Parents sign in with any Google account.** The Parents pages, the front door and the pages outside guests may open no
  longer ask Google for a school account; Parents › Life Skills leads with "Continue with Google" for families and keeps
  school sign-in for staff below it. Student pages still point Google at school accounts.

## Phone menu, account menu, Trail Partner page, section links (Nov 23, 2026)
- **Phones (760px and narrower):** the top bar's sections move into a ☰ menu (with "Switch to" and Basecamp). A page's own row
  of sections (the Life Skills menu; Mentor Mindset, Behavior, Our Approach and At Home sections) becomes one "Section ▾"
  button that opens the list. Nothing scrolls sideways. All in `/wlnav.js` and `/wl.css`; wide screens are unchanged.
- **Test view** is inside the account menu now (the sign-in chip, or the Life Skills tracker's menu); `window.WLTest.html()`
  gives the choices. Only pages with no account menu (Parents pages, the front door) still show the 🧪 button.
  Also fixed: the sign-in chip's menu closed the moment it opened.
- **Trail Partner page, `/guides/partner/`:** every conversation with the staff AI tools on the left (search, filter, grouped
  by day), the conversation on the right. Trail Partner conversations continue right there; the others open in their own tool.
  The 🐲 side panel's ⤢ opens it; `/guides/history/` and `/guides/?mentor` now lead here. The front door no longer shows Trail
  Partner; the Guides home has one quiet link.
- **Previous / Next** links end every section of Mentor Mindset, Behavior, Our Approach and At Home.

## Policies & Resources (`/guides/policies/`), added Nov 23, 2026
- **One place for everything beyond the handbook.** A new **Policies** tab in the Guides bar (the Staff Handbook page sits under
  it too) and a card on `/guides/`. The page has the forms (Elective Time Off), the four policies (Role Clarity and Updates, Guide
  Standards & Expectations, Two-Adult Minimum, Raising Concerns), and links to the Staff Handbook and the Behavior Guide. Staff only.
- **Read them on the page.** Each policy opens at `/guides/policies/#<id>` with its sections, a search across all four, "Ask about
  this 🐲" on every section and a link to the original (Google Doc, or for the Guide Standards a PDF admins upload at
  `staff/guide-standards.pdf`; the existing `storage.rules` already cover it). Section links look like `#two-adult--procedures`.
- **The text is not in this public repo.** Like the handbook, it lives in Cloudflare KV (namespace `DOCS`) under
  `policy-role-clarity`, `policy-guide-standards`, `policy-two-adult` and `policy-raising-concerns`, served by the Worker's `doc`
  mode to school staff only. Until a key is added, that policy's card links to the Google Doc instead.
- **Trail Partner knows them.** `POLICY_DOCS` in `relay/worker.js` adds the four to its documents, each labelled with its date
  and whether it's still a draft; it says so when it relies on a draft.
- **⌘K search** finds the policy pages, the time-off form, and (for school staff) every policy section by its text.
- **Adding or updating a policy:** edit its KV key in Cloudflare. To add a new one, add it to `DOCS` in
  `/guides/policies/index.html`, `POLICY_DOCS` in `relay/worker.js` and the list in `/search.js`. When the Board adopts a draft,
  clear its `status` in `DOCS` and update its label in `POLICY_DOCS`. Forms are the `FORMS` list at the top of the page.
- **Top bar:** to fit six Guides tabs, tabs are a little tighter at 1500px and narrower, and Trail Partner shows just 🐲 at 1400px
  and narrower (its name stays in the tooltip).
- **Deploy:** add the four KV keys; paste `relay/worker.js` into the Worker and Deploy.

## Mentor Mindset is required training (Nov 23, 2026)
- The Field Guide's map now opens with "What brought you here won't get us there": why experienced guides still train (we apply
  new research on student motivation; we adapt, as we ask students to), and that the Mentor Mindset is obligatory for every
  guide, Field and Academic. The text is `WHY` at the top of `fieldguide/data.js`, so Trail Partner reads it too. Don't describe
  it as optional or "not homework". The Guides home card says "Required training for every guide."

## Navigation and layout pass (Nov 23, 2026)
- **Session Room tab.** The Guides bar has a Session Room tab (`/fieldguide/#sessions`). It lights up whenever the Field
  Guide shows the Session Room, and Mentor Mindset lights up for the other stops (`curTab()` in `/wlnav.js`).
- **"More".** When a site has more tabs than fit beside search, Trail Partner and the account chip, the last ones fold
  into a More menu (`fit()` in `/wlnav.js`), never the current page's tab. Phones still use ☰.
- **Section menus on the left.** Mentor Mindset, Behavior, At Home and Our Approach show their sections down the left at
  1000px and wider (`.trail.wlside`, wrapped by `/wlnav.js` in `.wlside-wrap`; styles in `/wl.css`). Narrower screens keep
  the row; phones keep "Section ▾". Add `wlside` to another page's `.trail` (followed by its `<main>`) to give it the same.
- **Mr. Fox page.** `/coach/` is half instructions, half Mr. Fox (`WLCoach.home({ dock })` in `/coach/coach.js`). Mr. Fox
  starts on a home screen (find a challenge, find a project idea, work out a conflict, help with academics, the tour again); the first time, Mr. Fox (a lovable grouch) gives a short interactive tour in the chat with tap-to-answer questions (coach/coach.js TOUR), and the page itself is just his conversations; × in a
  conversation goes back there. On phones the chat comes first.
- **One Life Skills header.** The tracker, Challenges map, Lab builder, Ideas and How Labs run (Guides and Parents) share
  `<header class="nav wlsub">` in `/wl.css`: same height, title and links, so nothing shifts between them. The tracker's
  account menu moved into the top bar, where the sign-in chip is everywhere else, and Parents › Challenges now shows the
  chip too. The students' tracker and Challenges keep their own header.

## 500 more books, "Read it, not for me", and the Camp Store's grades and experiences (Nov 23, 2026)
- **The Lantern Stacks has 1,436 books.** 500 were added on one `BOOKS.push(...)` line right after the first one in `books/index.html`
  (same fields as the rest; keep its `"id": "x", "t": "..."` spacing, because `/search.js` and the Student Roster find titles by
  that pattern). The mix: genuine classics (Newbery and Caldecott winners, Westerns, Shakespeare, Poe, Wells), modern classics,
  gateway books (graphic novels, manga, Goosebumps, Choose Your Own Adventure, first chapter books, early readers for K–1) and
  interest-first nonfiction for kids who say they don't like reading: sports heroes, survival guides, gross science, Who Would Win?,
  Guinness, LEGO and Minecraft, cars and trains, field guides for Utah birds and Rocky Mountain tracks. A few are local: The Great
  Brain (Adenville, Utah), Philo Farnsworth, Desert Solitaire, Between a Rock and a Hard Place, Dragon's Gate and Ten Mile Day
  (Promontory), and books by Utah authors (Brandon Mull, Shannon Hale, Ally Condie, Obert Skye).
  - Every new Lexile is an estimate (`v: 0`, shown with ≈) until someone checks it against a published list. Awards were added to
    `AWD`, and matching books were added to the Life List sets in `LSETS` (translated, farm and ranch, disaster, TV, plays...).
  - The new books have no cover photos yet; they use the drawn covers. Covers come from Open Library, which this build
    environment could not reach.
- **Read it, not for me.** Every book page has "I read it. Not for me", with optional reasons (too slow, too scary, too sad, too
  hard, too easy, not my kind of story, didn't like the ending). Stored in `lantern-stacks` as `nope` (ids) and `nwhy` (reasons), so
  it syncs with the shelf. These books count as read for the Life List and for the Lexile estimate (unless marked too hard or too
  easy). `nopePen()` pushes similar books down everywhere recommendations are made (book pages, For you, New ground, Moments, the
  new "Picked from your shelf" row on the home page); a reason aims the penalty (too scary lowers spooky books, too hard lowers
  books at that level and up). A book marked not-for-me shows "Try something different" instead of look-alikes. The shelf has a
  "Read it, not for me" list (`#nope`), and the Student Roster shows it with the reasons (`NWHY` in `guides/roster/app.js`, keep
  in step with `NWHY` in `books/index.html`). The shelf text now says guides can see it, which was already true.
- **Camp Store grades.** `APPEAL` in `store/products.js` lists the grade bands each product appeals to (not the same as its
  minimum age). The store starts on the visitor's band (`window.wlBand`), has All grades / K–1 / 2–4 / 5–8 buttons, puts
  band-specific things first, and opens with "Picked for grades …" (`FEATURED`, editorial, experiences first from grade 2 up).
- **Experiences are in the store.** 65 experiences (50 new, built mostly for grades 5–8, plus the 15 earlier ideas; the old
  "Pizza lunch" became "Lunch with any guide you choose") are now savable store items in an Experiences category, with what each
  takes and how often it can happen. Price = 2 blazes per dollar of cash cost + 1 blaze per guide minute beyond normal
  supervision, ×1.5 for minutes that pull a guide off their crew or fall outside school hours, rounded to 5 (`GUIDE_RATE`,
  `expBlazes` in `products.js`). The reasoning (status, respect, choice, private recognition) is in the comment there.
  Redeeming still happens with a guide and Basecamp; guides decide when each can run.

## Camp Store: better experiences and rewards from guides (Nov 23, 2026, evening)
- **The first 65 experiences are gone.** Kids found them lame, and many were jobs (lead a Lab, run the store, chair Town
  Hall). `EXPERIENCES` in `store/products.js` now holds 30 that follow one rule: something a kid would pick on a free
  afternoon. Friends, food, freedom, a little thrill and sanctioned mischief (pie a guide, Nerf war vs. guides, lounge pass,
  lunch ordered in, sleep-in pass, crew lock-in). The research behind it is in the comment above the list. Prices (`b`) are
  set by how much kids want them and how scarce they are, never below the cost to the school. Mischief only happens with
  guides who sign up for it.
- **Rewards from guides.** Staff see a "Rewards from guides" panel on `/store/`: name, emoji, blazes, an optional note, and
  who it's for (specific students picked from the Life Skills roster, or everyone in some grade bands). Students see rewards
  made for them first ("Just for you", "From Scott"), plus open ones for their band. Firestore `storeRewards`; a personal
  reward can be read only by staff and the students named (`to` holds their school emails). Edit, hide and delete in the panel.
  **Publish `firestore.rules` in the Firebase console** or the panel says guide rewards are off.

## Challenges: grade defaults and clearer saved dots (Nov 24, 2026)
- A signed-in 5th or 6th grader now starts on Grades 5–6 (7th and 8th graders already started on 7–8). Both lists include
  challenges for all of 5–8, and the Grades buttons still show the other grades or all of 5–8 (`gradeDefault` in
  `challenges/app.js`).
- The year tracker says what the dots mean: "2 passed · 3 saved" under each life skill (Epics noted, since they fill 2 dots),
  and every save beyond the expected 2 adds a gray lined dot, so no save is hidden.

## Challenges: AI-built family solutions, and no phone dropdown for students (Nov 24, 2026)

- AI-08.4 (Teaching myself anything, grades 7–8) now counts a tool built with an AI as well as one coded by hand. Students who use AI bring their prompts and one mistake the AI made that they caught and fixed, and use a tool their family allows (most AI tools have a minimum age).
- The students' Life Skills page no longer turns its links into an "On this site" menu on phones (`data-wl-collapse="off"` on its nav). Everything is on one page, so students just scroll. The guides' and parents' versions keep their menus.

## Student Goals (`/goals/`), added Nov 24, 2026

- Students set goals for this week, this month and the school year: Life Skills (progress from tracker passes),
  academics (apps by grade from the 2026–27 family packet, in `goals/apps.js`), Camp Store, projects, habits or behavior.
  A current Life Skills goal and a current academic goal are expected; the page flags a missing one.
- Saved in localStorage `wl-goals` and synced by `/auth.js` (site `goals`) like the other student sites.

## Parent profiles and shared copies, added Nov 24, 2026

- `/auth.js` copies a student's books, challenges, goals and projects to `lsShared/{sid}/sites/{site}` on every save,
  and once a day copies all four (so older saves show up). Guides, the student and linked parents can read them.
- Each child's profile (`/parents/lifeskills/#c=<sid>`) shows a launch note (until Mar 1, 2027), goals, saved
  challenges, books finished and wanted, and saved project ideas. Guides see the same on `/guides/lifeskills/#s=<sid>`.
- `/parents/challenges/` lists each child's passed and saved challenges and tags them on the map (`challenges/family.js`).
- The home pass-off guide and log moved to `/parents/passoff/` (old `/challenges/parents.html` and `log.html` redirect).
- A tester's "view as parent" also shows the tester's own real children (records listing the tester's email as a parent).
- `firestore.rules` adds `lsShared` (replacing `lsGoals`): paste it into the Firebase console to publish.

## Portals, notifications, Camp Store and Suggestion Wall for guides, added Nov 24, 2026

- **Staying in your site.** `/wlnav.js` points links at the current site's copy of a page when there is one (Challenges,
  Life Skills tracker, Camp Store, Suggestion Wall). A link that must leave for another site opens a short notice first
  ("This opens the Students site…"). Students never get links to the Parents site's pass-off guide.
- **Notifications** (`/notify.js`, loaded by `/wlnav.js`): a 🔔 for students and guides, from Firestore `wlNotes`.
  Students hear about passes and not yets, Camp Store rewards made for them, ideas accepted or answered (with the
  guide's name), votes on their ideas and Town Hall answers. Their guides hear about saved challenges, goals set or
  finished, books, project ideas, Camp Store list additions, challenges started, ideas, votes and Town Hall items.
  Senders: `/auth.js` (site saves), `challenges/progress.js`, `lifeskills/app.js`, `_includes/store.html`,
  `_includes/suggest.html`, `behavior/app.js`.
- **Camp Store** and **Suggestion Wall** (renamed from Suggestion Box) are one include each (`_includes/store.html`,
  `_includes/suggest.html`) built for Students (`/store/`, `/suggest/`) and Guides (`/guides/store/`, `/guides/suggest/`).
  Rewards from guides open from a button at the top right, leave out K–1, and can carry a picture (Storage `store/`).
  Accepting an idea records the guide's name; votes keep voters' names (`vnames`).
- **Lantern Stacks** shows grades instead of ages and presets a signed-in student's grade.
- Publish both `firestore.rules` and `storage.rules` in the Firebase console.

## Camp Store: play with guides, never against them (Nov 24, 2026)

- **Pay-to-target rewards are gone.** One student paying to duct-tape, pelt (ten snowball shots), ambush (water balloons) or hair-spray a guide who has to stand there made the guide a target money could buy. Removed: `x-ducttape`, `x-snowballs`, `x-waterballoon`, `x-hairspray`.
- **What replaced them.** Every stunt is now two-sided, shared, or earned by the whole crew with a guide who volunteered:
  - `x-pie` is now a **crew pie** (200 blazes, pooled by the crew). A volunteer guide takes it, and then pies one volunteer back.
  - **Snowball fight** and **water balloon fight**: your crew vs. the guides, and both sides throw.
  - **Twin day with a guide**: you and a guide you pick dress alike.
- "Pick what a guide wears" and "Give a guide a nickname" stay, since the guide opts in and can veto. The reasoning and sources are in the comment above `EXPERIENCES`. There are now 29 experiences.

## Parents: "My child" in the top bar, home challenges at the right level, nothing "on this device only" (Nov 24, 2026)
- **My child.** A child's profile (Life Skills, goals, books, project ideas, help at home) has outgrown Life Skills. It is now
  the first tab on the Parents site ("My child", or "My children" when the tracker has seen more than one child: `wl-kids`).
  It points to `/parents/lifeskills/`, and the bar marks it current there unless the view is `#schedule`, which belongs to
  Life Skills.
  - The Life Skills tab now opens `/parents/challenges/`. Its sub-menu is Challenges, Labs schedule and Passing off at home.
  - On a profile, the tracker's sub-bar says "My child" and lists one tab per child (none for one child).
- **Challenges to try at home** (on a child's profile) only lists challenges at the child's level: their band, and in 5–8,
  their half of it (5–6 or 7–8 from their grade; "5–8" challenges fit both), as the Challenges page does. Saved ones from
  another level are left out. If a band has no home challenges, it says so instead of "passed the expected 2".
- **Saved to your account, everywhere.** Families' At Home and Our Approach choices and their Challenges plan
  (`wl-family-…`, `wl-picks` on the Parents site), and guides' Field Guide reps, if-then plan, self-check and streak
  (`fg-…`), now copy to `accounts/{uid}/sites/{parents|fieldguide}` through `/auth.js` (`ACCT`). The first sign-in on a
  device merges; after that the account wins. Sign-out clears them from the device.
  - Training results that couldn't reach the account go up on the next load.
  - Every "saved on this device only" / "in this browser only" line on the three sites now says it's saved to your account.
  - **Publish `firestore.rules`** (the new `accounts` match) or these copies fail quietly and stay on the device.

## Our Approach: pillars read as switches, no in-page Next (Nov 24, 2026)
- **The three pillars look tappable now.** Each card has an on/off switch, says "On"/"Off", and says what a tap does ("Tap to switch off"). It lifts on hover and presses in on click. The intro says "Tap a pillar…". Each button's label states the pillar and whether it's on.
- **No Previous/Next between sections.** Our Approach is one long scroll, so Next only moved about 8px to the section directly below, on desktop and phone alike. The section menu covers moving around. The last section keeps its link to the next page (Wilderland at Home). At Home, the Field Guide and Behavior show one section at a time, so they keep their pagers.

## Wilderland Guides as a phone app (Nov 24, 2026)
- **Installable.** Every Guides-site page links `/guides/app/manifest.webmanifest`. That includes the Guides copies of the shared Challenges, Camp Store and Suggestion Wall includes, but not the student or parent copies.
  - The app is named "Wilderland Guides" ("Guides" under the icon). It starts at `/guides/`, opens standalone, and covers the whole site (scope `/`).
  - Icons are in `/guides/app/`: a 180 px Apple touch icon, 192 and 512 px icons, and a maskable 512 px icon.
  - Chrome reports no installability errors. There's no service worker yet, because none is needed to install.
- **How guides install it:** `/guides/app/` has iPhone (Safari: Share → Add to Home Screen, Open as Web App on) and Android (Chrome: ⋮ → Add to home screen / Install) steps. It's linked from the Guides home (hidden inside the app) and from search.
- **Sign-in inside the app.** On iPhone, Google's sign-in pop-up has a long history of not reporting back to a Home Screen app. The code for same-page sign-in (`signInWithRedirect`) is in `auth.js` and `lifeskills/app.js`, behind one switch: `SAME_PAGE_SIGNIN` in `/wlnav.js` (`window.wlSamePageSignIn()`, `window.WLAuthDomain()`). It is **off**, so the app uses the pop-up like any browser.
  - Before turning it on:
    1. Serve Firebase's helper pages from this site at `/__/auth/` (handler, iframe, links and their .js, plus `/__/firebase/init.json`). This is Firebase's "self-host the helper code" option, re-synced now and then.
    2. Add `https://explore.wilderland.academy/__/auth/handler` to the web OAuth client's authorized redirect URIs in Google Cloud.
    3. Add `include: ["__"]` to a `_config.yml`, because Jekyll skips folders that start with "_".

## Parents nav, Field Notes inside Our Approach, student tabs and Coaching in Students (Nov 24, 2026)
- **Parents top bar:** At Home, Life Skills, My Child (My Children with two or more children), Our Approach.
  - The count comes from `lsParents.children` at sign-in (`auth.js`), plus the tracker and Challenges page (`wl-kids`).
  - `wlKidsLabel()` labels the tab, any `[data-wl-kids-label]` (the Parents home card) and the account menu.
- **Field Notes is the last section of Our Approach** (`#fieldnotes`, code in `parents/approach/fieldnotes.js` and `fieldnotes-data.js`).
  - An entry (`#<id>`) takes over the page until "← All Field Notes", which returns to where the reader was.
  - `/parents/series/` and its entry links redirect there.
- **Students: tabs on every student page.** Profile (`#s=`), Life Skills (`#ls=`, the tracker's record) and Coaching (`#coach=`, Field Guides and testers only).
  - Life Skills and Coaching are framed pages (`?embed=1`). `/wlnav.js` hides their top bar and menus, opens other-page links in the whole window, and reports their content height so the frame fits.
  - Nothing navigates away from Students anymore.
- **Coaching (1:1 sessions) moved out of Mentor Mindset.** The Session Room tab and stop are gone.
  - `/fieldguide/?embed=1&sid=<sid>#sessions` shows one student's private notebook. Old `/fieldguide/#sessions` links go to Students.
  - Field Guides are listed in `FIELD_GUIDES` in `/wlnav.js` (April, Scott, Chelse); `wlCoaches(email)` checks it.
- **Second phone app: Wilderland Students** (`/guides/app/students.webmanifest`, linked only from `/guides/roster/`). Its icon says STUDENTS in lime. Install steps are on `/guides/app/`.

## Mr. Fox reliability, honest "books finished", Students shortcuts (Nov 25, 2026)
- **Mr. Fox stopped going quiet.** Claude 5 models think by default and the thinking counted against a 500-token reply budget, so replies came back cut off ("*", empty, or half a sentence) and the safety check rightly held them back. The Worker (`relay/worker.js`) now turns thinking off for the Haiku checks (`thinking: disabled`) and limits it on Sonnet 5.5 (`between_tools`; Sonnet 5.5 rejects `disabled`), gives replies 1,200 tokens (2,400 on a retry if a reply still runs out), retries network errors and 429/5xx twice, and if the checker holds a reply back it rewrites once with the reason. If it still can't send a reply, Mr. Fox sends a short fixed reply for that topic (`FALLBACK`) with useful buttons (`NEXT_FOR`) instead of "couldn't double-check its answer". **Deploy the Worker** after merging for this to take effect.
- **Find a challenge / project prompts:** suggest 2–3 real challenges as soon as a student names any interest, even one word ("calisthenics"); never ask the same question twice; when nothing matches by name, use the bring-your-own-interest challenges (30-day challenge, drilling a skill, training plan, saving toward a goal, teaching it, planning an event).
- **Mr. Fox scrolls to new messages.** Each new message is scrolled into view (a long one shows from its first line), and again whenever the reply buttons change size. Reply buttons take at most 38% of the panel and scroll inside it.
- **Books finished this year** (student profile, Life Skills record) is empty until Basecamp is connected. Books a student marked "loved it" or "not for me" on the Books site are shown as **Book tastes**, with a note that these aren't books finished this year. Guides' Students page says "Books they loved"; notifications say "said they loved…".
- **Students home:** Treebeard Library and Camp Store cards show small drawings of the apps instead of photos; the "Sign in with your school account" notes are gone (every page needs sign-in anyway).
- **Guides › Students** has **Life Skills** (everyone's tracker, `#lifeskills`) and, for Field Guides, **Coaching** (the whole session room, `#coaching`, framed as `/fieldguide/?embed=1&sid=all#sessions`) next to Roster, Pickup, Alerts and AI conversations. Each student's own Life Skills and Coaching tabs are unchanged.

## "Expected", not "goal", for the yearly 2 per Life Skill (Nov 25, 2026)
- "Goal" is kept for what a student sets for themselves (the Goals page, 1:1s). The school's yearly 2 challenges in each Life Skill (16 a year) is now called **expected**: "Expected this year: 2 in every life skill" in Challenges, the Life Skills tracker, parents' and guides' views; the tracker filter is "Plan short of expected"; onboarding and the training quiz say "expected each year". The Goals page says "Wilderland expects 16 this year… You pick your own number."
- Guides › Students: the first tab is **Roster** (was "Students and parents"), and a student's button is **Edit student profile** (name, band, grade, sign-in, guide, parents, Academics pilot).
- Mr. Fox's safety screen no longer flags hands-on projects with fire, heat, tools, heights, water or snow (a kiln, a campfire, whittling, forging, an igloo, flips) as "weapons or danger". It treats them as normal challenge talk and leaves the safety rules to the coach's reply. "Build a kiln" used to get a refusal and a high-severity alert for guides.

## Camp Store: no incentives for K–1; science shows and a crew movie night (Nov 25, 2026)
- **K–1 removed everywhere.** Incentives start in 2nd grade.
  - No item or experience lists K–1 (`k1` is gone from `APPEAL` and from experiences' `g`). There's no K–1 featured row and no "Grades K–1" filter: the filter reads Grades 2–8 / 2–4 / 5–8.
  - A K–1 student who opens the store sees "The Camp Store starts in 2nd grade" (`#k1note`) instead of the shelves.
  - K–1 students don't get the Store tab (`wlK1Student()` in `/wlnav.js`), the Camp Store card on the Students home, or the "save blazes" goal in Goals.
  - Guides' custom rewards already skipped K–1.
- **Science shows,** a guide-run demo for the crew with the buyer at the controls:
  - Giant elephant toothpaste: 100 blazes. Uses 30% hydrogen peroxide, which only a guide handles, in goggles and gloves.
  - Soda geyser launch: 35 blazes.
  - Exploding watermelon challenge: 60 blazes.
  - Dry ice fog and smoke bubbles: 70 blazes. Only guides handle the dry ice, and only in a ventilated space.
  - Water rocket launch day: 60 blazes.
- **Crew movie night at school:** 300 blazes, once a term. Showing movies as rewards needs a public performance license, so the movie night and the movie lunch both say "shown under the school's movie license."
## To-dos, reward ideas, goals set with guides, behavior log, 1:1 snapshot (Nov 25, 2026)
- **To-dos (`/tasks.js`)**: a ✓ button with a count beside the 🔔 (loaded by `/wlnav.js`), and a "Your to-dos" list on the Students and Guides home pages (`[data-wl-tasks]`). Notifications are things to look at; to-dos are things to do. Nothing is stored: each to-do is worked out from saved data and ticks itself off.
  - Students: save 3 challenges (grades 2–8), keep a Life Skills goal and an academic goal going, pick something to save for in the Camp Store, grades 7–8 save a Project Spark for the year; optional: propose their own reward.
  - Guides: finish onboarding, schedule a Life Skill Lab in the next two weeks for their band, add at-home instructions for parents on each Lab in the next three weeks, help students missing a goal set one.
  - Field Guides only: reward ideas to decide, weekly 1:1s left this week (from their session notebook), restores to sign off.
- **Reward ideas**: students propose a reward in the Camp Store (`/store/propose.js`, Firestore `incentives`). Only the band's Field Guide (`FIELD_GUIDES` in `/wlnav.js`, also hard-coded in `firestore.rules` `fieldGuideOf`; keep in step) approves or declines, on Guides › Students › **Reward ideas**. Approving adds a reward for that student alone to the Camp Store (`storeRewards`, to: their email) and notifies them.
- **Goals set with a guide**: on a student's page and Coaching tab, "Set a goal with …" writes `guideGoals`; the student's My goals page adds it to their list the next time they open it, marked "Set with …". Guides › Students › **Goals** shows who's missing a Life Skills or academic goal.
- **Behavior incidents** (`behaviorLog`, staff only): record from a student's page (date, tier, facts). Tier 2 and 3 open a restore, which the Field Guide signs off. Guides › Students › **Behavior** lists them; two Tier 2s in 7 days shows the parent-email reminder. This answers the open question in Behavior about where incidents get logged; change it if the school picks another place.
- **Coaching tab = everything for a 1:1**: above the session notebook, goals (and the set-a-goal form), Life Skills this year (passed, not yet and saved per life skill against the expected 2), behavior incidents, reward ideas, and a place for academics (Basecamp/Treebeard, not connected yet). In the whole-class session room, a student opens their full Coaching tab.
- **My goals**: the "What's expected" line is now a quiet status line (no box); the new-goal form is a light sheet with numbered steps; hero illustration in the Guides site's paper-cut style. `#new=life` / `#new=acad` open the form.
- **Students home**: Treebeard Library card is an illustration of a library in the same style.
- **Publish `firestore.rules`** (new: `incentives`, `guideGoals`, `behaviorLog`) or these features can't save.

## Notifications for students and parents (Nov 25, 2026)
- **Students** hear when a guide records a pass or a not yet, approves or answers their reward idea, sets a goal with them, shares 1:1 takeaways, and when their Suggestion Wall idea gets a vote, a reply or is accepted, or their Town Hall item goes on the agenda. The empty bell says so, in a student's words.
- **Parents** now have the 🔔 on the Parents site (`/wlnav.js` adds it even though Parents pages have no account chip). They hear about each linked child's passes and not yets, goals set or finished, challenges and project ideas saved, challenges started, reward ideas approved, ideas accepted, Town Hall items on the agenda (not the item's words), goals set with a guide, and 1:1 takeaways. Not the Camp Store list. `notify.js`: `wlNotifyParents` (from a student's page) and `wlNotifyFamily` (from a guide's page: student plus linked parents).
- **1:1 takeaways**: in the session room, a reviewed session has "Share takeaways with …": what you talked about and what they said they'd do, edited by the guide, with "Their parents see it too" (on by default). Saved to `coachShare/{session id}` (rules: only the student, the chosen parents and staff read it). Students see them on My goals ("From your 1:1s", `/goals/#oneonone`), parents on their child's profile. The notebook, transcript and coaching feedback stay private.
- **Publish `firestore.rules`** again (new: `coachShare`).

## Mr. Fox alerts in the bell; technical alerts only for the admin (Nov 25, 2026)
- **Guides' 🔔 includes open Mr. Fox alerts** (`notify.js`), the same ones Students › Alerts counts. Each links to the conversation.
  - An alert leaves the bell once someone marks it reviewed in Students.
  - "Mark all read" only records the alerts as seen on that device (`wl-alerts-seen`). It doesn't review them.
- **Technical alerts go only to the tech admin** (`TECH_ADMINS` in `/wlnav.js`: Alex). These are Mr. Fox replies held back only because they came out cut off, garbled, off-task or with stray tags.
  - `wlTechAlert(a)` decides. For older `coach_reply_held_back` alerts, an alert counts as technical only if its reason describes a broken reply and names nothing unsafe.
  - Guides don't see them in the bell or in Students. Alex gets them in the bell and in "Technical: only you" at the bottom of Alerts.
- **Relay (`relay/worker.js`):** the reply check now says whether a held-back reply was a `safety` or a `quality` problem.
  - Quality problems are saved as `coach_glitch` (low, `audience: "admin"`). They don't raise the conversation's level and don't go to Slack.
  - **Deploy:** paste `worker.js` into Cloudflare and Deploy. Until then, new glitches still arrive as "Coach reply held back", and the reason-based rule sorts them.

## Trail Partner: no DCFS for peer conflicts; Tier 3 send-home is required (Nov 25, 2026)
- **Behavior Guide v0.5** (`behavior/data.js`, Board-president decision, clarified the same night): for a Tier 3, sending home is **required** when the student already had a Tier 3 this school year or last (an earlier Tier 2 doesn't count), in every band. With no earlier Tier 3 it's the guide's call; the incident report, parent-guide conversation and repair plan happen either way. An admission counts even if no guide saw it ("reported, and the student said they did it"). Tiers themselves are unchanged.
- **Trail Partner** (`relay/worker.js`): now reads the Behavior Guide itself (`/behavior/data.js`) and treats it as replacing the March 2026 Behavior Policy where they differ. It gives a tier's required response, says send-home is required for a Tier 3 after an earlier one this school year or last (and the guide's call otherwise), and asks about earlier incidents when it doesn't know. Mandatory reporting comes up only when there's reason to believe abuse or neglect (harm by an adult or caregiver, needs unmet at home, injuries that don't fit, or sexual contact between children with force or coercion), not for fights between children. **Deploy the Worker** for this to take effect.
- **Students › Behavior log**: the incident form states the rule, and saving a Tier 3 for a student who already had a Tier 3 this school year or last reminds the guide that send-home is required.

## Camp Store and Students home illustrations (Nov 25, 2026)
- The "Camp Store starts in 2nd grade" note is gone. Its `display:flex` beat the `hidden` attribute, so every student saw it. K–1 students get no Store tab or home card (`wlK1Student` in `/wlnav.js`), and if one opens /store/ anyway, the page sends them to /students/ once their role is confirmed.
- The Camp Store page opens with an illustration of a camp trading post. On the Students home, Basecamp (tents and a progress board), Camp Store and Suggestion Wall (a board of notes) are illustrations too, in the Guides site's paper-cut style, like Treebeard Library.

## 300 picture books for K–1 in the Lantern Stacks (Nov 26, 2026)
- **The Lantern Stacks has 1,736 books.** 300 picture books, read-alouds and interactive books for kindergarten and first grade
  are on their own `BOOKS.push(...)` line (marked "K–1 picture books") in `books/index.html`, with the same `"id": "x", "t": "..."`
  spacing. The mix: about 120 Caldecott Medal and Honor books, Geisel winners (the best books for brand-new readers), classics
  from Peter Rabbit to Corduroy, books you press, shake and lift (Press Here, The Book with No Pictures, Where's Spot?),
  poetry, folktales from around the world, wordless books and true picture books about space, seeds, water and real people.
- **Awards were checked** against the ALA Caldecott list, ALA/library Geisel and Coretta Scott King lists, and the Greenaway list;
  they live in `AWD` (one `Object.assign(AWD, ...)` line) so the "Caldecott Medal or Honor book" Life List item finds them.
- **No Lexile on purpose.** Picture books are read together, so their covers say "Read-aloud" instead of a number, and a
  reader with a Lexile of 500L or less still sees them on "Right for your grade."
- **New "Picture books" section** (`pic`, first genre on each new book) with its own region on the map. Older picture books already
  in the Stacks (Where the Wild Things Are, The Snowy Day...) keep their home section and also join this one.
- **Picture books stay with younger readers.** They show for kindergarten–1st grade (grade set, or the K–1 band), on a new
  "Read it together" home shelf, and from other books for that age. They don't appear in recommendations from older books,
  in home shelves, Moments or New ground for older readers, and they sort last on tag pages for them (`isPic`, `youngR`,
  `near`, `forReader` next to `allowed()`). The K–1 band's starting shelf now opens with picture books.

## Tool Library: challenge gear and reservations (Nov 26, 2026)
- **53 new catalog items** (`tools/catalog.js`, the block marked "Added Nov 26, 2026") cover what the grades 2–4 and 5–8
  Life Skills challenges need, from the two challenge shopping lists: rescue throw bag, Ten Essentials pack, slackline,
  winter sleep system, kick net, planispheres, energy meter, pull-up bar, juggling balls, speed cubes, cones, visual timers,
  cash boxes, nest box kit, matches and more. Two new categories: Games & movement, Classroom & learning. All start at
  `have: 0` until a guide counts them.
- **Items know their challenges.** A `ch` list of challenge ids (111 items, new and old) shows as links on each item's sheet
  (to `/challenges/#c=ID`, or `/guides/challenges/#c=ID` for guides). Search finds items by challenge id, and a "For a challenge"
  chip shows only challenge gear. Every id was checked against `/challenges/data.js`, and no 2–4 challenge points at gear
  only 5th graders can borrow.
- **Students reserve in 4-hour blocks.** On an item's sheet: a day, a start (12, 4 or 8, AM or PM) and a length (4 hours to a
  week), up to 90 days ahead. Tools ask how many; materials ask how much ("set some aside"). The same checks as borrowing
  apply (grade, badge, we own one). Machines that stay put are reserved this way instead of the old morning/afternoon booking.
  - A reservation is a `toolLoans` doc (`kind: "reserve"`, `status: "reserved"`, `start`, `end`, `qty`) plus, for tools and
    machines, a `toolHolds/{same id}` doc with only `item`, `start`, `end`, `qty`. Every student reads the holds, so the sheet
    says "2 of 3 free" for the window they pick without showing who reserved. Materials have no hold.
  - Students see reservations under My tools and can cancel them (the hold goes too). A reservation that starts today is on
    their to-do list and on guides' ("N Tool Library reservations start today").
  - Guides' Desk has **Reserved** (Hand it out, due back the day it ends; or Cancel it, which tells the student) and
    **Reservations nobody picked up** (Clear). Handing out marks the hold `out`; checking in removes it. Quantities count.
- **Limits, on purpose:** two students reserving the last one at the same moment can both get it (guides sort it out at the desk);
  a tool already out on an ordinary loan only counts against reservations that start today, because students can't see
  other students' due dates.
- **Tested:** the new rules against the Firestore emulator (27 cases: a student's own reservation and hold, mismatched or
  foreign holds refused, past or 90-day-plus windows refused, other students can read holds but not loans or change them,
  guides mark and remove holds, testers only touch test holds), and the page itself in jsdom (34 cases: availability math,
  quantity limits, badges and grades, materials, cancel, hand out and check in).
- **Publish `firestore.rules`** in the Firebase console, or reservations fail with "Not allowed".

## Tool Library: kitchen appliances, consumables, "running low" reports (Nov 26, 2026)
- **15 new catalog items** (the block marked "Added Nov 26, 2026: kitchen appliances..." in `tools/catalog.js`):
  high-power blender (Vitamix), stand mixer (KitchenAid, badge), food processor, electric griddle, bowls and bakeware,
  garden hoses (split out of "Watering cans"), and consumables that run out: laminating pouches, Cameo blades and mats,
  batteries, sandpaper and finish, kitchen consumables, pantry staples, first-aid refills, cleaning supplies, and mulch
  and compost. Already in the catalog before this: dehydrator, shovels and spades, hoes, rakes, trowels, laminator,
  PLA filament and Toybox Printer Food.
- **"Running low?"** On any material that's been stocked, a student picks "A little" or "None", adds a note, and taps
  Tell the guides. That writes a `toolReports` doc and notifies guides. A student sees "You told the guides" on that item.
- **Guides:** the Desk has a **Running low** section (counted in the Desk tab) with **Add to restock list** (sets the item's
  stock to low or out and closes the reports) and **Dismiss**. The item's sheet lists its reports, and saving its stock level
  closes them. The Shopping list counts reported items as Restock, sorts them up with student requests, and says who reported.
- **Tested:** rules in the Firestore emulator (37 cases, 10 new for reports) and the page in jsdom (47 cases, 13 new).
- **Publish `firestore.rules`** in the Firebase console, or reports fail with "Not allowed".

## Tool Library: Upper Campus only; iPhone, DSLR and speaker (Nov 26, 2026)
- **Upper Campus students (grades 2–8) only.** Guides on both campuses still see and run it.
  - No catalog item is K–1 any more (the 89 that were became 2–4), and the guide's item editor offers "All of Upper Campus (2–8)"
    or "5th grade and up". A guide-added item saved as K–1 earlier reads as 2–4.
  - K–1 students get no Tools tab (`wlK1Student()` in `/wlnav.js`, same as the Store) and no Tool Library card on the
    Students home (`data-not-k1`). If one opens `/tools/` anyway, they see "The Tool Library opens in 2nd grade" and nothing loads.
  - The Desk's "Check out to a student" list and the Badges list leave out K–1 students.
  - `firestore.rules` refuses a student loan, reservation or running-low report marked K–1 (backstop; guides aren't limited).
- **New media items:** School iPhone (badge, 2nd grade and up), DSLR camera (badge, 5th grade and up) and Bluetooth speaker
  (anyone, 2nd grade and up). "Projector and speaker" is now just Projector, and its note points to the speaker.
- **Tested:** rules in the Firestore emulator (42 cases, 5 new) and the page in jsdom (51 cases, 5 new).
- **Publish `firestore.rules`** in the Firebase console to turn on the K–1 backstop. The page changes work without it.

## Weekly 1:1s: student-led, scored, with check-ins (Nov 26, 2026)
Based on Alpha School's Limitless Meetings (Future of Education podcast).
- **Weekly 1:1s page (`/fieldguide/#oneonone`)** now has the rules (one-on-one but never behind a closed door, the student
  drives, any goal counts, no shame, end with accountability), seven moves (help them prepare → read last week → start with
  their list → check the commitment → find the goal and what it's for → make it small → close with a check-in time),
  questions that go deeper, "keep their hands busy" ideas, and 10 to 30 minutes instead of 10 to 20. New "stuck" prompts.
- **AI review (`SESSION_PROMPT` in `fieldguide/data.js`)** adds an overall rating (exceeds / meets / below expectations) and
  scores for Student-led, Depth and Accountability, plus the check-in time, the life skill the goal builds, and rough counts of
  the guide's questions vs statements. Talk share and counts are only kept for recordings.
- **Leadership sees ratings and scores.** Firestore `coachScores/{session id}`: guide, band, mode, minutes, date, rating and
  scores only (no student name, notes, transcript or quotes). Guides write their own once (no edits); admins read all and can
  delete. Admin tab shows a 30-day table by guide. Guides are told on the Weekly 1:1s page, every session, the notebook and
  onboarding. Only sessions reviewed from Nov 26, 2026 are shared; older ones stay private as promised.
- **Students bring the agenda.** "For my next 1:1" on My goals (`/goals/#oneonone`) saves `coachAgenda/{sid}` (up to 8 lines);
  the guide sees it first, as "<name>'s topics for today", on the student's Coaching tab.
- **Accountability.** The notes form's last field is now "Check-in" (day and time the student chose). Takeaways (`coachShare`)
  carry `checkIn`; students see "When <guide> will check in" on My goals, parents on their child's profile, and the guide sees
  "You said you'd check in" before the next 1:1.
- **Publish `firestore.rules`** (new: `coachScores`, `coachAgenda`, `checkIn` on `coachShare`). Until then, scores and agendas
  don't save, and takeaways send without the check-in.
