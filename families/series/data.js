// Field Notes: the parent education series. Three featured books, a short shelf of others from Wilderland's
// Inspiration list (https://wilderland.academy/inspiration), and podcasts and talks the team has shared and stands behind
// (many from Slack #inspiration and #alpha-inspiration). Full entries live in ITEMS; lighter reading lives in READS.
// Each full entry: why it matters to us, big ideas, where you'll see it at Wilderland (METHODS), where we part ways,
// anything worth knowing, questions to talk about, and one thing to try.
// Plain language for parents. No em dashes in copy. Big ideas for podcasts and talks come from the episode's own
// description or transcript; never invent what someone said. Quote only what has been checked.

export const INSPIRATION = "https://wilderland.academy/inspiration";

// Wilderland practices an entry can point to. Keep these to things that really happen at school.
export const METHODS = {
  mentor: { n: "Mentor mindset", d: "Guides hold a high bar and give real help at the same time, from David Yeager's research." },
  cps: { n: "Solving problems together", d: "Behavior starts from “kids do well if they can”: find the lagging skill and solve the problem with the child." },
  montessori: { n: "Montessori", d: "Prepared spaces and hands-on materials. The foundation in K–1, and the go-to when an older child is stuck on why." },
  mastery: { n: "Mastery mornings", d: "Each child works at their own level and moves on only after mastering it, Alpha-style." },
  choice: { n: "Student choice", d: "Children choose their own books, their own pace, their own challenges and, in grades 5–8, their own projects." },
  lifeskills: { n: "Life Skills challenges", d: "Eight skills built through real feats with a clear standard: pass or “not yet.”" },
  projects: { n: "Passion pursuits and projects", d: "Student-driven work on something a child cares about. Central in K–1; long projects in grades 5–8." },
  nature: { n: "Nature immersion", d: "A daily nature walk and afternoons spent mostly outdoors, with nature braided into academics." },
  risk: { n: "Healthy risk and Safety Gates", d: "Climbing, cold, tools and fire, taught first and unlocked by passing a Safety Gate." },
  bands: { n: "Mixed-age bands", d: "Children learn in K–1, 2–4 and 5–8 groups, and freedoms grow as they move up." },
  inclusive: { n: "Inclusive excellence", d: "The same high bar for every child, with support shaped to how each one learns." },
  private: { n: "No academic rankings", d: "Academic data stays between a child, their guide and you. No leaderboards." },
  screens: { n: "Screens with a purpose", d: "School devices are Chromebooks used for mastery work, with tech use monitored by our own software." }
};

export const THEMES = {
  drive: "Motivation from the inside",
  free: "Independence, play and nature",
  connect: "Connection and attention",
  school: "Rethinking school"
};

// How the grid groups things. "Listen" = Podcast; "Watch" = Talk or Video.
export const KINDS = { Book: "Books", Podcast: "Listen", Talk: "Watch", Video: "Watch" };

const FOE = "Future of Education, Alpha School's podcast";

export const ITEMS = [
  /* ================= featured books ================= */
  { id: "10-to-25", theme: "drive", kind: "Book", t: "10 to 25", sub: "The Science of Motivating Young People", by: "David Yeager", yr: 2024,
    why: "The research behind how our guides talk to kids. If one book explains the adults at Wilderland, it's this one.",
    ideas: [
      "Adults tend to fall into one of three mindsets: the enforcer (high standards, low support), the protector (high support, low standards), or the mentor (both).",
      "From about age ten, young people care intensely about status and respect. Many “bad decisions” make sense once you see that.",
      "Mentors explain why, ask before telling, and treat stress as a sign a challenge matters, not a sign something's wrong.",
      "Feedback lands when it's framed as belief: high standards, plus confidence the young person can reach them."
    ],
    here: [["mentor", "It's the core of how guides are trained, and the lens for our behavior approach."], ["inclusive", "Inclusive excellence, from this book, is our top principle for supporting neurodivergent students."], ["lifeskills", "Challenges are designed to carry real status with peers, not just adult approval."]],
    ask: ["When you correct your child, do you sound more like an enforcer, a protector or a mentor?", "How does your child react when they feel talked down to?", "What high standard could you hold this week while making it clear you believe they can meet it?"],
    tryit: "Before your next correction, say why: “I'm telling you this because I have high standards and I know you can reach them.”",
    link: ["Hear Yeager explain it (Class Disrupted podcast)", "https://www.the74million.org/article/podcast-what-a-mentorship-mindset-can-do-for-student-motivation/"] },

  { id: "self-driven-child", theme: "drive", kind: "Book", t: "The Self-Driven Child", sub: "The Science and Sense of Giving Your Kids More Control Over Their Lives", by: "William Stixrud & Ned Johnson", yr: 2018,
    why: "Why a child's sense of control is the best antidote to stress, and what that means for how we parent and teach.",
    ideas: [
      "A sense of control is one of the strongest buffers against stress. Kids who feel they have a say in their own lives cope better and are more motivated.",
      "Be your child's consultant, not their boss or manager. Offer help and advice, then let them make the call on what's theirs to decide.",
      "Calm is contagious, and so is anxiety. A non-anxious adult helps a child settle.",
      "Protect sleep and real downtime. A rested brain handles hard things, and unscheduled time is where creativity and identity grow."
    ],
    here: [["choice", "Children choose their books, their Life Skills challenges and, in grades 5–8, their projects."], ["mentor", "Guides coach rather than command, and help is asked for, not imposed."], ["lifeskills", "Sleep and recovery are part of Energy, one of our eight Life Skills."]],
    ask: ["Which decisions in your child's day could honestly be theirs, and which do you still make for them?", "When your child struggles, is your first move to fix it or to ask what they want to do?", "How does your own stress show up at home, and how does your child respond to it?"],
    tryit: "Pick one thing you usually manage for your child, like homework timing or packing their bag, and say: “It's your call. I'm here if you want help.”" },

  { id: "free-range-kids", theme: "free", kind: "Book", t: "Free-Range Kids", sub: "How Parents and Teachers Can Let Go and Let Grow", by: "Lenore Skenazy", yr: 2021,
    why: "A funny, pointed case for trusting kids with more independence than our fears allow.",
    ideas: [
      "Our sense of danger is distorted. Skenazy argues that news coverage and worst-case thinking make the world feel far more dangerous for children than it is.",
      "Kids grow by doing real things on their own: walking to a friend's house, running an errand, solving their own problems.",
      "Overprotection has costs too, even if they're harder to see: less confidence, less resilience, more anxiety.",
      "It's easier together. When a group of families or a whole school lets kids do more, no single parent has to be the brave one."
    ],
    context: "Skenazy became known as “America's Worst Mom” after writing in 2008 about letting her 9-year-old ride the New York subway alone. She later co-founded Let Grow. This 2021 edition is written for teachers as well as parents. Utah passed the country's first free-range parenting law in 2018.",
    here: [["risk", "Children use real tools and fire after passing Safety Gates, and range more widely as they show they're ready."], ["lifeskills", "Many challenges are exactly this kind of independence, like packing your own bag every day for a week or finding a paying customer outside your family."], ["bands", "Freedoms grow with age: discover in K–1, take ownership in 2–4, design and lead in 5–8."]],
    differ: "We teach before we trust. Freedoms here are earned by showing a skill, not handed out all at once.",
    ask: ["What could you do alone at your child's age that they can't do now? What changed: the world, or us?", "What's one thing your child is ready for that you haven't let them try?", "What would you need to see before you said yes?"],
    tryit: "Let your child do one new thing on their own this week, then ask them to tell you how it went." },

  /* ================= the rest of the shelf ================= */
  { id: "lost-connections", theme: "connect", kind: "Book", t: "Lost Connections", sub: "Why You're Depressed and How to Find Hope", by: "Johann Hari", yr: 2018,
    why: "A journalist's search for why so many people are depressed and anxious. His answer, that we've lost things humans need, shaped what we want school to give children.",
    ideas: [
      "Hari argues that depression and anxiety are often driven by disconnection: from other people, from meaningful work, from meaningful values, from status and respect, from the natural world, and from a hopeful future.",
      "He names nine causes in all, including childhood trauma and real changes in the brain, and argues the social causes get too little attention.",
      "Chasing money, status and image (extrinsic goals) tends to leave people emptier than pursuing things that matter to them for their own sake (intrinsic goals).",
      "Reconnection helps: community, work that means something, time in nature, and a future worth working toward."
    ],
    here: [["nature", "Every day includes a nature walk, and most afternoons are spent outdoors."], ["projects", "Passion projects and Life Skills challenges are built on meaningful work kids choose."], ["lifeskills", "Fellowship, one of our eight Life Skills, is about belonging, standing up for others and repairing after conflict."], ["mentor", "Older students are corrected in private and given real roles, because respect matters."]],
    know: { t: "This is a book about adults, written by a journalist, not a clinician. Read it as a lens on what children need, not as medical advice, and never change a medication without a doctor. Hari also admitted in 2011 to plagiarizing quotes in his journalism, which is fair to keep in mind.", src: ["Irish Times on Hari's work", "https://www.irishtimes.com/culture/too-few-of-us-are-paying-attention-to-the-problems-with-johann-hari-s-new-book-1.4775651"] },
    ask: ["Which of these connections feel strong in your family right now, and which feel thin?", "Where does your child feel they truly belong?", "Is your child mostly chasing things that feel good to have, or things that feel good to do?"],
    tryit: "Plan one thing this week that connects your family to something bigger than yourselves: a neighbor, a cause, or a place outdoors." },

  { id: "raising-human-beings", theme: "drive", kind: "Book", t: "Raising Human Beings", sub: "Creating a Collaborative Partnership with Your Child", by: "Ross W. Greene", yr: 2016,
    why: "The thinking behind how we handle hard behavior: kids do well if they can.",
    ideas: [
      "When a child isn't meeting an expectation, it's usually because they're missing a skill, not because they don't want to.",
      "Adults have three options: impose their will (Plan A), drop the expectation for now (Plan C), or solve the problem together (Plan B).",
      "Plan B has three steps: understand the child's concern, share your own concern, then invite the child to find a solution that works for both of you.",
      "Solve problems before they happen, at calm times, not in the heat of the moment."
    ],
    here: [["cps", "Our behavior approach draws on Greene's work: guides solve recurring problems with the child, not to them."], ["mentor", "High expectations stay; the child helps figure out how to meet them."], ["lifeskills", "Fellowship and Self-Governance challenges build the skills, like stating a boundary, that many problems turn on."]],
    know: { t: "Greene's model has done well in clinical trials with children who have explosive behavior. Studies in ordinary schools are still thin." },
    ask: ["What's the recurring battle in your home, and what skill might your child still be missing?", "Do you know your child's concern about it, or only your own?", "Which problems could you drop for now so you can solve the important ones well?"],
    tryit: "Pick one recurring problem. At a calm time, start with “I've noticed that ___. What's up?” Then just listen." },

  { id: "last-child-in-the-woods", theme: "free", kind: "Book", t: "Last Child in the Woods", sub: "Saving Our Children from Nature-Deficit Disorder", by: "Richard Louv", yr: 2005,
    why: "The book that named what children lose when childhood moves indoors.",
    ideas: [
      "Children spend far less unstructured time in nature than earlier generations did.",
      "Louv coined “nature-deficit disorder” for the costs. It's his term for a pattern, not a medical diagnosis.",
      "Time in nature supports attention, creativity, health and a sense of wonder.",
      "Fear, screens, schedules and rules all keep kids indoors. Each can be changed."
    ],
    here: [["nature", "A daily nature walk, and afternoons spent mostly outdoors."], ["lifeskills", "Nature & Living Systems is one of our eight Life Skills: birds, tracks, plants, and how ecosystems connect."], ["risk", "Cold, wet and wild are part of learning here."]],
    ask: ["Where did you spend unstructured time outdoors as a kid?", "How many hours did your child spend outside last week, with no adult agenda?", "What keeps your family indoors?"],
    tryit: "Find a “sit spot” near home and visit it with your child a few times this week. Notice what changes." },

  /* ================= listen ================= */
  { id: "yeager-class-disrupted", theme: "drive", kind: "Podcast", t: "What a Mentorship Mindset Can Do for Student Motivation", sub: "Class Disrupted, from The 74", by: "David Yeager with Diane Tavenner & Michael B. Horn", yr: 2024,
    why: "The fastest way into 10 to 25. Yeager explains the mentor mindset in his own words, with classroom stories you can borrow at home.",
    ideas: [
      "Adults tend to slide into one of two traps. Enforcers hold high standards with little support. Protectors give lots of support and drop the standards. Yeager argues both quietly assume young people aren't capable.",
      "Mentors explain their reasons. Teenagers read a lot into ambiguous signals, so adults should say why they're asking for something more often than feels necessary.",
      "Ask before you tell. Real questions, ones you don't know the answer to, build on the young person's own thinking.",
      "Stress often means something matters. Telling a child “don't be stressed” tends to backfire.",
      "Purpose comes from knowing someone is counting on you, and belonging is built through contribution over time. It can't be announced."
    ],
    here: [["mentor", "This is the model our guides are trained in."], ["lifeskills", "Challenges give children real roles that others count on."]],
    ask: ["When did someone explain their high expectations of you in a way that made you rise to them?", "What would change if you asked your child one real question before giving advice?"],
    tryit: "Next time you hold a firm line, add one sentence on why. Notice whether the pushback changes.",
    link: ["Listen at The 74", "https://www.the74million.org/article/podcast-what-a-mentorship-mindset-can-do-for-student-motivation/"] },

  { id: "foe-mentor", theme: "drive", kind: "Podcast", len: "38 min", t: "How to Be a Mentor to Your Kid (Not Just a Parent)", sub: FOE + ", S2 E363", by: "MacKenzie Price with Alpha guide Chauncey", yr: 2026,
    why: "A working guide on taking the mentor mindset home: high standards, high support, and routines that don't feel like a fight.",
    ideas: [
      "High standards paired with high support. Kids look for real challenge when they trust the adult behind it.",
      "Most life lessons are “caught, not taught.” Children copy what we do far more than what we say.",
      "“Glows, Grows & Everyone Should Know”: a simple daily framework for talking through the day together.",
      "Separate age from learning stage, so a child can close a gap without feeling ashamed of it.",
      "Practical ways to reach a quiet or anxious child, starting in their world."
    ],
    here: [["mentor", "Our guides use the same high-standards, high-support model."], ["mastery", "Children work at their own level in each subject, whatever their age."], ["bands", "Mixed-age bands make it normal to be at different stages."]],
    ask: ["Which of your habits is your child most likely to “catch” this year?", "Where is your child behind or ahead, and how do they feel about it?"],
    tryit: "Try Glows and Grows at dinner for a week: each person shares one thing that went well and one thing to work on, adults too.",
    link: ["Listen on Apple Podcasts", "https://podcasts.apple.com/us/podcast/future-of-education-podcast/id1673109764?i=1000797773957"] },

  { id: "foe-weekly-meeting", theme: "drive", kind: "Podcast", len: "46 min", t: "The 15-Minute Weekly Habit That Turns Kids into Self-Starters", sub: FOE + ", S2 E357", by: "MacKenzie Price with Alpha guide Jackson", yr: 2026,
    why: "A short weekly one-on-one is one of the most useful things a parent can borrow from school. This episode walks through how to run one.",
    ideas: [
      "One focused conversation a week helps a child name what they want, what's in the way, and their own next step.",
      "Use questions, in the style of motivational interviewing, instead of lecturing or jumping to a fix.",
      "Shift the agenda over time from the parent's list to the child's.",
      "Two ground rules: keep the conversation private, and tie goals to real-life skills.",
      "Fit the length to the child's age, and end by letting the child decide how they want to be held accountable."
    ],
    here: [["mentor", "Guides meet one-on-one with students to set goals and check progress."], ["choice", "Children set their own goals and pick their own challenges."], ["lifeskills", "Goals often become Life Skills challenges."]],
    ask: ["When did your child last set a goal that was truly theirs?", "In your check-ins, who does most of the talking?"],
    tryit: "Set a 15-minute weekly meeting with each child. Ask three questions: What do you want this week? What's in the way? What's your next step?",
    link: ["Listen on Apple Podcasts", "https://podcasts.apple.com/us/podcast/future-of-education-podcast/id1673109764?i=1000789037781"] },

  { id: "foe-grit", theme: "free", kind: "Podcast", len: "28 min", t: "When Grit Looks Like Crying", sub: FOE + ", S2 E327", by: "MacKenzie Price with Alpha guide Carrington", yr: 2026,
    why: "A reassuring listen for any parent of a young child who melts down at the hard part. Tears are often the start of grit.",
    ideas: [
      "Grit isn't a fixed trait. It grows under real challenge, the way a muscle grows under load.",
      "For a five-year-old, challenge often looks like tears and frustration. That's normal, and it's where the growth happens.",
      "Be a “spotter”: stay close and supportive, and let the child do the lift.",
      "“Confidence anchors,” sources of steadiness, help a child keep going while they struggle.",
      "The episode follows a young student working through a daunting bike challenge."
    ],
    here: [["lifeskills", "Challenges are built to be hard, with a “not yet” that invites another try."], ["risk", "Kids push through real difficulty, with skills taught first."], ["mentor", "Guides support without taking over."]],
    ask: ["What does your child's frustration look like, and what's your instinct when you see it?", "What's one thing you rescue your child from that they could push through?"],
    tryit: "Next time your child is stuck and upset, stay close, name the feeling, and wait one more minute before you help.",
    link: ["Listen on Apple Podcasts", "https://podcasts.apple.com/us/podcast/future-of-education-podcast/id1673109764?i=1000764541573"] },

  { id: "foe-coddling", theme: "free", kind: "Podcast", len: "24 min", t: "Are You Coddling Your Kid?", sub: FOE + ", S2 E364", by: "MacKenzie Price with educator Eric Salgado", yr: 2026,
    why: "A veteran principal on the signs of overprotection teachers see, and the small daily routines that build independence.",
    ideas: [
      "Overprotection usually comes from love, and it can still cost a child confidence, problem-solving and resilience.",
      "Teachers see the signs in class. Parents and school work best as one team.",
      "“1% better every day”: small daily wins instead of perfectionism.",
      "Morning routines, checklists and avoiding empty threats.",
      "The forgotten sports gear test: let a child live with the natural consequence."
    ],
    here: [["mentor", "High standards and high support, at school and at home."], ["lifeskills", "Self-Governance challenges include owning your own gear and routines."], ["bands", "Freedoms grow as children show they're ready."]],
    ask: ["What did you do for your child this week that they could have done themselves?", "If your child forgot something tomorrow, would you bring it?"],
    tryit: "Make a short morning checklist with your child, then stop reminding them. Let the list do the work.",
    link: ["Listen on Apple Podcasts", "https://podcasts.apple.com/us/podcast/future-of-education-podcast/id1673109764?i=1000798940554"] },

  { id: "greene-tilt", theme: "drive", kind: "Podcast", t: "How to Parent Angry and Explosive Children", sub: "Tilt Parenting, Session 81", by: "Ross Greene with Debbie Reber",
    why: "Ross Greene explains his model in under an hour. The most practical companion to Raising Human Beings.",
    ideas: [
      "Kids with hard behavior usually lack skills like flexibility, frustration tolerance and problem solving. They aren't short on motivation.",
      "Treat unmet expectations as unsolved problems. Fixing the problem gets at the cause; rewards and punishments only reach the symptom.",
      "Plan A imposes a solution, Plan B solves it with the child, Plan C sets it aside for now.",
      "Most problems are predictable, so solve them ahead of time, at a calm moment.",
      "Listening to a child's concerns doesn't weaken a parent's authority. Greene argues it strengthens it."
    ],
    here: [["cps", "Guides solve recurring problems with the child, using Greene's approach."], ["inclusive", "Support is shaped to the skill a child is missing."]],
    ask: ["Which problem in your home is completely predictable?", "Do you know your child's concern about it?"],
    tryit: "Write down the three most predictable problems in your week. Pick one to talk through with your child at a calm time.",
    link: ["Listen at Tilt Parenting", "https://tiltparenting.com/session81"] },

  { id: "sold-a-story", theme: "school", kind: "Podcast", len: "21 min", t: "Sold a Story, Season 2", sub: "Episode 1: It's Not Just Reading", by: "Emily Hanford, APM Reports", yr: 2026,
    why: "Season 1 showed why so many kids weren't taught to read well. Season 2 widens the lens to how kids learn anything, and why direct, well-built teaching works.",
    ideas: [
      "Season 1 (2022) showed how many U.S. schools taught children to guess at words from pictures and context instead of sounding them out.",
      "Season 2 opens with Zig Engelmann, an outsider who in the 1960s doubted what experts assumed young children could learn. He taught his 4-year-old twins basic algebra.",
      "Engelmann's approach, Direct Instruction, breaks skills into small clear steps and checks that each one is learned.",
      "The idea we take from it: competence builds confidence. Children who truly master the basics start to believe they can learn hard things."
    ],
    context: "Season 1 is the place to start if you haven't heard it. Season 2 began in October 2026.",
    here: [["montessori", "In K–1, letter sounds and phonics are taught directly, with Montessori language materials and decodable books."], ["mastery", "Mastery apps in grades 2–8 move a child on only when a skill is learned."], ["lifeskills", "Challenges have a clear standard and a “not yet,” so kids know when they've mastered something."]],
    ask: ["How were you taught to read? To do math?", "When has getting good at something made your child more confident?"],
    tryit: "When your young reader is stuck on a word, cover the picture and say, “Let's sound it out.”",
    link: ["Listen on Apple Podcasts", "https://podcasts.apple.com/us/podcast/sold-a-story/id1649580473?i=1000796435660"] },

  { id: "report-card-alpha", theme: "school", kind: "Podcast", len: "69 min", t: "Alpha School, with MacKenzie Price", sub: "The Report Card with Nat Malkus", by: "Nat Malkus (American Enterprise Institute) with MacKenzie Price", yr: 2025,
    why: "Alpha's co-founder explains the model to a researcher who asks hard questions. Worth hearing both the pitch and the pushback.",
    ideas: [
      "Alpha uses software and mastery learning, plus incentives, to speed up academics so the rest of the day can go to other things.",
      "Malkus presses on what's known so far. The first graduating class was small (twelve students), and most students come from well-off families, so results are hard to judge yet."
    ],
    here: [["mastery", "Our mornings borrow Alpha's mastery model."], ["screens", "Screens are used for mastery work, then put away."]],
    differ: "We borrow Alpha's mornings, not the whole model. Our afternoons are outdoors, our K–1 is Montessori.",
    ask: ["What would you want to see before believing any school's results, including ours?"],
    tryit: "Ask your child's guide how they know your child has mastered a skill, and what “mastered” means in that app.",
    link: ["Listen on Pocket Casts", "https://pocketcasts.com/podcast/the-report-card-with-nat-malkus/d6aa06d0-9792-0139-c11f-0acc26574db2/alpha-school-with-mackenzie-price/276b75a1-99fa-4150-a92b-01c5a67d3791"] },

  /* ================= watch ================= */
  { id: "skenazy-ted", theme: "free", kind: "Talk", len: "13 min", t: "Why You Should Spend Less Time with Your Kids", sub: "TED2025", by: "Lenore Skenazy", yr: 2025,
    why: "The author of Free-Range Kids makes her case in thirteen minutes. A good one to watch with your partner.",
    ideas: [
      "Heavy adult involvement in childhood (directing play, hovering, constant phone use) has fed anxiety in kids and in parents.",
      "Kids often learn the most when adults step back.",
      "Skenazy co-founded Let Grow, which helps schools and families give kids more independence."
    ],
    here: [["risk", "Children range more widely as they pass Safety Gates."], ["nature", "Afternoons outdoors include play no adult is running."], ["bands", "Freedoms grow with each band."]],
    ask: ["Where in your child's week is there no adult in charge?", "What are you most afraid would happen if you stepped back?"],
    tryit: "Watch it together with your partner, then each name one thing your child could do alone this month.",
    link: ["Watch on TED", "https://www.ted.com/talks/lenore_skenazy_why_you_should_spend_less_time_with_your_kids"] },

  { id: "lythcott-haims-ted", theme: "free", kind: "Talk", len: "14 min", t: "How to Raise Successful Kids, Without Over-Parenting", sub: "TED Talks Live", by: "Julie Lythcott-Haims", yr: 2015,
    why: "A former Stanford dean of freshmen on what over-managed childhoods cost, and what kids need instead.",
    ideas: [
      "Micromanaging children's lives and loading them with expectations doesn't help them.",
      "Stop defining a child's success by grades and test scores.",
      "Focus on unconditional love. She saw what over-parenting costs firsthand as Stanford's dean of freshmen."
    ],
    here: [["private", "No academic rankings or leaderboards."], ["lifeskills", "Life Skills are about doing real things yourself."], ["mentor", "Guides care about the whole child."]],
    ask: ["How much of your talk with your child is about grades and scores?", "What does success mean in your family?"],
    tryit: "For one week, when you ask about school, skip “How did you do?” and ask “What did you try?”",
    link: ["Watch on TED", "https://www.ted.com/talks/julie_lythcott_haims_how_to_raise_successful_kids_without_over_parenting"] },

  { id: "myth-of-average", theme: "school", kind: "Talk", t: "The Myth of Average", sub: "TEDxSonomaCounty", by: "Todd Rose", yr: 2013,
    why: "A short, memorable talk on why a system built for the “average” child fits almost no one.",
    ideas: [
      "In the 1950s the U.S. Air Force measured more than 4,000 pilots on 10 body dimensions to design a cockpit for the average pilot. Not one pilot was average on all 10.",
      "Every person has a jagged profile: strong in some things, weaker in others. Averages hide that.",
      "The Air Force fixed it by designing to the edges, with adjustable seats. Schools can do the same."
    ],
    here: [["mastery", "Each child works at their own level in each subject, so a child can be ahead in math and still building in reading."], ["inclusive", "The same high bar, with paths shaped to each child."], ["choice", "Choice in books and challenges lets kids lean into their spikes."]],
    ask: ["Where is your child jagged: way ahead in some things, behind in others?", "Which expectations in your child's life were designed for an “average” kid?"],
    tryit: "List three of your child's spikes and one dip, and share them with their guide.",
    link: ["Watch on YouTube", "https://www.youtube.com/watch?v=4eBmyttcfU4"] },

  { id: "changing-paradigms", theme: "school", kind: "Video", t: "Changing Education Paradigms", sub: "RSA Animate", by: "Sir Ken Robinson", yr: 2010,
    why: "A quick, animated challenge to the factory model of school.",
    ideas: [
      "Most schools are still organized like factories: bells, separate subjects, and children batched by age, as if their date of manufacture is the most important thing about them.",
      "Divergent thinking, seeing many possible answers to a question, is a key part of creativity. Robinson argues it declines the longer children spend in school.",
      "Most great learning happens in groups, and collaboration is how growth happens."
    ],
    here: [["bands", "Mixed-age bands instead of single-grade classrooms."], ["choice", "Children choose the order and content of much of their learning."], ["projects", "Projects and Life Skills challenges reward many possible answers."]],
    know: { t: "Two cautions. The famous claim that 98% of kindergartners scored at genius level comes from a popular book, not a published study. And Robinson calls ADHD a “fictitious epidemic.” We don't share that view: many of our students are neurodivergent, and their needs are real." },
    ask: ["What did school teach you about whether there's only one right answer?", "Where does your child get to come up with many answers instead of one?"],
    tryit: "Ask your child how many uses they can think of for an ordinary object, like a paper clip. Count them together.",
    link: ["Watch on YouTube", "https://www.youtube.com/watch?v=zDZFcDGpL4U"] },

  { id: "most-likely-to-succeed", theme: "school", kind: "Video", len: "86 min", t: "Most Likely to Succeed", sub: "Documentary, Sundance 2015", by: "Directed by Greg Whiteley", yr: 2015,
    why: "A year inside High Tech High in San Diego, where students learn through big projects with real audiences. Good for a family movie night.",
    ideas: [
      "The film argues that school in America has changed little in a century, while the world it prepares kids for has changed a lot.",
      "At High Tech High, a public charter school, students build ambitious projects and show them to the public.",
      "It follows students and teachers through a year of projects, including the ones that struggle."
    ],
    here: [["projects", "Long, self-designed projects in grades 5–8."], ["lifeskills", "Storytelling & Speaking challenges put kids in front of real audiences."]],
    know: { t: "The film leans on the “factory model” story of how schools began, which education historians dispute. Some critics also felt it sold project-based learning without enough doubt.", src: ["Background and critiques on Wikipedia", "https://en.wikipedia.org/wiki/Most_Likely_to_Succeed_(film)"] },
    ask: ["Which student in the film reminded you of your child?", "What would your child build if they had a whole semester?"],
    tryit: "Watch it as a family (older kids) and ask your child what project they'd pick.",
    link: ["Where to watch", "https://www.whatschoolcouldbe.org/most-likely-to-succeed"] },

  { id: "death-of-recess", theme: "free", kind: "Video", len: "Documentary", t: "The Death of Recess", sub: "Documentary, Angel Studios", by: "Spencer Taylor",
    why: "A documentary on how school pushed out play, movement and time outdoors, and the schools bringing them back.",
    ideas: [
      "Many schools have cut or ended daily recess as testing and schedules took over.",
      "The film presents research that movement and hands-on learning help memory, emotional health and development.",
      "It looks at alternatives, including outdoor education models."
    ],
    here: [["nature", "A daily nature walk and afternoons mostly outdoors."], ["risk", "Real play, with skills taught first."]],
    ask: ["How much free time outdoors did you get in a school day? How much does your child get?"],
    tryit: "Ask your child to show you their favorite spot outside at school, and what they do there.",
    link: ["Watch on Angel", "https://www.angel.com/watch/death-of-recess"] }
];

// the three to start with, in order
export const START = ["10-to-25", "self-driven-child", "free-range-kids"];

// Lighter reading: one card each, linking out. g = which group it shows in.
export const READS = [
  /* the bigger movement */
  { g: "movement", t: "7 Things to Know About Microschools in 2026", src: "The 74", by: "Linda Jacobson", d: "June 2026", url: "https://www.the74million.org/article/exclusive-7-things-to-know-about-microschools-in-2026/",
    why: "The latest national snapshot. Microschools are lasting: 1 in 5 has been open six or more years and 70% expect to reach ten. The median private microschool has about 20 students, and about half get more than a quarter of their tuition from state school-choice programs." },
  { g: "movement", t: "As Movement Grows, Microschools Aren't So “Micro” Anymore", src: "The 74", by: "Linda Jacobson", d: "May 2025", url: "https://www.yahoo.com/news/exclusive-report-movement-grows-microschools-103000348.html",
    why: "Microschools now serve roughly 750,000 U.S. students, about 2% of the total. Fewer than a quarter are accredited, and 38% take state choice funds." },
  { g: "movement", t: "Why Microschools Are Multiplying", src: "Education Next", by: "Mickey Revenaugh", d: "July 2026", url: "https://www.educationnext.org/why-microschools-are-multiplying-schools-out-book-excerpt/",
    why: "From her book School's Out. Revenaugh estimates more than 100,000 microschools serving 1 to 2 million children, and argues they're often a strong fit for boys and neurodivergent kids." },
  { g: "movement", t: "A School With 7 Students: Inside the “Microschools” Movement", src: "The New York Times", d: "2024", url: "https://ca.news.yahoo.com/school-7-students-inside-microschools-172733589.html",
    why: "A clear-eyed look at the upside and the risks: microschools are lightly regulated and aren't bound by the same disability laws as public schools." },
  { g: "movement", t: "The Macro Dilemma with Microschools", src: "Chalkbeat", by: "Erica Meltzer", d: "June 2026", url: "https://cbnewsletters.chalkbeat.org/p/the-macro-dilemma-with-microschools",
    why: "In Indiana, public school districts are opening microschools too. The open question is which families get access." },
  { g: "movement", t: "Microschools as an Emerging Education Model", src: "RAND", d: "2025", url: "https://www.rand.org/pubs/research_reports/RRA3698-1.html",
    why: "An independent research look at what's known, and how much isn't yet, about how microschool students do." },
  { g: "movement", t: "The State of Private and Microschool Enrollment", src: "Sutherland Institute (Utah)", d: "January 2024", url: "https://sutherlandinstitute.org/the-state-of-private-and-microschool-enrollment/",
    why: "Utah's picture: about a quarter of Utah parents said they'd choose a private school if they could, and the Utah Fits All scholarship gives eligible families $8,000 a year." },
  /* on Alpha, both sides */
  { g: "alpha", t: "Your Review: Alpha School", src: "Astral Codex Ten", d: "June 2025", url: "https://www.astralcodexten.com/p/your-review-alpha-school",
    why: "A parent who moved to Austin and enrolled three kids writes the most detailed outside account we've seen: what works (mastery pacing, incentives, strong guides) and what's oversold (“two hours” runs closer to three and a half, and the results data is thin)." },
  { g: "alpha", t: "Wealthy Parents Pay $75,000 for Alpha's Two-Hour AI School Day. Half of Its K-8 Students Missed the Math Target.", src: "Fortune", by: "Muskaan Arshad", d: "November 2026", url: "https://fortune.com/2026/11/14/alpha-school-ai-students-tuition-learning-goals",
    why: "A critical look at Alpha's own numbers: only 42% of students met its “2x” learning goal in both subjects. Worth reading next to the review above." },
  /* research we keep coming back to */
  { g: "research", t: "Decline in Independent Activity as a Cause of Decline in Children's Mental Well-Being", src: "Journal of Pediatrics", by: "Peter Gray, David Lancy & David Bjorklund", d: "2023", url: "https://www.petergray.org/_files/ugd/b4b4f9_eb922e47312e43cf94b8ba5923e9993b.pdf",
    why: "Three researchers summarize the evidence that kids today get far less time to play, roam and do things without adults, and argue it's a major cause of rising anxiety and depression." },
  { g: "research", t: "Childhood Friends, Not Moms, Shape Attachment Styles Most", src: "Nautilus", by: "Kristen French", d: "November 2025", url: "https://nautil.us/childhood-friends-not-moms-shape-attachment-styles-most-1247316/",
    why: "A study following about 1,300 children to ages 26 to 31 found childhood friendships predicted adult relationship security more than relationships with mothers did. Friendships are where kids practice give and take." },
  { g: "research", t: "Young Adults Are More Perfectionistic Than Ever Before", src: "American Psychological Association", d: "May 2026", url: "https://www.apa.org/news/press/releases/2026/05/young-adults-perfectionistic",
    why: "A review of 35 years of studies covering more than 82,000 college students. Fear of failure and of being judged has risen fastest, and perfectionism stays tied to anxiety and depression." },
  { g: "research", t: "Outside Play", src: "University of British Columbia", url: "https://www.outsideplay.org/", go: "Try the tool ↗",
    why: "A free online tool for parents who feel nervous about risky play, from Mariana Brussoni's lab at UBC and BC Children's Hospital. It builds the confidence to let kids play outside with some risk." }
];

export const READ_GROUPS = {
  movement: ["The bigger movement", "Wilderland is one of thousands of microschools. Here's what reporters and researchers are finding, good and bad."],
  alpha: ["On Alpha, both sides", "Our mornings borrow from Alpha School. These are the two most useful outside looks at it."],
  research: ["Research we keep coming back to", "Short reads and one tool, shared by our team."]
};
