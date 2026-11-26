// Wilderland Behavior Guide (staff): content.
// This is the living document. Edit text here; app.js only lays it out.
// Sources: Wilderland Behavior Policy (Notion, Aug 2025), Community Accountability System, Guide Reference Edition
// (Aug 2026), Revised Freedom Level Proposal 2026-27, How Wilderland Supports Neurodivergent Children (Notion),
// #student-behavior and operational-meeting Slack threads, and the research listed in REFS.
// Scenarios are composites. Names and identifying details are removed on purpose. Keep it that way.

export const VERSION = { n: "0.5", date: "2026-11-25", note: "Tier 3 send-home is required after an earlier Tier 3 this school year or last, otherwise the guide's call. Earlier: Renamed the Behavior Guide, with a valley map. Earlier: K–1 gets its own mechanics; Inclusive Excellence leads the neurodiversity guidance. Earlier: Board-president decisions added on the Tier 3 full day away, K–1 send-home, Town Halls, privileges versus rewards, and the normalization period." };

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
  pyramid: { t: "The Pyramid Model for young children (Hemmeter et al., 2016, 2021)", s: "moderate", f: "In two randomized trials in public pre-K classrooms (40 classrooms and 494 children, then 92 classrooms and 997 children), teachers who were trained and coached in Pyramid Model practices used them more, and children had better social skills and less problem behavior. The model puts relationships, a predictable room and explicitly taught expectations at the base, with targeted help and individual plans for the few who need more.", c: "Pre-K rather than K–1, coaching was part of the package, and outcomes were rated by teachers who knew which group they were in.", u: "https://www.challengingbehavior.org/pyramid-model/overview/research/" },
  exclude: { t: "Exclusion in the early years (HHS and Education policy statement, 2014)", s: "mixed", f: "Federal guidance recommends preventing, severely limiting and eventually eliminating suspension and expulsion for young children, citing high preschool expulsion rates, large disparities by race and sex, and links to later school failure. It recommends prevention, coaching for teachers and clear policies applied without bias.", c: "Most of the evidence that exclusion harms young children is correlational: children who are sent away also differ in other ways.", u: "https://www.zerotothree.org/wp-content/uploads/2022/12/Policy-Statement-on-Expulsion-and-Suspension-Policies-in-Early-Childhood-Settings.pdf" },
  aggress: { t: "Physical aggression declines with age (Côté, Tremblay et al., 2006)", s: "strong", f: "A national longitudinal study of Canadian children found that physical aggression peaks in toddlerhood and declines through the elementary years for most children. Hitting and pushing at five or six is common and usually fades with teaching; a small group stays high and needs earlier, stronger support.", c: "Trajectories come from parent and teacher reports. Common doesn't mean harmless to the child who was hit.", u: "https://doi.org/10.1007/s10802-005-9001-z" },
  brief: { t: "Brief, immediate consequences for young children (Kazdin)", s: "moderate", f: "For young children, a short break from attention works within the first minute or two, and it needs to follow the behavior right away. Longer or delayed consequences add little. A consequence that arrives hours later rarely connects to the behavior for a five-year-old.", c: "Mostly parent-training and clinical research. A calm-down spot at school is a close cousin of time-out, not the same procedure.", u: "https://psychologybenefits.org/2014/12/10/what-every-parent-should-know-about-timeouts/" },
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
    rules: ["Safety first: protect the harmed student and the group.", "When the student already has a history of Tier 3 behavior (an earlier Tier 3 this school year or last), sending home is required, not a judgment call. Keeping that student at school because it's easier that day teaches the whole group that hurting someone has no real cost.", "With no earlier Tier 3, the guide decides whether to send the student home. Either way, the incident report, parent-guide conversation and repair plan still happen.", "A student who is sent home goes right away. It is not a suspension and never framed as one. It's time to decompress away from what set things off.", "A guide doesn't have to see it. If the student admits it, respond to it by the tier, the same as if you had seen it. Write “reported, and the student said they did it” in the incident report.", "A student sent home stays away for a full school day. A send-home late in the day means the next school day away too.", "Same rules in every band, K–8. K–1 does not get a softer version.", "The guide emails an incident report to the parents.", "A parent-guide conversation is required before the student returns.", "Everyone involved agrees on a plan for repair before return, and the student delivers it on return.", "The student's own Field Guide owns the return conversation, even if a substitute handled the incident."],
    nd: "The way back matters more than the way out. Return with a predictable script: who will meet them at the door, where they'll sit, what the first ten minutes look like. Surprise re-entry undoes the reset.",
    src: "Accountability System 2026-27; board president decision, Nov 2026" },
  { id: "parents", icon: "📨", name: "When families hear from us", short: "The same thresholds for every family.",
    rules: ["Yellow card (third Tier 1 in a day): text home.", "Same Tier 1 behavior on 3 or more days in a school week: the guide may call a parent meeting.", "Two Tier 2 incidents in one school week: email with all the incident reports.", "Tier 3: incident report email, then a parent-guide conversation before return.", "Never name other children to a family. Describe what happened around their child without identifying anyone else."],
    nd: "Families of neurodivergent children often hear only bad news from school. Pair every notice with one specific thing their child did well that week.",
    src: "Accountability System 2026-27; Parent Concern Protocol" },
  { id: "freedom", icon: "🧭", name: "Freedom Levels", short: "Four separate domains, weekly review, one rung at a time, delivered privately.",
    rules: ["Every student starts at Level 3 in each of the four domains: Academic Block, Nature Walk, Table, Field Block.", "Review weekly. Look for the week's pattern, not one moment.", "Move one rung at a time and tie the change to the domain's criteria.", "Share levels privately at the one-on-one. Never post a ranking or announce levels to the group.", "Nature Walk Level 4 (carrying hatchet, knife or saw) must be confirmed by a second guide.", "Level 5 is earned automatically when all four domains are at Level 4."],
    nd: "Before stepping a child down, ask: can't or won't? If the barrier is a skill or a sensory load, change the support first. Keep the standard; change the route.",
    src: "Freedom Level Proposal 2026-27", link: "freedom" },
  { id: "safety", icon: "🚨", name: "Threats and crises go up, not around", short: "Some moments are beyond coaching.",
    rules: ["Treat any threat of serious violence, including sexual violence or weapons, as Tier 3 until leadership has assessed it. Document the exact words and tell leadership the same day. Sending home follows the Tier 3 rule: required if the student has had a Tier 3 earlier this school year or last, otherwise your call.", "If a student talks or writes about hurting themselves, wanting to die, or being harmed by someone, stop coaching and follow the Mental Health Crisis Policy now.", "Don't promise a child secrecy about safety."],
    nd: "Some neurodivergent children repeat shocking phrases they heard without grasping their weight. That changes how you teach afterward. It doesn't change the first steps.",
    src: "Accountability System 2026-27; Mental Health Crisis Policy", research: ["cstag"] },
  { id: "townhall", icon: "🏛️", name: "Town Halls", short: "For the whole community's problems, run by students.",
    rules: ["Town Halls handle system-level and group concerns, not individual discipline. The old student judicial system is archived this year.", "A Town Hall can discuss a specific student when the community has a concern about them. Keep the talk on solving the problem together: what is happening, who is affected, what would help. Avoid discussing the behavior as a trait or a verdict.", "Students submit agenda items through the Suggestion Box. Guides review them on the Town Hall page of this site.", "If 3 or more concerns about the same student arrive, the guide and class president may convene a restorative Town Hall. Its purpose is to name the impact and repair it, never to shame.", "Aim for students doing about 95 percent of the talking."],
    nd: "Public discussion of one child lands hardest on socially sensitive and neurodivergent students, and peer judgment can trigger more shame than adult correction. Tell the student beforehand what will be discussed, let them help word the problem, and let them help with the solution or pass.",
    src: "Accountability System 2026-27; board president decision, Nov 2026", research: ["townhall", "rc"], link: "townhall" },
  { id: "record", icon: "🗂️", name: "Write it down", short: "Patterns are invisible without records.",
    rules: ["Document every Tier 2 and Tier 3, and any repeated Tier 1, the same day.", "Record what you saw and heard, word for word where it matters. Leave out labels and guesses about motive.", "Use Behavior Claude to draft incident reports and parent emails, then read and edit before sending."],
    nd: "Records help you spot triggers: time of day, transitions, noise, hunger, a certain peer. That's antecedent data, the first step in most evidence-based plans.",
    src: "Accountability System 2026-27", open: "logging", research: ["ncaep"] },
  { id: "norewards", icon: "🌱", name: "No prizes for behavior", short: "We skip sticker charts and prizes for behavior. We give specific feedback and gratitude.",
    rules: ["Don't trade prizes, points or treats for good behavior.", "Freedom Levels are not rewards. They pair privileges with the behavior that makes them safe and workable, such as more independence when a student shows they handle it well. Explain them that way.", "Do notice it out loud, specifically: what they did and why it mattered.", "Thank instead of praising the person: “Thanks for giving up your seat for her” beats “Good boy.”"],
    nd: "Some autistic and ADHD students rely on clear, immediate feedback more than peers do. No prizes doesn't mean no feedback. Make your notice frequent and concrete.",
    src: "Behavior Policy 2025; board president decision, Nov 2026", research: ["rewards", "praise"] },
  { id: "normalize", icon: "🌤️", name: "The normalization period", short: "In every band, new students get time to settle before behavior is judged against the full standard.",
    rules: ["Every band, K–8, has a normalization period in which a new student's behavior can settle into the community's norms.", "Returning students do not need one.", "Normalization is time and support, not a pass on safety. Anything that hurts someone still gets a safety response."],
    nd: "A new student may be masking, overloaded or testing whether the place is safe. Predictable routines, a named adult and fewer surprises in the first weeks do more than extra rules.",
    src: "Board president decision, Nov 2026", open: "normalize" }
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
    response: ["Safety first.", "Sending home: required when the student already has a history of Tier 3 behavior (an earlier Tier 3 this school year or last). Otherwise it's the guide's call.", "Sent home means right away, for a full school day (the next school day if it happens late in the day).", "Guide emails the incident report.", "Parent-guide conversation (before return, if sent home).", "A repair plan agreed by all parties, delivered on return or, if the student stayed, the next school day."],
    escalate: "Any single incident. No count required. It counts when the student admits it, even if no guide saw it.",
    nd: "A meltdown is not a tantrum and it is not a choice. If a meltdown causes Tier 3 harm, the safety response is the same, and the return plan should focus on what overloaded the student and how to catch it earlier next time." }
];

/* Behaviors for the Tier Sorter game: [text, tier] */
export const SORT = [
  ["Humming while doing math, not bothering anyone nearby", 0], ["Blurting out an answer during a group lesson", 0], ["Pacing at the back of the room while thinking", 0], ["Forgetting to push in a chair again", 0], ["Narrating their own Lego build out loud", 0], ["Strong body odor", 0],
  ["Closing a classmate's laptop as a joke", 1], ["Hiding a classmate's pencil case", 1], ["Laughing at someone's drawing while they work", 1], ["Repeatedly chatting to someone who has asked to focus", 1], ["Changing a setting on another student's computer", 1], ["Talking over another student in circle", 1],
  ["Shoving someone off the bench", 2], ["Telling the group not to play with one particular student", 2], ["Making fun of a classmate's family in front of the group", 2], ["Taking someone's cards and refusing to give them back", 2], ["Following a student who has clearly asked for space", 2], ["Spreading a rumor about a classmate", 2], ["Tripping someone on the trail", 2],
  ["Punching a classmate in the stomach", 3], ["Saying they're going to bring a gun and shoot someone's family", 3], ["Throwing a heavy stick at a classmate", 3], ["Putting someone in a chokehold", 3], ["Pantsing a classmate", 3], ["Cornering a younger student behind the shed to scare them", 3], ["Calling a classmate a slur about their race", 3],
  ["Sharpening a pencil for the third time during a lesson", 0], ["Standing a little too close to a classmate in line, not aggressively", 0],
  ["Moving a classmate's materials off their table while they're working", 1], ["Blocking a classmate from getting to their cubby on purpose", 2]
];

/* Standard or Toolkit? [statement, "standard"|"toolkit", why] */
export const SORTKIND = [
  ["Sending a student home after they punch someone, when they already had a Tier 3 this school year or last", "standard", "A Tier 3 after an earlier one this school year or last always means an immediate send-home."],
  ["Sending a student home after a Tier 3, with no earlier Tier 3 this school year or last", "toolkit", "With no earlier Tier 3, sending home is the guide's call. The incident report, parent conversation and repair plan happen either way."],
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
  ["Following the crisis policy when a student writes about wanting to die", "standard", "Never coach through a safety disclosure alone."],
  ["Delivering a red card right away after a Tier 2", "standard", "The first step of every Tier 2 response."],
  ["Keeping an Open Coaching Session in your morning schedule", "standard", "Every guide protects one. Don't fill it with prep or admin."],
  ["Reviewing Freedom Levels weekly, on the week's pattern", "standard", "Weekly, on the pattern, never on one moment."],
  ["Recording a Tier 2 incident the same day", "standard", "Every Tier 2 and Tier 3 is documented the same day."],
  ["Describing an incident to a family without naming the other children", "standard", "Never name other children to a family."],
  ["Giving a guide-supported Peace Talk at least 20 protected minutes", "standard", "At least 20 minutes, with the guide as a neutral mediator."],
  ["Having the student's own Field Guide lead the return after a Tier 3", "standard", "Even if a substitute handled the incident."],
  ["Offering a short, optional mindfulness practice to a student who finds it calming", "toolkit", "One option among many. A mindfulness curriculum did no better than ordinary SEL in the largest trial."],
  ["Teaching the whole band about ADHD and autism without singling anyone out", "toolkit", "A good move where differences have become a target. Your call."],
  ["Writing a Personal Fire Drill plan with a student and their family", "toolkit", "Useful for some kids. Don't make it a requirement for everyone."],
  ["Using the four-part Nonviolent Communication script to help a student say something hard", "toolkit", "A communication script with a weak research base. Use it when it helps."],
  ["Running the band up a hill before seated work", "toolkit", "Vigorous movement is fuel. When and how is your judgment."],
  ["Asking the six meaning questions slowly during a blowup", "toolkit", "A choice for blowups that run on a misreading."],
  ["Opening hard feedback with the wise-feedback sentence", "toolkit", "Good practice, your call. It needs real critique and help after it."],
  ["Reflecting back what a student said before anything else", "toolkit", "Empathic listening is an option. Don't stay there so long that the standard never gets named."]
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
  { id: "field", name: "Field Block", sub: "Afternoon Life Skill Labs and self-directed projects", up: "Be responsible and keep moving your projects forward.",
    L: { 4: "Take your work anywhere, inside or outside, away from a guide, and pursue a personal project on your own, such as chess or BandLab.", 3: "Move freely within the Life Skill Lab structure and work with the students you choose, staying in the guide's view.", 2: "The guide sets your work, your seat, and who you work with.", 1: "Stay directly with a guide, who directs your work." },
    nd: "A special interest is a motor. A student who stalls in Life Skill Labs may fly when the project runs through what they already love." }
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
    trap: "A circle convened to make one student face the group isn't restorative. It's a trial.", extra: "Restorative practices are optional here. We don't mandate them. For middle school, lean on the Mentor Mindset approaches, which were built for that age group." },
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
    standard: ["Safety first: check the injured student; separate the group.", "Tier 3 for the throw: incident email, parent-guide conversation and repair plan. Send home if the thrower already had a Tier 3 this school year or last; otherwise it's your call.", "Get each student's account separately, before any group talk, so the loudest story doesn't become the official one.", "Tier 2 for repeated taunting (repeatedly targeting someone): red card, SMART Restore.", "Record all of it the same day."],
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
    opts: [["Treat it as a Tier 3: document the exact words, involve leadership that day, decide on sending home, require a parent conversation, and assess how serious the threat is.", true, "Serious threats are Tier 3 until assessed. Most student threats turn out to be transient, but you find out by assessing, not assuming."], ["Ask the two boys to have a Peace Talk about respect.", false, "Peace Talks are explicitly not for threats or power imbalances."], ["Tell the parents kids say things like that at this age.", false, "Most threats are transient, but dismissing one without assessing it is the error the research warns about."]],
    standard: ["Threats of serious violence, including sexual violence: Tier 3, incident report, parent-guide conversation, repair plan. Sending home is required if the student has had a Tier 3 earlier this school year or last, otherwise the guide's call.", "Document the exact words, who heard them, when and where.", "Tell leadership the same day. Leadership decides whether outside professionals are needed.", "Tell the reporting family what you're doing, without details about the other child.", "The taking and name-calling are their own Tier 2s."],
    toolkit: ["Use the transient vs substantive distinction: was there intent, a plan, a target, access to means? Was it anger or bravado that the student can explain and retract?", "On return, teach the impact of words like these directly. Some kids genuinely don't understand how they land.", "Check on the boy who was targeted. Being assertive shouldn't have been his job."],
    nd: "Some neurodivergent children echo words from games, videos or older kids without grasping their weight. That changes what you teach afterward, not the safety steps now.",
    trap: "Two errors, both common: panicking into a permanent judgment of the child, or shrugging it off as kids being kids.", research: ["cstag"] },
  { id: "optout", title: "The opt-out", band: "5–8", where: "Academics and Life Skill Labs",
    story: "A capable middle schooler won't engage with anything. Freedom Levels don't move him. Blazes don't interest him. Every Life Skill Lab gets “I don't like that thing.” He's not disruptive. He just isn't trying, and it's starting to look like a choice.",
    q: "What's the most likely read?",
    opts: [["He's lazy and needs firmer consequences.", false, "Labels harden the pattern and the research says firmer consequences rarely move this kind of student."], ["He may be protecting himself: not trying is safer than trying and visibly failing. Lower the public stakes and build trust before raising the bar.", true, "Self-handicapping is well documented, especially where ability is on public display."], ["He's not a good fit for a self-directed school.", false, "Maybe, eventually. But if a system only works for kids who already buy in, that's a system problem."]],
    standard: ["Effort alone isn't a behavior tier. Don't use the tier system to force engagement.", "Freedom Level changes still follow the criteria. Holding steady is a legitimate outcome."],
    toolkit: ["Make expectations less public. Private goals, private progress, private wins.", "Daily two-minute conversations about anything he cares about, with no agenda.", "Wise feedback when you do give critique.", "Find one real competence and give it a real job in front of peers.", "See the Mentor Mindset Field Guide's Rough Terrain stop."],
    nd: "Demand avoidance driven by anxiety can look exactly like this. Try declarative language (“I notice the saw is free”) instead of direct demands (“Go use the saw”), and see what changes.",
    trap: "Adding one more incentive system. He's already told you incentives aren't the lever.", research: ["handicap", "wise", "rewards"] },
  { id: "late", title: "A Tier 3 at 2:45", band: "All", where: "End of day",
    story: "A Tier 3 happens fifteen minutes before dismissal. The student already had a Tier 3 this school year or last, so the guide sends them home, and they're picked up at 3:00. Tomorrow is a normal school day, and next week is the showcase.",
    q: "What does the standard require now?",
    opts: [["Nothing. The student was sent home at 3:00, so the consequence is served.", false, "A send-home means a full school day away. Leaving fifteen minutes early doesn't count as one."], ["The student stays home tomorrow too, the guide emails an incident report, and a parent-guide conversation and repair plan come before return.", true, "A late-day send-home still means a full school day away, so the return is the day after tomorrow at the earliest."], ["A short call home tonight, and the student returns tomorrow if the parents agree.", false, "The call is part of it, but the full day away isn't up to a guide or a parent to waive."]],
    standard: ["Incident report email the same day.", "A full school day away. After a late-day Tier 3, that is the next school day.", "Parent-guide conversation before return.", "Repair plan agreed and delivered on return.", "Field Guide owns the return conversation."],
    toolkit: ["Hold the parent conversation by phone that evening if the family can, so the return day is spent on the repair plan, not on scheduling."],
    nd: "Unpredictability about whether they're coming back tomorrow is its own stressor. Tell the student and family exactly which day they return and who will meet them.",
    trap: "Different guides making different calls on timing. That's the inconsistency families notice first.", research: ["suspend"] },
  { id: "sub", title: "The substitute's afternoon", band: "All", where: "Any",
    story: "A parent volunteer is covering. Two students fight; one punches the other. The volunteer calls home and the student is picked up. The next morning, nobody is sure who is meeting with him.",
    q: "Who owns the return?",
    opts: [["The volunteer, since they saw it.", false, "Volunteers and subs handle safety and the report. They don't own re-entry."], ["The student's own Field Guide, with a clear handoff from whoever handled the incident before the next morning.", true, "Relationship carries the return conversation."], ["Whoever is free first in the morning.", false, "That's how returns get skipped."]],
    standard: ["The adult on duty handles immediate safety, the send-home (required after an earlier Tier 3 this school year or last) and the incident report.", "Hand off to the student's Field Guide the same day, in writing.", "No return without the parent-guide conversation and repair plan."],
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
    opts: [["Write him up at Tier 2 every time and stop there.", false, "K–1 uses the same tiers and the same send-home rules as every other band, but a tier only names the response. A six-year-old's impulsivity also needs a change to the room and a plan, or the same thing happens tomorrow."], ["Safety first, then the environment: give the kids real things to play with, remove what's tempting and fragile, and start collecting pattern data on the one student.", true, "Change the room before trying to change the child. Data supports the next decision."], ["Ask his parents to keep him home until he's calmer.", false, "Possibly part of a later plan, but not a first move without data and a conversation."]],
    standard: ["Classify each incident by the same tier definitions used in grades 2 to 8, and follow that tier's steps. If it is a Tier 3, the send-home rules are the same: a full school day away, a parent-guide conversation before return, a repair plan.", "Document behaviors and adult responses daily so decisions about support rest on patterns, not memory."],
    toolkit: ["Loose parts, swings, jump ropes, a mud kitchen: things to do instead of things to break.", "Precorrection before transitions and recess.", "A simplified Plan B: “I noticed you have a hard time when your friend plays with someone else. What's up?”"],
    nd: "Sensory seeking, impulsivity and fixation on one friend can all be part of ADHD or autism in young children. Vigorous movement and predictable routines are among the most useful supports.",
    trap: "Relying on volunteers who change daily. Inconsistency is a trigger in itself.", research: ["ncaep", "move"] },
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

/* Extra scenarios for the Knot Untangler badge only (not shown on the Knots page), so each of its three question sets
   has scenarios a guide hasn't just read. Same shape as KNOTS: opts are [text, correct, why]. */
export const QUIZ_KNOTS = [
  { id: "q-third", title: "Before morning snack", story: "In grades 2 to 4, a boy has already had a reminder for talking over others and then moved to sit by the guide. At 10:15 he closes a classmate's laptop as a joke.", q: "What happens now?",
    opts: [["A yellow card and a text home. It's his third Tier 1 today.", true, "Reminder, then proximity, then a yellow card and a text home on the third Tier 1 in a day."], ["A red card and a SMART Restore.", false, "Closing a laptop as a joke is Tier 1 disruption, not harm. Red cards are for Tier 2."], ["Call a parent meeting today.", false, "A parent meeting is for the same Tier 1 behavior on 3 or more days in a school week."]] },
  { id: "q-shove", title: "Peace Talk, please", story: "A student was shoved off the bench at lunch, hard. He asks for a Peace Talk with the boy who shoved him.", q: "What's the right response?",
    opts: [["Let them set up a student-led Peace Talk after lunch.", false, "A Peace Talk is never the right tool for physical aggression."], ["Treat the shove as Tier 2: red card, care for the student who was shoved first, then a SMART Restore once the other boy is calm.", true, "Shoving is Tier 2 harm. Care for the harmed student comes first."], ["Send the boy who shoved home for a full day.", false, "Tier 3 is for immediate or serious threats, like punching or choking. A shove off a bench is Tier 2."]] },
  { id: "q-announce", title: "Levels at morning meeting", story: "A co-guide suggests reading out everyone's new Freedom Levels at morning meeting, to motivate the students who dropped.", q: "What do you say?",
    opts: [["Good idea, as long as it's done kindly.", false, "Levels are never announced to the group or posted as a ranking."], ["No. Levels are shared privately at each student's one-on-one, tied to the domain's criteria.", true, "A level change is a private conversation, not a public mark."], ["Only announce the students who went up.", false, "Announcing some still makes the rest public by omission."]] },
  { id: "q-new", title: "Week two", story: "A new fifth grader in his second week blurts answers, wanders during focus time, and on Thursday pushes a classmate hard enough that she falls.", q: "How does the normalization period apply?",
    opts: [["It covers everything. New students get a pass until they settle.", false, "Normalization is time and support, not a pass on safety."], ["Give time and support for the blurting and wandering, and still respond to the push as harm: Tier 2.", true, "Anything that hurts someone still gets a safety response, even during normalization."], ["New students don't get a normalization period in grades 5 to 8.", false, "Every band, K–8, has one for new students. Returning students don't need one."]] },
  { id: "q-restore", title: "The unfinished restore", story: "A student had a Tier 2 on Monday. On Wednesday her SMART Restore still isn't done, and she wants to join the afternoon Life Skill Lab.", q: "What does the standard say?",
    opts: [["Let her go. The incident was two days ago.", false, "The restore is her next work, and it was due by the end of Tuesday."], ["The restore comes first. Normal activities wait until her Field Guide signs it off.", true, "The SMART Restore is the student's next work; normal activities wait for the sign-off."], ["It becomes a Tier 3 for not finishing.", false, "Tier is set by impact, not by an overdue restore."]] },
  { id: "q-journal", title: "A line in the reflection", story: "Reading a fourth grader's weekly reflection, you find: “I wish I wasn't alive.” She asks you not to tell anyone.", q: "What do you do?",
    opts: [["Promise to keep it between you so she keeps trusting you.", false, "Never promise a child secrecy about safety."], ["Stop and follow the Mental Health Crisis Policy now, and involve leadership the same day.", true, "Any mention of wanting to die goes straight to the crisis policy. It's beyond coaching."], ["Bring it up at next week's 1:1.", false, "Safety disclosures don't wait."]] }
];

/* ------------------------------------------------------------------ */
/* NEURODIVERGENT CHILDREN: the Different Wiring page. */
export const ND = {
  why: "Families often choose Wilderland because their child didn't fit a conventional school. So we have more neurodivergent students than an average school, and our hypersocial, self-directed setting is both a gift and a test for them. Nature-based and self-directed learning were chosen partly with ADHD and autism in mind.",
  principles: [
    ["Inclusive Excellence", "The same high bar for every child, and as much support as it takes for each one to reach it. A label changes the route, never the standard."],
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
/* TRAINING: modules and questions. Each question: [prompt, [options], correctIndex, why].
   Every module has three separate question sets; each attempt takes the next one (behavior/app.js). The sorting
   modules split their pools (SORT, SORTKIND, KNOTS plus QUIZ_KNOTS) into three sets the same way every time. */
export const MODULES = [
  { id: "tiers", name: "Tier Tracker", icon: "🪜", pass: 8, blurb: "Sort real behaviors into Tiers 0 to 3.", kind: "sort" },
  { id: "kinds", name: "Standard Bearer", icon: "📏", pass: 8, blurb: "Tell the standards from the toolkit.", kind: "kinds" },
  { id: "counts", name: "Exact Counts", icon: "🔢", pass: 5, blurb: "The numbers that keep us consistent.", kind: "mcq",
    sets: [[
      ["How many reminders on the same Tier 0 behavior in a day before it can become Tier 1 (if it affects another student)?", ["1", "2", "3", "5"], 1, "After 2 reminders or coaching attempts, if it continues and affects someone."],
      ["Which Tier 1 offense in a single day earns a yellow card and a text home?", ["1st", "2nd", "3rd", "4th"], 2, "Reminder, proximity, then yellow card."],
      ["When can a guide call a parent meeting for Tier 1?", ["After any yellow card", "When the same Tier 1 behavior happens on 3 or more days in a school week", "After 10 Tier 1s in a month", "Never for Tier 1"], 1, "3 or more days within 5 school days."],
      ["When is a Tier 2 SMART Restore due?", ["Before lunch", "By the end of the following school day", "Within a week", "Whenever the student is ready"], 1, "End of the following school day, signed off by the Field Guide."],
      ["How many Tier 2 incidents in one school week trigger a parent email?", ["1", "2", "3", "4"], 1, "Two in a week: email with all incident reports."],
      ["How many concerns about the same student can lead to a restorative Town Hall?", ["1", "2", "3 or more", "Never"], 2, "3 or more, convened by the guide and class president, never to shame."],
      ["How much protected time does a guide-supported Peace Talk get?", ["5 minutes", "At least 20 minutes", "An hour", "Whatever's left before lunch"], 1, "At least 20 protected minutes."]
    ], [
      ["What happens on the 2nd Tier 1 in a day?", ["A reminder", "Move closer to the guide and lose seating preference", "A yellow card", "A red card"], 1, "1st: reminder. 2nd: proximity and loss of seating preference. 3rd: yellow card and a text home."],
      ["2 or more Tier 1s against the same student in one day lead to…", ["A parent meeting", "A Peace Talk with the peace stone and an act of kindness for that student before scheduled work resumes", "A red card", "Nothing extra"], 1, "Repair with the person affected comes before scheduled work."],
      ["A Tier 3 happens at 2:40 p.m. on a Tuesday. What's the earliest the student can return?", ["Wednesday morning", "Thursday, after the parent-guide conversation", "The following Monday", "Whenever the parents decide"], 1, "A Tier 3 means a full school day away, so a late-day Tier 3 means the next school day too. Return needs the parent-guide conversation and a repair plan."],
      ["A Tier 2 happens Thursday afternoon. When is the SMART Restore due?", ["At dismissal Thursday", "By the end of the school day Friday", "Next Monday", "Next Thursday"], 1, "By the end of the following school day, signed off by the Field Guide."],
      ["A Tier 1 behavior becomes Tier 2 only when…", ["It happens twice", "A yellow card and a Peace Talk have both been used and the impact turns into actual harm", "A parent complains", "The guide is out of patience"], 1, "Escalation follows pattern and impact."],
      ["At a Town Hall, students aim to do about how much of the talking?", ["50%", "75%", "About 95%", "100%; guides don't speak"], 2, "Guides speak last and least, about 5 percent."],
      ["How long is a Tier 3 send-home?", ["The rest of that day only", "A full school day", "Three days", "Until the student apologizes"], 1, "Same rule in every band, K–8. It's not a suspension and never framed as one."]
    ], [
      ["A student hums during work, has had 2 reminders today, keeps humming, and his tablemate can't concentrate. It's now…", ["Still Tier 0", "Tier 1", "Tier 2", "Tier 3"], 1, "After 2 reminders on the same behavior in a day, if it continues and affects another student, it becomes Tier 1."],
      ["The same Tier 1 behavior shows up Monday, Wednesday and Thursday. The guide…", ["Must send the student home", "May call a parent meeting", "Gives a red card", "Waits for a fourth day"], 1, "3 or more days in a school week."],
      ["After a Tier 2, who gets the guide's care first?", ["The student who caused the harm", "The harmed student: safety, feelings, dignity", "The bystanders", "The parents"], 1, "Step two of every Tier 2 response, right after the red card."],
      ["Two Tier 2s in one school week. What goes home?", ["A text", "An email to the parents with all the incident reports", "A phone call only", "Nothing until a third"], 1, "The same threshold for every family."],
      ["Before a student returns from a Tier 3, which is required?", ["A written apology", "A parent-guide conversation and an agreed repair plan", "A Town Hall", "A Freedom Level drop"], 1, "No return without both."],
      ["When are Tier 2 and Tier 3 incidents documented?", ["The same day", "By Friday", "At the next coaching meeting", "Only if parents ask"], 0, "Patterns are invisible without records."],
      ["How long is a K–1 Peace Talk?", ["Under five minutes, always guide-led", "At least 20 minutes", "As long as it takes", "K–1 doesn't use Peace Talks"], 0, "At the peace table, with a feelings chart and sentence starters."]
    ] ] },
  { id: "freedom", name: "Freedom Keeper", icon: "🧭", pass: 6, blurb: "Domains, rungs and the summit.", kind: "mcq",
    sets: [[
      ["Where does every student start?", ["Level 1", "Level 2", "Level 3 in every domain", "Wherever last year ended"], 2, "Level 3 is the baseline in all four domains."],
      ["A student had one rough lunch this week and was great otherwise. Table level?", ["Drop one rung", "Drop two rungs", "Hold. One moment isn't a pattern.", "Drop to Level 1"], 2, "Look for the week's pattern, not a single moment."],
      ["A student is ready to move from Level 2 to Level 4 in Field Block. What do you do?", ["Move to 4", "Move to 3 this week", "Move to 5", "Wait for the term to end"], 1, "One rung at a time."],
      ["What's required for Nature Walk Level 4?", ["Parent permission", "Confirmation by a second guide", "A written test only", "Nothing extra"], 1, "Earned slowly, confirmed by more than one guide."],
      ["How does Level 5 happen?", ["A guide awards it", "Students vote", "Level 4 in all four domains at once", "Perfect attendance"], 2, "It's a whole-child status."],
      ["How do students learn their levels?", ["Posted ranking", "Announced at Town Hall", "Privately at their one-on-one", "Email to the class"], 2, "Never as a public ranking."],
      ["A student struggles on Nature Walk but is excellent at the Table. You…", ["Drop all domains", "Adjust only Nature Walk", "Drop Table to match", "Hold all"], 1, "Domains stay separate."]
    ], [
      ["What are the four Freedom Level domains?", ["Math, Reading, Writing, Science", "Academic Block, Nature Walk, Table, Field Block", "Morning, Lunch, Afternoon, Dismissal", "Respect, Effort, Safety, Kindness"], 1, "Four separate domains, each with its own criteria."],
      ["A student had a consistently hard week in Academic Block. You…", ["Drop every domain one rung", "Move Academic Block down one rung and name what moves them back up", "Drop Academic Block to Level 1", "Hold, since levels never drop"], 1, "One rung, one domain, with the path back made visible."],
      ["What does Nature Walk Level 3 allow?", ["Carrying a hatchet, knife or saw", "Exploring and playing freely while staying in the guide's view", "Staying within 20 feet of the guide", "Staying right beside the guide"], 1, "Level 4 adds tools; Level 2 is within 20 feet; Level 1 is within 10 feet."],
      ["How do you describe Freedom Levels to a family?", ["As rewards for good behavior", "As privileges paired with the behavior that makes them safe and workable", "As a ranking of the class", "As punishments when they drop"], 1, "Freedom Levels are not rewards."],
      ["At Table Level 4, a student may…", ["Sit next to a guide", "Eat and head off to play without checking off first", "Eat anywhere on campus", "Skip lunch"], 1, "Level 3 eats in designated areas and checks off with a guide before playing."],
      ["Before stepping a child down a level, ask…", ["Did their parents agree?", "Can't or won't? If the barrier is a skill or a sensory load, change the support first.", "How many reminders did they get?", "What did the other guides do?"], 1, "Keep the standard; change the route."],
      ["In K–1, Freedom Levels are used for…", ["All four domains", "The Nature Walk only", "Lunch only", "Nothing"], 1, "The rest of the K–1 day runs on Montessori freedom within limits, with a fresh start each morning."]
    ], [
      ["How often are Freedom Levels reviewed?", ["Daily", "Weekly", "Monthly", "Each term"], 1, "Weekly, on the week's pattern."],
      ["Academic Block Level 1 means…", ["Working from the couches", "Working in a one-person enclosed desk space", "Sitting at any open table", "Working outside"], 1, "Offer that desk as a choice at any level too, so it never only means “in trouble.”"],
      ["A student's Nature Walk level drops after a tool near-miss. What happens to Table, Academic Block and Field Block?", ["They drop too", "They stay where they are", "They drop to Level 1", "They freeze until the next term"], 1, "Domains stay separate."],
      ["Which is a Level 5 privilege?", ["Skipping Academic Block", "Leading class meetings and town halls", "Choosing their own grades", "Carrying a hatchet without a second guide's confirmation"], 1, "Level 5 is earned automatically with Level 4 in all four domains."],
      ["When a level changes, the student should hear…", ["Nothing; the chart says it", "Exactly which behavior moved them, tied to the domain's criteria", "How they compare with classmates", "That it's final for the term"], 1, "Tie the change to the criteria."],
      ["Nature Walk Level 2 means…", ["Carrying tools", "Staying within 20 feet of the guide and away from risky areas", "Exploring freely in view", "Staying home from the walk"], 1, "Level 1 is right beside the guide, within 10 feet."],
      ["A student steps down a level. What else should they hear?", ["Nothing more; it's a consequence", "What the higher level looks like, and an offer to build toward it together", "Which classmates are higher", "That they'll stay there a month"], 1, "Make the path back visible."]
    ] ] },
  { id: "knots", name: "Knot Untangler", icon: "🪢", pass: 5, blurb: "Pick the right first move in real scenarios.", kind: "knots" },
  { id: "wiring", name: "Different Wiring", icon: "🧠", pass: 6, blurb: "Supporting neurodivergent students.", kind: "mcq",
    sets: [[
      ["A student hums and taps while working and nobody else is affected. Tier?", ["0", "1", "2", "None, but write it up"], 0, "Tier 0. Coach and support."],
      ["What does the double empathy problem say?", ["Autistic people lack empathy", "Misunderstanding runs both ways between neurotypes", "Everyone has two kinds of empathy", "Empathy can't be taught"], 1, "Mixed-neurotype communication breaks down; autistic-to-autistic works well."],
      ["During a meltdown, the best adult move is usually…", ["Ask lots of questions to understand", "Fewer words, more space, safety first", "Firm consequences right away", "Ignore it entirely"], 1, "Teach later, when the brain is back online."],
      ["About what share of autistic youth are bullied at school, by pooled estimates?", ["5%", "15%", "About 44%", "90%"], 2, "Maïano et al., 2016."],
      ["A child with ADHD forgets steps every transition. What helps most?", ["A talk about responsibility", "Help at the point of performance: a checklist where the task happens", "Losing recess", "A Tier 1"], 1, "Barkley's point-of-performance principle."],
      ["What's true about masking?", ["It shows a child is coping well", "It's linked to worse mental health and exhaustion", "Only adults do it", "It's a sign of manipulation"], 1, "Cook et al., 2021."],
      ["Before touching an autistic student on the shoulder, you should…", ["Do it quickly", "Ask first, or wave", "Only touch from behind", "Never speak to them"], 1, "Unexpected touch can feel like a shock."]
    ], [
      ["What does Inclusive Excellence mean?", ["Lower bars for students who learn differently", "The same high bar for every child, and as much support as each needs to reach it", "Separate classes by ability", "Only the strongest students clear the bar"], 1, "A label changes the route, never the standard."],
      ["A child who is struggling is usually…", ["Choosing to misbehave", "Behaving under stress or running into a lagging skill", "Seeking attention", "Testing the guide"], 1, "Ask: can't, or won't? Most of the time it's can't."],
      ["With an autistic student who needs to hear something hard, you…", ["Hint so it lands softly", "Say exactly what you mean, without sarcasm or hints", "Use a joke to break the ice", "Say it in front of a friend for support"], 1, "Literal is respectful."],
      ["A student holds it together all day and falls apart at home. That may be…", ["Proof the day went well", "The cost of masking", "A home problem only", "Manipulation"], 1, "A calm day at school isn't proof of an easy day."],
      ["What does the research say about aerobic exercise and ADHD?", ["No effect", "Moderate to large benefits for attention and executive function in a 2015 meta-analysis", "It makes symptoms worse", "Only adults benefit"], 1, "Movement is fuel, not a reward."],
      ["Before a transition, give warnings at…", ["10 and 5 minutes", "5 minutes and 1 minute", "Only at the moment", "No warnings; it builds flexibility"], 1, "Precorrection and priming. Surprise is the enemy."],
      ["The Academic Block Level 1 enclosed desk should be…", ["Only for students in trouble", "Offered as a choice at any level, so it never only means “in trouble”", "Removed", "Assigned by seniority"], 1, "Some autistic students would pick it for themselves on a loud day."]
    ], [
      ["What does “exclusive excellence” describe?", ["A high bar with high support", "A high bar with little support: whoever can't clear it falls away", "A low bar with warmth", "Neglect"], 1, "The enforcer. Inclusive non-excellence is the protector. We aim for inclusive excellence."],
      ["Emotion dysregulation in ADHD is…", ["Rare", "Common and a big driver of impairment, so plan for it", "Always a choice", "Only in teenagers"], 1, "Don't treat each outburst as a choice."],
      ["Taking away movement as a consequence for a student with ADHD…", ["Teaches responsibility", "Removes the very thing that helps", "Is required by the standard", "Works if done privately"], 1, "Movement isn't a reward to be earned."],
      ["In a Peace Talk, a student can't name a feeling yet. You…", ["Move on without it", "Let them point to a feelings chart, or write first", "Name it for them and continue", "End the Peace Talk"], 1, "Eye contact is optional too."],
      ["Why practice a Personal Fire Drill plan when the student is calm?", ["To fill time", "Sensing your own body's signals is often harder for neurodivergent kids; practice builds the map they'll need under stress", "Because parents require it", "It replaces the tier system"], 1, "Point back to the plan in the moment instead of improvising."],
      ["A neurodivergent student repeats a shocking threat they heard in a game. That changes…", ["Nothing at all", "What you teach afterward, not the first safety steps", "The tier, down to Tier 0", "Whether you tell leadership"], 1, "Serious threats are Tier 3 until leadership has assessed them."],
      ["A student narrates his math out loud. Best first response?", ["Tier 1 right away", "Treat it as Tier 0 and let him choose a seat where narrating doesn't land on anyone", "Ask him to stop forever", "Send him to the regulation space"], 1, "Narrating and humming are often how a child holds focus."]
    ] ] }
];

/* ------------------------------------------------------------------ */
/* LIVING DOCUMENT: open questions leadership needs to settle. */
export const OPEN = [
  { id: "normalize", q: "How long is the normalization period, and what changes during it?", why: "The board president confirmed every band has one for new students and returning students skip it. The length, who decides it has ended, and how tiers apply in the meantime are not written down.", sources: "Board president, Nov 2026" },
  { id: "wallchart", q: "What goes on the Freedom Level wall chart?", why: "The proposal says levels are never posted as a public ranking, and also says to post the chart where students can see where they stand. This site assumes the wall shows what each level means, not who is where.", sources: "Freedom Level Proposal 2026-27" },
  { id: "logging", q: "Where do incidents and Peace Talk requests get logged?", why: "The system says to record incidents with Behavior Claude and request Peace Talks through the Dashboard. Guides have asked where that dashboard is.", sources: "Accountability System 2026-27; #lower-elementary-campus-k-to-1, Oct 2026" },
  { id: "twodocs", q: "Retire the 2025 parent-involvement thresholds?", why: "The 2025 Behavior Policy says 3 Tier 1s, 2 Tier 2s or 1 Tier 3 in a day means a note home. The 2026-27 system uses different counts. This site follows 2026-27. Archive the old rule so families don't hear two versions.", sources: "Behavior Policy 2025; Accountability System 2026-27" },
  { id: "aide", q: "What's the rule when a student's 1:1 aide is absent?", why: "A board member proposed: baseline expectations written into enrollment, case-by-case review, and if attendance depends on an aide, no aide means no attendance. Not yet adopted; it needs legal review because the ADA applies to private schools.", sources: "#lower-elementary-campus-k-to-1, Nov 2026" }
];

export const CHANGELOG = [
  ["0.5", "2026-11-25", "Board-president decision: for a Tier 3, sending home is required when the student already has a history of Tier 3 behavior (an earlier Tier 3 this school year or last school year), in every band. With no earlier Tier 3, sending home is the guide's call; the incident report, parent-guide conversation and repair plan happen either way. An admission counts even if no guide saw it."],
  ["0.4", "2026-11-18", "Renamed the Behavior Guide. The map is now a valley: behavior keeps every child safe, in school and getting along (table stakes), while the Mentor Mindset is how children climb the peaks. One toggle in the top bar switches between the two guides."],
  ["0.3", "2026-11-17", "Gave this guide its own look, separate from the Mentor Mindset Field Guide. K–1 now has its own mechanics, drawn from early-childhood research: taught expectations, in-the-moment responses, a same-day repair menu, guide-led Peace Talks, Montessori freedom within limits outside the Nature Walk, and class meetings without discussing a specific child. Tier 3 send-home rules are unchanged. Inclusive Excellence (Yeager, 10 to 25) is the first neurodiversity principle."],
  ["0.2", "2026-11-17", "Decisions from the board president: a Tier 3 means a full school day away, including the next day for late incidents; K–1 follows the same send-home rules as 2–8; a Town Hall may discuss a specific student with the focus on solving the problem; Freedom Levels pair privileges with behavior and are not rewards; every band has a normalization period for new students, not for returning ones; restorative practices are optional and middle school leans on Mentor Mindset."],
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
  "A concern about a specific student can be on the agenda. Word it as a problem to solve, not a behavior to judge, and tell the student first. Go to a guide first before it is posted."
];

/* ------------------------------------------------------------------ */
/* AI coach prompt. */
export const COACH = `You are the Wilderland Behavior Guide coach, helping adult guides (teachers) at Wilderland Academy, a nature-based K-8 microschool in Utah, untangle real behavior situations. Many students are neurodivergent (ADHD, autism, anxiety). The school values high standards, high support, high autonomy, and restorative rather than punitive responses.

Separate clearly what Wilderland REQUIRES (Standards) from what is OPTIONAL (Toolkit).

STANDARDS (grades 2-8, 2026-27 Accountability System):
- Tier by impact first. Tier 0 = self-regulation/developmental, not meaningful harm (humming, tapping, blurting, pacing, fidgeting). Response: patience, coaching, environment changes. After 2 reminders on the same behavior in one day, if it continues and affects another student, it becomes Tier 1.
- Tier 1 = interferes with another's learning/space without significant harm. Within one day: 1st reminder, 2nd proximity to guide and loses seating preference, 3rd yellow card plus text home. If 2+ Tier 1s hit the same student in a day: Peace Talk with peace stone plus an act of kindness before resuming work. Same Tier 1 behavior on 3+ days in a school week: guide may call a parent meeting. Escalates to Tier 2 only after a yellow card AND a Peace Talk AND actual harm.
- Tier 2 = actual physical, emotional, social or property harm or serious boundary violation (pushing, tripping, humiliating, deliberate harmful exclusion, rumors, taking and refusing to return belongings, following someone who asked for space). Response: red card; care for the harmed student first; calm down (Personal Fire Drill plan); SMART Restore matched to community-agreed restorative actions, due and signed off by Field Guide by end of next school day, and it is the student's next work; record the incident; discuss at next coaching meeting; 2 Tier 2s in a school week = email parents with reports.
- Tier 3 = immediate or serious threat to safety, dignity or wellbeing (punching, choking, fighting, object as weapon, threats of serious violence including sexual violence, identity-based harassment, sexual harassment, cornering/intimidation). Response: safety first; send-home is required when the student already has a history of Tier 3 behavior (an earlier Tier 3 this school year or last) and is otherwise the guide's call; a send-home is immediate (not a suspension) and lasts a full school day, so a late-day one means the next school day too; an admission counts even if no guide saw it; incident report email; parent-guide conversation required before return; repair plan agreed by all parties and delivered on return. The student's own Field Guide owns re-entry.
- Peace Talks: student-led with Peace Object when safe, or guide-supported after the guide assesses whether it's warranted; at least 20 protected minutes; never for physical aggression, threats, repeated harassment or big power imbalances. Every guide protects a morning Open Coaching Session.
- Freedom Levels: four separate domains (Academic Block, Nature Walk, Table, Field Block), levels 1-4, everyone starts at 3, reviewed weekly on the week's pattern, move one rung at a time tied to criteria, delivered privately at one-on-ones, never posted as a ranking. Nature Walk Level 4 (blades) needs a second guide's confirmation. Level 5 = Level 4 in all four domains.
- Town Halls handle system-level and group concerns, not individual discipline. A Town Hall may discuss a specific student, with the focus on solving the problem together, not on the behavior; never public shaming. Tell the student first.
- Threats of serious violence: treat as Tier 3 pending leadership assessment; document exact words. Any mention of self-harm, suicide, abuse or being harmed: stop and follow the Mental Health Crisis Policy and involve leadership now.
- No prizes for behavior; specific noticing and gratitude instead. Never name other children to a family.
- The Mentor Mindset (high standards, high support) is how children climb to excellence; this behavior policy is the valley floor: table stakes for safety and living together. Suggest the Mentor Mindset move first.
- K-1 (lower campus) uses the same Tier 3 send-home rule (required after an earlier Tier 3 this school year or last, otherwise the guide's call; a full school day away) but different mechanics elsewhere: 3-5 positively stated, taught and practiced expectations; Tier 1 = cue, redo, short calm-down spot near the guide, one end-of-day note home; Tier 2 = care for the hurt child, calm, then a same-day 3-picture repair menu (check on them, fix it, do something kind) and the family told the same day; Peace Talks are always guide-led and under 5 minutes; Freedom Levels only for the Nature Walk, everything else is Montessori freedom within limits with a fresh start each morning; class meetings never discuss a specific child; much more noticing than correcting. In K-1, hitting or pushing without injury is usually Tier 2; injury or danger is Tier 3. Every band has a normalization period for new students to settle; returning students do not need one.
- Freedom Levels pair privileges with behavior; they are not rewards. Restorative practices are optional; for middle school prefer Mentor Mindset approaches.

TOOLKIT (guide's discretion): Collaborative & Proactive Solutions Plan B (empathy, adult concerns, invitation; assumes kids do well if they can; ask can't vs won't); co-regulation (Self-Reg); restorative conversations (student proposes the repair); Nonviolent Communication (weak evidence; use as a script); empathic listening; RULER; self-management plans (no rewards step); Personal Fire Drill plans; regulation space as time-in, never punishment; precorrection and priming; wise feedback; specific noticing; vigorous movement; meaning questions; teaching peers about differences; optional mindfulness (large trials found little benefit as a curriculum).

NEURODIVERGENCE: tier 0 protects wiring. Double empathy: misunderstanding runs both ways. Masking has costs. Meltdowns are not defiance: fewer words, more space, teach later. ADHD: help at the point of performance, fast feedback, movement, emotion dysregulation is common. Autism: predictability, literal language, ask before touching, sensory load, written or drawn options.

Rules: You do not know these children; offer hypotheses as guesses. Never diagnose. Tell the guide to use first names or initials only. Don't invent policy: if the policy doesn't cover something, say so and suggest raising it with leadership. Don't invent research. Plain text, no markdown symbols, under 350 words, with these labeled parts:
WHAT THE STANDARD REQUIRES (tier for each student's action and the required steps)
WHAT MIGHT BE GOING ON (2-3 guesses, including any neurodivergent angle)
TOOLKIT OPTIONS (2-3 concrete moves, with an exact line to say in quotes)
WATCH OUT FOR (one trap)
End with one question if something important is unclear.`;


/* ------------------------------------------------------------------ */
/* K–1: same values, different mechanics. Sources: Pyramid Model (Hemmeter et al.), HHS/ED 2014, Côté/Tremblay 2006,
   Kazdin on brief consequences, Caldarella 2020, Montessori freedom within limits. Tier 3 send-home is a board-president decision. */
export const K1 = {
  intro: "Five- and six-year-olds are still building the skills the 2–8 system leans on: waiting, naming a feeling, remembering yesterday's rule, and connecting a consequence that arrives hours later. So the lower campus keeps the same values and changes the mechanics. Teach first. Respond in the moment. Keep consequences short. Tell families the same day.",
  diffs: [
    ["Expectations", "Students write the Code of Conduct each fall.", "Three to five expectations, said in the positive (“walking feet”), taught with photos of our own students, practiced, and retaught after every break."],
    ["Small disruptions (Tier 1)", "Reminder, then proximity, then a yellow card and a text home.", "A cue, then a redo (“Show me walking feet”), then a minute or two in a calm-down spot near the guide. One note home at the end of the day, with something that went well."],
    ["Peace Talks", "Student-led when it's safe; 20 protected minutes.", "Always guide-led, under five minutes, at the peace table, with a feelings chart and sentence starters."],
    ["Harm (Tier 2)", "Red card, then a SMART Restore by the next day.", "Care for the hurt child, calm down, then a same-day repair menu with three picture choices: check on them, fix it, or do something kind. The family hears the same day."],
    ["Serious harm (Tier 3)", "Sent home for a full school day: required if the student already had a Tier 3 this school year or last, otherwise the guide's call.", "Same rule. The return uses a short picture story of the next morning, and the guide meets the child at drop-off."],
    ["Freedom Levels", "Four domains, reviewed weekly.", "Nature Walk only, shown on picture cards, with a one-line update every day. The rest of the day runs on Montessori freedom within limits, with a fresh start each morning."],
    ["Town Halls", "May discuss a specific student, focused on solving the problem.", "Short class meetings about group problems only. Never discuss one child in front of the class."],
    ["Noticing", "Specific feedback and gratitude, no prizes.", "No prizes, and far more noticing: several specific notices for every correction."],
    ["New students", "A normalization period before the full standard applies.", "Plan for a longer settling period, especially at the start of kindergarten."]
  ],
  why: [
    ["Teach it before you enforce it", "Young children learn expectations the way they learn letters: shown, practiced, and practiced again. The Pyramid Model puts this at its base, and two randomized trials found less problem behavior where teachers were coached to do it.", "pyramid"],
    ["Now, not later", "A consequence at the end of the day doesn't connect for a five-year-old. Short and immediate works; long and delayed adds little.", "brief"],
    ["Hitting at five is common", "Physical aggression peaks in toddlerhood and declines through the early school years for most children. That's why hitting without injury is usually Tier 2 in K–1: it gets a firm, same-day response and lots of teaching.", "aggress"],
    ["Notice far more than you correct", "Across 151 K–6 classrooms, students stayed on task more as teachers' praise-to-reprimand ratio rose.", "praise"],
    ["Keep them in the room when you safely can", "Federal early-childhood guidance urges programs to prevent and severely limit sending young children away. Our Tier 3 rule stays, which makes everything below Tier 3 matter more.", "exclude"]
  ],
  standards: {
    conduct: { short: "Guides teach three to five expectations with pictures, then practice them.", rules: ["Choose three to five expectations, stated as what to do: “walking feet,” “gentle hands,” “one voice at a time.”", "Teach each one with photos of our own students doing it. Model it, let children practice it, and role-play the tricky moments.", "Reteach after every long break and whenever a new child joins.", "The seven principles stay on the wall. In K–1, connect each expectation to one of them in plain words."] },
    tiers: { short: "Impact still sets the tier. Most K–1 behavior is Tier 0: a skill still being learned.", rules: ["Tier placement is by impact, the same as in 2–8.", "Hitting, pushing or biting without injury is usually Tier 2. Injury or danger is Tier 3.", "Respond in the moment. Don't save it for later."] },
    peace: { short: "Always guide-led, short, at the peace table.", rules: ["The guide runs every K–1 Peace Talk. Children don't schedule their own.", "Keep it under five minutes, at the peace table or with the peace rose.", "Use sentence starters: “I felt ___ when you ___. Next time, please ___.” A child who can't find the word can point to the feelings chart.", "End with something the children do together: a handshake, a high five, or going back to play side by side.", "Never use a Peace Talk for a child who has just been hurt and is still upset. Comfort first."] },
    restore: { short: "Care for the hurt child, calm, then a same-day repair from a picture menu.", rules: ["Stop it and care for the hurt child first.", "The child who caused harm calms down near the guide. No talking it through until they're calm.", "Offer the repair menu with three pictures: check on them, fix it (rebuild, clean up, return), or do something kind. The child picks; the guide helps them do it.", "Finish the repair the same day.", "Tell the family the same day, in person at pickup or by message, with what happened, what the child did to repair it, and one thing that went well.", "Record it the same day."] },
    sendhome: { rules: ["Safety first: protect the hurt child and the group.", "Same rule as 2–8: a child who already had a Tier 3 this school year or last is sent home, required, not a judgment call. Otherwise the guide decides.", "A child who is sent home goes right away, for a full school day. It is never framed as a suspension.", "It counts when the child admits it, even if no guide saw it.", "The guide emails an incident report to the family.", "A parent-guide conversation happens before the child returns.", "Make a short picture story of the return: who meets them, where they'll put their things, what they'll do first.", "The guide meets the child at drop-off and does the repair with them early that morning."] },
    parents: { short: "Families hear from us the same day.", rules: ["Tier 1: one note at the end of the day, not a text per incident. Include something that went well.", "Same Tier 1 behavior on 3 or more days in a school week: a family check-in.", "Any Tier 2: tell the family the same day.", "Tier 3: incident report email, then a parent-guide conversation before return.", "Never name other children to a family."] },
    freedom: { short: "Freedom Levels only for the Nature Walk. The rest of the day runs on freedom within limits.", rules: ["Use Freedom Levels for the Nature Walk only, where distance from the guide is a safety question. Show each level on a picture card.", "Give the child a one-line update every day (“Today you stayed where I could see you”), even though levels change weekly.", "Everywhere else, use Montessori freedom within limits: a child keeps a freedom while they use it well, and loses it for that moment if they don't. Every morning starts fresh.", "Tools (knives, saws) stay one-on-one and certification-based, whatever the level."] },
    townhall: { short: "Class meetings about group problems, never about one child.", rules: ["Hold short class meetings (about ten minutes) in a circle.", "Bring group problems only: the line to the slide, sharing the wagons, cleanup.", "Never discuss a specific child in front of the class. Bring individual concerns to the guide and the family.", "Act out the problem and two solutions, then let the children choose one to try for a week."] },
    norewards: { short: "No prizes, and far more noticing than correcting.", rules: ["No prizes, points or treats for behavior.", "Aim for several specific notices for every correction: “You waited for your turn on the swing. That was patient.”", "Thank children for what they did for someone else.", "Notice the quiet children too, not only the ones who need redirection."] },
    normalize: { short: "Plan for a longer settling period in K–1.", rules: ["Expect the settling period to take longer than in 2–8, especially at the start of kindergarten.", "During it, teach and practice expectations every day, and use Tier 0 generously.", "Safety responses still apply from day one."] }
  },
  tiers: {
    0: { examples: ["Wiggling, rolling or wandering at circle", "Calling out", "Melting down when a plan changes", "Grabbing a material without asking", "Forgetting a routine taught this week", "A loud voice indoors"], response: ["A picture or gesture cue, then model it and let them try again.", "Change the setup before you count anything: seat, timing, a visual schedule, a first-then card.", "Teach the skill at a calm time, not only in the moment."], escalate: "After 2 cues and redos on the same behavior in one day, if it keeps affecting another child, it becomes Tier 1." },
    1: { examples: ["Knocking down another child's work", "Taking a material another child is using", "Silly noises during a lesson after a redo", "Staying in another child's space after being asked to move", "Splashing or throwing water or sand near someone"], response: ["1st: a calm cue and a redo.", "2nd: work next to the guide for a bit, framed as help.", "3rd: a minute or two in the calm-down spot within sight, then rejoin and try again.", "End of day: one note home, including something that went well."], escalate: "Same behavior on 3 or more days in a school week: a family check-in. Becomes Tier 2 when it hurts someone." },
    2: { examples: ["Hitting, pushing, kicking or biting without injury", "Throwing sand or small objects at someone", "“You can't play” to the same child, again and again", "Unkind words about someone's body or family", "Breaking another child's work on purpose"], response: ["Stop it and care for the hurt child first.", "Calm down near the guide.", "Same-day repair from the picture menu: check on them, fix it, or do something kind.", "Tell the family the same day.", "Record it."], escalate: "Becomes Tier 3 when someone is injured or in danger." },
    3: { examples: ["Hitting, kicking or biting that injures someone", "Using a stick, rock or tool to hurt someone", "Running off from the group out of the guide's sight", "Hurting the same child again after Tier 2 responses the same week"], response: ["Safety first.", "Sent home for a full school day (the next school day if it happens late in the day): required if the child already had a Tier 3 this school year or last, otherwise the guide's call.", "Guide emails the incident report.", "Parent-guide conversation (before return, if sent home).", "Picture story of the return; the guide meets the child at drop-off and does the repair with them."] }
  }
};

export const SORT_K1 = [
  ["Rolling on the rug during the circle story", 0], ["Calling out the answer before others can try", 0], ["Crying hard when lunch moves outside", 0], ["Grabbing the red pencil without asking, first time today", 0], ["Humming while washing a table", 0],
  ["Knocking over a classmate's block tower as a joke", 1], ["Taking the shovel another child is using", 1], ["Making silly noises during a lesson after a redo", 1], ["Staying in a friend's work space after being asked to move", 1],
  ["Pushing a child off the swing; no one is hurt", 2], ["Biting a classmate's arm, leaving no mark", 2], ["Throwing a handful of sand at another child", 2], ["Telling the same child “you can't play” every recess this week", 2],
  ["Hitting a classmate in the face, giving them a bloody nose", 3], ["Swinging a stick at another child's head", 3], ["Running off from the group into the trees and hiding", 3]
];

export const PATHNET = {
  path: "Practiced every day with every child, the Mentor Mindset is how children climb from getting by to excellent: high standards, high support, and respect. When it's working, most of what's on this site rarely comes up.",
  net: "Our policies and tools for keeping every child safe, in school, and getting along with others. That's table stakes: every child needs it, and every guide holds it the same way. It keeps the community livable, but it won't by itself get a child to a summit."
};

export const IE = {
  line: "The same high bar for every child, and as much support as it takes for each one to reach it.",
  body: "In 10 to 25, David Yeager calls the mentor mindset “inclusive excellence” when it's applied to young people who learn and work differently. He sets it against two common failures. Exclusive excellence keeps the bar high and lets whoever can't clear it fall away. Inclusive non-excellence welcomes everyone and quietly drops the bar. Both fail a neurodivergent child: the first says they don't belong, the second says we don't believe in them.",
  quad: [["Exclusive excellence", "High bar, little support. A few clear it; the rest are written off.", "The enforcer"], ["Inclusive excellence", "High bar, high support. Every child is expected to clear it, with help.", "The mentor"], ["Neglect", "Low bar, little support. Nobody is pushed or helped.", ""], ["Inclusive non-excellence", "Low bar, plenty of warmth. Everyone belongs; nobody is pushed.", "The protector"]],
  story: "Yeager's example is Keivan Stassun, a Vanderbilt astrophysicist who built a research group where autistic scientists do top-level work. He changed the conditions, not the bar. Lab meetings moved online so people could control light and sound. When a gifted programmer on his team broke laptops in moments of frustration, Stassun bought rugged laptops instead of letting him go. That programmer, Dan Burger, went on to build Filtergraph, a data-visualization tool behind published discoveries in astrophysics.",
  storyUrl: "https://news.vanderbilt.edu/2025/05/12/from-subjects-to-scientists-vanderbilts-autism-research-and-autistic-researchers-are-reshaping-discovery",
  doThis: ["Keep the standard; change the route. Tier 0, accommodations and regulation spaces are routes to the bar, not discounts on it.", "Say the high-standards sentence out loud: “I'm holding you to this because I know you can reach it, and I'll help you get there.”", "Never quietly excuse a child from a challenge, a Life Skill or a Lab because of a label. Find the support that gets them there.", "Ask what support would let this child meet the standard before you ask whether they should have to."]
};
