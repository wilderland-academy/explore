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

## Changing things later
- Staff list: the Admin page. Admin emails are also listed in `worker.js`, `fieldguide/app.js` and `firestore.rules`.
- Models and size limits: the constants at the top of `worker.js`.
- To switch the AI off: delete the relay address on the Admin page, or delete the Worker.
