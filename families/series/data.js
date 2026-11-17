// Field Notes: the parent education series. One entry per book or talk from Wilderland's Inspiration list
// (https://wilderland.academy/inspiration), the "Philosophical Canon" plus "Other Media". Only titles on that list go here.
// Each entry: why it matters to us, big ideas, where you'll see it at Wilderland (METHODS), where we part ways,
// anything worth knowing about the evidence, questions to talk about, and one thing to try.
// Plain language for parents. No em dashes in copy. Paraphrase the books; quote only what has been checked.

export const INSPIRATION = "https://wilderland.academy/inspiration";

// Wilderland practices a book can point to. Keep these to things that really happen at school.
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

export const ITEMS = [
  /* ---------------- start here ---------------- */
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

  /* ---------------- motivation from the inside ---------------- */
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

  { id: "your-childs-strengths", theme: "drive", kind: "Book", t: "Your Child's Strengths", sub: "Discover Them, Develop Them, Use Them", by: "Jenifer Fox", yr: 2008,
    why: "A school leader's argument that we spend too much energy fixing weaknesses and too little building on what energizes a child.",
    ideas: [
      "A strength isn't just something you're good at. It's something that leaves you feeling energized and engaged.",
      "Fox names three kinds: activity strengths (what absorbs you), relationship strengths (what you do for and with others that makes you feel valued), and learning strengths (how you best take in new things).",
      "School mostly measures deficits. A child who only hears about weaknesses learns to see themselves that way.",
      "Strengths can be discovered on purpose, with reflection and a little structure. The book includes tools to do it."
    ],
    here: [["projects", "Passion pursuits and projects start from what a child cares about."], ["choice", "Choosing their own challenges lets children lean into what energizes them."], ["inclusive", "The bar stays the same; the path is shaped to the child."]],
    differ: "We still hold a floor in core academics for every child. Strengths are how we get there, not a reason to skip it.",
    ask: ["When does your child lose track of time?", "What does your child do for others that makes them light up?", "How much of your talk with your child is about fixing weaknesses?"],
    tryit: "For a week, jot down moments your child seems most energized. Then look for the pattern together." },

  /* ---------------- independence, play and nature ---------------- */
  { id: "play", theme: "free", kind: "Book", t: "Play", sub: "How It Shapes the Brain, Opens the Imagination, and Invigorates the Soul", by: "Stuart Brown with Christopher Vaughan", yr: 2009,
    why: "A psychiatrist's case that play is a biological need, not a reward for finishing the real work.",
    ideas: [
      "Play is done for its own sake. It's voluntary, absorbing, and makes you lose track of time.",
      "Play prepares us for the unexpected. It's how young animals and people rehearse for a world they can't predict.",
      "Brown began studying play after looking at the life histories of young men who had committed murder, and finding severe play deprivation.",
      "Adults need play too, and a child who sees adults play learns it's allowed."
    ],
    here: [["nature", "Unstructured time outdoors is part of every day."], ["projects", "Hobbies like music, art and games can become Life Skills work when a child takes them further."], ["risk", "Climbing and adventurous play are part of the day, with the skills taught first."]],
    know: { t: "The murderer research was small and observational, and Brown himself hedges on it. Treat it as a striking clue, not proof." },
    ask: ["When did your child last play with no adult running it?", "What did you play as a kid that you'd want for them?", "What's your own play?"],
    tryit: "Protect one afternoon this week with nothing scheduled and no screens." },

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

  { id: "anxious-generation", theme: "free", kind: "Book", t: "The Anxious Generation", sub: "How the Great Rewiring of Childhood Is Causing an Epidemic of Mental Illness", by: "Jonathan Haidt", yr: 2024,
    why: "The most talked-about case for a play-based childhood over a phone-based one.",
    ideas: [
      "Between about 2010 and 2015, childhood shifted from play-based to phone-based, and teen anxiety and depression rose sharply.",
      "We overprotect children in the real world and underprotect them online.",
      "Haidt proposes four norms: no smartphones before high school, no social media before 16, phone-free schools, and far more independence and free play.",
      "These work best when families agree on them together."
    ],
    here: [["screens", "Students use Chromebooks for mastery work, not phones, and school tech use is monitored."], ["nature", "Most afternoons are outdoors, with real play."], ["risk", "Independence and healthy risk are built into the day."]],
    know: { t: "Haidt's claim that phones and social media caused the rise in teen mental illness is disputed. Psychologist Candice Odgers argued in Nature that the research doesn't show it; Haidt has responded at length. His four norms are sensible either way.", src: ["Odgers in Nature (2024)", "https://www.nature.com/articles/d41586-024-00902-2"] },
    ask: ["When does your family plan to give your child a smartphone, and why then?", "Are we protecting our kids more in the real world or online?", "Which families could you agree with on phone norms, so your child isn't the only one?"],
    tryit: "Talk with two other Wilderland families about when your kids will get phones.",
    link: ["The book's site", "https://www.anxiousgeneration.com/"] },

  /* ---------------- connection and attention ---------------- */
  { id: "stolen-focus", theme: "connect", kind: "Book", t: "Stolen Focus", sub: "Why You Can't Pay Attention, and How to Think Deeply Again", by: "Johann Hari", yr: 2022,
    why: "An argument that our trouble focusing isn't just a personal failing. Much of it is done to us.",
    ideas: [
      "Hari names twelve causes of lost focus, from technology designed to grab attention to too little sleep and too much stress.",
      "Constant switching between tasks has real costs. Deep focus, or flow, takes protected time.",
      "Reading long books builds a kind of attention that skimming doesn't.",
      "One chapter is about children: how much less freedom kids now have to play and roam, and what that does to their attention."
    ],
    here: [["mastery", "Mornings are split into focused segments, one subject at a time."], ["screens", "Devices are for mastery work, with tech use monitored."], ["choice", "Children choose their own books, and reading every day is expected."], ["lifeskills", "Energy, one of our eight Life Skills, includes sleep."]],
    know: { t: "Psychologist Stuart Ritchie and others have criticized the book for leaning on anecdote. Hari himself notes there are no long-term studies tracking changes in people's ability to focus. Read it as a strong argument, not settled science.", src: ["Irish Times on the critiques", "https://www.irishtimes.com/culture/too-few-of-us-are-paying-attention-to-the-problems-with-johann-hari-s-new-book-1.4775651"] },
    ask: ["What pulls your attention most in a day? What about your child's?", "When did your child last get lost in something for an hour?", "Is sleep protected in your home, for kids and adults?"],
    tryit: "Choose one hour a day this week as a phone-free family hour, adults included." },

  /* ---------------- rethinking school ---------------- */
  { id: "one-world-schoolhouse", theme: "school", kind: "Book", t: "The One World Schoolhouse", sub: "Education Reimagined", by: "Salman Khan", yr: 2012,
    why: "Khan Academy's founder on why kids should move on when they've mastered something, not when the calendar says so.",
    ideas: [
      "In a time-based class, everyone moves on together, so most kids carry gaps. Khan calls it “Swiss cheese” learning, and the holes catch up with them later.",
      "Mastery learning flips that: the time varies, the understanding doesn't.",
      "Video and software can handle much of the explaining, freeing class time for working problems with help.",
      "Grouping children strictly by age is a habit, not a law of learning. Mixed ages let kids learn from and teach each other."
    ],
    here: [["mastery", "Mornings are built on exactly this: own level, own pace, move on when mastered."], ["bands", "Mixed-age bands let older and younger kids learn together."], ["mentor", "Guides spend their time coaching, not lecturing."]],
    differ: "Khan imagines technology doing most of the teaching. We pair it with Montessori materials, Life Skills, and a lot of time outdoors.",
    ask: ["Did you ever move on in school before you really understood something? What happened later?", "How would you feel if your child spent longer on a skill than their age-mates? Or less?", "What does “finished” mean in your house: done, or done well?"],
    tryit: "Ask your child to teach you one thing they mastered this week." },

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

  { id: "sold-a-story", theme: "school", kind: "Podcast", t: "Sold a Story", sub: "How Teaching Kids to Read Went So Wrong", by: "Emily Hanford, APM Reports", yr: 2022,
    why: "A gripping investigation of why so many American kids weren't taught to read well, and why we teach reading the way we do.",
    ideas: [
      "Many U.S. schools taught children to guess at words using pictures and context, a method called three-cueing, instead of sounding them out.",
      "The research is clear that young readers need explicit, systematic teaching of how letters and sounds work.",
      "Popular programs and well-meaning teachers spread an approach that didn't match the science, for decades.",
      "Season 2 (2026) asks what else in teaching should be rebuilt on how children actually learn."
    ],
    here: [["montessori", "In K–1, letter sounds and phonics are taught directly, with Montessori language materials and decodable books."], ["mastery", "Reading apps in grades 2–8 move a child on only when they've mastered a skill."], ["choice", "Once they can read, children choose their own books."]],
    ask: ["How were you taught to read?", "When your child gets stuck on a word, what do you usually say?"],
    tryit: "When your young reader is stuck on a word, cover the picture and say, “Let's sound it out.”",
    link: ["Listen", "https://features.apmreports.org/sold-a-story/"] },

  { id: "teach-like-finland", theme: "school", kind: "Book", t: "Teach Like Finland", sub: "33 Simple Strategies for Joyful Classrooms", by: "Timothy D. Walker", yr: 2017,
    why: "An American teacher's account of teaching in Helsinki, and the small habits behind joyful, serious classrooms.",
    ideas: [
      "Walker groups his strategies under five ideas: well-being, belonging, autonomy, mastery and mindset.",
      "Frequent breaks matter. Finnish students often get a 15-minute break after each 45 minutes of class.",
      "Students are expected to take responsibility for themselves, and teachers have freedom in how they teach.",
      "Finland pairs that freedom with plenty of traditional, teacher-led instruction. Joy and rigor aren't opposites."
    ],
    here: [["mastery", "Mornings run in focused segments, with movement and outdoor time around them."], ["choice", "Students set their own pace and own much of their day."], ["mentor", "Belonging comes first: every child is known by at least one adult."]],
    differ: "Like Finland, we pair freedom with direct teaching. Choice here covers pace and order, not whether a child gets taught.",
    ask: ["Where does your child get real breaks in a day?", "What would a joyful school day look like to your child?"],
    tryit: "Try a work-then-move rhythm for app work or reading at home: 20 minutes on, 5 minutes moving." },

  { id: "thomas-jefferson-education", theme: "school", kind: "Book", t: "A Thomas Jefferson Education", sub: "Teaching a Generation of Leaders for the 21st Century", by: "Oliver DeMille", yr: 2000,
    why: "A Utah classic on mentoring, great books and inspiring kids rather than forcing them.",
    ideas: [
      "DeMille's seven keys: classics, not textbooks; mentors, not professors; inspire, not require; structure time, not content; quality, not conformity; simplicity, not complexity; you, not them.",
      "“You, not them”: the best way to raise a learner is to be one, visibly.",
      "Children move through phases: a core phase of values and family life (roughly up to age 8), a love-of-learning phase (about 8 to 12), and a scholar phase (about 12 to 16)."
    ],
    here: [["mentor", "Guides are mentors, and weekly coaching is one-on-one."], ["choice", "Children choose their own books, and inspiration is the goal."], ["bands", "Our bands roughly track the phases: discover, take ownership, design and lead."]],
    differ: "We require more than DeMille does. Core academics happen every morning for every child, and mastery apps do much of that work. Inspiration is how we want children to feel about it.",
    ask: ["What are you reading right now that your child sees you read?", "Which subject would your child chase on their own if it were sparked?", "What would “structure time, not content” look like at home?"],
    tryit: "Read something you love where your child can see you, then tell them about it." },

  { id: "excellent-sheep", theme: "school", kind: "Book", t: "Excellent Sheep", sub: "The Miseducation of the American Elite and the Way to a Meaningful Life", by: "William Deresiewicz", yr: 2014,
    why: "A former Yale professor on what goes wrong when kids are raised to win the race without asking which race is theirs.",
    ideas: [
      "High-achieving students are often anxious, timid and lost: superb at clearing hurdles, unsure why they're running.",
      "Chasing credentials crowds out curiosity, risk-taking and the freedom to fail.",
      "The real purpose of education is to build a self: to think for yourself and decide what your life is for."
    ],
    here: [["lifeskills", "“Ready for life, not just tests” is one of our three promises."], ["private", "No rankings or leaderboards in academics."], ["projects", "Projects let kids find out what they care about, with real chances to fail."]],
    ask: ["Are we raising our child to win the race, or to know which race is theirs?", "What would your child do if no one were grading it?", "Which of your child's activities are for them, and which are for a résumé?"],
    tryit: "Ask your child what they'd learn this month if nothing counted." },

  { id: "school-of-our-own", theme: "school", kind: "Book", t: "A School of Our Own", sub: "The Story of the First Student-Run High School and a New Vision for American Education", by: "Samuel Levin & Susan Engel", yr: 2016,
    why: "The true story of a high school junior who designed a semester run by students, and what happened when it worked.",
    ideas: [
      "In 2010, students at Monument Mountain Regional High School in Massachusetts ran their own semester, called the Independent Project.",
      "Each week they picked a real question, researched it, and taught their findings to each other. They read books they chose and wrote about them.",
      "Each student carried one long project of their own, like building a kayak or writing a novel, plus a group project together.",
      "Students asked more questions, judged sources better and managed their time better. Engagement turned out to be a design problem."
    ],
    here: [["projects", "Long, self-designed projects in grades 5–8."], ["choice", "Students choose their own books and challenges."], ["lifeskills", "Storytelling & Speaking challenges ask kids to teach and present to real audiences."]],
    differ: "These were high schoolers with a strong school around them. Our younger students get more structure, and the structure loosens as they show they're ready.",
    ask: ["If your child designed their own semester, what would be in it?", "Where does your child already teach others?"],
    tryit: "Ask your child one real question this week, and let them research it and teach you the answer." },

  { id: "free-at-last", theme: "school", kind: "Book", t: "Free at Last", sub: "The Sudbury Valley School", by: "Daniel Greenberg", yr: 1987,
    why: "Stories from the most radical school in America: one that trusts children to run their own education.",
    ideas: [
      "At Sudbury Valley in Massachusetts, founded in 1968, there are no required classes and no grades.",
      "Children of all ages mix freely and learn from each other.",
      "The school is run by a School Meeting where every student and staff member gets one vote, including on rules.",
      "Children learn things like reading when they're ready and want to, often faster than adults expect."
    ],
    here: [["bands", "Mixed ages learning side by side."], ["choice", "Real choices about how and what, growing with age."], ["lifeskills", "Self-Governance is one of our eight Life Skills."]],
    differ: "We part ways on required learning. Sudbury makes all classes optional. We protect a daily academic block for every child, because research on young learners favors direct, explicit teaching.",
    ask: ["How much of your child's learning do you trust them to direct?", "What rules would your child write for their school, or your home?"],
    tryit: "Hold a family meeting where your child proposes one house rule. If it's fair, everyone follows it, including you." }
];

// the three to start with, in order
export const START = ["self-driven-child", "free-range-kids", "lost-connections"];
