// Our Approach: one page, anchor sections. It goes beyond the Parent Education Night packet rather than repeating it;
// the packet's material is condensed into a short refresher at the bottom.
// Sources: The Three Pillars (staff working draft v2, Sept 2026; only SETTLED items are taught here), the Upper Campus
// Parent Handbook (Oct 2026), the Life Skills Challenges site (/challenges/), the Parent Education Night packet (Aug 2026),
// and the studies linked under EVIDENCE. Plain language for parents. No em dashes in copy.

export const BANDS = { k1: "Grades K–1", g24: "Grades 2–4", g58: "Grades 5–8" };

/* ---------- three pillars: what happens when one is missing (from The Three Pillars) ---------- */
export const PILLARS = {
  S: { name: "High standards", short: "Standards", line: "A clear bar, set high, that a child clears by actually being able to do the thing.",
    here: ["Mastery before moving on. In the apps, a lesson isn't done until it's mastered.", "Life Skills challenges are pass or “not yet.” No partial credit, no “close enough.”", "A finished project isn't automatically a passing one. The work has to meet the bar."] },
  U: { name: "High support", short: "Support", line: "Adults who know each child well and help in ways that build independence, not dependence.",
    here: ["Every child is known by at least one adult: what they're working on, avoiding, proud of, and finding hard.", "Weekly one-on-one coaching with a Field Guide.", "Explicit teaching in every core subject, and hands-on materials when a child is stuck on why."] },
  A: { name: "High autonomy", short: "Autonomy", line: "Real choices about how, when and what, growing as a child shows they're ready.",
    here: ["Children set their own pace in the morning and move on when they've mastered something.", "They choose their own books, their own Life Skills challenges and, in grades 5–8, their own projects.", "Freedoms are earned by showing you can handle them, and they grow with age."] }
};
// key = which pillars are on (letters in S,U,A order)
export const COMBOS = {
  SUA: { name: "Growth", tone: "M", what: "The bar is high, the help is real, and the work belongs to the child. This is what we're aiming for every day.", eg: "“This isn't there yet. I know you can get it. What's your plan, and what help do you want?”" },
  UA: { name: "Drift", tone: "P", what: "Warm, free and happy, with no clear bar. Self-starters do fine. Everyone else slowly falls behind and doesn't know it.", eg: "“Do whatever feels right today.”" },
  SA: { name: "Pressure", tone: "E", what: "A high bar and freedom, but no one in your corner. The kids who can't clear it alone quietly give up or leave.", eg: "“You chose this. Figure it out.”" },
  SU: { name: "Compliance", tone: "E", what: "High bar, lots of help, no ownership. It looks like learning until the adult leaves the room.", eg: "“Do it exactly my way and I'll walk you through every step.”" },
  S: { name: "The enforcer", tone: "E", what: "Rules and consequences without belief or help. Kids learn to avoid getting caught.", eg: "“Because I said so.”" },
  U: { name: "The rescuer", tone: "P", what: "Kind, close and always stepping in. The child learns that adults think they can't.", eg: "“Here, I'll just do it.”" },
  A: { name: "Left alone", tone: "A", what: "Freedom with no bar and no help. That isn't autonomy. It's being on your own.", eg: "“Up to you.”" },
  "": { name: "Checked out", tone: "A", what: "No bar, no help, no say. Usually a sign the adults are running on empty.", eg: "“Whatever.”" }
};

/* ---------- how guides help, and when they hold back (SETTLED items in The Three Pillars) ---------- */
export const HELP_RULES = [
  ["Help is asked for", "A guide doesn't step in just because a child looks stuck. Children learn to ask, and asking is taught as a skill."],
  ["Hints before answers", "A question, a nudge, a reminder of something they already know. The thinking stays with the child."],
  ["Stepping in has a reason", "A guide steps in unasked when a child is unsafe, has been stuck a long time without asking, is missing something they were never taught, or is frustrated enough to start hating the subject."],
  ["Then step back", "Help pays off most when it's followed by real time working alone, so mornings have protected stretches of independent work."]
];
export const FEEDBACK_RULES = [
  ["About the work, never the child", "“This paragraph needs a clearer first sentence,” not “You're a sloppy writer.”"],
  ["No academic rankings", "No leaderboards or public scores. Academic data stays between a child, their guide and you. Life Skills feats are celebrated out loud at Honor Court."],
  ["Private correction from grade 5", "From about age ten, being corrected in front of peers costs more than it teaches. Guides correct older students one-on-one."],
  ["Adults do it over", "When a guide slips into enforcer or rescuer mode, they say so and try again, in front of the kids."]
];
export const MINDSET = [
  ["E", "Enforcer", "High standards, low support", "“Because I said so.”"],
  ["P", "Protector", "Low standards, high support", "“Here, I'll just do it.”"],
  ["M", "Mentor", "High standards, high support", "“The bar stays high. I know you can reach it, and I'll help.”"]
];

/* ---------- mornings ---------- */
export const MORNING_RULES = [
  ["Daily targets", "Each child has a set number of lessons a day in each app. Unfinished lessons become catch-up work on their dashboard."],
  ["Mastery, then move on", "A child moves forward when they've shown they know it, not when the calendar says so."],
  ["Explicit teaching still happens", "Choice covers pace and order. It doesn't cover whether a child gets taught."],
  ["Hands-on when it matters", "When a child is stuck on why something works, a guide brings out Montessori materials to build the concept."]
];
export const TOOLS = [
  { area: "Reading", k1: "Montessori language materials, phonics lessons and decodable books", up: "Amira (an AI reading tutor that listens to kids read aloud), Nessy for extra support, and free reading of books they choose" },
  { area: "Math", k1: "Montessori math materials", up: "Synthesis Tutor and IXL; Math Academy from about 4th grade up" },
  { area: "Writing and grammar", k1: "Dictated stories, early writing", up: "IEW Structure and Style, Fix It! Grammar, and Class Companion for feedback on writing" },
  { area: "Where to see progress", k1: "Transparent Classroom (Montessori records)", up: "Basecamp dashboards and the Basecamp Parent Portal, including MAP data" }
];

/* ---------- life skills (descriptions condensed from the packet; challenges copied from /challenges/ by ID) ---------- */
export const SKILLS = [
  { k: "EN", n: "Energy", i: "zap", col: "#C2611F", d: "Sleep, movement, nutrition, recovery, and reading your own body's needs.",
    ex: [["EN-03.1", "K–1", "I can hike 3 miles with at least 500 feet of climbing on my own feet, carrying my own water and snack."], ["EN-04.2", "2–4", "I can do 10 full push-ups with a straight body and hang from a bar for 30 seconds."], ["EN-03.3", "5–8", "I can summit a named peak near Ogden Valley on my own feet (5+ miles round trip, 1,500+ feet of climbing), carrying my own pack."]] },
  { k: "SG", n: "Self-Governance", i: "crown", col: "#2F5D8A", d: "Starting without being told, setting goals, handling emotions, and thinking for yourself.",
    ex: [["SG-06.1", "K–1", "I can put on all my snow gear by myself in 5 minutes or less."], ["SG-06.2", "2–4", "I can make my own packing checklist and pack my school bag every day for 2 school weeks (lunch, water, layers, anything special that day) with nothing missing in surprise checks."], ["SG-02.3", "5–8", "I can lead my own 20-minute student-led conference: show my parents and guide 3 strengths and 1 growth edge, each with a work sample, and 2 goals with a number or a date."]] },
  { k: "CG", n: "Character & Grit", i: "mountain", col: "#9C3F2A", d: "Doing the right thing when no one is watching, and staying with something past the point where it stops being fun.",
    ex: [["CG-06.4", "K–1", "I can stay out for a whole 45-minute outdoor Lab in cold, wind, rain or snow, dressed for it, without asking to go inside."], ["CG-04.2", "2–4", "I can complete a 30-day challenge I choose (daily push-ups, an instrument, a drawing a day) with no more than 2 missed days, proof from every day, and a measured improvement from day 1 to day 30."], ["CG-04.3", "5–8", "I can complete a 2-night backpacking or canoe trip carrying my own share and doing my camp jobs, rain or shine."]] },
  { k: "AI", n: "Adaptability & Ingenuity", i: "puzzle", col: "#1C6F6A", d: "Creative and systems thinking, learning how to learn, and changing course when things change.",
    ex: [["AI-03.1", "K–1", "I can come up with 10 uses for a stick in 3 minutes, then build one of them and show it working."], ["AI-05.5", "2–4", "I can assemble a small flat-pack furniture item (like an IKEA step stool) with one partner from the picture instructions in under 45 minutes, with no leftover parts and nothing wobbly."], ["AI-01.2", "5–8", "I can spot the scam in 18 of 20 real-looking messages (fake prizes, phishing texts, fake stores) and name the red flag in each, then teach 3 family members who each score 8 of 10 on a quiz I made."]] },
  { k: "VC", n: "Value Creation", i: "coins", col: "#8A6418", d: "Noticing what needs doing and building something useful, including early entrepreneurship.",
    ex: [["VC-03.1", "K–1", "I can sell something I made at a class market and count out the right change."], ["VC-03.6", "2–4", "I can get a paying customer outside my family for a service (shoveling a walk, raking leaves, walking a dog), agree on the job and price before I start, do it, and get a note saying they'd hire me again."], ["VC-02.3", "5–8", "I can build something for a real client outside school (a sign, a shelf, a website) that they sign off on and use."]] },
  { k: "SP", n: "Storytelling & Speaking", i: "mic", col: "#6E4382", d: "Communicating clearly, knowing your audience, and making a message land.",
    ex: [["SP-06.1", "K–1", "I can host a visitor: greet them with my name, eye contact and a handshake, show them 3 places in our room and say what we do at each, then thank them and say goodbye."], ["SP-02.2", "2–4", "I can tell a true story from my life in under 3 minutes, with a problem, a turning point and a moment of reflection on what it meant, without notes."], ["SP-02.4", "5–8", "I can tell a 5-minute true story at a public story night for 30 or more people."]] },
  { k: "FE", n: "Fellowship", i: "users", col: "#A04660", d: "Empathy and belonging, plus backbone: standing up for others, holding boundaries, and repairing after conflict.",
    ex: [["FE-14.1", "K–1", "I can use my Stop Power in 3 practice scenes: hand up, strong voice, “Stop, I don't like that,” then walk to a grown-up."], ["FE-07.2", "2–4", "I can be a new student's buddy for their first week: plan and give a tour, introduce them to at least 3 kids, check in with them every day, and they say it helped."], ["FE-02.2", "5–8", "I can interview someone very different from me (in age, culture or ability) and present their view so accurately that they say it's fair."]] },
  { k: "NL", n: "Nature & Living Systems", i: "trees", col: "#356B33", d: "Understanding and caring for the natural world, and seeing how what we do ripples outward.",
    ex: [["NL-03.1", "K–1", "I can name 10 common birds by sight (like a robin, magpie and chickadee), in the field or at our feeder."], ["NL-04.1", "2–4", "I can identify 8 animal tracks from our area in snow or mud."], ["NL-01.5", "5–8", "I can name 40 local plants in the field, including 5 in winter by bark and buds alone."]] }
];
export const CHALLENGE_STEPS = [
  ["Pick", "Your child chooses a challenge and tells their Field Guide the plan."],
  ["Practice", "Life Skill Labs, the “Where to learn” links, coaching and lots of tries."],
  ["Show it", "In person to a guide, any day they're ready. Some can be passed off at home with your video or log."],
  ["Pass or not yet", "No partial credit and no limit on retries. A “not yet” says exactly what to practice."],
  ["Rank up", "Every 4 credits is a milestone, celebrated at Honor Court. Some milestones bring a new rank."]
];

/* ---------- evidence: strength describes the study design and sample, not how much we like the finding ---------- */
export const EVIDENCE = [
  { s: "Strong", t: "Montessori, tested by lottery", what: "A national study entered 588 children in lotteries for seats at 24 public Montessori schools. By the end of kindergarten, those offered a seat at age 3 scored higher in reading, short-term memory, understanding others, and executive function.", limit: "This covers preschool through kindergarten. The research on Montessori in the elementary and middle years is much thinner.", src: ["Lillard et al., 2025, PNAS", "https://pmc.ncbi.nlm.nih.gov/articles/PMC12582262/"] },
  { s: "Strong", t: "Individual attention works", what: "A review of tutoring experiments in preK–12 found an average gain of 0.37 standard deviations. That's large by education standards.", limit: "It's about a fifth of the famous “two sigma” claim, which has never been independently replicated. Software and guides are our way of getting closer to one-on-one, and we check it with MAP tests.", src: ["Nickow, Oreopoulos & Quan, 2020, NBER", "https://www.nber.org/papers/w27476"] },
  { s: "Moderate", t: "AI tutors: design is everything", what: "A carefully designed AI tutor beat an active-learning class in a Harvard physics trial. In a high school trial, open access to a chatbot left students worse off once it was taken away.", limit: "Both studies are with older students than ours. It's why our students use programs built to teach, with a guide watching, not open chatbots.", src: ["Kestin et al., 2025, Scientific Reports", "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179260/"], src2: ["Bastani et al., 2025, PNAS", "https://papers.ssrn.com/abstract=4895486"] },
  { s: "Strong", t: "Choices and structure go together", what: "Across 94 studies, teachers who support autonomy also tend to give clear structure. The two aren't a trade-off.", limit: "In 8 studies they pulled apart, mostly where structure turned into control. That's the line we try to hold.", src: ["Patzak & Zhang, 2025, Educational Psychology Review", "https://link.springer.com/article/10.1007/s10648-025-09994-2"] },
  { s: "Strong", t: "Too much help backfires", what: "In a study of about 8,200 pupils in England and Wales, the more support children got from teaching assistants, the less progress they generally made, even after accounting for where they started.", limit: "The researchers blamed how the help was used, not the helpers. It's why our guides give hints before answers.", src: ["Blatchford et al., DISS project, UCL", "https://impact.ref.ac.uk/casestudies/CaseStudy.aspx?Id=44332"] },
  { s: "Moderate", t: "Risky outdoor play is good for kids", what: "A systematic review found mostly positive links between risky outdoor play and children's health, and recommended promoting it.", limit: "The studies underneath are mixed in quality, and none looked at tools or fire specifically.", src: ["Brussoni et al., 2015, IJERPH", "https://www.mdpi.com/1660-4601/12/6/6423"] }
];
export const UNKNOWN = [
  "Whether microschools like ours outperform other schools. Researchers at RAND found the data is too thin to say, for the whole sector.",
  "How our results hold up for every kind of child. A school that families choose attracts certain families, so we watch closely how children who arrive behind are doing.",
  "Which parts of our model matter most. We combine several things at once, so we can't separate their effects."
];
export const UNKNOWN_SRC = ["RAND, Microschools as an Emerging Education Model, 2025", "https://www.rand.org/pubs/research_reports/RRA3698-1.html"];

/* ---------- words we use ---------- */
export const WORDS = [
  ["Guide", "What we call our teachers. Guides coach, ask questions, notice, and hold the bar."],
  ["Field Guide", "The adult who knows your child as a whole person: feelings, friendships, behavior, motivation and life skills."],
  ["Academic Guide", "The adult who tracks your child's academic progress in detail and decides what they need next."],
  ["Morning Foundations", "The protected morning block for core academics. Often called “two-hour learning,” though in practice it runs longer."],
  ["Catch-up work", "Lessons left from a day's target. They wait on the dashboard until they're done."],
  ["Basecamp", "Wilderland's dashboards. Students track their work there, and parents can see progress and MAP data from home."],
  ["Blazes", "Credits students earn for academic work, worth 50 cents each, spent in the Camp Store."],
  ["Life Skill Lab", "A guide-led group experience that teaches a skill and ends with a quick test. The core of the afternoon."],
  ["Challenge", "One “I can” statement with a clear standard, like “I can hike 2 miles on a trail on my own feet.”"],
  ["Not yet", "What a child hears when they don't pass. It comes with exactly what was missing and how to practice. Retries are unlimited."],
  ["Credit", "One passed challenge from your grade band or higher."],
  ["Epic", "A bigger challenge built over several weeks, with checkpoints. Worth 2 credits."],
  ["Safety Gate", "A safety check a child passes before an activity, like a fire card before lighting a fire. Always checked at school."],
  ["Honor Court", "Where milestones are celebrated: a child is called up and the feat they're proudest of is named out loud."],
  ["Ranks", "Working names for milestones on each trail, like Fox and Badger in grades 2–4, or Tracker and Pathfinder in grades 5–8."],
  ["Home pass-off", "A challenge passed at home with a parent's video, log or witness note, held to the exact same standard as school."],
  ["Freedom Levels", "Privileges that go with how a student is handling themselves. They aren't rewards; they match responsibility."],
  ["Mentor mindset", "High standards and high support at the same time. From David Yeager's book 10 to 25."],
  ["Inclusive excellence", "The same high bar for every child, with support shaped to how each one learns."],
  ["Braided moments", "When nature and academics happen together: measuring a creek, writing about a track, counting seeds."],
  ["Bands", "Our grade groupings: K–1 on the lower campus, 2–4 and 5–8 on the upper campus."]
];

/* ---------- the Education Night packet, condensed ---------- */
export const REFRESHER = [
  ["Three promises", "Your child will love school, surprise everyone (starting with themselves), and be ready for real life, not just tests."],
  ["The day", "Mornings are protected for core academics: nearly three hours of Montessori work in K–1, about two and a half hours of focused app and materials work in grades 2–8. The rest of the day is for Life Skill Labs, challenges, projects and nature, nearly all of it outdoors."],
  ["Two kinds of guides", "Your child's Field Guide knows them as a whole person. Their Academic Guide tracks exactly where they are in each subject."],
  ["Growing responsibility", "K–1: “Let me discover.” 2–4: “Let me take ownership.” 5–8: “Let me design and lead.” The model moves from Montessori toward Alpha-style mastery as children grow."],
  ["Healthy risk", "Climbing, cold, tools and fire are part of growing up here. We separate healthy risk from unnecessary danger, teach the skills first, and use Safety Gates."]
];
