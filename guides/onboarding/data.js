// Guide onboarding: one path, in order, through everything a Wilderland guide needs. Each step has readings and a
// checkpoint; the next step opens once this one is done. Edit the content here; app.js only lays it out.
// Lesson shape: { id, title, text: [paragraph or [bullet, bullet]], links: [[label, href]] }. A lesson that points at
// another page summarizes it and links there (opens in a new tab so this page keeps your place).
// Sources: Mentor Mindset Field Guide (/fieldguide/), Behavior Guide (/behavior/), Lab builder rules
// (/guides/lifeskills/builder/rules.txt), the Life Skills tracker, the home pass-off guide (/challenges/parents.html),
// the Weekly 1:1s stop, and the Parent Communication rules (/guides/parents/skill.txt). Policy text stays private.

export const STEPS = [
  { id: "welcome", name: "Welcome", icon: "🧭", time: "10 minutes",
    intro: "One path through everything a Wilderland guide needs, in order. Each step has a few readings and a checkpoint. The next step opens once you finish this one.",
    lessons: [
      { id: "w-how", title: "How this works", text: [
        "Six steps: Welcome, the Mentor Mindset, Behavior, Life Skills, Parent Communication, and our policies. Work through them in order. Mark each reading done when you've read it, then pass the step's checkpoint.",
        ["Checkpoints have three different sets of questions that take turns. If you don't pass, the next try asks different questions, so the way through is knowing the material.", "Your progress is saved to your Wilderland account. Admins can see which steps you've finished and your checkpoint scores, not your individual answers.", "Finished steps stay open, so you can come back to any of them."]
      ] },
      { id: "w-why", title: "Why we train this way", text: [
        "Wilderland runs on high standards, high support and high autonomy, for students and for us. We hired experienced educators on purpose, and we're also a very ambitious school: as research on what motivates students moves, we change how we work.",
        "This training is required for every guide, Field Guides and Academic Guides alike. Reading is the start. The moves have to be practiced until they come naturally, which is why the Mentor Mindset has a practice range and a session room."
      ], links: [["Why this training exists", "/fieldguide/#start"]] },
      { id: "w-where", title: "Where everything lives", text: [
        ["The menu at the top of every Guides page: Mentor Mindset, Session Room, Behavior, Life Skills, Student Roster, Parent Comms and Policies.", "Trail Partner 🐲 (top right) answers questions about your work from our own handbook and policies.", "Search with ⌘K or Ctrl+K from any page."]
      ], links: [["Guides home", "/guides/"], ["Trail Partner", "/guides/partner/"]] }
    ] },

  { id: "mentor", name: "Mentor Mindset", icon: "🌱", time: "2 to 3 hours",
    intro: "How we coach every student: keep the real standard, show belief and give real help, and leave the thinking and choices with the student. Read the stops below in the Field Guide, then pass the checkpoint.",
    lessons: [
      { id: "m-start", title: "Trailhead: the idea in five minutes", text: ["The enforcer, the protector and the mentor, and why young people read every adult word for respect."], links: [["Open the Trailhead", "/fieldguide/#start"]] },
      { id: "m-evidence", title: "The evidence", text: ["What the studies found: wise feedback, discipline with empathy, stress as fuel, belonging, purpose."], links: [["Open The evidence", "/fieldguide/#evidence"]] },
      { id: "m-spot", title: "Lookout: spot enforcer and protector moves", text: ["What each mindset sounds like in academic coaching, behavior, projects and Labs."], links: [["Open the Lookout", "/fieldguide/#spot"]] },
      { id: "m-phrases", title: "Phrasebook and Trail moments", text: ["What to say instead, and what to say right now when a student says “I don't care” or “This is stupid.”"], links: [["Open the Phrasebook", "/fieldguide/#phrases"], ["Open Trail moments", "/fieldguide/#moments"]] },
      { id: "m-trust", title: "Rough terrain and the Campfire", text: ["Rebuilding trust with jaded and shut-down students, and stories of where this worked."], links: [["Open Rough terrain", "/fieldguide/#trust"], ["Open the Campfire", "/fieldguide/#stories"]] },
      { id: "m-practice", title: "Practice range", text: ["Rehearse at least three scenarios and read your scores and the rewrite. This is the part that changes what you actually say."], links: [["Open the Practice range", "/fieldguide/#practice"]] },
      { id: "m-1on1", title: "Weekly 1:1s and the Session room", text: ["Every student gets a one-on-one with their guide every week. Six moves, an if-then plan, and how to record or take notes."], links: [["Open Weekly 1:1s", "/fieldguide/#oneonone"], ["Open the Session room", "/fieldguide/#sessions"]] },
      { id: "m-habits", title: "Pack list: how we make it stick", text: ["The habits that keep the Mentor Mindset alive after training."], links: [["Open the Pack list", "/fieldguide/#habits"]] }
    ],
    quiz: "mentor" },

  { id: "behavior", name: "Behavior", icon: "🪜", time: "2 to 3 hours",
    intro: "The valley floor under the Mentor Mindset: how we keep every child safe, in school and getting along. The standards every guide holds the same way, the tools you choose with judgment, and support for neurodivergent students. Read the Behavior Guide, then earn all six badges.",
    lessons: [
      { id: "b-standard", title: "The Standard", text: ["What every guide does the same way: the Code of Conduct, Peace Talks, Tier 2 restores, Tier 3 send-home, when families hear from us."], links: [["Open The Standard", "/behavior/#standard"]] },
      { id: "b-tiers", title: "Tier ladder", text: ["Tiers 0 to 3, sorted by impact, with exact counts."], links: [["Open the Tier ladder", "/behavior/#tiers"]] },
      { id: "b-freedom", title: "Freedom Levels", text: ["Four domains, weekly review, one rung at a time, delivered privately."], links: [["Open Freedom Levels", "/behavior/#freedom"]] },
      { id: "b-knots", title: "Knots", text: ["Real scenarios, untangled: what the standard requires and what's your call."], links: [["Open Knots", "/behavior/#knots"]] },
      { id: "b-toolkit", title: "Toolkit and Evidence", text: ["The methods you choose with judgment, and what the research honestly says about each."], links: [["Open the Toolkit", "/behavior/#toolkit"], ["Open Evidence", "/behavior/#evidence"]] },
      { id: "b-wiring", title: "Different wiring", text: ["Supporting neurodivergent students: inclusive excellence, same bar, different routes."], links: [["Open Different wiring", "/behavior/#wiring"]] }
    ],
    quiz: "behavior" },

  { id: "lifeskills", name: "Life Skills", icon: "🏔️", time: "1 to 2 hours",
    intro: "How students grow the eight Life Skills: weekly 1:1 coaching, Skill Labs, Challenges, and Passion Projects for the students who are ready for them.",
    lessons: [
      { id: "l-big", title: "The big picture", text: [
        "Wilderland teaches eight Life Skills: Energy, Self-Governance, Character & Grit, Adaptability & Ingenuity, Value Creation, Storytelling & Speaking, Fellowship, and Nature & Living Systems. Each has sub-skills and specific abilities, mapped on the Skill Map. Content is the vehicle; the skill is the point.",
        ["Weekly 1:1 coaching keeps every student moving and owning their goals.", "Skill Labs teach a skill to a crew, and every student ends with their own Test to Pass.", "Challenges let one student prove one ability, whenever they're ready.", "Passion Projects are long, student-driven builds for students who are truly passionate about an idea and equipped with the skills to take it on."]
      ], links: [["Life Skills tracker", "/guides/lifeskills/"]] },
      { id: "l-1on1", title: "1:1 coaching sessions", text: [
        "Every student gets a one-on-one with their guide every week. It isn't optional, and it isn't only for students who are struggling. If a week gets away from you, make it up before the next week ends. Most take 10 to 20 minutes; K–1 is shorter and more concrete.",
        ["Read last week's notes first.", "Start with them: how did the week go? Follow what they say with a real question.", "Check last week's commitment. If it didn't happen, get curious, no lecture.", "The student proposes this week's goal; you hold the bar.", "Make an if-then plan: “If ___ happens, then I will ___.” They say it back; you write it down.", "Close with the day of next week's 1:1, and save your notes."],
        "Recording is allowed only when a parent's written consent is marked on the student's page and the student says it's okay that day. Audio is never saved. Without consent, take notes."
      ], links: [["Weekly 1:1s", "/fieldguide/#oneonone"], ["Session room", "/fieldguide/#sessions"]] },
      { id: "l-challenges", title: "Challenges", text: [
        "A Challenge is one “I can…” statement with a Test to Pass: observable, scored or event-based, and hard to pass without the skill. Sizes: a Week (about 3 to 8 hours of work), a Practice skill tested whenever the student is ready (like a timed mile), or an Epic (about 2 to 3 weeks, 2 credits, with start, halfway and finish checkpoints).",
        ["Pass or not yet. No partial credit and no lowered bar.", "A not yet always says exactly what was missing and how to practice. It never goes on the wall, and retries aren't rationed.", "Knowledge checks (“say the 3 fire rules”) are Steps that unlock a challenge, never the pass itself.", "Record passes and not yets in the tracker the day you see them. Every 4 credits is a milestone, celebrated at Honor Court.", "Some challenges can be passed off at home. Parents hold the same bar: video in one continuous take from the last 7 days, a parent log, a witness note, or a turnaround check. A video can't replace a guide on Safety Gates.", "K–1 has no independent Challenges: the guide runs them and each child shows the skill alone. In 2–4, a challenge from the 5–8 band counts as a Stretch.", "No prizes for passing. Status comes from doing hard things and from specific spoken recognition. No public leaderboards."]
      ], links: [["Challenge map", "/challenges/"], ["Passing off at home", "/challenges/parents.html"]] },
      { id: "l-labs", title: "Skill Labs", text: [
        "In a Skill Lab, you lead a crew through learning and practicing a skill together, and each student ends with their own Test to Pass. The strongest Labs pass four tests: anyone can see the pass (a time, a count, a weight, or a yes from someone outside school); the whole crew can do it in one Lab week (one day in K–1); kids can practice it here; and it leaves something to show.",
        ["Design backward from the Test to Pass. Name its quality bar: Score it, Make something happen, or Satisfy the expert.", "Make it thrilling by changing the arena (race an adult, a real audience, a real event), never the bar.", "Epic Skill Labs run for weeks and end in a real, public feat. Every band can do them, K–1 included.", "A Lab built from an existing Challenge keeps that Challenge's Test to Pass exactly.", "Score every plan on the Workshop Scorecard: 9 indicators, 1 to 3 each. Aim for 3 on every one, and score honestly.", "Safety gates come before the activity (fire card, knife card, tool card and so on). Field days need at least two approved adults with every group, permission slips and a transport plan.", "First names only in anything public, and no photos without a release on file. Students can't use Claude (Anthropic requires users to be 18 or older)."]
      ], links: [["How Labs run", "/guides/lifeskills/playbook/"], ["Lab ideas", "/guides/lifeskills/ideas/"], ["Lab builder", "/guides/lifeskills/builder/"]] },
      { id: "l-projects", title: "Passion Projects", text: [
        "A Passion Project is about 25 hours of student-driven building, with milestones at the start, halfway and finish, shown to real people at the end. A finished project isn't automatically a passing one: the work has to meet the bar.",
        "Passion Projects are only open to students who are truly passionate about the idea and equipped with the skills to take it on. They aren't a default assignment. Before saying yes, ask both questions: does this student really care about this, and do they have the skills to carry it? If either answer is not yet, keep the door open and route them through the Challenges and Labs that build those skills first. That's a path, not a no.",
        ["K–1: no Projects.", "2–4: only by exception, when the student asks and the guide and a parent agree.", "5–8: the full range, with real audiences and real responsibility."]
      ], links: [["Atlas of Sparks (project ideas)", "/projects/"]] }
    ],
    quiz: "lifeskills" },

  { id: "parents", name: "Parent Communication", icon: "📨", time: "1 hour",
    intro: "How we write to families: clear, warm, specific, and the same thresholds for every family.",
    lessons: [
      { id: "p-tool", title: "Use the Parent Comms tool", text: [
        "The Parent Comms tool drafts first and coaches second. Give it what you know; it returns a message you can send, with placeholders like [CONFIRM: pick-up time] for anything missing. It never invents facts, and your voice wins: paste your own draft and it keeps your wording."
      ], links: [["Open Parent Comms", "/guides/parents/"]] },
      { id: "p-clear", title: "What every message makes clear", text: [
        ["The purpose, in the first sentence.", "What it means for parents, near the top: action needed (and by when), optional at home, or no action needed.", "What's different from a normal day, said outright.", "For any activity, contest or event: whether participation is required, optional, or automatic unless families opt out, and how to opt in or out.", "Who to contact with questions.", "Read it as a busy parent: would they need to reply with a question? Fix it before you send."]
      ] },
      { id: "p-safe", title: "Privacy and sensitive messages", text: [
        ["Never name other students in a group message without permission, and never name another child to a family. Describe what happened around their child without identifying anyone else.", "Never name a child with an allergy in a group message. Check the Allergy forms and contact those families privately before announcing.", "Messages about one student's behavior or progress, discipline, safety incidents, parent conflicts, policy changes, money, or unusual activities are drafts for leadership review. Get sign-off before sending.", "Any injury, allergic reaction or incident is reported to Shanan the same day, before any message to families.", "An individual concern goes only to that family: specific observed behavior (not labels), what you've tried, what you're asking of the parent, and a proposed next step."]
      ] },
      { id: "p-behavior", title: "When families hear about behavior", text: [
        ["Yellow card (third Tier 1 in a day): text home.", "Same Tier 1 behavior on 3 or more days in a school week: the guide may call a parent meeting.", "Two Tier 2s in one school week: an email with all the incident reports.", "Tier 3: an incident report email, then a parent-guide conversation before the student returns.", "K–1: one note at the end of the day for Tier 1, and the family hears the same day about any Tier 2.", "Reply to a parent's concern within one working day, with what you'll do and when you'll report back.", "Families of neurodivergent children often hear only bad news. Pair every notice with one specific thing their child did well that week."]
      ], links: [["When families hear from us", "/behavior/#standard/parents"]] },
      { id: "p-events", title: "Events and timing", text: [
        ["Field trip or family event: save the date 3 weeks before; full announcement 2 weeks before (1 week for a party); forms and payments due 5 school days before; reminder 1 to 2 days before; follow-up with a recap or photos within 2 days.", "Off-campus or higher-risk activities need a signed permission form: no form, no trip.", "Supervising volunteers must be 18 or older and background-checked, under the Two-Adult Minimum.", "Event announcements get a second read from another guide or Shanan before sending.", "Everything goes in one message through the usual parent channel, never split across threads.", "A correction is one complete replacement, with “Updated” in the subject and what changed in the first sentence."]
      ] },
      { id: "p-voice", title: "How we sound", text: [
        ["Warm, confident, specific and human, like a guide who knows and loves these kids. No school marketing.", "Dates include the weekday: “Friday, Dec 5.” Action items and deadlines are bold or set apart.", "Short sentences, plain words, no jargon, no em dashes.", "The substitute test: could a substitute who walked in this week have written this? If so, add what you set up on purpose and a real moment.", "Spread stories across different students over time."]
      ] }
    ],
    quiz: "parentcomms" },

  { id: "policies", name: "Our policies", icon: "📜", time: "2 to 3 hours",
    intro: "The Staff Handbook and our staff policies. Read them, then pass a knowledge check on each policy in effect. The checks are written fresh from the policy text each time, so there's nothing to memorize but the policies themselves.",
    lessons: [
      { id: "x-handbook", title: "Staff Handbook", text: ["Conduct, child safety, mandatory reporting, emergencies, technology, the classroom and employment terms."], links: [["Open the Staff Handbook", "/guides/handbook/"]] },
      { id: "x-roles", title: "Role Clarity and Updates", text: ["Who owns what: the four roles, behavior and safety, curriculum, spending, coverage and time off, and what to do when you're not sure whose call it is."], links: [["Open Role Clarity", "/guides/policies/#role-clarity"]] },
      { id: "x-drafts", title: "Policies awaiting Board adoption", text: ["Guide Standards & Expectations, the Two-Adult Minimum and Raising Concerns. Read them so you know what's coming. They aren't in the checks until they're adopted."], links: [["Policies & Resources", "/guides/policies/"]] }
    ],
    checks: [
      { id: "policy-handbook", key: "handbook", label: "Staff Handbook", name: "Staff Handbook check" },
      { id: "policy-role-clarity", key: "policy-role-clarity", label: "Role Clarity and Updates policy", name: "Role Clarity check" }
    ] }
];
