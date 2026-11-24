// Guide onboarding: one continuous path through everything a Wilderland guide needs. Each step is a short run of
// screens with one big Next button, then a checkpoint. Finishing a step adds that part of the Guides site
// (wlnav.js keeps the rest hidden until then: no tab, no card, no search result). Life Skills comes first.
// Screen kinds are laid out by app.js: text, quad, phrases, moments, evidence, trust, practice, oneonone, standards,
// tiers, freedom, knots, toolkit, wiring, doc. Kinds that pull from the Field Guide or Behavior Guide data stay in step
// with those guides automatically. Edit text here.
// DIG: optional books, articles, podcast episodes and studies. Each has on: <screen id> and shows, folded, at the
// bottom of that screen (a screen can have none). Guides can save any of them to their own list (#library). Every link was checked when added (Nov 2026); keep it that way.

export const STEPS = [
  { id: "welcome", name: "Welcome", icon: "🧭", time: "5 minutes",
    intro: "Everything a Wilderland guide needs, one step at a time.",
    unlocks: null,
    screens: [
      { id: "w-how", kind: "text", title: "How this works", text: [
        "Eight short steps, in order: Welcome, Life Skills, the Mentor Mindset, Behavior, Parent Communication, Students, Trail Partner, and our policies. Everything you need is right here. Read a screen, press Next.",
        ["Each step ends with a short checkpoint. Pass it and that part of the Guides site appears for you. Until then it stays out of sight, so you only see what you've trained for.", "Checkpoints have three different sets of questions that take turns. If you don't pass, the next try asks different questions.", "Your place is saved. Close the tab any time and pick up where you left off.", "Some screens end with Dig deeper: books, articles, podcasts and studies on that topic, if you want more. They're optional. Save any of them for later."]
      ] },
      { id: "w-why", kind: "text", title: "Why we train this way", text: [
        "Wilderland runs on high standards, high support and high autonomy, for students and for us. We hired experienced educators on purpose, and we're also an ambitious school: as research on what motivates students moves, we change how we work.",
        "This training is required for every guide, Field Guides and Academic Guides alike. It's also built to be quick. Most steps take under an hour."
      ] },
      { id: "w-map", kind: "map", title: "What opens as you go" }
    ],
    dig: [] },

  { id: "lifeskills", name: "Life Skills", icon: "🏔️", time: "45 minutes",
    intro: "Start here: the vision for the Life Skills afternoon, why it works, and its four parts in the order a student climbs them. Life Skill Labs, Challenges, weekly 1:1 coaching, and Passion Projects for the students who are ready for them.",
    unlocks: { name: "Life Skills", what: "The Life Skills tracker (validate passes and not yets), the Labs schedule, Lab ideas, How Labs run, and the AI Lab builder." },
    screens: [
      { id: "l-vision2", kind: "text", art: "climb", title: "The Life Skills afternoon", text: [
        "Mornings build academic foundations. Afternoons are where students become capable people. They learn the eight Life Skills by doing real things, mostly in the real world, often in front of real people.",
        "The goal is children who break their own ceilings: who can do things that would impress an adult, and know it because they proved it. Status comes from doing hard things. It never comes from prizes or from pleasing a grown-up.",
        "The afternoon has four parts. Each one hands the student more of the wheel:",
        ["Life Skill Labs: you lead and the whole crew takes part. The flagship experiences of the afternoon.", "Challenges: the student chooses from a large list and you verify. Real autonomy, with high standards.", "1:1 Coaching: every student, every week. Where students own their goals and choose what's next.", "Passion Projects: the student leads and you advise. Mostly for 7th and 8th graders who have found something they're excited about, and open to younger students who meet the criteria."],
        "That order is on purpose. Researchers call it the gradual release of responsibility (Pearson & Gallagher, 1983): show it, practice it together, then let the learner carry it. A review of decades of studies found that beginners learn less when left to figure things out alone, and that guidance should ease off only as skill grows (Kirschner, Sweller & Clark, 2006). So Labs come first, and Passion Projects wait until a student is ready.",
        "What holds it together is individualization. In academics, our metrics let us see where each child is in real time and adjust as we go. In Life Skills, each child chooses and works on their own challenges. Both come together in one place: the weekly coaching session, where you look at a child's data, get to know them, and help them set their goals.",
        ["High standards: the bar never moves, for any child.", "High support: Labs, coaching, and retries that aren't rationed.", "High autonomy: it grows as a student shows they can carry it."]
      ] },
      { id: "l-why", kind: "text", title: "Why it works: autonomy, structure and competence", text: [
        "Three large research reviews shape how the afternoon is built.",
        ["Choice: a meta-analysis of 41 studies found that giving choice raised intrinsic motivation, effort, task performance and perceived competence. The effect was strongest when people made 2 to 4 successive choices, and leveled off after about five (Patall, Cooper & Robinson, 2008). So students choose from a large list of challenges, then commit to a few at a time: up to 3 on their “working on” list, picked with you at their 1:1.", "Structure: a 2025 meta-analysis of 94 studies found that teachers' autonomy support and structure reinforce each other, and recommends blending the two (Patzak & Zhang, 2025). Autonomy isn't a menu without limits. Our choices sit inside a clear frame: the Life Skills map, the same high bar for everyone, Labs, and weekly coaching.", "Competence: across 144 studies and more than 79,000 students, feeling competent was the strongest predictor of self-driven motivation, ahead of autonomy and then relatedness (Bureau, Howard, Chong & Guay, 2022). Every pass has to be real. A student who proves they can do something hard wants to do the next hard thing."],
        "Relevance is the other half. Students ask “When will I ever use this?” The afternoon answers with real audiences, real stakes, and challenges tied to students' own lives: a speech to people outside school, a business that can lose real money, a hobby taken to a serious level. That's where the afternoon finds its resonance."
      ] },
      { id: "l-skills", kind: "text", art: "skills", title: "The eight Life Skills", text: [
        "Wilderland teaches eight Life Skills: Energy, Self-Governance, Character & Grit, Adaptability & Ingenuity, Value Creation, Storytelling & Speaking, Fellowship, and Nature & Living Systems. Each has sub-skills and specific abilities, mapped on the Skill Map. Content is the vehicle; the skill is the point.",
        ["The yearly goal: in grades 2–8, at least 2 passes in every Life Skill. In K–1, at least 3 per Life Skill for each child, from guide-run challenges (plan on at least 2 a week).", "Passes come from Lab tests and from Challenges. Both count toward the goal.", "Progress lives in two places: the printed wall chart, where students see each other getting hard things done, and the Life Skills tracker, which families can see from home."]
      ] },
      { id: "l-labs3", kind: "text", art: "labs", title: "1. Life Skill Labs", text: [
        "Life Skill Labs are the flagship experiences of the afternoon, and everyone takes part. They're high-energy, often themed, and can run for a whole session, up to about two months, building toward a real, public feat. Every student should be excited to be part of them, and that excitement should pull them to finish their academic work, too.",
        "Labs aren't required to tie into academics, though they're welcome to. Plan them ahead, on purpose. In a Lab you lead a crew through learning and practicing a skill together. Then run a quick testing session: each student takes their own Skill Validation. Not every student passes every Lab, but every pass counts toward their yearly goal.",
        "The strongest Labs pass four tests: anyone can see the pass (a time, a count, a weight, or a yes from someone outside school); the Skill Validation itself fits in one Lab week (one day in K–1); kids can practice it here; and it leaves something to show.",
        ["Design backward from the Skill Validation. Name its quality bar: Score it, Make something happen, or Satisfy the expert.", "Make it thrilling by changing the arena (race an adult, a real audience, a real event), never the bar.", "Epic Life Skill Labs run for weeks and end in a real, public feat. Every band can do them, K–1 included.", "A Lab built from an existing Challenge keeps that Challenge's Skill Validation exactly.", "Score every plan on the Life Skill Lab Scorecard: 9 indicators, 1 to 3 each. Aim for 3 on every one, and score honestly.", "Safety gates come before the activity (fire card, knife card, tool card and so on). Field days need at least two approved adults with every group, permission slips and a transport plan.", "First names only in anything public, and no photos without a release on file. Students can't use Claude (Anthropic requires users to be 18 or older)."]
      ] },
      { id: "l-challenges3", kind: "text", art: "challenges", title: "2. Challenges", text: [
        "Challenges are where choice comes in. Students choose from a large list of challenges across all eight Life Skills, and many can be done through a hobby they already love. That's real autonomy, with a high standard on every one. They keep up to 3 on their “working on” list at a time, usually 3 to 8 hours of work a week, and you verify the pass.",
        "A Challenge is one “I can…” statement with a Skill Validation: observable, scored or event-based, and hard to pass without the skill. Sizes: a Week (about 3 to 8 hours of work), a Practice skill tested whenever the student is ready (like a timed mile), or an Epic (about 2 to 3 weeks, 2 credits, with start, halfway and finish checkpoints).",
        ["Pass or not yet. No partial credit and no lowered bar.", "A not yet always says exactly what was missing and how to practice. It never goes on the wall, and retries aren't rationed.", "Knowledge checks (“say the 3 fire rules”) are Steps that unlock a challenge, never the pass itself.", "Record passes and not yets in the tracker the day you see them. Every 4 credits is a milestone, celebrated at Honor Court.", "Some challenges can be passed off at home. Parents hold the same bar: video in one continuous take from the last 7 days, a parent log, a witness note, or a turnaround check. A video can't replace a guide on Safety Gates.", "K–1 has no independent Challenges: the guide runs them and each child shows the skill alone. In 2–4, a challenge from the 5–8 band counts as a Stretch.", "No prizes for passing. Status comes from doing hard things and from specific spoken recognition. No public leaderboards."]
      ] },
      { id: "l-coaching2", kind: "text", art: "coaching", title: "3. 1:1 Coaching Sessions", text: [
        "Every student meets one-on-one with their guide every week. It isn't optional, and it isn't only for students who are struggling. If a week gets away from you, make it up before the next week ends. Most take 10 to 20 minutes; K–1 is shorter and more concrete.",
        "The 1:1 is where a student steers their own afternoon. You hold the bar; they own the goal. Use the Mentor Mindset the whole way through: keep the real standard, show belief and offer real help, and leave the thinking and the next choice with them.",
        "Before you sit down, review the data as well as your notes:",
        ["Life Skills: are they saving new challenges and working toward passing them? Where do they stand across the eight Life Skills?", "Academics: how is their data on Basecamp? Are they meeting their goals and finishing their assignments?", "Motivation: do they have an incentive they're excited about working toward?", "Behavior: any incidents since last week? Look for the root problem with the student, using Collaborative Troubleshooting from the Mentor Mindset: surface their thinking, validate what's right, then bridge with a question."],
        "Then run the session:",
        ["Read last week first: last week's notes, what they said they'd do, and your one thing.", "Start with them. Ask how the week went and listen. Follow what they say with a real question.", "Check the commitment. Name exactly what went well. If it didn't happen, get curious: “What got in the way?” No lecture.", "Give wise feedback where it's needed: “I'm giving you feedback because I know you can reach a high standard.” Then be specific, and offer help.", "They pick this week's goal, such as their next Challenge. The student proposes it; you hold the bar.", "Make an if-then plan: “If ___ happens, then I will ___.” They say it back; you write it down.", "Close with the next date. Name the day of next week's 1:1, then save your notes."],
        "Watch for readiness. The 1:1 is where you'll notice a student who has found a real passion, and where you'll see whether they can plan and follow through on their own. That's the doorway to a Passion Project.",
        "Recording a 1:1 (it becomes text; audio is never saved) needs a parent's written consent on the student's page and the student's okay that day. Otherwise, take notes. The Mentor Mindset step teaches the coaching skills in depth and opens the Session Room."
      ] },
      { id: "l-projects2", kind: "text", art: "projects", title: "4. Passion Projects", text: [
        "A Passion Project is about 25 hours of student-driven building, with milestones at the start, halfway and finish, shown to real people at the end. A finished project isn't automatically a passing one: the work has to meet the bar.",
        "Passion Projects are mostly encouraged for 7th and 8th graders, once they've found something they're excited about. Younger students can take one on too, when they meet the same criteria: a real passion, and the skills to run it. Those skills are two things:",
        ["Executive functioning: they plan the work, start without being prompted, manage their time, and push through setbacks.", "Self-teaching: they can learn something new from books, videos and experts, without being taught step by step."],
        "They aren't a default assignment. Before saying yes, ask both questions: does this student truly care about this, and can they carry it on their own? Look at what they've already done. An Epic Challenge finished with every checkpoint met is strong evidence. If either answer is not yet, keep the door open and route them through the Challenges and Labs that build those skills first. That's a path, not a no.",
        ["Grades 7–8: encouraged, once a student has found something they're excited about. Real audiences and real responsibility.", "Grades 2–6: open to any student who meets the criteria.", "K–1: no Projects."]
      ] }
    ],
    quiz: "lifeskills",
    dig: [
      { id: "d-patall", on: "l-why", t: "study", title: "The effects of choice on intrinsic motivation and related outcomes: a meta-analysis", by: "Patall, Cooper & Robinson, 2008, Psychological Bulletin", url: "https://doi.org/10.1037/0033-2909.134.2.270", note: "41 studies: choice raises motivation, effort and performance, most with 2 to 4 successive choices." },
      { id: "d-patzak", on: "l-why", t: "study", title: "Blending teacher autonomy support and provision of structure in the classroom for optimal motivation", by: "Patzak & Zhang, 2025, Educational Psychology Review", url: "https://doi.org/10.1007/s10648-025-09994-2", note: "94 studies: autonomy support and structure reinforce each other. Open access." },
      { id: "d-bureau", on: "l-why", t: "study", title: "Pathways to student motivation: a meta-analysis of antecedents of autonomous and controlled motivations", by: "Bureau, Howard, Chong & Guay, 2022, Review of Educational Research", url: "https://doi.org/10.3102/00346543211042426", note: "144 studies, 79,000+ students: competence is the strongest predictor of self-driven motivation." },
      { id: "d-pearson", on: "l-vision2", t: "study", title: "The instruction of reading comprehension", by: "Pearson & Gallagher, 1983, Contemporary Educational Psychology", url: "https://doi.org/10.1016/0361-476X(83)90019-X", note: "Where “gradual release of responsibility” comes from: the shape of our afternoon." },
      { id: "d-ksc", on: "l-vision2", t: "study", title: "Why minimal guidance during instruction does not work", by: "Kirschner, Sweller & Clark, 2006, Educational Psychologist", url: "https://doi.org/10.1207/s15326985ep4102_1", note: "Why beginners need Labs before independent work, and why guidance eases off only as skill grows." },
      { id: "d-zimmerman", on: "l-projects2", t: "study", title: "Becoming a self-regulated learner: an overview", by: "Zimmerman, 2002, Theory Into Practice", url: "https://doi.org/10.1207/s15430421tip4102_2", note: "Plan, do, reflect: what a student ready for a Passion Project can already do. Five readable pages." },
      { id: "d-diamond", on: "l-challenges3", t: "study", title: "Interventions shown to aid executive function development in children 4 to 12 years old", by: "Diamond & Lee, 2011, Science", url: "https://doi.org/10.1126/science.1204529", note: "What builds executive function: repeated practice with steadily rising challenge." },
      { id: "d-hidden", on: "l-skills", t: "book", title: "Hidden Potential: The Science of Achieving Greater Things", by: "Adam Grant (2023)", note: "Character skills over talent, and how they're built." },
      { id: "d-pblbook", on: "l-projects2", t: "book", title: "Setting the Standard for Project Based Learning", by: "John Larmer, John Mergendoller & Suzie Boss (ASCD, 2015)", note: "The book behind Gold Standard PBL." },
      { id: "d-tenpercent", on: "l-skills", t: "podcast", title: "Adam Grant on the Science of Potential and Achievement", by: "Ten Percent Happier", url: "https://www.tenpercent.com/tph/podcast-episode/adam-grant-hidden-potential", note: "Why character skills matter and how to develop them." },
      { id: "d-woop", on: "l-coaching2", t: "podcast", title: "WOOP, There It Is! 4 Steps to Achieve Your Goals", by: "Hidden Brain (NPR) with Gabriele Oettingen", url: "https://www.npr.org/transcripts/477379965", note: "Wish, outcome, obstacle, plan: the if-then plan behind our 1:1s." },
      { id: "d-futureed", on: "l-vision2", t: "podcast", title: "Future of Education Podcast", by: "MacKenzie Price, co-founder of Alpha School", url: "https://podcasts.apple.com/us/podcast/id1673109764", note: "How Alpha runs its life-skills afternoons, which our day borrows from." },
      { id: "d-gold", on: "l-labs3", t: "article", title: "Gold Standard PBL: Essential Project Design Elements", by: "PBLWorks", url: "https://www.pblworks.org/blog/gold-standard-pbl-essential-project-design-elements", note: "Seven elements of a strong project: useful for Passion Projects and Labs." },
      { id: "d-woopguide", on: "l-coaching2", t: "article", title: "WOOP overview for classrooms", by: "Character Lab", url: "https://characterlab.org/wp-content/uploads/2019/03/CharacterLabWOOPoverview.pdf", note: "A one-page guide to teaching WOOP." },
      { id: "d-gollwitzer", on: "l-coaching2", t: "study", title: "Implementation intentions and goal achievement: a meta-analysis", by: "Gollwitzer & Sheeran, 2006", url: "https://doi.org/10.1016/S0065-2601(06)38002-1", note: "94 tests; if-then plans have a medium-to-large effect." },
      { id: "d-duckworth", on: "l-coaching2", t: "study", title: "Self-regulation strategies improve self-discipline in adolescents", by: "Duckworth et al., 2011", url: "https://doi.org/10.1080/01443410.2010.506003", note: "A 30-minute wish-obstacle-plan exercise, over 60% more practice done." },
      { id: "d-dubois", on: "l-coaching2", t: "study", title: "Effectiveness of mentoring programs for youth: a meta-analytic review", by: "DuBois, Holloway, Valentine & Cooper, 2002", url: "https://doi.org/10.1023/A:1014628810714", note: "Why weekly, steady 1:1 contact matters." }
    ] },

  { id: "mentor", name: "Mentor Mindset", icon: "🌱", time: "45 minutes",
    intro: "How we coach every student: keep the real standard, show belief and give real help, and leave the thinking and choices with the student.",
    unlocks: { name: "Mentor Mindset and the Session Room", what: "The full Field Guide, the AI practice range and coach, and the Session Room for recording and reviewing weekly 1:1s." },
    screens: [
      { id: "m-quad", kind: "quad", art: "mountain", title: "Four mindsets" },
      { id: "m-why", kind: "text", title: "Why young people react the way they do", text: [
        "From about age 10, young people become intensely tuned to status and respect. They read between the lines of everything we say, hunting for one answer: does this adult think I'm capable?",
        "A threat says “I don't respect you.” A rescue says “I don't think you can.” Either one shuts motivation down.",
        "The mentor's move is wise feedback, which keeps the standard and the relationship in one breath: “I'm giving you these comments because I have very high expectations, and I know that you can reach them.” It only works when specific critique and real help follow.",
        ["Standard: did I keep the real bar, out loud?", "Support: did I show belief and offer a concrete way to help?", "Autonomy: did I leave the thinking and the next choice with them?"]
      ] },
      { id: "m-evidence", kind: "evidence", title: "What the studies found" },
      { id: "m-spot", kind: "ctx", title: "What each mindset sounds like" },
      { id: "m-phrases", kind: "phrases", title: "Say this instead" },
      { id: "m-moments", kind: "moments", title: "When a student says…" },
      { id: "m-trust", kind: "trust", title: "Jaded and shut-down students" },
      { id: "m-practice", kind: "practice", title: "Try it yourself", ids: ["t1", "t4", "t10"] },
      { id: "m-1on1", kind: "oneonone", title: "Weekly 1:1s" },
      { id: "m-habit", kind: "text", title: "Making it stick", text: [
        "We're learning a new professional skill together, on the same three pillars we use with students: every guide uses mentor responses consistently (standard), with short rehearsals, a partner and the coach (support), choosing your own words and focus (autonomy).",
        ["Weekly, together: ten minutes at team meeting, one real situation, two people rehearse it out loud.", "Weekly, solo: two reps on the practice range and one if-then plan.", "Any time: a do-over with a student. “I didn't handle that the way I want to. Can I try again?”"]
      ] }
    ],
    quiz: "mentor",
    dig: [
      { id: "d-1025", on: "m-quad", t: "book", title: "10 to 25: The Science of Motivating Young People", by: "David Yeager (2024)", note: "The book this whole step comes from." },
      { id: "d-tilt450", on: "m-quad", t: "podcast", title: "Dr. David Yeager on What the Science Says About Motivating Young People", by: "Tilt Parenting, episode 450", url: "https://www.tiltparenting.com/session450", note: "Enforcer, protector and mentor, explained by Yeager himself." },
      { id: "d-kawasaki", on: "m-quad", t: "podcast", title: "David Yeager: The Science of Motivating Young People", by: "Remarkable People with Guy Kawasaki", url: "https://guykawasaki.com/david-yeager-the-science-of-motivating-young-people/", note: "Transcript on the page." },
      { id: "d-gratitude", on: "m-why", t: "podcast", title: "#151: David Yeager on the Mentor Mindset", by: "Evolving with Gratitude (Lainie Rowell), March 2026", url: "https://podbay.fm/p/evolving-with-gratitude/e/1774962180", note: "Wise feedback and what real support looks like, 45 minutes." },
      { id: "d-wise", on: "m-why", t: "study", title: "Wise critiques help students succeed", by: "Yeager et al., 2014", url: "https://sparq.stanford.edu/solutions/wise-critiques-help-students-succeed", note: "The 19-word note: revisions rose from about 17% to 71%." },
      { id: "d-okonofua", on: "m-evidence", t: "study", title: "Brief intervention to encourage empathic discipline cuts suspension rates in half", by: "Okonofua, Paunesku & Walton, 2016, PNAS", url: "https://doi.org/10.1073/pnas.1523698113", note: "Suspensions fell from 9.6% to 4.8%." },
      { id: "d-synergistic", on: "m-evidence", t: "study", title: "A synergistic mindsets intervention protects adolescents from stress", by: "Yeager et al., 2022, Nature", url: "https://doi.org/10.1038/s41586-022-04907-7", note: "Stress as fuel: 63% vs 47% pass rates in the hardest courses." },
      { id: "d-belong", on: "m-evidence", t: "study", title: "When students feel they belong, they thrive", by: "Walton & Cohen, 2011", url: "https://sparq.stanford.edu/solutions/when-students-feel-they-belong-they-thrive", note: "A one-hour belonging exercise halved a three-year grade gap." },
      { id: "d-coaching", on: "m-habit", t: "study", title: "The effect of teacher coaching on instruction and achievement", by: "Kraft, Blazar & Hogan, 2018", url: "https://annenberg.brown.edu/publications/effect-teacher-coaching-instruction-and-achievement-meta-analysis-causal-evidence", note: "Why we rehearse: 60 causal studies." }
    ] },

  { id: "behavior", name: "Behavior", icon: "🪜", time: "1 hour",
    intro: "The valley floor under the Mentor Mindset: how we keep every child safe, in school and getting along. The standards every guide holds the same way, and the tools you choose with judgment.",
    unlocks: { name: "the Behavior Guide", what: "The Behavior Guide, the AI behavior coach, the weekly Freedom Level tracker and the Town Hall agenda." },
    screens: [
      { id: "b-standards", kind: "standards", art: "valley", title: "The Standard: what every guide does the same way" },
      { id: "b-tiers", kind: "tiers", title: "Tiers 0 to 3, sorted by impact" },
      { id: "b-freedom", kind: "freedom", title: "Freedom Levels" },
      { id: "b-knots", kind: "knots", title: "Real situations", ids: ["treefort", "late", "girlgroup"] },
      { id: "b-toolkit", kind: "toolkit", title: "The toolkit: your judgment" },
      { id: "b-wiring", kind: "wiring", title: "Different wiring" }
    ],
    quiz: "behavior",
    dig: [
      { id: "d-lostatschool", on: "b-toolkit", t: "book", title: "Lost at School", by: "Ross Greene", note: "Collaborative & Proactive Solutions (Plan B) in schools." },
      { id: "d-explosive", on: "b-toolkit", t: "book", title: "The Explosive Child", by: "Ross Greene", note: "Kids do well if they can." },
      { id: "d-selfreg", on: "b-wiring", t: "book", title: "Self-Reg", by: "Stuart Shanker", note: "Reading behavior as stress, and co-regulation." },
      { id: "d-unmasking", on: "b-wiring", t: "book", title: "Unmasking Autism", by: "Devon Price", note: "What masking costs, from the inside." },
      { id: "d-barkley", on: "b-wiring", t: "book", title: "Taking Charge of ADHD", by: "Russell Barkley", note: "Help at the point of performance." },
      { id: "d-thinkinclusive", on: "b-toolkit", t: "podcast", title: "From Punishment to Problem-Solving: The CPS Model Explained by Dr. Ross Greene", by: "Think Inclusive podcast, episode 1004", url: "https://mcie.org/think-inclusive/dr-ross-greene-using-collaborative-and-proactive-solutions-to-support-the-behavior-of-all-learners/", note: "Plan B in plain terms, with a transcript." },
      { id: "d-greenepod", on: "b-toolkit", t: "podcast", title: "Dr. Ross Greene Educators' Podcast", by: "Ross Greene", url: "https://podcasts.apple.com/podcast/id649017652", note: "Episodes on running Plan B with students, like “The Who, When, and What of Plan B.”" },
      { id: "d-mindshift", on: "b-knots", t: "article", title: "Ross Greene: What if bad behavior isn't the problem?", by: "KQED MindShift", url: "https://www.kqed.org/mindshift/66347/ross-greene-what-if-bad-behavior-isnt-the-problem", note: "Unsolved problems, not consequences." },
      { ref: "cps", on: "b-toolkit" }, { ref: "rp", on: "b-tiers" }, { ref: "praise", on: "b-toolkit" }, { ref: "rewards", on: "b-freedom" }, { ref: "ncaep", on: "b-wiring" }, { ref: "dep", on: "b-wiring" }, { ref: "mask", on: "b-wiring" }, { ref: "pyramid", on: "b-toolkit" }
    ] },

  { id: "parents", name: "Parent Communication", icon: "📨", time: "20 minutes",
    intro: "How we write to families: clear, warm, specific, and the same thresholds for every family.",
    unlocks: { name: "Parent Comms", what: "The Parent Comms tool, which drafts any message to families with you and checks your own drafts." },
    screens: [
      { id: "p-tool", kind: "text", title: "Draft first, then decide", text: [
        "Once this step is done, the Parent Comms tool opens for you. It drafts first and coaches second. Give it what you know; it returns a message you can send, with placeholders like [CONFIRM: pick-up time] for anything missing. It never invents facts, and your voice wins: paste your own draft and it keeps your wording."
      ] },
      { id: "p-clear", kind: "text", title: "What every message makes clear", text: [
        ["The purpose, in the first sentence.", "What it means for parents, near the top: action needed (and by when), optional at home, or no action needed.", "What's different from a normal day, said outright.", "For any activity, contest or event: whether participation is required, optional, or automatic unless families opt out, and how to opt in or out.", "Who to contact with questions.", "Read it as a busy parent: would they need to reply with a question? Fix it before you send."]
      ] },
      { id: "p-safe", kind: "text", title: "Privacy and sensitive messages", text: [
        ["Never name other students in a group message without permission, and never name another child to a family. Describe what happened around their child without identifying anyone else.", "Never name a child with an allergy in a group message. Check the Allergy forms and contact those families privately before announcing.", "Messages about one student's behavior or progress, discipline, safety incidents, parent conflicts, policy changes, money, or unusual activities are drafts for leadership review. Get sign-off before sending.", "Any injury, allergic reaction or incident is reported to Shanan the same day, before any message to families.", "An individual concern goes only to that family: specific observed behavior (not labels), what you've tried, what you're asking of the parent, and a proposed next step."]
      ] },
      { id: "p-behavior", kind: "text", title: "When families hear about behavior", text: [
        ["Yellow card (third Tier 1 in a day): text home.", "Same Tier 1 behavior on 3 or more days in a school week: the guide may call a parent meeting.", "Two Tier 2s in one school week: an email with all the incident reports.", "Tier 3: an incident report email, then a parent-guide conversation before the student returns.", "K–1: one note at the end of the day for Tier 1, and the family hears the same day about any Tier 2.", "Reply to a parent's concern within one working day, with what you'll do and when you'll report back.", "Families of neurodivergent children often hear only bad news. Pair every notice with one specific thing their child did well that week."]
      ] },
      { id: "p-events", kind: "text", title: "Events and timing", text: [
        ["Field trip or family event: save the date 3 weeks before; full announcement 2 weeks before (1 week for a party); forms and payments due 5 school days before; reminder 1 to 2 days before; follow-up with a recap or photos within 2 days.", "Off-campus or higher-risk activities need a signed permission form: no form, no trip.", "Supervising volunteers must be 18 or older and background-checked, under the Two-Adult Minimum.", "Event announcements get a second read from another guide or Shanan before sending.", "Everything goes in one message through the usual parent channel, never split across threads.", "A correction is one complete replacement, with “Updated” in the subject and what changed in the first sentence."]
      ] },
      { id: "p-voice", kind: "text", title: "How we sound", text: [
        ["Warm, confident, specific and human, like a guide who knows and loves these kids. No school marketing.", "Dates include the weekday: “Friday, Dec 5.” Action items and deadlines are bold or set apart.", "Short sentences, plain words, no jargon, no em dashes.", "The substitute test: could a substitute who walked in this week have written this? If so, add what you set up on purpose and a real moment.", "Spread stories across different students over time."]
      ] }
    ],
    quiz: "parentcomms",
    dig: [
      { id: "d-powerful", on: "p-voice", t: "book", title: "Powerful Partnerships: A Teacher's Guide to Engaging Families for Student Success", by: "Karen Mapp, Ilene Carver & Jessica Lander (Scholastic, 2017)", note: "Written for teachers, walking through a whole school year." },
      { id: "d-scholastic47", on: "p-voice", t: "podcast", title: "Getting Families Engaged in the Classroom", by: "Scholastic Reads, episode 47, with Karen Mapp", url: "https://scholasticreads.fireside.fm/47", note: "33 minutes." },
      { id: "d-backpack", on: "p-voice", t: "podcast", title: "Partnering with Your Child's Teacher", by: "Notes from the Backpack (National PTA), with Karen Mapp", url: "https://www.pta.org/the-center-for-family-engagement/podcast/notes-from-the-backpack/partnering-with-your-child-s-teacher", note: "The parents' side of the partnership." },
      { id: "d-mappascd", on: "p-voice", t: "article", title: "Unlocking Families' Potential: A Conversation with Karen L. Mapp", by: "ASCD Educational Leadership", url: "https://www.ascd.org/el/articles/unlocking-families-potential-a-conversation-with-karen-l.-mapp", note: "Beyond “random acts of parent involvement.”" },
      { id: "d-bostonfed", on: "p-clear", t: "article", title: "The Underutilized Potential of Teacher-Parent Communication", by: "Matthew Kraft, Federal Reserve Bank of Boston, 2016", url: "https://www.bostonfed.org/publications/communities-and-banking/2016/spring/the-underutilized-potential-of-teacher-parent-communication.aspx", note: "A readable summary of the research." },
      { id: "d-kraftrogers", on: "p-clear", t: "study", title: "The underutilized potential of teacher-to-parent communication: evidence from a field experiment", by: "Kraft & Rogers, 2015, Economics of Education Review", url: "https://www.hks.harvard.edu/publications/underutilized-potential-teacher-parent-communication-evidence-field-experiment-0", note: "Weekly one-sentence messages cut the share failing to earn credit from 15.8% to 9.3%. Messages about what to improve worked best." },
      { id: "d-bergman", on: "p-clear", t: "study", title: "Leveraging Parents through Low-Cost Technology", by: "Bergman & Chan, 2021, Journal of Human Resources (J-PAL summary)", url: "https://www.povertyactionlab.org/node/2353", note: "Automated texts about missed work and absences improved outcomes." }
    ] },

  { id: "students", name: "Students", icon: "🧒", time: "10 minutes",
    intro: "The Students page: every student, their parents, and the safety information you need before you take a child anywhere.",
    unlocks: { name: "Students", what: "Every student and their parents, pickup, allergies and photo permissions, Mr. Fox alerts, and every student conversation with Mr. Fox." },
    screens: [
      { id: "s-page", kind: "text", title: "One page for every student", text: [
        "The Students page has four tabs:",
        ["Students and parents: every student, their parents and their guide. Any guide can add a student or link a parent. A parent sees their child's record only after you add their email and they confirm it.", "Pickup, allergies & photos: what the office keeps on each child. Family contacts, authorized pickup and do-not-release, emergency and health notes, allergies, photo permission and birthday.", "Alerts: when a student's message to Mr. Fox is worrying or breaks the rules. Every staff member sees every alert.", "All AI conversations: every student conversation with Mr. Fox."]
      ] },
      { id: "s-safety", kind: "text", title: "Check before you go", text: [
        "Red and amber tags on a student mean look closer. Read the notices at the top of your band first.",
        ["Pickup: check authorized pickup and do-not-release before you hand a child to anyone you don't know. A “Do not release” tag means never to that person.", "Allergies: check your band's allergy tags before any food, cooking or event. “No allergy form” means unknown, not clear: check with the family before food is shared.", "Photos: check before you take or share a photo. “No photos” means do not photograph. “Community only” has limits: read the note on the student's card.", "Only admins change this information, by importing the office's lists. If something looks wrong, tell an admin."]
      ] },
      { id: "s-care", kind: "text", title: "Handle it with care", text: [
        ["It's confidential: family contacts, health, custody and safety. Look it up when you need it. Don't copy it into messages, documents or AI tools, Trail Partner included.", "Urgent alerts come with what to do now. If a student may be harmed, Utah law requires your own report to DCFS (1-855-323-3237, any time) or the police, right away. Telling an admin doesn't replace it.", "Read an alert, do what it says, then mark it reviewed with a note on what you did."]
      ] }
    ],
    quiz: "students",
    dig: [] },

  { id: "partner", name: "Trail Partner", icon: "🐲", time: "5 minutes",
    intro: "Trail Partner is an AI fellow guide for thinking things through. Here's what it knows, where your conversations go, and how to use it well.",
    unlocks: { name: "Trail Partner", what: "The 🐲 button on every staff page, and the Trail Partner page with all your conversations." },
    screens: [
      { id: "t-what", kind: "text", title: "A fellow guide, any time", text: [
        "Trail Partner knows the Staff Handbook, the Behavior Policy and how Wilderland works: the Mentor Mindset, Our Approach, At Home, the Parent Comms rules and the Lab builder rules. Ask it the way you'd ask an experienced guide.",
        ["“A student keeps disrupting the Lab. What does our policy say to do?”", "“Help me plan what to say to a parent who is upset.”", "“What's our procedure if a child gets hurt outside?”"],
        "Open it with the 🐲 button at the top of any staff page. The Trail Partner page shows every conversation."
      ] },
      { id: "t-use", kind: "text", title: "Use it well", text: [
        ["It can be wrong. Check anything about safety or the law with an admin.", "Your conversations are private: only you can see them. Every conversation with Trail Partner and the other coaches (Mentor Mindset, Behavior, Parent Communication) and every Lab builder draft is saved there. Reopen or delete any of them.", "Describe the situation, not the child's file. Leave out last names and anything from Pickup, allergies & photos."]
      ] }
    ],
    quiz: "partner",
    dig: [] },

  { id: "policies", name: "Our policies", icon: "📜", time: "1 to 2 hours",
    intro: "The Staff Handbook and our staff policies, right here. Then a short knowledge check on each one in effect, written fresh from the policy text each time.",
    unlocks: { name: "Policies & Resources and the Staff Handbook", what: "Every policy and form in one place, searchable, plus Trail Partner answers drawn from them." },
    screens: [
      { id: "x-handbook", kind: "doc", key: "handbook", title: "Staff Handbook" },
      { id: "x-roles", kind: "doc", key: "policy-role-clarity", title: "Role Clarity and Updates" },
      { id: "x-drafts", kind: "text", title: "Coming soon: policies awaiting Board adoption", text: [
        "Three more policies are written and waiting for the Board: Guide Standards & Expectations, the Two-Adult Minimum, and Raising Concerns. Once this step is done you'll find them on the Policies page. They aren't in the checks until they're adopted."
      ] }
    ],
    checks: [
      { id: "policy-handbook", key: "handbook", label: "Staff Handbook", name: "Staff Handbook check" },
      { id: "policy-role-clarity", key: "policy-role-clarity", label: "Role Clarity and Updates policy", name: "Role Clarity check" }
    ],
    dig: [
      { id: "d-dcfs", on: "x-handbook", t: "article", title: "Report child abuse or neglect", by: "Utah Division of Child and Family Services", url: "https://dcfs.utah.gov/services/child-protective-services/", note: "Hotline 1-855-323-3237, 24/7, or the online form for non-urgent reports. In Utah everyone is a mandated reporter." },
      { id: "d-poster", on: "x-handbook", t: "article", title: "Utah abuse and neglect reporting law (poster)", by: "State of Utah, Utah Code §80-2-609", url: "https://dlbc.utah.gov/wp-content/uploads/Abuse-and-Neglect-Poster-_-February-2026.pdf", note: "The law on one page." },
      { id: "d-d2l", on: "x-handbook", t: "article", title: "Stewards of Children", by: "Darkness to Light", url: "https://www.d2l.org/education/stewards-of-children/", note: "A two-and-a-half-hour training on preventing, recognizing and responding to child sexual abuse. Available online." },
      { ref: "cstag", on: "x-handbook" }
    ] }
];

// What each step opens on the site. Keep in step with LOCKS in /wlnav.js.
export const SECTION_OF = { lifeskills: "lifeskills", students: "students", partner: "partner", mentor: "mentor", behavior: "behavior", parents: "parents", policies: "policies" };
export const OPEN_LINK = { students: "/guides/roster/", partner: "/guides/partner/", mentor: "/fieldguide/", behavior: "/behavior/", lifeskills: "/guides/lifeskills/", parents: "/guides/parents/", policies: "/guides/policies/" };
