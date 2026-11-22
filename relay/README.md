# Mentor relay setup (about 20 minutes, one time)

The staff Field Guide at `/fieldguide/` asks Claude for practice scores, coaching suggestions, live tips and session reviews.
A browser can't hold the API key safely, so those requests pass through this small relay. It only answers signed-in
Wilderland staff, and only when called from explore.wilderland.academy.

## 1. Update the database rules (2 min)
Firebase console → Firestore Database → Rules. Replace everything with the contents of `/firestore.rules` and click Publish.

## 2. Get a Claude API key (5 min)
1. Go to https://platform.claude.com and sign in as the Team plan owner.
2. Check Billing for the Team plan's monthly API credits and claim them if offered.
3. Settings → Spend limits: set a monthly limit (for example $25).
4. API keys → Create key. Name it "Wilderland mentor relay". Copy it. You will not see it again.

## 3. Create the Worker (10 min)
1. Sign up at https://dash.cloudflare.com (the free plan is enough).
2. Workers & Pages → Create → Worker ("Hello World" template). Name it `mentor-relay`. Deploy.
3. Edit code. Delete what is there, paste all of `worker.js` from this folder, and Deploy.
4. Settings → Variables and Secrets → Add. Type: Secret. Name: `ANTHROPIC_API_KEY`. Value: the key from step 2. Deploy.
5. Copy the Worker's address. It looks like `https://mentor-relay.<your-name>.workers.dev`.

## 4. Connect it (1 min)
Open https://explore.wilderland.academy/fieldguide/#admin, paste the address under "AI relay", click Save, then Test.
"Relay answered: ready" means everything is working.

## 5. The student AI Coach (added Nov 21, 2026)
The same Worker answers students' AI Coach chats (requests with `mode: "coach"`). Nothing extra to set up beyond
publishing the latest `/firestore.rules` and pasting the latest `worker.js`. Optional:
- **ALERT_WEBHOOK** (Settings → Variables and Secrets → Secret): the Slack incoming-webhook address for **#alerts**. Urgent and
  high alerts post a one-line notice there (category, student, grades, and a link; never the student's words), so
  someone sees them even when nobody has the site open. It also gets a notice for every academics conversation (see below).
- **Turning the coach off for one student:** in the Firebase console, open that student's `lsStudents` record and add the
  field `coachOff` = true (boolean).

How it keeps students safe, in the order it runs:
1. Only signed-in school accounts. Students in K–1 are refused (their challenges are guide-led). Guests are refused.
2. Daily cap (50 messages per student) and a cap per conversation (40 messages).
3. Emails, phone numbers, street addresses and links are removed from the message before anything else.
4. A separate quick model screens the message (self-harm, being harmed, threats, sexual, weapons and danger, drugs,
   bullying, distress, personal info, manipulation, cheating, profanity, off topic). If screening fails, nothing is answered.
5. The student's message is saved, and any medium-or-worse message creates an alert, before any reply.
6. Urgent and high messages, and attempts to get around the rules, get fixed replies written in advance (crisis replies
   point to a trusted adult, SafeUT, 988 and 911). The AI never improvises those.
7. Otherwise the coach replies under fixed server-side rules (`coachSystem` in `worker.js`), with only conversation lines this
   Worker signed (anything typed straight into the database is ignored and reported as tampering).
8. A second check reads the reply before the student sees it. If it fails or can't run, the student gets a safe fallback
   and staff get an alert.
9. The coach's reply is saved. Students can add to their log but can't edit or delete it (see `firestore.rules`).

## Academics, hint-only (added Nov 22, 2026)
Students can also ask the coach about schoolwork (`kind: "academic"`, started from the subject buttons on `/coach/`). The
coach never gives the answer: it asks what they tried, gives one hint at a time, re-explains the basic idea with its own
example, checks their thinking without giving the value, names resources without links, and won't help on a test.
- `coachSystem(band, "academic")` adds those rules; `OUTPUT_SYSTEM` gets `academic="yes"` and holds back any reply that
  hands over the answer (the student sees a neutral reply, staff get a "coach reply held back" alert).
- Every academics conversation gets one `academic_use` alert (low) and one Slack notice in #alerts per conversation per day
  (alert id `academic-<chatId>-<day>`, so a long-running chat is reviewed again each day it's used).
- Asking for answers in an academics chat is raised from low to medium (`cheating`) and also posts to #alerts.
- **Deploy:** paste the new `worker.js` into Cloudflare and Deploy. Until then, academics chats are refused ("bad kind").
  Check that `ALERT_WEBHOOK` is the #alerts channel's webhook (Slack → Apps → Incoming Webhooks).

## Nov 22, 2026: academics gated, finder and conflict coaches, Guide Mentor, book tags
See "Coach updates, the Guide Mentor…" in the main README. Worker modes now: `coach` (kinds challenge, project, find-challenge,
find-project, conflict, lesson, and academic for pilot students only), `interest`, `mentor`, `doc`, `booktags`, and the staff tools.
The Worker needs a KV namespace bound as **DOCS** with keys `handbook` and `behavior-policy` for the Guide Mentor and the Staff
Handbook page. Without it, the mentor still works from the public documents.

## Changing things later
- Staff list: the Admin page. Admin emails are also listed in `worker.js`, `fieldguide/app.js` and `firestore.rules`.
- Models and size limits: the constants at the top of `worker.js`. The coach's limits are under "Student coach limits".
- The coach's rules, the screener and the fixed crisis replies: `coachSystem`, `SCREEN_SYSTEM`, `OUTPUT_SYSTEM` and `SCRIPTS` in `worker.js`.
- To switch the AI off: delete the relay address on the Admin page, or delete the Worker.

## Nov 22, 2026: test student
Testers (the `TESTERS` list) can send `as: "student"` with coach and interest requests. The Worker then treats them exactly
like the test student (`lsStudents/test-student`): same screening, limits and academics pilot, `staffTest` off. Everything it
writes is marked `test: true` (the daily count is `aiStudents/test-{uid}`), and test alerts are never posted to Slack.
Anyone else's `as` is ignored. Deploy with `firestore.rules` from the same change.
