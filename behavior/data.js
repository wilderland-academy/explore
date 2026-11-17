// Wilderland Behavior Guide (staff): content.
// This is the living document. Edit text here; app.js only lays it out.
// Sources: Wilderland Behavior Policy (Notion, Aug 2025), Community Accountability System, Guide Reference Edition
// (Aug 2026), Revised Freedom Level Proposal 2026-27, How Wilderland Supports Neurodivergent Children (Notion),
// #student-behavior and operational-meeting Slack threads, and the research listed in REFS.
// Scenarios are composites. Names and identifying details are removed on purpose. Keep it that way.

export const VERSION = { n: "0.1", date: "2026-11-17", note: "First edition, built from the 2026-27 Accountability System, the Freedom Level proposal, the 2025 Behavior Policy and the neurodiversity plan." };

/* ------------------------------------------------------------------ */
/* Research the site leans on. Every card that cites research points here by id. */
/* strength: strong = several trials or a meta-analysis; moderate = one good trial; mixed = trials disagree; thin = theory, small or descriptive studies */
export const REFS = {
  cps: { t: "Collaborative & Proactive Solutions vs. parent training", s: "moderate", f: "In a randomized trial with 134 youth aged 7 to 14 who met criteria for oppositional defiant disorder, CPS did about as well as Parent Management Training, the established treatment, and both beat a waitlist.", c: "Clinic and family setting, not schools. Some authors receive royalties from CPS. A 2023 community trial in Australia found the same pattern.", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4564364" },
  rp: { t: "Restorative practices in Pittsburgh (RAND randomized trial)", s: "mixed", f: "Across 44 schools, restorative practices cut suspensions and improved teacher-rated climate in elementary grades. Middle schoolers did not benefit, students reported worse classroom management, and academics did not improve.", c: "A whole-school program run by a large district. Our scale and staffing are very different.", u: "https://www.rand.org/pubs/research_reports/RR2840.html" },
  ncaep: { t: "Evidence-based practices for autistic children (NCAEP 2020)", s: "strong", f: "A review of 972 studies named 28 practices with evidence, including antecedent-based intervention, visual supports, self-management, social narratives, peer-based instruction, exercise and movement, functional behavior assessment, and reinforcement.", c: "Critics say inclusion rules were loose and many studies were small single-case designs. Treat the list as a menu, not a guarantee.", u: "https://ncaep.fpg.unc.edu/wp-content/uploads/EBP-Report-2020.pdf" },
  cstag: { t: "Comprehensive School Threat Assessment Guidelines (Cornell)", s: "moderate", f: "Most student threats are transient: anger, jokes, or bravado with no intent to harm. In large samples about 75 to 80 percent of cases are transient and under 10 percent are very serious. Sorting transient from substantive threats avoids both overreaction and underreaction.", c: "Built for public schools with a trained multi-disciplinary team. We do not have one, so serious cases go to leadership and outside professionals.", u: "https://education.virginia.edu/documents/yvpcomprehensive-school-threat-assessment-guidelines-overviewpaper2020-05-26pdf" },
  dep: { t: "The double empathy problem (Crompton et al., 2020)", s: "moderate", f: "In a telephone-style chain, autistic people passed a story to each other as well as non-autistic people did. Information broke down fastest in mixed chains. Misunderstanding runs both ways.", c: "Adults, a lab task, modest samples. A 2025 registered report extended the finding.", u: "https://doi.org/10.1177/1362361320919286" },
  bully: { t: "Bullying of autistic students (Maïano et al., 2016)", s: "strong", f: "Pooling 17 studies, about 44 percent of autistic youth were bullied at school, mostly verbally, a higher risk than their peers.", c: "Prevalence varies a lot by who reports it: student, parent or teacher.", u: "https://pubmed.ncbi.nlm.nih.gov/26451871/" },
  mask: { t: "Masking and camouflaging (Cook et al., 2021)", s: "moderate", f: "Across 29 studies, autistic people who report more camouflaging (forcing eye contact, scripting, copying peers) report worse mental health, including anxiety, depression and exhaustion. Girls camouflage more and are diagnosed later.", c: "Mostly cross-sectional adult data, so cause and effect are unclear.", u: "https://discovery-pp.ucl.ac.uk/id/eprint/10134806" },
  adhdemo: { t: "Emotion dysregulation in ADHD (Shaw et al., 2014)", s: "strong", f: "Big emotions, fast mood swings and irritability are common in ADHD across the lifespan and drive much of the impairment. One population study found mood lability in 38 percent of children with ADHD, about ten times the general rate.", c: "Researchers still debate whether this is part of ADHD or a separate trait that often travels with it.", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4282137" },
  move: { t: "Exercise and ADHD (meta-analyses)", s: "moderate", f: "Aerobic exercise showed moderate to large effects on attention and executive function in children with ADHD in a 2015 meta-analysis of randomized trials; later reviews agree on direction, with smaller sizes.", c: "Small trials and varied programs. More is not automatically better; intensity and regularity matter.", u: "https://pubmed.ncbi.nlm.nih.gov/25988743/" },
  praise: { t: "Praise-to-reprimand ratio (Caldarella et al., 2020)", s: "moderate", f: "In 151 elementary classrooms, the more teachers praised behavior relative to reprimanding it, the more students stayed on task, with up to 20 to 30 percent more focus in the highest-ratio classrooms. There was no magic tipping point.", c: "Correlational analysis inside a larger trial; praise here meant specific, behavior-focused praise.", u: "https://www.tandfonline.com/doi/full/10.1080/01443410.2020.1711872" },
  wise: { t: "Wise feedback (Yeager et al., 2014)", s: "moderate", f: "Seventh graders who got the note “I'm giving you these comments because I have very high expectations and I know that you can reach them” revised their essays far more often, with the biggest gains among students who trusted school least.", c: "Effects depend on real critique and help following the words. Repeated as a slogan it goes hollow.", u: "https://sparq.stanford.edu/solutions/wise-critiques-help-students-succeed" },
  rewards: { t: "Rewards and intrinsic motivation (Deci, Koestner & Ryan, 1999)", s: "strong", f: "Across 128 experiments, expected tangible rewards lowered free-choice interest, more so for children than college students. Informative positive feedback raised it.", c: "Rewards for dull tasks or brand-new skills behave differently; this is about activities that could be interesting on their own.", u: "https://pubmed.ncbi.nlm.nih.gov/10589297/" },
  mind: { t: "School mindfulness (MYRIAD trial, 2022)", s: "strong", f: "In 84 schools and 8,376 students aged 11 to 13, a well-run mindfulness curriculum was no better than ordinary social-emotional teaching for wellbeing or depression risk. Teachers reported a slightly better climate that faded.", c: "A classroom curriculum. Brief, chosen calming practice for one student is a different use.", u: "https://myriadproject.org/?p=4754" },
  trauma: { t: "Trauma-informed schools (Campbell review, 2019)", s: "thin", f: "A systematic search found no study rigorous enough to show that school-wide trauma-informed approaches improve behavior, mental health or learning.", c: "No evidence of benefit is not evidence of harm. It means we should name what we do concretely and watch whether it works.", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8356508" },
  antibully: { t: "Anti-bullying programs (Gaffney, Ttofi & Farrington)", s: "strong", f: "School programs cut bullying by about 19 to 20 percent and victimization by about 15 to 16 percent on average. Whole-school policy and adult supervision are among the parts linked to larger effects.", c: "Average effects; many programs were large and multi-part.", u: "https://www.repository.cam.ac.uk/handle/1810/316770" },
  handicap: { t: "Self-handicapping (Urdan & Midgley; Schwinger et al., 2021)", s: "strong", f: "Students who fear looking incapable often withdraw effort so a poor result can be blamed on not trying. It is linked to fear of failure, low self-esteem and classrooms that make ability public.", c: "Mostly correlational. The useful takeaway is to lower the public stakes of trying.", u: "https://deepblue.lib.umich.edu/items/768c742d-d37f-465a-93c6-4fa9babdf1f2" },
  ruler: { t: "RULER emotional literacy (Rivers et al., 2013)", s: "moderate", f: "In a randomized trial, RULER classrooms showed more warmth, more regard for student perspectives and better emotional support than comparison classrooms.", c: "Measures were classroom climate, not individual behavior incidents.", u: "https://plataformadeevidencias.iadb.org/en/casos-avaliados/ruler-approach" },
  rc: { t: "Responsive Classroom and class meetings (Rimm-Kaufman et al., 2014)", s: "mixed", f: "In a 24-school randomized trial, simply being assigned to Responsive Classroom did not raise achievement. Teachers who actually used the practices, including morning meetings and academic choice, saw gains.", c: "Fidelity mattered more than the label. Same lesson applies to our town halls.", u: "https://www.aera.net/Newsroom/Recent-AERA-Research/Efficacy-of-the-Responsive-Classroom-Approach-Results-From-a-3-Year-Longitudinal-Randomized-Controlled-Trial" },
  suspend: { t: "What time away from school does", s: "mixed", f: "A reform that limited K-2 out-of-school suspension cut suspensions by more than half with no harm to test scores, and gains for high-risk students. A New York City study found middle schoolers sent out of school, or for longer, misbehaved more later.", c: "Other studies find null effects. Causation is hard to pin down. Our send-home is short and tied to a repair plan, which these studies did not test.", u: "https://edworkingpapers.com/sites/default/files/ai24-590.pdf" },
  levels: { t: "Level systems in behavior programs", s: "thin", f: "Point and level systems are common in special education, but rigorous evidence for long-term behavior change is thin. One 2020 single-case study found a level system reduced disruption in the short term.", c: "Our Freedom Levels differ: no points, separate domains, weekly review, private delivery. Still, watch for the known failure modes: kids who stall at the bottom and stop trying.", u: "https://escholarship.org/uc/item/6n5849cs" },
  townhall: { t: "Student-run town halls (Alpha School account, 2026)", s: "thin", f: "Fourth and fifth graders who wrote and voted on their own rules raised their own academic minimum above the adults' private target, and lifted a slang ban once they had shown they could self-limit. The ideal is about 95 percent student talk.", c: "Anecdotes from a school network's own newsletter. No outcome data or comparison group.", u: "https://futureofeducation.substack.com/p/what-happens-when-you-let-kids-choose" }
};

/* ------------------------------------------------------------------ */
/* The two kinds of practice. */
export const KINDS = {
  standard: { name: "Standard", say: "Everyone does it the same way, every time. Students and families should get the same answer from any guide." },
  toolkit: { name: "Toolkit", say: "Your judgment. Use what fits the child and the moment. Write down what you tried." }
};

/* ------------------------------------------------------------------ */
/* STANDARDS: what every guide does the same way. */
export const STANDARDS = [
  { id: "conduct", icon: "📜", name: "Code of Conduct and the seven principles", short: "Students write the rules each fall; the principles hang on the wall.",
    rules: ["At the start of each year, guides lead a class conversation where students propose the rules, make the poster and sign it.", "The seven principles are the shared language for every conversation about behavior: Show Respect, Take Accountability, Work Hard, Stay Humble, Be a Peacemaker, Prepare Yourself, Be Grateful.", "Name the principle, not the child's character. “That wasn't Peacemaker” works. “You're mean” doesn't."],
    nd: "Some autistic students follow written rules more faithfully than anyone else in the room, and get hurt when others don't. Keep the poster literal and specific, and point to it instead of hinting.",
    src: "Behavior Policy 2025" },
  { id: "tiers", icon: "🪜", name: "Tiers 0 to 3, sorted by impact", short: "Ask what happened and what it did to someone, not whether the child meant it.",
    rules: ["Tier placement is based on impact first. Intent, developmental ability and past support shape the response, not the tier.", "Use the exact counts on the Tier Ladder. They replace every “repeatedly” and “multiple times.”", "Escalation follows pattern and impact, not a pile of punishments."],
    nd: "Tier 0 exists for exactly this: behaviors a child is still learning to regulate (tapping, blurting, pacing, narrating). We coach those. We do not discipline them.",
    src: "Accountability System 2026-27", link: "tiers" },
  { id: "ocs", icon: "⏰", name: "A protected Open Coaching Session every morning", short: "Leave room in your day for the conflicts that will come.",
    rules: ["Every guide keeps an Open Coaching Session in the morning schedule.", "Don't fill it with prep or admin. It's for Peace Talk assessments, facilitated Peace Talks, conflicts and regulation support.", "The guide decides whether and when a Peace Talk happens. Students don't negotiate times with each other."],
    nd: "Students who need longer to process can't do repair at a sprint. A protected block lets a slow thinker answer at their own pace.",
    src: "Accountability System 2026-27" },
  { id: "peace", icon: "🪨", name: "Peace Talks", short: "Student-led when it's safe, guide-supported when it isn't.",
    rules: ["Path 1, student-led: approach calmly with the Peace Object, agree on a time, wear the peace lanyards, follow the script.", "Path 2, guide-supported: the student asks for help; the guide first decides whether a Peace Talk is warranted or whether coaching fits better.", "A guide-supported Peace Talk gets at least 20 protected minutes, with the guide present as a neutral mediator.", "Script: I-statement, listen and reflect, own your part, agree on a repair, close with “Peace is restored.”", "A Peace Talk is never the right tool for physical aggression, threats, repeated harassment or a big power imbalance."],
    nd: "Eye contact is optional. Let a student write their I-statement first, hold the Peace Object to know whose turn it is, or walk side by side while they talk. A student who can't name a feeling yet can point to one.",
    src: "Accountability System 2026-27" },
  { id: "restore", icon: "🔴", name: "Tier 2: red card and SMART Restore", short: "Care for the harmed student first. The restore becomes the next work.",
    rules: ["Deliver the red card right away.", "Care for the harmed student first: safety, feelings, dignity.", "Give the student time to calm down, pointing to their Personal Fire Drill plan if they have one.", "Once calm, the student builds a SMART Restore, matched to the community's agreed restorative actions for that kind of harm.", "The SMART Restore is the student's next work. Normal activities wait until the Field Guide signs it off. It's due by the end of the following school day.", "Record the incident and discuss it at the next coaching meeting.", "Two Tier 2 incidents in one school week: email parents with the incident reports."],
    nd: "Calm means calm. A dysregulated brain can't plan a repair. Some autistic students need hours, not minutes, and may need the repair options shown as a short written menu.",
    src: "Accountability System 2026-27" },
  { id: "sendhome", icon: "🏠", name: "Tier 3: send-home and the way back", short: "Immediate safety, a call home, a conversation before return, a repair plan on return.",
    rules: ["Safety first: protect the harmed student and the group.", "The student is sent home right away. It is not a suspension and never framed as one. It's time to decompress away from what set things off.", "The guide emails an incident report to the parents.", "A parent-guide conversation is required before the student returns.", "Everyone involved agrees on a plan for repair before return, and the student delivers it on return.", "The student's own Field Guide owns the return conversation, even if a substitute handled the incident."],
    nd: "The way back matters more than the way out. Return with a predictable script: who will meet them at the door, where they'll sit, what the first ten minutes look like. Surprise re-entry undoes the reset.",
    src: "Accountability System 2026-27; Behavior Policy 2025", open: "latetier3" },
  { id: "parents", icon: "📨", name: "When families hear from us", short: "The same thresholds for every family.",
    rules: ["Yellow card (third Tier 1 in a day): text home.", "Same Tier 1 behavior on 3 or more days in a school week: the guide may call a parent meeting.", "Two Tier 2 incidents in one school week: email with all the incident reports.", "Tier 3: incident report email, then a parent-guide conversation before return.", "Never name other children to a family. Describe what happened around their child without identifying anyone else."],
    nd: "Families of neurodivergent children often hear only bad news from school. Pair every notice with one specific thing their child did well that week.",
    src: "Accountability System 2026-27; Parent Concern Protocol" },
  { id: "freedom", icon: "🧭", name: "Freedom Levels", short: "Four separate domains, weekly review, one rung at a time, delivered privately.",
    rules: ["Every student starts at Level 3 in each of the four domains: Academic Block, Nature Walk, Table, Field Block.", "Review weekly. Look for the week's pattern, not one moment.", "Move one rung at a time and tie the change to the domain's criteria.", "Share levels privately at the one-on-one. Never post a ranking or announce levels to the group.", "Nature Walk Level 4 (carrying hatchet, knife or saw) must be confirmed by a second guide.", "Level 5 is earned automatically when all four domains are at Level 4."],
    nd: "Before stepping a child down, ask: can't or won't? If the barrier is a skill or a sensory load, change the support first. Keep the standard; change the route.",
    src: "Freedom Level Proposal 2026-27", link: "freedom" },
  { id: "safety", icon: "🚨", name: "Threats and crises go up, not around", short: "Some moments are beyond coaching.",
    rules: ["Treat any threat of serious violence, including sexual violence or weapons, as Tier 3 until leadership has assessed it. Send home, document the exact words, and tell leadership the same day.", "If a student talks or writes about hurting themselves, wanting to die, or being harmed by someone, stop coaching and follow the Mental Health Crisis Policy now.", "Don't promise a child secrecy about safety."],
    nd: "Some neurodivergent children repeat shocking phrases they heard without grasping their weight. That changes how you teach afterward. It doesn't change the first steps.",
    src: "Accountability System 2026-27; Mental Health Crisis Policy", research: ["cstag"] },
  { id: "townhall", icon: "🏛️", name: "Town Halls", short: "For the whole community's problems, run by students.",
    rules: ["Town Halls handle system-level and group concerns, not individual discipline. The old student judicial system is archived this year.", "Students submit agenda items through the Suggestion Box. Guides review them on the Town Hall page of this site.", "If 3 or more concerns about the same student arrive, the guide and class president may convene a restorative Town Hall. Its purpose is to name the impact and repair it, never to shame.", "Aim for students doing about 95 percent of the talking."],
    nd: "Public discussion of one child's behavior lands hardest on socially sensitive and neurodivergent students. Peer judgment can trigger more shame than adult correction.",
    src: "Accountability System 2026-27", open: "townhallnames", research: ["townhall", "rc"], link: "townhall" },
  { id: "record", icon: "🗂️", name: "Write it down", short: "Patterns are invisible without records.",
    rules: ["Document every Tier 2 and Tier 3, and any repeated Tier 1, the same day.", "Record what you saw and heard, word for word where it matters. Leave out labels and guesses about motive.", "Use Behavior Claude to draft incident reports and parent emails, then read and edit before sending."],
    nd: "Records help you spot triggers: time of day, transitions, noise, hunger, a certain peer. That's antecedent data, the first step in most evidence-based plans.",
    src: "Accountability System 2026-27", open: "logging", research: ["ncaep"] },
  { id: "norewards", icon: "🌱", name: "No prizes for behavior", short: "We skip sticker charts and prizes for behavior. We give specific feedback and gratitude.",
    rules: ["Don't trade prizes, points or treats for good behavior.", "Do notice it out loud, specifically: what they did and why it mattered.", "Thank instead of praising the person: “Thanks for giving up your seat for her” beats “Good boy.”"],
    nd: "Some autistic and ADHD students rely on clear, immediate feedback more than peers do. No prizes doesn't mean no feedback. Make your notice frequent and concrete.",
    src: "Behavior Policy 2025", open: "rewards", research: ["rewards", "praise"] }
];

/* ------------------------------------------------------------------ */
/* TIERS, with exact counts from the Guide Reference Edition. */
export const TIERS = [
  { n: 0, name: "Self-regulation", color: "t0", q: "Is this something the student is still learning to regulate, and is it not causing meaningful harm?",
    voice: "“I am still learning how to regulate myself.”",
    examples: ["Burping, hiccups, involuntary noises", "Tapping, drumming, humming, singing", "Talking out loud to oneself or narrating work", "Fidgeting, pacing, getting up often", "Blurting answers, trouble waiting to speak", "Forgetting routines, needing volume reminders", "Standing too close, when it isn't aggressive", "Repetitive sensory behaviors"],
    response: ["Patience, kindness, gentle reminders, coaching.", "Address it in the coaching meeting.", "A peer who is genuinely affected may start a Peace Talk."],
    escalate: "After 2 reminders or coaching attempts on the same behavior in one day, if it continues and is affecting another student, it becomes Tier 1.",
    nd: "Most of the Tier 0 list is a description of ADHD and autism. The tier is a promise: we won't punish wiring. Change the environment first (seat, fidget, movement break, headphones) before you count reminders." },
  { n: 1, name: "Disruption", color: "t1", q: "Did it interfere with someone's ability to learn, work, or keep their space, without significant harm?",
    voice: "“My behavior is interfering with another person's ability to learn or work.”",
    examples: ["Interrupting or repeatedly talking to someone who's working", "Touching, moving or hiding someone's materials", "Messing with someone's computer", "Laughing at someone's work, minor teasing", "Talking over others", "Continuing after being asked to stop"],
    response: ["1st in a day: reminder of the Code of Conduct expectation.", "2nd in a day: move closer to the guide, lose seating preference.", "3rd in a day: yellow card and a text home.", "2 or more Tier 1s against the same student in a day: Peace Talk (with the peace stone) and an act of kindness for that student before scheduled work resumes."],
    escalate: "Same Tier 1 behavior on 3 or more days in a school week: the guide may call a parent meeting. Becomes Tier 2 only after both a yellow card and a Peace Talk have been used and the impact turns into actual harm.",
    nd: "Proximity is support, not banishment. Say it that way: “Sit by me so I can help you catch it sooner.” For a student with ADHD, a reminder that arrives before the moment (precorrection) works better than one after." },
  { n: 2, name: "Harm", color: "t2", q: "Did it actually cause physical, emotional, social or property harm, or seriously cross someone's boundary?",
    voice: "“My behavior has caused actual harm or seriously violated someone's boundaries.”",
    examples: ["Pushing, tripping, shoving, grabbing, blocking someone", "Humiliating, insulting, mocking someone's family or appearance", "Deliberately excluding someone in a way that causes real social harm", "Spreading rumors, sharing embarrassing information", "Taking belongings and refusing to return them, damaging property", "Following someone who has asked for space", "Serious threatening language that isn't an immediate danger"],
    response: ["Red card right away.", "Harmed student cared for first.", "Calm down, then build a SMART Restore matched to the community's agreed actions.", "Restore is the next work; signed off by the Field Guide by end of the next school day.", "Record it; discuss at the next coaching meeting.", "2 Tier 2s in a school week: email parents with the reports."],
    escalate: "Becomes Tier 3 when it presents an immediate or serious threat to safety, dignity or wellbeing.",
    nd: "Exclusion that looks like quiet friendship politics to adults can be devastating to a student who already struggles to read the group. Take reports of it seriously even when you haven't seen it yourself." },
  { n: 3, name: "Serious harm", color: "t3", q: "Does it present an immediate or serious threat to safety, dignity or wellbeing?",
    voice: "“My behavior presents an immediate or serious threat to someone's safety, dignity, or well-being.”",
    examples: ["Punching, kicking with force, choking, fighting", "Using an object as a weapon, throwing hard objects at people", "Threatening serious violence", "Identity-based harassment or discrimination", "Sexual harassment or sexually aggressive behavior", "Cornering or trapping someone, deliberate intimidation", "Severe, targeted bullying"],
    response: ["Safety first.", "Sent home immediately.", "Guide emails the incident report.", "Parent-guide conversation before return.", "A repair plan agreed by all parties, delivered on return."],
    escalate: "Any single incident. No count required.",
    nd: "A meltdown is not a tantrum and it is not a choice. If a meltdown causes Tier 3 harm, the safety response is the same, and the return plan should focus on what overloaded the student and how to catch it earlier next time." }
];

/* Behaviors for the Tier Sorter game: [text, tier] */
export const SORT = [
  ["Humming while doing math, not bothering anyone nearby", 0], ["Blurting out an answer during a group lesson", 0], ["Pacing at the back of the room while thinking", 0], ["Forgetting to push in a chair again", 0], ["Narrating their own Lego build out loud", 0], ["Strong body odor", 0],
  ["Closing a classmate's laptop as a joke", 1], ["Hiding a classmate's pencil case", 1], ["Laughing at someone's drawing while they work", 1], ["Repeatedly chatting to someone who has asked to focus", 1], ["Changing a setting on another student's computer", 1], ["Talking over another student in circle", 1],
  ["Shoving someone off the bench", 2], ["Telling the group not to play with one particular student", 2], ["Making fun of a classmate's family in front of the group", 2], ["Taking someone's cards and refusing to give them back", 2], ["Following a student who has clearly asked for space", 2], ["Spreading a rumor about a classmate", 2], ["Tripping someone on the trail", 2],
  ["Punching a classmate in the stomach", 3], ["Saying they're going to bring a gun and shoot someone's family", 3], ["Throwing a heavy stick at a classmate", 3], ["Putting someone in a chokehold", 3], ["Pantsing a classmate", 3], ["Cornering a younger student behind the shed to scare them", 3], ["Calling a classmate a slur about their race", 3]
];

/* Standard or Toolkit? [statement, "standard"|"toolkit", why] */
export const SORTKIND = [
  ["Sending a student home after they punch someone", "standard", "Tier 3 always means immediate send-home."],
  ["Running a CPS Plan B conversation about a pattern", "toolkit", "CPS is a strong option, used at your discretion. The 2025 policy also suggests it before a return after a send-home."],
  ["Giving a yellow card on the third Tier 1 in a day", "standard", "The Tier 1 ladder has exact counts."],
  ["Letting a student wear noise-canceling headphones during work time", "toolkit", "An environmental support. Use it when it helps."],
  ["Sharing a level change privately at the one-on-one", "standard", "Levels are never announced to the group."],
  ["Starting class with a two-minute RULER mood check", "toolkit", "Good practice, your call."],
  ["Requiring a parent-guide conversation before a Tier 3 return", "standard", "No return without it."],
  ["Holding a restorative circle after a hard day for the whole band", "toolkit", "Circles are an option. Evidence is mixed, so use them where they fit."],
  ["Getting a second guide to confirm Nature Walk Level 4", "standard", "Carrying a blade is the highest-trust privilege."],
  ["Asking a student to draw what happened instead of telling you", "toolkit", "A communication accommodation. Use it when words are hard."],
  ["Caring for the harmed student before talking with the one who caused harm", "standard", "Step two of every Tier 2 response."],
  ["Building a self-management plan with a student", "toolkit", "An evidence-based option for patterns, chosen by the guide."],
  ["Emailing parents after a second Tier 2 in the same week", "standard", "Two Tier 2s in a school week triggers the email."],
  ["Moving the lesson outside so a restless student can walk while listening", "toolkit", "Your judgment about the route; the standard stays."],
  ["Following the crisis policy when a student writes about wanting to die", "standard", "Never coach through a safety disclosure alone."]
];

/* ------------------------------------------------------------------ */
/* FREEDOM LEVELS (Revised proposal 2026-27) */
export const DOMAINS = [
  { id: "academic", name: "Academic Block", sub: "Focused, independent learning", up: "Finish your daily work, don't disturb others, and solve your problems without AI or Google.",
    L: { 4: "Work from the couches, or take your laptop outside.", 3: "Sit at any open table, get up and move when you need to, and talk about academic topics.", 2: "Sit at a spot the guide chooses for you.", 1: "Work in a one-person enclosed desk space." },
    nd: "Level 1's enclosed desk is also what some autistic students would pick for themselves on a loud day. Offer it as a choice at any level, so it never only means “in trouble.”" },
  { id: "walk", name: "Nature Walk", sub: "Safety, tools, and care for others outdoors", up: "Stay safe, handle tools responsibly, and protect the safety of others.",
    L: { 4: "May carry higher-risk tools into the environment: hatchet, knife, saw.", 3: "Explore and play freely, as long as you stay in the guide's view.", 2: "Stay within 20 feet of the guide, and keep away from dangerous or risky areas.", 1: "Stay right beside the guide, within 10 feet." },
    nd: "Impulsivity and danger don't mix with blades. For a student with ADHD, a slower climb to Level 4 is kindness, not doubt. Say so out loud." },
  { id: "table", name: "Table", sub: "Lunch and snack: grace, courtesy, cleaning up", up: "Be polite, show grace and courtesy while eating, and clean up after yourself.",
    L: { 4: "Eat and head off to play on your own, no check-off needed first.", 3: "Eat in the designated eating areas, and check off with a guide before you go play.", 2: "Eat in a spot the guide assigns, and check off with a guide before playing.", 1: "Sit directly next to a guide." },
    nd: "Lunch is the loudest, least structured, most sensory part of the day. Picky eating and leaving early can be sensory, not rudeness. A quieter seat can be support, not a step down." },
  { id: "field", name: "Field Block", sub: "Afternoon workshops and self-directed projects", up: "Be responsible and keep moving your projects forward.",
    L: { 4: "Take your work anywhere, inside or outside, away from a guide, and pursue a personal project on your own, such as chess or BandLab.", 3: "Move freely within the workshop structure and work with the students you choose, staying in the guide's view.", 2: "The guide sets your work, your seat, and who you work with.", 1: "Stay directly with a guide, who directs your work." },
    nd: "A special interest is a motor. A student who stalls in workshops may fly when the project runs through what they already love." }
];
export const LEVEL5 = ["Lead class meetings and town halls", "Run for student government", "Serve as a teacher assistant", "Go beyond school grounds with another Level 5, carrying walkie-talkies", "Organize class parties"];
export const FL_RULES = [
  ["Look for the week's pattern, not a single moment.", "One hard day doesn't drop a level. A consistent week of responsibility earns one; a consistent week of struggle lowers one."],
  ["Move one step at a time.", "A student always has a clear, reachable next step in either direction."],
  ["Tie the change to the criteria.", "The student should hear exactly which behavior moved them."],
  ["Make the path back visible.", "Whenever a student steps down, name what the higher level looks like and offer to build toward it together."],
  ["Keep the four domains separate.", "Don't drop a student everywhere for one rough area."],
  ["Deliver it warmly, in person, in private.", "A level change is a conversation, not a mark on a chart."]
];
export const FL_SAY = {
  up: "“You've shown me all week that I can trust you with more space. This week you're at Level {L} in the {D}. Here's what that opens up.”",
  down: "“This week the {D} got a little hard, so we're going to stay closer together for a bit at Level {L}. That's not a punishment. It's how we rebuild trust, and we'll climb back together. Here's what moves you up: {UP}”",
  hold: "“You're holding steady at Level {L} in the {D}. Here's what would move you up next week: {UP}”"
};

/* ------------------------------------------------------------------ */
/* TOOLKIT: discretionary methods. */
export const TOOLS = [
  { id: "cps", name: "Collaborative & Proactive Solutions (Plan B)", when: "A pattern that keeps coming back after simpler fixes.", research: ["cps"],
    how: ["Pick one unsolved problem. Phrase it without blame: “You're having difficulty getting started on math when you sit at the long table. What's up?”", "Empathy step: listen and drill. Ask what, where, when. Don't guess for them. Silence is fine.", "Define adult concerns: how it affects them and others. Keep it short.", "Invitation: “I wonder if there's a way we could… Do you have any ideas?” The solution has to work for both of you.", "Check back in a week. If it didn't work, the first solution was the experiment, not the failure."],
    nd: "CPS was made for kids whose skills lag behind expectations. It assumes kids do well if they can. With autistic students, give the problem in writing ahead of time and allow long pauses.",
    trap: "Plan B done in the heat of the moment is Plan A in disguise. Wait until everyone is calm." },
  { id: "coreg", name: "Co-regulation (Self-Reg)", when: "A student is escalating or already dysregulated.", research: ["adhdemo"],
    how: ["Read the behavior as a signal of stress, not a challenge to you.", "Attune: lower your voice, slow down, match their level physically.", "Find the stressors: noise, hunger, a peer, a transition, the task itself.", "Reduce what you can right now.", "Later, help them notice their own early signs and what helps them recover."],
    nd: "Talking more adds load. For an autistic student in meltdown, fewer words, more space, less eye contact. For ADHD, movement often regulates faster than talk.",
    trap: "“Calm down” is a command to a brain that can't take commands right now." },
  { id: "restorative", name: "Restorative conversations and circles", when: "Harm between people, once everyone is calm.", research: ["rp"],
    how: ["Ask: What happened? What were you thinking at the time? Who has been affected and how? What do you need to make it right?", "Let the person who did the harm propose the repair. Imposed acts of service tend to become performances.", "Circles work best for proactive community building, not only for repair after harm."],
    nd: "Peer audiences raise shame for socially sensitive kids. Start one-to-one, and add people only when the student is ready.",
    trap: "A circle convened to make one student face the group isn't restorative. It's a trial." },
  { id: "nvc", name: "Nonviolent Communication", when: "Helping students say hard things without attack.", research: [],
    how: ["Observation: “When I see…” (camera-ready facts).", "Feeling: “I feel…” (an emotion word, not a thought).", "Need: “Because I need…” (a need, not a strategy).", "Request: “Would you be willing…” (and be willing to hear no)."],
    nd: "The four-part frame is a gift to students who struggle with tone: it makes the unspoken explicit. Keep a feelings and needs card handy.",
    trap: "NVC has the weakest research base of our frameworks. Use it as a communication script, not as proof that a conflict is resolved." },
  { id: "empathic", name: "Empathic listening", when: "A student needs to be heard before anything else can happen.", research: [],
    how: ["Skip the fix-it moves: advising, one-upping, lecturing, consoling, interrogating, correcting.", "Reflect: “Let me see if I've got this…” and summarize.", "Guess at feelings and needs: “Are you feeling… because you need…?”", "Let them correct you."],
    nd: "Some autistic kids take your guess literally. If you guess wrong, thank them for the correction. It's useful data, not defiance.",
    trap: "Reflecting forever without ever naming the standard slides into protector mode." },
  { id: "ruler", name: "RULER mood meter", when: "Building everyday emotional vocabulary for the whole group.", research: ["ruler"],
    how: ["Recognize, Understand, Label, Express, Regulate.", "A quick daily check on the mood meter (energy and pleasantness).", "Teach more precise words than “fine,” “mad,” “sad.”"],
    nd: "Alexithymia (difficulty identifying feelings) is common in autism. A grid with colors and body cues gives a way in when words don't come.",
    trap: "A check-in that nobody follows up on teaches kids that sharing changes nothing." },
  { id: "selfmgmt", name: "Self-management plans", when: "A student wants to change a habit and could use a structure to own it.", research: ["ncaep"],
    how: ["Observe and record the behavior for a few days.", "Choose one behavior to track, and define it clearly.", "Teach the student to record their own behavior.", "Skip the rewards step. We use specific feedback instead.", "Raise the goal slowly, then fade the plan out."],
    nd: "Self-management is on the evidence-based list for autistic learners. Visual trackers work well. Let the student design the tracker.",
    trap: "A plan the adult tracks is surveillance, not self-management." },
  { id: "firedrill", name: "Personal Fire Drill plan", when: "Before the year starts, or after a hard week.", research: [],
    how: ["With the family, the student names their early warning signs (hot face, fists, going quiet).", "They choose 2 or 3 things that help (a walk, a sensory box, a drink of water, a set spot).", "Practice the plan when calm, like a real fire drill.", "Point back to the plan in the moment instead of improvising."],
    nd: "Interoception, sensing what's going on inside your own body, is often harder for neurodivergent kids. Practicing the plan when calm builds the map they'll need under stress.",
    trap: "Some kids rarely flip their lids. Don't make it a requirement for everyone." },
  { id: "regspace", name: "Regulation space (time-in)", when: "A student needs to come down before re-joining.", research: [],
    how: ["Introduce it as a positive choice for everyone, before anyone needs it.", "Soft light, seating, ear protection, simple sensory tools, some privacy without isolation.", "Never use it as a punishment or a time-out."],
    nd: "For many autistic students, a retreat space prevents the meltdown entirely. It works best when the student can go there without asking.",
    trap: "If it becomes where kids get sent, nobody will go there willingly again." },
  { id: "precorrect", name: "Precorrection and priming", when: "You can see the hard moment coming: a transition, a new place, a group game.", research: ["ncaep"],
    how: ["Before the moment, say what's coming and what success looks like: “In two minutes we pack up. Laptops closed, then shoes on.”", "Rehearse the tricky part once.", "Give a warning at 5 and 1 minute.", "Afterward, name what went well."],
    nd: "Antecedent-based intervention and visual schedules are among the best-supported practices for autistic learners. Surprise is the enemy.",
    trap: "Priming that turns into a lecture loses the student before the moment arrives." },
  { id: "wise", name: "Wise feedback", when: "You need to name a gap without losing the student.", research: ["wise"],
    how: ["Say why: “I'm telling you this because I have high expectations and I know you can reach them.”", "Then give one or two specific critiques, about the work or behavior, not the person.", "Offer real help and ask for their plan."],
    nd: "Make the high expectation explicit. Many neurodivergent kids have heard years of hints that they're a problem. Say plainly that you believe in them.",
    trap: "The sentence is worthless without real critique and real help after it." },
  { id: "specific", name: "Specific noticing (5 to 1)", when: "All day, especially with kids who hear mostly correction.", research: ["praise", "rewards"],
    how: ["Notice behavior out loud, specifically: what they did and why it matters.", "Aim for several noticings for every correction.", "Prefer gratitude and process over person-praise: “Thanks for…” and “You kept going when…” over “You're so smart.”"],
    nd: "A child who's been corrected all morning needs a deliberate run of positive contact before they can hear the next correction.",
    trap: "Praise that's vague or unearned reads as manipulation, especially to middle schoolers." },
  { id: "move", name: "Vigorous movement", when: "Restless bodies, flat mornings, before focus work.", research: ["move"],
    how: ["Run, jump, climb, carry before seated work.", "Teach a few outdoor games that keep everyone moving.", "Keep a jar of quick running and jumping ideas for free play."],
    nd: "Exercise has some of the more consistent evidence for ADHD attention and executive function. It isn't a reward to be earned; it's fuel.",
    trap: "Taking away movement as a consequence removes the very thing that helps." },
  { id: "meaning", name: "Meaning questions mid-meltdown", when: "A blowup running on a misreading of what happened.", research: [],
    how: ["What does this mean to you?", "How is that meaning making you feel?", "Is that serving your goals?", "What else could it mean?", "How would you feel if you thought that?", "Would that serve your goals?"],
    nd: "Ask slowly and accept every answer. For literal thinkers, “What else could it mean?” may need examples.",
    trap: "Six questions fired fast feel like an interrogation." },
  { id: "peers", name: "Teaching peers about differences", when: "A band where one student's differences have become a target.", research: ["bully", "antibully", "dep"],
    how: ["Teach the whole group about ADHD and autism, without singling anyone out.", "Coach a few peers to be good models and allies.", "Thank students for inclusion when you see it.", "Name bullying's disproportionate impact on neurodivergent kids."],
    nd: "The double empathy problem cuts both ways. Ask neurotypical students to stretch toward their autistic classmates as much as the reverse.",
    trap: "Never discuss a specific child's diagnosis with peers without the family's permission." },
  { id: "mindful", name: "Mindfulness practice", when: "A student who finds it calming and chooses it.", research: ["mind"],
    how: ["Offer short, optional practices (Headspace is available to staff and students).", "Pair with movement or nature for kids who can't sit still.", "Let it be one option among many."],
    nd: "Sitting still with eyes closed can be distressing for some neurodivergent students. Walking or sensory-based versions work better for them.",
    trap: "The largest school trial found a mindfulness curriculum no better than regular SEL. Don't oversell it." }
];

/* ------------------------------------------------------------------ */
/* KNOTS: common scenarios, as composites. */
export const KNOTS = [
  { id: "treefort", title: "The tree-fort war", band: "2–4 / 5–8", where: "Nature Walk",
    story: "Two groups are building forts in the same stand of trees. Sticks keep migrating between camps. One student keeps taunting a girl on the other team. Another student, belonging to neither group, quietly moves sticks from one fort to the other so each side blames the other. The taunted girl gets louder, calls her taunter an idiot, and finally throws a heavy, sharp stick at full force. It hits a bystander in the foot.",
    q: "Who gets which tier?",
    opts: [["Only the thrower. She did the dangerous thing.", false, "She did, and her Tier 3 stands. But three other students fed the fire, and if only she is held accountable, the lesson everyone learns is that provoking quietly is safe."], ["Thrower Tier 3; the repeated taunting Tier 2; the covert stick-moving at least Tier 1, likely Tier 2; the stick-taker who was trying to make it fair, coaching.", true, "Each student did something different. Sort each by its impact."], ["Everyone involved gets the same consequence so nobody feels singled out.", false, "Same consequences for different actions isn't fair, and kids notice."]],
    standard: ["Safety first: check the injured student; separate the group.", "Tier 3 for the throw: send home, incident email, parent-guide conversation and repair plan before return.", "Get each student's account separately, before any group talk, so the loudest story doesn't become the official one.", "Tier 2 for repeated taunting (repeatedly targeting someone): red card, SMART Restore.", "Record all of it the same day."],
    toolkit: ["Name the covert role privately and exactly: “I saw you move sticks from one fort to the other. What were you hoping would happen?”", "With the student who took sticks back to make it fair, build an answer to: what do you do when you think something of yours was taken?", "Before forts resume, fix the conflict engine: marked materials or zones."],
    nd: "A student with ADHD or anxiety can hold together through a lot of provocation and then go from 4 to 10 in a second. In her return conversation, find the earlier exits together: the moment she noticed her face getting hot, the moment she could have walked to a guide.",
    trap: "Telling the family “it wasn't a one-student problem” is honest and right. Naming the other students to them isn't.", research: [] },
  { id: "loop", title: "Two kids, one loop", band: "5–8", where: "All day",
    story: "Two boys have been at each other for months. Each keeps careful track of what the other did. Small things become reports: gum, a lunchbox held for ransom, a shove. Each says the other lies. Both admit they aren't innocent, but neither can get past what the other did first. Other students are getting pulled in as witnesses.",
    q: "What's the first move?",
    opts: [["Bring them together for a Peace Talk today to settle the whole history.", false, "Too much history and too much heat. A Peace Talk needs both kids calm and a single concern."], ["Run separate CPS Plan B conversations with each boy about one specific unsolved problem, then decide whether a joint plan is possible.", true, "One problem at a time, one child at a time, after both are calm."], ["Give both a Tier 2 so they learn the system is serious.", false, "Tier depends on impact of each act, not on who's exhausting."]],
    standard: ["Each new incident gets tiered on its own impact. Physical harm is at least Tier 2; a chokehold or punch is Tier 3.", "Two Tier 2s in a week for either student means a parent email.", "Peace Talks only with both calm and the guide assessing first. After 2 documented attempts at Peace Talks or coaching fail, escalate."],
    toolkit: ["Separate CPS conversations, one unsolved problem each: “You're having trouble at lunch when you two sit together. What's up?”", "Agree on a contact plan for a while: separate tables, separate walk groups. Present it as support, not punishment.", "Watch the system itself. If kids are using reports as weapons, the system is rewarding the wrong thing."],
    nd: "Both kids may have a strong sense of justice and a hard time letting go of the past, which can be a feature of autism or anxiety. Ask each: “What would make this feel fair to you?” Their answers may surprise you.",
    trap: "Spending the whole conversation re-litigating who started it. You will never find patient zero.", research: ["cps"] },
  { id: "girlgroup", title: "The girl group", band: "5–8", where: "Recess and lunch",
    story: "A parent writes that her daughter comes home sad every day. One classmate has built a friend group and tells the others they can't be her friend if they play with this girl. You haven't seen it. When you've watched, the two girls seemed fine. The excluded girl says she doesn't tell guides because she doesn't want to be a tattletale, and because she was told to work it out herself.",
    q: "What do you do with something you haven't seen?",
    opts: [["Nothing official until a guide witnesses it. Fairness requires evidence.", false, "Covert exclusion is designed to happen out of adult sight. Waiting for a witness means waiting forever."], ["Take it seriously: talk with each girl separately, gather accounts from other students, and treat confirmed deliberate exclusion that causes social harm as Tier 2.", true, "The accountability system lists deliberate exclusion that causes meaningful social harm as Tier 2."], ["Raise it at the next Town Hall so the whole band can discuss inclusion.", false, "A general inclusion lesson is fine. A Town Hall about these two girls would be public shaming."]],
    standard: ["Deliberate exclusion that causes meaningful social harm is Tier 2.", "Talk with each girl separately. Gather other students' accounts privately.", "Reply to the parent within one working day with what you'll do and when you'll report back.", "Don't name either child to the other's family."],
    toolkit: ["Teach the difference between telling and tattling to the whole band: telling is to get someone help or safe, tattling is to get someone in trouble.", "Coach the bystanders. Many of them would include her if it didn't cost them.", "Check on the student doing the excluding. Distress and controlling friendships often travel together."],
    nd: "Girls with ADHD or autism are often diagnosed late, and many camouflage hard to fit in. Exclusion hits them where they're already working hardest.",
    trap: "“I haven't seen it” turns into “it isn't happening.”", research: ["mask", "antibully"] },
  { id: "threat", title: "Something scary at lunch", band: "2–4 / 5–8", where: "Lunch",
    story: "A parent tells you that over several weeks a classmate has taken their son's cards and called him names, and has said at lunch that he would shoot someone's mom and, on another day, made a violent sexual threat toward a classmate. Their son has been told to be more assertive. It hasn't helped.",
    q: "What's the right first step?",
    opts: [["Treat it as a Tier 3: document the exact words, involve leadership that day, send home, require a parent conversation before return, and assess how serious the threat is.", true, "Serious threats are Tier 3 until assessed. Most student threats turn out to be transient, but you find out by assessing, not assuming."], ["Ask the two boys to have a Peace Talk about respect.", false, "Peace Talks are explicitly not for threats or power imbalances."], ["Tell the parents kids say things like that at this age.", false, "Most threats are transient, but dismissing one without assessing it is the error the research warns about."]],
    standard: ["Threats of serious violence, including sexual violence: Tier 3, sent home, incident report, parent-guide conversation, repair plan.", "Document the exact words, who heard them, when and where.", "Tell leadership the same day. Leadership decides whether outside professionals are needed.", "Tell the reporting family what you're doing, without details about the other child.", "The taking and name-calling are their own Tier 2s."],
    toolkit: ["Use the transient vs substantive distinction: was there intent, a plan, a target, access to means? Was it anger or bravado that the student can explain and retract?", "On return, teach the impact of words like these directly. Some kids genuinely don't understand how they land.", "Check on the boy who was targeted. Being assertive shouldn't have been his job."],
    nd: "Some neurodivergent children echo words from games, videos or older kids without grasping their weight. That changes what you teach afterward, not the safety steps now.",
    trap: "Two errors, both common: panicking into a permanent judgment of the child, or shrugging it off as kids being kids.", research: ["cstag"] },
  { id: "optout", title: "The opt-out", band: "5–8", where: "Academics and workshops",
    story: "A capable middle schooler won't engage with anything. Freedom Levels don't move him. Blazes don't interest him. Every workshop gets “I don't like that thing.” He's not disruptive. He just isn't trying, and it's starting to look like a choice.",
    q: "What's the most likely read?",
    opts: [["He's lazy and needs firmer consequences.", false, "Labels harden the pattern and the research says firmer consequences rarely move this kind of student."], ["He may be protecting himself: not trying is safer than trying and visibly failing. Lower the public stakes and build trust before raising the bar.", true, "Self-handicapping is well documented, especially where ability is on public display."], ["He's not a good fit for a self-directed school.", false, "Maybe, eventually. But if a system only works for kids who already buy in, that's a system problem."]],
    standard: ["Effort alone isn't a behavior tier. Don't use the tier system to force engagement.", "Freedom Level changes still follow the criteria. Holding steady is a legitimate outcome."],
    toolkit: ["Make expectations less public. Private goals, private progress, private wins.", "Daily two-minute conversations about anything he cares about, with no agenda.", "Wise feedback when you do give critique.", "Find one real competence and give it a real job in front of peers.", "See the Mentor Mindset Field Guide's Rough Terrain stop."],
    nd: "Demand avoidance driven by anxiety can look exactly like this. Try declarative language (“I notice the saw is free”) instead of direct demands (“Go use the saw”), and see what changes.",
    trap: "Adding one more incentive system. He's already told you incentives aren't the lever.", research: ["handicap", "wise", "rewards"] },
  { id: "late", title: "A Tier 3 at 2:45", band: "All", where: "End of day",
    story: "A Tier 3 happens fifteen minutes before dismissal. The student is sent home and picked up at 3:00. Tomorrow is a normal school day, and next week is the showcase.",
    q: "What does the 2026-27 system require before tomorrow?",
    opts: [["Nothing. The student was sent home, so the consequence is served.", false, "Send-home is only step two. Return has conditions."], ["An incident report email to parents, a parent-guide conversation before the student returns, and an agreed repair plan delivered on return.", true, "Those are the written requirements. Whether a full extra day away is also required is an open question."], ["An automatic full day away from school, no exceptions.", false, "That was board direction last spring, but the 2026-27 document doesn't say it. Until it's decided, follow the written rules and flag the case to leadership."]],
    standard: ["Incident report email the same day.", "Parent-guide conversation before return.", "Repair plan agreed and delivered on return.", "Field Guide owns the return conversation."],
    toolkit: ["Hold the parent conversation by phone that evening if the family can, so the student isn't kept out just by scheduling."],
    nd: "Unpredictability about whether they're coming back tomorrow is its own stressor. Tell the student and family exactly what the next step is and when.",
    trap: "Different guides making different calls on timing. That's the inconsistency families notice first.", research: ["suspend"], open: "latetier3" },
  { id: "sub", title: "The substitute's afternoon", band: "All", where: "Any",
    story: "A parent volunteer is covering. Two students fight; one punches the other. The volunteer calls home and the student is picked up. The next morning, nobody is sure who is meeting with him.",
    q: "Who owns the return?",
    opts: [["The volunteer, since they saw it.", false, "Volunteers and subs handle safety and the report. They don't own re-entry."], ["The student's own Field Guide, with a clear handoff from whoever handled the incident before the next morning.", true, "Relationship carries the return conversation."], ["Whoever is free first in the morning.", false, "That's how returns get skipped."]],
    standard: ["The adult on duty handles immediate safety, the send-home and the incident report.", "Hand off to the student's Field Guide the same day, in writing.", "No return without the parent-guide conversation and repair plan."],
    toolkit: ["Keep a one-page Tier 3 checklist with the sub folder."],
    nd: "A different adult greeting a student after a hard day can feel like a trap. Make sure the face at the door is a familiar one.",
    trap: "Telling a student not to file a report because the other kid is too angry. Safety reporting doesn't wait on anyone's mood.", research: [] },
  { id: "roast", title: "The roast battle", band: "5–8", where: "Lunch into Nature Walk",
    story: "Two students start roasting each other at lunch. By the walk, it's yelling. An adult asks them to stop. They keep going all the way back to school.",
    q: "Is banter between willing friends a tier at all?",
    opts: [["No. If both are playing along, it isn't harm.", false, "It may start mutual. The adult's request to stop changed things, and so did the yelling."], ["It started as banter. Continuing after an adult asked them to stop, and escalating to yelling, made it at least Tier 1, and Tier 2 if it became humiliating.", true, "A game stops being a game when one person wants out, or when an adult says stop."], ["Tier 3 for ignoring an adult.", false, "Ignoring an adult once isn't Tier 3. Ongoing, regulated defiance of staff is a separate concern."]],
    standard: ["Tier 1 ladder within the day.", "If it becomes mocking that causes harm: Tier 2, red card, SMART Restore."],
    toolkit: ["Teach a consent test for banter: “Would you both still laugh if I read it out to your families?”", "Give both a face-saving exit before it escalates: “Hey, I need two strong people to carry this.”"],
    nd: "Some students genuinely can't tell when teasing has tipped into hurting. Teach the signs explicitly: the other person stops laughing, goes quiet, walks away.",
    trap: "Waiting for one of them to report it before acting. If you saw it, you know.", research: [] },
  { id: "window", title: "The window and the hose timers", band: "K–1", where: "Lower campus",
    story: "A young student jumps out the kitchen window twice in one morning. Outside, kids are using hose timers as pretend bombs and phones until they break. One boy's swearing and anger are escalating, and he fixates on one classmate at a time. When adults step in, he shuts down.",
    q: "Where do you start?",
    opts: [["Write him up at Tier 2 every time.", false, "The tier system is written for grades 2 to 8. The lower campus runs on Montessori norms, and a six-year-old's impulsivity calls for environment and support first."], ["Safety first, then the environment: give the kids real things to play with, remove what's tempting and fragile, and start collecting pattern data on the one student.", true, "Change the room before trying to change the child. Data supports the next decision."], ["Ask his parents to keep him home until he's calmer.", false, "Possibly part of a later plan, but not a first move without data and a conversation."]],
    standard: ["Unsafe actions (jumping out windows): call the family, follow the send-home process if the student can't be kept safe.", "Document behaviors and adult responses daily so decisions about support rest on patterns, not memory."],
    toolkit: ["Loose parts, swings, jump ropes, a mud kitchen: things to do instead of things to break.", "Precorrection before transitions and recess.", "A simplified Plan B: “I noticed you have a hard time when your friend plays with someone else. What's up?”"],
    nd: "Sensory seeking, impulsivity and fixation on one friend can all be part of ADHD or autism in young children. Vigorous movement and predictable routines are among the most useful supports.",
    trap: "Relying on volunteers who change daily. Inconsistency is a trigger in itself.", research: ["ncaep", "move"], open: "k1" },
  { id: "tier0", title: "Can't sit, can't stop", band: "2–4", where: "Academic Block",
    story: "During focus time a boy hums, taps his pencil, gets up four times, and narrates his math out loud. His tablemate keeps sighing and asks to move.",
    q: "What tier is this?",
    opts: [["Tier 1, because his tablemate is bothered.", false, "Not yet. Tier 0 becomes Tier 1 after 2 reminders or coaching attempts the same day if it keeps affecting someone."], ["Tier 0. Coach and change the setting first. If it continues after 2 reminders today and keeps affecting his tablemate, it becomes Tier 1.", true, "The exact count is what keeps this consistent across guides."], ["Not a behavior issue at all; the tablemate should move.", false, "The tablemate's learning matters too. Both kids deserve a plan."]],
    standard: ["Tier 0: patience, reminders, coaching.", "After 2 reminders on the same behavior in a day, if it continues and affects another student: Tier 1."],
    toolkit: ["Offer a standing spot, a fidget, headphones or a walk break before counting reminders.", "Let him choose a seat where narrating doesn't land on anyone.", "Teach the tablemate to make a respectful request: “Could you hum quieter?”"],
    nd: "Narrating and humming are often how a child keeps focus. Removing the strategy without a substitute can make the work impossible.",
    trap: "Freedom Level drop in the Academic Block for Tier 0 behavior. That punishes wiring.", research: ["move"] },
  { id: "tools", title: "The hatchet arc", band: "5–8", where: "Nature Walk",
    story: "A Level 4 Nature Walk student is splitting kindling and swings the hatchet in a wide arc while a younger student walks past.",
    q: "What happens to the Nature Walk level?",
    opts: [["Nothing, nobody got hurt.", false, "Level 4 Nature Walk is the highest-trust privilege. A near miss is information."], ["Stop the activity now. Endangering others is at least Tier 2. Review the Nature Walk level this week; the tool privilege comes back only with a second guide's confirmation.", true, "Safety, then the pattern review, then a slow, confirmed path back."], ["Drop the student to Level 1 in all four domains.", false, "Domains are independent, and levels move one rung at a time."]],
    standard: ["Stop the activity.", "Endangering others: Tier 2 at least.", "Freedom Levels move one rung at a time and domains stay separate.", "Nature Walk Level 4 requires confirmation by a second guide."],
    toolkit: ["Have the student re-teach the safety circle rule to a younger student as part of the repair."],
    nd: "Spatial awareness and motor planning differ a lot between kids. Make the safety circle physical: an arm's length plus the tool, marked on the ground.",
    trap: "Treating a tool lapse as a character flaw. It's a skill and attention gap, and the path back should teach the skill.", research: [] },
  { id: "argue", title: "Argues every point", band: "5–8", where: "Academics",
    story: "A middle schooler challenges every request for three days. You've been short with her in return. Then you find writing she did in a learning app that is dark and distressing.",
    q: "What comes first?",
    opts: [["Address the arguing. That's the pattern you can see.", false, "The writing changes the priority."], ["Follow the Mental Health Crisis Policy for the writing now, and involve leadership. Return to the arguing later, with a reset of your own tone.", true, "Safety disclosures come before behavior."], ["Wait to see if the writing was just a story.", false, "It may be. Leadership and the family decide that with you, not you alone."]],
    standard: ["Distressing writing about harm to self or others: follow the Mental Health Crisis Policy and involve leadership the same day.", "Don't confront the student about it publicly."],
    toolkit: ["Once safety is handled, own your part: “I've been short with you this week. That's on me.”", "Offer real choice inside the standard to reduce power struggles."],
    nd: "Intense argument and a sense that rules are unfair can come with anxiety, ADHD or autism. A do-over from the adult models the repair you want from her.",
    trap: "Winning the argument. You can't, and trying makes you the opponent.", research: [] }
];

/* ------------------------------------------------------------------ */
/* NEURODIVERGENT CHILDREN: the Different Wiring page. */
export const ND = {
  why: "Families often choose Wilderland because their child didn't fit a conventional school. So we have more neurodivergent students than an average school, and our hypersocial, self-directed setting is both a gift and a test for them. Nature-based and self-directed learning were chosen partly with ADHD and autism in mind.",
  principles: [
    ["Affirm, don't extinguish", "We help every child become the best version of who they actually are. We don't try to shave away autistic or ADHD traits. We do expect everyone to live in peace together."],
    ["Behavior is stress or skill", "A child who is struggling is usually behaving under stress or running into a lagging skill. Ask: can't, or won't? Most of the time it's can't."],
    ["When you've met one autistic person…", "…you've met one autistic person. Ask each child about their own experience instead of applying a profile."],
    ["Misunderstanding runs both ways", "The double empathy problem: autistic and non-autistic people misread each other about equally. Don't ask only the autistic child to do the stretching."],
    ["Strengths are the way in", "Many traits we label as problems have a mirror strength. Find it, name it, and build on it."],
    ["Fair isn't the same", "Same standard, different routes. Tier 0 exists so wiring isn't punished."],
    ["Families are partners", "Parents know what works. Ask them, early and often, and share good news as often as concerns."]
  ],
  mirrors: [
    ["Inflexible, rigid, stubborn", "Logical, determined, persistent", "autism"], ["Explosive, emotional", "Passionate, strong moral code, attentive to rules", "autism"], ["Cold, unfeeling", "Analytical, keen observer, pattern-spotter", "autism"], ["Rude", "Honest, direct", "autism"], ["Can't transition", "Intense focus, detail", "autism"], ["Weird, awkward", "Original, authentic, trailblazing", "autism"], ["Obsessive, fixated", "Deep expertise, strong memory", "autism"], ["Sensitive", "Perceptive, notices dangers others miss", "autism"], ["Argumentative", "Opinionated, committed", "autism"],
    ["Distractible", "Curious", "adhd"], ["Impulsive", "Creative", "adhd"], ["Hyperactive", "Energetic", "adhd"], ["Intrusive", "Eager", "adhd"], ["Can't stay on point", "Sees connections others don't", "adhd"], ["Forgetful", "Gets totally into what they're doing", "adhd"], ["Disorganized", "Spontaneous", "adhd"], ["Inconsistent", "Flashes of brilliance", "adhd"], ["Moody", "Sensitive", "adhd"]
  ],
  healthy: ["Intense study of a new favorite topic", "Not noticing sounds or social signals while absorbed", "Needing to know what to expect before something new", "Taking a long time before answering a complex question", "Needing time alone to recharge after a social day", "Needing all the information before deciding", "Not knowing yet how they feel about something"],
  comm: [
    ["Clear expectations", ["Specific plans: time, place, what will happen", "A clear yes or no, not “we'll see”", "Agendas shared ahead and then followed", "Step-by-step instructions", "Specific, measurable goals"]],
    ["Explicit messages", ["Say feelings out loud: “I'm disappointed because…”", "Don't expect them to read tone, posture or tears", "Don't punish failing to read between the lines", "Ask clarifying questions: “What would you like me to do about this?”"]],
    ["Lower sensory and social load", ["No eye-contact demands in hard conversations", "Talk while walking or doing something with hands", "Let them write or draw what they can't say", "Give time alone to reflect", "Learn to spot fawning and early signs of meltdown", "Frequent breaks, quiet places to retreat"]]
  ],
  adhd: [
    ["Put help at the point of performance", "Reminders, timers and checklists work best right where and when the task happens, not in a talk beforehand."],
    ["Feedback fast and frequent", "Delayed consequences barely register. Notice what's going right in the moment."],
    ["Move to focus", "Running and jumping before seated work. Standing spots. Walk-and-talk coaching."],
    ["Big feelings are part of the package", "Emotion dysregulation is common in ADHD. Plan for it instead of treating each outburst as a choice."],
    ["Interest is the engine", "Attention follows interest. Thread the hard thing through what they already love."]
  ],
  autism: [
    ["Predictability prevents meltdowns", "Warnings before transitions, visual schedules, a preview of anything new."],
    ["Literal is respectful", "Say exactly what you mean. Avoid sarcasm, idioms and hints."],
    ["Ask before touching", "An unexpected touch can feel like a shock. Default to a wave or an elbow bump."],
    ["Sensory load is real", "Noise, fluorescent light, smells and clutter drain the battery. Headphones, quiet corners and dimmers help."],
    ["Masking costs", "A child who holds it together at school may fall apart at home. A calm day isn't proof of an easy day."],
    ["Meltdown isn't defiance", "During a meltdown, fewer words and more space. Teach later, when the brain is back online."]
  ],
  sensory: [["See", "Dimmable, diffuse light; less visual clutter; clear signs"], ["Hear", "Rugs and soft surfaces to cut echo; quiet signals instead of clapping; headphones available"], ["Touch", "Wave or elbow-bump greetings; fidgets normal; comfortable clothes; space between seats"], ["Smell and taste", "No strong scents; keep kitchen smells contained; say what food is coming; bland backups"]],
  intake: ["How does your child communicate best?", "What do they love: shows, books, toys, subjects, physical activities, sensory play?", "What would make their life easier?", "What helps them learn?", "When are they happiest, and what do they do best?", "What settings and people bring out their best?"],
  reflect: ["Thanks to my hyperfocus, I've developed these skills…", "Thanks to my special interests, I know a lot about…", "Being me, I've met these people who matter to me…", "Being me, I've had these experiences…", "These are awesome things about my personality…", "It's hard sometimes, and it's made me resilient in these ways…"],
  watch: [
    ["Peer judgment", "Peer-led accountability can trigger more shame than adult correction for socially sensitive kids."],
    ["Public correction", "Correct privately. Public correction is a status event first and feedback second."],
    ["Freedom Levels as a ceiling", "A child with a lagging skill can get stuck at Level 2. Change the support before you hold the line."],
    ["Mismatch in rewards", "The national evidence list for autism includes reinforcement. We don't use prizes. Make sure specific feedback fills that gap for kids who need it."],
    ["Mistaking masking for wellbeing", "Quiet isn't the same as fine."]
  ],
  books: [["Unmasking Autism", "Devon Price"], ["Lost & Found and The Explosive Child", "Ross Greene"], ["Self-Reg", "Stuart Shanker"], ["Hidden Brilliance", "Lynn Kern Koegel & Claire LaZebnik"], ["Driven to Distraction / ADHD 2.0", "Hallowell & Ratey"], ["Superparenting for ADD", "Hallowell & Jensen"], ["Taking Charge of ADHD", "Russell Barkley"], ["Building a Trauma-Informed Restorative School", "Joe Brummer & Margaret Thorsborne"], ["Why Will No One Play With Me?", "Caroline Maguire"], ["How to Talk to an Autistic Kid", "Daniel Stefanski"], ["NeuroTribes", "Steve Silberman"]]
};

/* Tips that rotate on the home page. */
export const ND_TIPS = [
  "Ask before you touch. For some autistic kids an unexpected hand on the shoulder feels like a shock.",
  "Before stepping a level down, ask: can't, or won't?",
  "Give the 5-minute and 1-minute warning before every transition.",
  "Say what you mean. Sarcasm and hints are a second language for many students.",
  "Movement is fuel, not a reward. Don't take it away as a consequence.",
  "A calm day at school can mean a hard evening at home. Masking costs energy.",
  "Offer a way to write or draw what happened when talking is too hard.",
  "During a meltdown, fewer words. Teach later.",
  "Narrating and humming are often how a child holds focus.",
  "Find the special interest and run the hard thing through it.",
  "Misunderstanding runs both ways. Ask neurotypical kids to stretch too.",
  "Name the strength hiding behind the label."
];

/* ------------------------------------------------------------------ */
/* TRAINING: modules and questions. Each question: [prompt, [options], correctIndex, why] */
export const MODULES = [
  { id: "tiers", name: "Tier Tracker", icon: "🪜", pass: 8, blurb: "Sort real behaviors into Tiers 0 to 3.", kind: "sort" },
  { id: "kinds", name: "Standard Bearer", icon: "📏", pass: 8, blurb: "Tell the standards from the toolkit.", kind: "kinds" },
  { id: "counts", name: "Exact Counts", icon: "🔢", pass: 5, blurb: "The numbers that keep us consistent.", kind: "mcq",
    qs: [
      ["How many reminders on the same Tier 0 behavior in a day before it can become Tier 1 (if it affects another student)?", ["1", "2", "3", "5"], 1, "After 2 reminders or coaching attempts, if it continues and affects someone."],
      ["Which Tier 1 offense in a single day earns a yellow card and a text home?", ["1st", "2nd", "3rd", "4th"], 2, "Reminder, proximity, then yellow card."],
      ["When can a guide call a parent meeting for Tier 1?", ["After any yellow card", "When the same Tier 1 behavior happens on 3 or more days in a school week", "After 10 Tier 1s in a month", "Never for Tier 1"], 1, "3 or more days within 5 school days."],
      ["When is a Tier 2 SMART Restore due?", ["Before lunch", "By the end of the following school day", "Within a week", "Whenever the student is ready"], 1, "End of the following school day, signed off by the Field Guide."],
      ["How many Tier 2 incidents in one school week trigger a parent email?", ["1", "2", "3", "4"], 1, "Two in a week: email with all incident reports."],
      ["How many concerns about the same student can lead to a restorative Town Hall?", ["1", "2", "3 or more", "Never"], 2, "3 or more, convened by the guide and class president, never to shame."],
      ["How much protected time does a guide-supported Peace Talk get?", ["5 minutes", "At least 20 minutes", "An hour", "Whatever's left before lunch"], 1, "At least 20 protected minutes."]
    ] },
  { id: "freedom", name: "Freedom Keeper", icon: "🧭", pass: 6, blurb: "Domains, rungs and the summit.", kind: "mcq",
    qs: [
      ["Where does every student start?", ["Level 1", "Level 2", "Level 3 in every domain", "Wherever last year ended"], 2, "Level 3 is the baseline in all four domains."],
      ["A student had one rough lunch this week and was great otherwise. Table level?", ["Drop one rung", "Drop two rungs", "Hold. One moment isn't a pattern.", "Drop to Level 1"], 2, "Look for the week's pattern, not a single moment."],
      ["A student is ready to move from Level 2 to Level 4 in Field Block. What do you do?", ["Move to 4", "Move to 3 this week", "Move to 5", "Wait for the term to end"], 1, "One rung at a time."],
      ["What's required for Nature Walk Level 4?", ["Parent permission", "Confirmation by a second guide", "A written test only", "Nothing extra"], 1, "Earned slowly, confirmed by more than one guide."],
      ["How does Level 5 happen?", ["A guide awards it", "Students vote", "Level 4 in all four domains at once", "Perfect attendance"], 2, "It's a whole-child status."],
      ["How do students learn their levels?", ["Posted ranking", "Announced at Town Hall", "Privately at their one-on-one", "Email to the class"], 2, "Never as a public ranking."],
      ["A student struggles on Nature Walk but is excellent at the Table. You…", ["Drop all domains", "Adjust only Nature Walk", "Drop Table to match", "Hold all"], 1, "Domains stay separate."]
    ] },
  { id: "knots", name: "Knot Untangler", icon: "🪢", pass: 9, blurb: "Pick the right first move in real scenarios.", kind: "knots" },
  { id: "wiring", name: "Different Wiring", icon: "🧠", pass: 6, blurb: "Supporting neurodivergent students.", kind: "mcq",
    qs: [
      ["A student hums and taps while working and nobody else is affected. Tier?", ["0", "1", "2", "None, but write it up"], 0, "Tier 0. Coach and support."],
      ["What does the double empathy problem say?", ["Autistic people lack empathy", "Misunderstanding runs both ways between neurotypes", "Everyone has two kinds of empathy", "Empathy can't be taught"], 1, "Mixed-neurotype communication breaks down; autistic-to-autistic works well."],
      ["During a meltdown, the best adult move is usually…", ["Ask lots of questions to understand", "Fewer words, more space, safety first", "Firm consequences right away", "Ignore it entirely"], 1, "Teach later, when the brain is back online."],
      ["About what share of autistic youth are bullied at school, by pooled estimates?", ["5%", "15%", "About 44%", "90%"], 2, "Maïano et al., 2016."],
      ["A child with ADHD forgets steps every transition. What helps most?", ["A talk about responsibility", "Help at the point of performance: a checklist where the task happens", "Losing recess", "A Tier 1"], 1, "Barkley's point-of-performance principle."],
      ["What's true about masking?", ["It shows a child is coping well", "It's linked to worse mental health and exhaustion", "Only adults do it", "It's a sign of manipulation"], 1, "Cook et al., 2021."],
      ["Before touching an autistic student on the shoulder, you should…", ["Do it quickly", "Ask first, or wave", "Only touch from behind", "Never speak to them"], 1, "Unexpected touch can feel like a shock."]
    ] }
];

/* ------------------------------------------------------------------ */
/* LIVING DOCUMENT: open questions leadership needs to settle. */
export const OPEN = [
  { id: "latetier3", q: "Does a Tier 3 late in the day still require a full day away?", why: "Last spring the board said Tier 3 means a full day home, including the next day for late incidents. The 2026-27 Accountability System says “sent home immediately” plus a parent-guide conversation before return, with no full-day rule. Guides need one answer.", sources: "#student-behavior, Apr–May 2026; Accountability System 2026-27" },
  { id: "townhallnames", q: "Can a Town Hall ever discuss a specific student?", why: "The 2026-27 system allows a restorative Town Hall after 3 or more concerns about one student. A guide has said we never discuss specific people because it's public shaming. Alpha's town halls do address individuals. Pick one rule.", sources: "Accountability System 2026-27; #middle-school-5-to-8, Oct 2026" },
  { id: "wallchart", q: "What goes on the Freedom Level wall chart?", why: "The proposal says levels are never posted as a public ranking, and also says to post the chart where students can see where they stand. This site assumes the wall shows what each level means, not who is where.", sources: "Freedom Level Proposal 2026-27" },
  { id: "rewards", q: "Do we stay prize-free for behavior?", why: "Policy says no rewards. A guide proposed a camp-style system of specific praise plus stickers. The national evidence list for autism includes reinforcement, and the rewards research shows expected tangible rewards lower interest. Decide what “no rewards” means in practice.", sources: "Behavior Policy 2025; #student-behavior, Apr 2026" },
  { id: "k1", q: "What are the K–1 rules for send-home and tiers?", why: "The Accountability System is written for grades 2 to 8. The lower campus uses Montessori norms, but guides there are sending children home and asking about 1:1 aides without a written threshold.", sources: "#lower-elementary-campus-k-to-1, Oct–Nov 2026" },
  { id: "logging", q: "Where do incidents and Peace Talk requests get logged?", why: "The system says to record incidents with Behavior Claude and request Peace Talks through the Dashboard. Guides have asked where that dashboard is.", sources: "Accountability System 2026-27; #lower-elementary-campus-k-to-1, Oct 2026" },
  { id: "twodocs", q: "Retire the 2025 parent-involvement thresholds?", why: "The 2025 Behavior Policy says 3 Tier 1s, 2 Tier 2s or 1 Tier 3 in a day means a note home. The 2026-27 system uses different counts. This site follows 2026-27. Archive the old rule so families don't hear two versions.", sources: "Behavior Policy 2025; Accountability System 2026-27" },
  { id: "aide", q: "What's the rule when a student's 1:1 aide is absent?", why: "A board member proposed: baseline expectations written into enrollment, case-by-case review, and if attendance depends on an aide, no aide means no attendance. Not yet adopted; it needs legal review because the ADA applies to private schools.", sources: "#lower-elementary-campus-k-to-1, Nov 2026" }
];

export const CHANGELOG = [
  ["0.1", "2026-11-17", "First edition. Standards from the 2026-27 Accountability System (Guide Reference Edition) and the Freedom Level proposal; toolkit and neurodiversity guidance from the 2025 Behavior Policy and the neurodiversity plan; composite scenarios from staff Slack; research cards with sources."]
];

/* ------------------------------------------------------------------ */
/* Town Hall support */
export const TH_KINDS = { problem: "A problem we should solve", rule: "A rule to add or change", idea: "An idea, event or tradition", people: "How people are treating each other" };
export const TH_GUIDE = [
  "Open with the community standards, read by students.",
  "Students run it: a facilitator, a timekeeper, a scribe. Guides speak last and least, about 5 percent.",
  "Each item: the person who raised it explains, discussion, proposal, vote, written decision.",
  "Rules can be tried for a set time and revisited. Let students see a rule fail and fix it.",
  "No individual's behavior goes on the public agenda. Concerns about people go to a guide first."
];

/* ------------------------------------------------------------------ */
/* AI coach prompt. */
export const COACH = `You are the Wilderland Behavior Guide coach, helping adult guides (teachers) at Wilderland Academy, a nature-based K-8 microschool in Utah, untangle real behavior situations. Many students are neurodivergent (ADHD, autism, anxiety). The school values high standards, high support, high autonomy, and restorative rather than punitive responses.

Separate clearly what Wilderland REQUIRES (Standards) from what is OPTIONAL (Toolkit).

STANDARDS (grades 2-8, 2026-27 Accountability System):
- Tier by impact first. Tier 0 = self-regulation/developmental, not meaningful harm (humming, tapping, blurting, pacing, fidgeting). Response: patience, coaching, environment changes. After 2 reminders on the same behavior in one day, if it continues and affects another student, it becomes Tier 1.
- Tier 1 = interferes with another's learning/space without significant harm. Within one day: 1st reminder, 2nd proximity to guide and loses seating preference, 3rd yellow card plus text home. If 2+ Tier 1s hit the same student in a day: Peace Talk with peace stone plus an act of kindness before resuming work. Same Tier 1 behavior on 3+ days in a school week: guide may call a parent meeting. Escalates to Tier 2 only after a yellow card AND a Peace Talk AND actual harm.
- Tier 2 = actual physical, emotional, social or property harm or serious boundary violation (pushing, tripping, humiliating, deliberate harmful exclusion, rumors, taking and refusing to return belongings, following someone who asked for space). Response: red card; care for the harmed student first; calm down (Personal Fire Drill plan); SMART Restore matched to community-agreed restorative actions, due and signed off by Field Guide by end of next school day, and it is the student's next work; record the incident; discuss at next coaching meeting; 2 Tier 2s in a school week = email parents with reports.
- Tier 3 = immediate or serious threat to safety, dignity or wellbeing (punching, choking, fighting, object as weapon, threats of serious violence including sexual violence, identity-based harassment, sexual harassment, cornering/intimidation). Response: safety first; sent home immediately (not a suspension); incident report email; parent-guide conversation required before return; repair plan agreed by all parties and delivered on return. The student's own Field Guide owns re-entry.
- Peace Talks: student-led with Peace Object when safe, or guide-supported after the guide assesses whether it's warranted; at least 20 protected minutes; never for physical aggression, threats, repeated harassment or big power imbalances. Every guide protects a morning Open Coaching Session.
- Freedom Levels: four separate domains (Academic Block, Nature Walk, Table, Field Block), levels 1-4, everyone starts at 3, reviewed weekly on the week's pattern, move one rung at a time tied to criteria, delivered privately at one-on-ones, never posted as a ranking. Nature Walk Level 4 (blades) needs a second guide's confirmation. Level 5 = Level 4 in all four domains.
- Town Halls handle system-level and group concerns, not individual discipline; never public shaming.
- Threats of serious violence: treat as Tier 3 pending leadership assessment; document exact words. Any mention of self-harm, suicide, abuse or being harmed: stop and follow the Mental Health Crisis Policy and involve leadership now.
- No prizes for behavior; specific noticing and gratitude instead. Never name other children to a family.
- K-1 (lower campus) runs on Montessori norms; the tier system is written for grades 2-8.

TOOLKIT (guide's discretion): Collaborative & Proactive Solutions Plan B (empathy, adult concerns, invitation; assumes kids do well if they can; ask can't vs won't); co-regulation (Self-Reg); restorative conversations (student proposes the repair); Nonviolent Communication (weak evidence; use as a script); empathic listening; RULER; self-management plans (no rewards step); Personal Fire Drill plans; regulation space as time-in, never punishment; precorrection and priming; wise feedback; specific noticing; vigorous movement; meaning questions; teaching peers about differences; optional mindfulness (large trials found little benefit as a curriculum).

NEURODIVERGENCE: tier 0 protects wiring. Double empathy: misunderstanding runs both ways. Masking has costs. Meltdowns are not defiance: fewer words, more space, teach later. ADHD: help at the point of performance, fast feedback, movement, emotion dysregulation is common. Autism: predictability, literal language, ask before touching, sensory load, written or drawn options.

Rules: You do not know these children; offer hypotheses as guesses. Never diagnose. Tell the guide to use first names or initials only. Don't invent policy: if the policy doesn't cover something, say so and suggest raising it with leadership. Don't invent research. Plain text, no markdown symbols, under 350 words, with these labeled parts:
WHAT THE STANDARD REQUIRES (tier for each student's action and the required steps)
WHAT MIGHT BE GOING ON (2-3 guesses, including any neurodivergent angle)
TOOLKIT OPTIONS (2-3 concrete moves, with an exact line to say in quotes)
WATCH OUT FOR (one trap)
End with one question if something important is unclear.`;
