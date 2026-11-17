// Our Approach: content for the "why and how" half of the parent site.
// Sources: Parent Education Night Packet (Aug 2026), The Three Pillars (staff working draft v2, Sept 2026),
// Intentful Learner Ecosystem (Oct 2026), the Life Skills Challenges site (/challenges/), and the research linked below.
// Plain language for parents. Avoid em dashes in copy. Only teach what is settled practice; mark anything still evolving.

export const BANDS = { k1: "Grades K–1", g24: "Grades 2–4", g58: "Grades 5–8" };

/* ---------- three promises (from the Parent Education Night Packet) ---------- */
export const PROMISES = [
  { t: "Love school.", d: "School should be a place where your child belongs, is known, and has a say. Learning is something they take part in, not something done to them.",
    see: ["Your child talks about what they're working on, not just what they had to do.", "Mornings get easier, not harder, as the year goes on.", "They have opinions about school, including complaints. That means they feel it's theirs."] },
  { t: "Surprise everyone, starting with themselves.", d: "Individualized, mastery-based learning with a guide who knows your child lets students move faster than a class can. In grades 2–8 we aim for 2x academic growth with daily use. The bigger surprise is what a child decides they're capable of.",
    see: ["A skill that was “too hard” in September is ordinary by spring.", "They take on a challenge you wouldn't have picked for them, and finish it.", "Their growth on MAP tests over the year, which you can see in the Basecamp Parent Portal."] },
  { t: "Be ready for life, not just tests.", d: "Academics are part of it. We also want children who can manage themselves, work with others, solve problems, take responsibility and contribute.",
    see: ["They do real things on their own: pack the bag, order the food, fix the problem.", "They can tell you which Life Skills challenge they're working on and why.", "They handle a setback with a plan instead of a meltdown, more often than before."] }
];

/* ---------- three pillars: what happens when one is missing (from The Three Pillars) ---------- */
export const PILLARS = {
  S: { name: "High standards", short: "Standards", line: "A clear bar, set high, that a child clears by actually being able to do the thing.",
    here: ["Mastery before moving on. In the apps, a lesson isn't done until it's mastered.", "Life Skills challenges are pass or “not yet.” No partial credit, no “close enough.”", "Feedback is about the work, never about the child."] },
  U: { name: "High support", short: "Support", line: "Adults who know each child well and help in ways that build independence, not dependence.",
    here: ["Every child is known by at least one adult: what they're working on, avoiding, proud of, and finding hard.", "Help is asked for. Guides give hints before answers.", "Weekly one-on-one coaching with a Field Guide."] },
  A: { name: "High autonomy", short: "Autonomy", line: "Real choices about how, when and what, growing as a child shows they're ready.",
    here: ["Children set their own pace in the morning and move on when they've mastered something.", "They choose their own books, their own challenges and, in grades 5–8, their own projects.", "Freedoms are earned by showing you can handle them, and they grow with age."] }
};
// key = which pillars are on (letters in S,U,A order)
export const COMBOS = {
  SUA: { name: "Growth", tone: "M", what: "The bar is high, the help is real, and the work belongs to the child. This is what we're aiming for every day.", eg: "“This isn't there yet. I know you can get it. What's your plan, and what help do you want?”" },
  UA: { name: "Drift", tone: "P", what: "Warm, free and happy, with no clear bar. Self-starters do fine. Everyone else slowly falls behind and doesn't know it.", eg: "“Do whatever feels right today.”" },
  SA: { name: "Pressure", tone: "E", what: "A high bar and freedom, but no one in your corner. The kids who can't clear it alone quietly give up or leave.", eg: "“You chose this. Figure it out.”" },
  SU: { name: "Compliance", tone: "E", what: "High bar, lots of help, no ownership. It looks like learning until the adult leaves the room.", eg: "“Do it exactly my way and I'll walk you through every step.”" },
  S: { name: "The enforcer", tone: "E", what: "Rules and consequences without belief or help. Kids learn to avoid getting caught.", eg: "“Because I said so.”" },
  U: { name: "The rescuer", tone: "P", what: "Kind, close and always stepping in. The child learns that adults think they can't.", eg: "“Here, I'll just do it.”" },
  A: { name: "Left alone", tone: "A", what: "Freedom with no bar and no help. That's not autonomy. It's being on your own.", eg: "“Up to you.”" },
  "": { name: "Checked out", tone: "A", what: "No bar, no help, no say. Usually a sign the adults are running on empty.", eg: "“Whatever.”" }
};

/* ---------- a day (shape only; times are drop-off and pick-up windows from the parent handbook) ---------- */
export const DAY = {
  k1: { model: "Montessori", arrive: "Drop-off 8:30–8:45", leave: "Pick-up 3:00–3:15",
    blocks: [
      { k: "am", t: "Morning work cycle", len: "Close to 3 hours", d: "One long, uninterrupted Montessori work cycle. Children choose from hands-on materials in a prepared room, with guides giving short lessons one child or a few children at a time.", w: 3 },
      { k: "mid", t: "Lunch", len: "", d: "A break to eat and reset.", w: 0.8 },
      { k: "pm", t: "Afternoon", len: "", d: "Guide-led Life Skill Labs (at least two challenges a week), passion pursuits, and nature exploration, including the daily nature walk.", w: 2.7 }
    ] },
  up: { model: "Montessori-informed, with Alpha-style two-hour learning", arrive: "Drop-off 8:15–8:30", leave: "Pick-up 3:15–3:30",
    blocks: [
      { k: "am", t: "Morning Foundations", len: "About 2½ hours", d: "Protected core academics in focused segments of about 25 minutes each: math, reading, language foundations, science, and an elective such as creative writing, research skills, handwriting or social studies. Each child works at their own level in mastery-based apps, and a guide can see exactly where they are.", w: 2.5 },
      { k: "mid", t: "Lunch", len: "", d: "A break to eat and reset.", w: 0.8 },
      { k: "pm", t: "Life skills time", len: "", d: "Life Skill Labs, challenges, projects in grades 5–8, and nature exploration, including the daily nature walk. Nearly all of it outdoors.", w: 3.2 }
    ] }
};
export const OWN = [
  { b: "K–1", say: "“Let me discover.”", model: "Montessori", d: "A prepared environment, hands-on materials and following the child. Life Skills challenges are run by guides with the whole crew." },
  { b: "2–4", say: "“Let me take ownership.”", model: "Montessori-informed + Alpha", d: "A protected morning academic block with continued Montessori support. Students start choosing and tracking their own Life Skills challenges." },
  { b: "5–8", say: "“Let me design and lead.”", model: "Alpha + Montessori influence", d: "Protected morning blocks, Life Skill Labs, self-chosen challenges and long projects students plan and carry out themselves." }
];

/* ---------- mornings ---------- */
export const WHY_FASTER = [
  ["No passive listening or busywork", "No lecture to sit through, no waiting for the class, no worksheets that fill a day without moving a child forward."],
  ["Working at their own level", "Each child works toward mastery at the level they're actually at, not the pace of the group."],
  ["Help at the moment it's needed", "Programs that adjust, materials a child chooses, and a guide who can see exactly where each child is stuck."]
];
export const TOOLS = [
  { area: "Reading", k1: "Montessori language materials, phonics lessons and decodable books", up: "Amira (reading practice with an AI tutor that listens), Nessy for extra support, free reading of books they choose" },
  { area: "Math", k1: "Montessori math materials", up: "Synthesis Tutor and IXL; Math Academy from about 4th grade up" },
  { area: "Writing and grammar", k1: "Dictated stories, early writing", up: "IEW Structure and Style, Fix It! Grammar, Class Companion for feedback on writing" },
  { area: "Progress", k1: "Transparent Classroom (Montessori records)", up: "Basecamp dashboards, which you can see from home" }
];
export const MORNING_RULES = [
  ["Mastery, then move on", "A child moves forward when they've shown they know it, not when the calendar says so."],
  ["Hints before answers", "Guides ask “What have you tried?” first. Help is real, but the thinking stays with the child."],
  ["Explicit teaching still happens", "Choice covers pace and order. It doesn't cover whether a child gets taught. Every core subject has direct instruction built in."],
  ["Hands-on when it matters", "When a child is stuck on why something works, not just how, a guide brings out Montessori materials to build the concept."],
  ["Blazes", "Students earn Blazes, Wilderland's credits, for academic work, and spend them in the Camp Store."]
];

/* ---------- life skills (descriptions from the Parent Education Night Packet; challenges from /challenges/) ---------- */
export const SKILLS = [
  { k: "EN", n: "Energy", i: "zap", col: "#C2611F", d: "Sleep, movement, nutrition, recovery and body literacy: learning to read and respond to your own body's needs. A rested, nourished, active child can reach everything else.",
    ex: [["EN-03.1", "K–1", "I can hike 2 miles on a trail on my own feet."], ["EN-04.2", "2–4", "I can do 10 full push-ups with a straight body and hang from a bar for 30 seconds."], ["EN-03.3", "5–8", "I can summit a named peak near Ogden Valley on my own feet (5+ miles round trip, 1,500+ feet of climbing), carrying my own pack."]] },
  { k: "SG", n: "Self-Governance", i: "crown", col: "#2F5D8A", d: "Directing yourself: starting without being told, setting goals, handling emotions, and thinking for yourself rather than following the crowd. It's what a self-directed model rests on.",
    ex: [["SG-06.1", "K–1", "I can put on all my snow gear by myself in 5 minutes or less."], ["SG-06.2", "2–4", "I can pack my own school bag every day for a school week (lunch, water, layers) with nothing missing."], ["SG-02.3", "5–8", "I can lead my own 20-minute student-led conference: show my parents and guide 3 strengths and 1 growth edge, each with a work sample, and 2 goals with a number or a date."]] },
  { k: "CG", n: "Character & Grit", i: "mountain", col: "#9C3F2A", d: "Doing the right thing, especially when no one is watching, and staying with something past the point where it stops being fun.",
    ex: [["CG-06.4", "K–1", "I can stay out for a whole 45-minute outdoor Lab in cold, wind, rain or snow, dressed for it, without asking to go inside."], ["CG-04.2", "2–4", "I can complete a 30-day challenge I choose (daily push-ups, an instrument, a drawing a day) with no more than 2 missed days, proof from every day, and a measured improvement from day 1 to day 30."], ["CG-04.3", "5–8", "I can complete a 2-night backpacking or canoe trip carrying my own share and doing my camp jobs, rain or shine."]] },
  { k: "AI", n: "Adaptability & Ingenuity", i: "puzzle", col: "#1C6F6A", d: "Critical, creative and systems thinking, learning how to learn, and changing course when circumstances change.",
    ex: [["AI-03.1", "K–1", "I can come up with 10 uses for a stick in 3 minutes, then build one of them and show it working."], ["AI-05.5", "2–4", "I can assemble a small flat-pack furniture item (like an IKEA step stool) with one partner from the picture instructions in under 45 minutes, with no leftover parts and nothing wobbly."], ["AI-01.2", "5–8", "I can spot the scam in 8 of 10 real-looking messages (fake prizes, phishing texts)."]] },
  { k: "VC", n: "Value Creation", i: "coins", col: "#8A6418", d: "Noticing what needs doing and building something useful, including early entrepreneurship, then using it to serve something bigger than yourself.",
    ex: [["VC-03.1", "K–1", "I can sell something I made at a class market and count out the right change."], ["VC-03.6", "2–4", "I can get a paying customer outside my family for a service (shoveling a walk, raking leaves, walking a dog), agree on the job and price before I start, do it, and get a note saying they'd hire me again."], ["VC-02.3", "5–8", "I can build something for a real client outside school (a sign, a shelf, a website) that they sign off on and use."]] },
  { k: "SP", n: "Storytelling & Speaking", i: "mic", col: "#6E4382", d: "Communicating clearly, understanding your audience, and making a message land. One of the highest-leverage skills for real life.",
    ex: [["SP-06.1", "K–1", "I can greet a visitor with my name, eye contact and a handshake."], ["SP-02.2", "2–4", "I can tell a true story from my life in under 3 minutes, with a problem, a turning point and a moment of reflection on what it meant, without notes."], ["SP-02.4", "5–8", "I can tell a 5-minute true story at a public story night for 30 or more people."]] },
  { k: "FE", n: "Fellowship", i: "users", col: "#A04660", d: "Empathy, kindness and belonging, paired with backbone: standing up for others, holding boundaries, and repairing things after a conflict.",
    ex: [["FE-14.1", "K–1", "I can use my Stop Power in 3 practice scenes: hand up, strong voice, “Stop, I don't like that,” then walk to a grown-up."], ["FE-07.2", "2–4", "I can welcome a new student: show them around and introduce them to 3 kids."], ["FE-02.2", "5–8", "I can interview someone very different from me (in age, culture or ability) and present their view so accurately that they say it's fair."]] },
  { k: "NL", n: "Nature & Living Systems", i: "trees", col: "#356B33", d: "Understanding and caring for the natural world, and seeing that we're part of nested living systems, so what we do ripples outward.",
    ex: [["NL-03.1", "K–1", "I can name 5 common birds by sight (like a robin, magpie and chickadee)."], ["NL-04.1", "2–4", "I can identify 8 animal tracks from our area in snow or mud."], ["NL-01.5", "5–8", "I can name 40 local plants in the field, including 5 in winter by bark and buds alone."]] }
];
export const CHALLENGE_STEPS = [
  ["Pick", "Your child chooses a challenge and tells their Field Guide the plan."],
  ["Practice", "Life Skill Labs, the “Where to learn” links, coaching and lots of tries."],
  ["Show it", "In person to a guide, any day they're ready. Some can be passed off at home with your video or log."],
  ["Pass or not yet", "No partial credit and no limit on retries. A “not yet” says exactly what to practice."],
  ["Rank up", "Every 4 credits is a milestone, celebrated at Honor Court. Some milestones bring a new rank."]
];

/* ---------- nature and healthy risk ---------- */
export const RISK = {
  quote: "We distinguish between healthy risk and unnecessary danger. Our goal is not to put children in danger. Our goal is to help children become capable of navigating the world.",
  healthy: ["Physical: climbing, balancing, cold and wet weather, a long hike", "Social: speaking to a visitor, joining a new group, standing up for someone", "Intellectual: trying a hard problem in front of others and getting it wrong", "Tools and fire, only after passing a Safety Gate"],
  guard: ["Guides set clear boundaries and teach the skills first.", "Safety Gates: a check a child must pass before an activity, like a fire card before lighting a fire. Gates are always checked by a guide or certified instructor, never at home.", "Freedoms grow with age and with what a child has shown they can handle."]
};
export const BRAIDED = ["Reading", "Writing", "Math", "Science", "Observation"];

/* ---------- the adults ---------- */
export const GUIDES = {
  field: { t: "Field Guide", role: "The coach", d: "Knows the whole child. Their work is to see and support the child as a person.", list: ["Emotional regulation", "Belonging and safety", "Social development", "Behavior and conflict", "Motivation", "Executive function", "Life skills", "Weekly one-on-one coaching"] },
  acad: { t: "Academic Guide", role: "The mastery specialist", d: "Watches the academic picture closely and tracks the details of each child's learning.", list: ["Assessment data", "Progress monitoring", "Individual skill gaps", "Mastery and pacing", "Interventions", "What a child needs next"] }
};
export const MINDSET = [
  ["E", "Enforcer", "High standards, low support", "“Because I said so.”"],
  ["P", "Protector", "Low standards, high support", "“Here, I'll just do it.”"],
  ["M", "Mentor", "High standards, high support", "“The bar stays high. I know you can reach it, and I'll help.”"]
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
  ["Field Guide", "The adult who knows your child as a whole person: feelings, friendships, behavior, motivation and life skills. Your first call for most things."],
  ["Academic Guide", "The adult who tracks your child's academic progress in detail and decides what they need next."],
  ["Morning Foundations", "The protected morning block for core academics. Often called “two-hour learning,” though in practice it runs longer."],
  ["Mastery", "Showing you can really do something before moving on, instead of moving on because the class did."],
  ["Basecamp", "Wilderland's dashboards. Students track their work there, and parents can see app progress from home."],
  ["Blazes", "Credits students earn for academic work, worth 50 cents each, spent in the Camp Store."],
  ["Life Skills", "The eight areas we build beyond academics, from Energy to Nature & Living Systems."],
  ["Life Skill Lab", "A guide-led group experience that teaches a skill and ends with a quick test. The core of the afternoon."],
  ["Challenge", "One “I can” statement with a clear standard, like “I can hike 2 miles on a trail on my own feet.”"],
  ["Not yet", "What a child hears when they don't pass. It comes with exactly what was missing and how to practice. Retries are unlimited."],
  ["Credit", "One passed challenge from your grade band or higher."],
  ["Epic", "A bigger challenge built over several weeks, with checkpoints. Worth 2 credits."],
  ["Safety Gate", "A safety check a child passes before an activity, like a fire card before lighting a fire."],
  ["Honor Court", "Where milestones are celebrated: a child is called up and the feat they're proudest of is named out loud."],
  ["Ranks", "Working names for milestones on each trail, like Fox and Badger in grades 2–4, or Tracker and Pathfinder in grades 5–8."],
  ["Home pass-off", "A challenge passed at home with a parent's video, log or witness note, held to the exact same standard as school."],
  ["Passion pursuits", "Student-driven exploration of something a child cares about. Especially central in K–1."],
  ["Projects", "Longer student-owned work: planning, research, building, problem-solving. Begins in grades 5–8."],
  ["Braided moments", "When nature and academics happen together: measuring a creek, writing about a track, counting seeds."],
  ["Mentor mindset", "High standards and high support at the same time. From David Yeager's book 10 to 25."],
  ["Bands", "Our grade groupings: K–1 on the lower campus, 2–4 and 5–8 on the upper campus."]
];

/* ---------- go deeper ---------- */
// size: 5 = five minutes, 30 = about half an hour, wk = a weekend (a book). Books: look for them at the Weber County Library or on Libby.
export const DEEPER = [
  { size: "5", topic: "support", t: "How to raise successful kids without over-parenting", who: "Julie Lythcott-Haims, TED talk", why: "Why doing less for our kids often helps them more.", href: "https://www.ted.com/talks/julie_lythcott_haims_how_to_raise_successful_kids_without_over_parenting" },
  { size: "5", topic: "nature", t: "Outside Play", who: "Dr. Mariana Brussoni's lab, University of British Columbia", why: "A short, free tool that helps parents get comfortable with outdoor risky play.", href: "https://www.outsideplay.org/" },
  { size: "30", topic: "mentor", t: "What a mentorship mindset can do for student motivation", who: "David Yeager on the Class Disrupted podcast", why: "The idea behind how our guides talk to kids, in the researcher's own words.", href: "https://www.the74million.org/article/podcast-what-a-mentorship-mindset-can-do-for-student-motivation/" },
  { size: "30", topic: "reading", t: "Sold a Story, Season 2: It's Not Just Reading", who: "Emily Hanford, APM Reports (Oct 2026)", why: "What happens when teaching is built on how children actually learn.", href: "https://hechingerreport.org/sold-a-story-its-not-just-reading/" },
  { size: "30", topic: "support", t: "How to parent angry and explosive children", who: "Dr. Ross Greene on Tilt Parenting", why: "“Kids do well if they can.” The thinking behind how we handle hard behavior.", href: "https://tiltparenting.com/session81" },
  { size: "30", topic: "nature", t: "Decline in independent activity as a cause of decline in children's mental well-being", who: "Gray, Lancy & Bjorklund, Journal of Pediatrics (2023)", why: "The case that kids need more independence, not less. An argument, not a trial.", href: "https://www.petergray.org/_files/ugd/b4b4f9_eb922e47312e43cf94b8ba5923e9993b.pdf" },
  { size: "30", topic: "learning", t: "Future of Education podcast", who: "MacKenzie Price, co-founder of Alpha School", why: "Short episodes on the two-hour learning model our mornings are built on. Wilderland blends it with Montessori and nature, so not all of it applies as is.", href: "https://podcasts.apple.com/us/podcast/future-of-education-podcast/id1673109764" },
  { size: "30", topic: "learning", t: "Alpha School, with MacKenzie Price", who: "The Report Card with Nat Malkus (Dec 2025)", why: "A more skeptical interviewer asking hard questions about the model.", href: "https://pocketcasts.com/podcast/the-report-card-with-nat-malkus/d6aa06d0-9792-0139-c11f-0acc26574db2/alpha-school-with-mackenzie-price/276b75a1-99fa-4150-a92b-01c5a67d3791" },
  { size: "wk", topic: "learning", t: "The Montessori Child", who: "Simone Davies & Junnifa Uzodike (2024)", why: "A practical start on Montessori for ages 3–12, at home and at school.", href: "https://themontessorinotebook.com/the-montessori-child" },
  { size: "wk", topic: "mentor", t: "10 to 25", who: "David Yeager (2024)", why: "Our guides' handbook for holding a high bar while making kids feel respected." },
  { size: "wk", topic: "learning", t: "Make It Stick", who: "Brown, Roediger & McDaniel (2014)", why: "Why real learning often feels harder, and why that's a good sign." },
  { size: "wk", topic: "support", t: "Hunt, Gather, Parent", who: "Michaeleen Doucleff (2021)", why: "How families around the world raise capable, helpful kids by including them in real work." },
  { size: "wk", topic: "nature", t: "The Anxious Generation", who: "Jonathan Haidt (2024)", why: "Why play-based, phone-light childhoods matter.", href: "https://www.anxiousgeneration.com/" },
  { size: "wk", topic: "learning", t: "The Math Academy Way", who: "Justin Skycak (free online)", why: "How the math program many of our students use is designed to teach.", href: "https://www.justinmath.com/books" },
  { size: "wk", topic: "support", t: "Raising Human Beings", who: "Ross Greene (2016)", why: "Solving problems with your child instead of to them." }
];
export const TOPICS = { all: "All", mentor: "Mentor mindset", learning: "How learning works", reading: "Reading", support: "Helping less", nature: "Nature and risk" };
export const SIZES = { all: "Any length", "5": "5 minutes", "30": "Half an hour", wk: "A weekend" };
