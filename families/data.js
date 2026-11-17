// Wilderland at Home: content for the parent site. Sources: Lower and Upper Campus Parent Handbooks (Oct 2026),
// Parent Partnership Guide (Spring 2026), Parent Education Night packet, /challenges/parents.html, and Yeager's 10 to 25.
// Plain language for parents. Avoid em dashes in copy.

export const BANDS = { k1: "Grades K–1", g24: "Grades 2–4", g58: "Grades 5–8" };
export const SCHED = { ft: "Full time", pt: "Part time" };

/* ---------- mentor mindset at home ---------- */
export const QUAD = {
  E: ["Enforcer", "High standards, low support", "“Because I said so.”", "Gets you through tonight. Your child learns that you think they won't do the right thing unless someone makes them."],
  M: ["Mentor", "High standards, high support", "“The bar stays high. I know you can reach it, and I'll help.”", "Your child hears respect. Even hard feedback lands as belief in them."],
  A: ["Checked out", "Low standards, low support", "“Whatever. Do what you want.”", "Usually a sign the adult is running on empty, not that they don't care."],
  P: ["Protector", "Low standards, high support", "“You've had a long day. I'll just do it.”", "Feels kind in the moment. Your child hears that you doubt them, and misses the chance to find out they can."]
};

// Front: a line most loving parents have said. Back: a mentor version.
export const SWAPS = [
  { k: "E", say: "“Because I said so.”", instead: "“Here's my reason: ___. What part doesn't make sense to you?”", why: "Explaining your reason treats your child as someone who can understand it." },
  { k: "E", say: "“If you don't finish your app work, no screens all weekend.”", instead: "“App work is the deal today. Do you want to start now or right after snack?”", why: "The standard stays. The threat goes. The choice of when is theirs." },
  { k: "P", say: "“Here, I'll just do it.”", instead: "“Show me where you got stuck. I'll sit right here.”", why: "Staying close is support. Taking over says you don't think they can." },
  { k: "P", say: "“It's okay. Math just isn't your thing.”", instead: "“Math is hard right now. Hard means you're at the edge of what you know. What have you tried?”", why: "Lowering the bar to comfort them quietly agrees that they can't." },
  { k: "E", say: "“How many times do I have to tell you?”", instead: "“What's your plan for remembering this tomorrow?”", why: "Moves the thinking from your head into theirs." },
  { k: "P", say: "“You did great!” (when it wasn't there yet)", instead: "“This part is strong. This part isn't there yet. What would make it better?”", why: "Kids can tell when praise is fake. Honest feedback with belief is the compliment." },
  { k: "E", say: "“You're grounded!” (in the heat of it)", instead: "“I'm too upset to decide anything right now. We'll talk after dinner.”", why: "Nobody solves problems well mid-meltdown, adults included." },
  { k: "P", say: "“You can quit if it's too hard.”", instead: "“You don't have to love it. You do finish what you started. What would help?”", why: "Hard is not a reason to stop. It is the point." },
  { k: "E", say: "“Stop whining.”", instead: "“I can hear this feels unfair. Tell me what's going on.”", why: "Listening first is how you find the real problem." },
  { k: "P", say: "“I'll email your guide and fix it.”", instead: "“What do you want to tell your guide? I'll help you plan what to say.”", why: "Speaking up for themselves is a life skill. You can coach without taking over." },
  { k: "E", say: "“You're being lazy.”", instead: "“Something is making this hard to start. What is it?”", why: "Kids do well if they can. A stall usually means a skill or a worry, not a character flaw." },
  { k: "P", say: "“You're so smart!”", instead: "“You kept trying different ways until it worked.”", why: "Praise the effort and strategy they can repeat, not a label they have to protect." }
];

export const CHECKS = [
  ["Standard", "Did I keep the real bar, out loud?"],
  ["Support", "Did I show I believe in them, and offer a real way to help?"],
  ["Autonomy", "Did I leave the thinking and the next choice with them?"]
];

/* ---------- hard moments at home ---------- */
// ages: "y" = younger (K–4), "o" = older (5–8), "b" = both. pt = matters most for part-time families.
export const MOMENTS = [
  { id: "door", ages: "b", title: "Getting out the door", when: "It's 7:35, shoes aren't on, and you've said “hurry up” six times.",
    E: "Louder reminders, a countdown, a threat about the car leaving.", P: "Putting their shoes on, packing their bag, carrying everything to the car.",
    M: ["In a calm moment (not at 7:35), build the morning routine together: a picture checklist for little ones, their own written list for older kids.", "Agree on the leave time and let the clock be the boss: “We leave at 7:40. Check your list.”", "Pack the night before and keep it by the door.", "Let small things teach. A forgotten library book teaches more than a reminder. Always bring what matters for health and safety, like lunch, water and warm layers."],
    lines: ["“What's on your list for this morning?”", "“Check your list.”", "“What would make tomorrow morning easier? Let's change the plan tonight.”"],
    why: "Owning the routine builds the self-management your child is practicing at school. Nagging moves the job back to you." },
  { id: "screens", ages: "b", title: "Screen time ends in a meltdown", when: "The timer goes off and your child explodes.",
    E: "Yanking the device, adding a punishment on top.", P: "“Okay, five more minutes,” again and again.",
    M: ["Set the limit ahead of time, together. Let your child set the timer and choose a stopping point, like the end of a level or episode.", "Give a heads-up before the end, then hold the limit kindly.", "Name the feeling, keep the boundary: “It's hard to stop when it's fun. Time's up.”", "If it keeps happening, solve it together later (see “The same fight keeps happening”)."],
    lines: ["“How will you know when to stop? Set the timer yourself.”", "“I get it. Stopping is hard. The answer is still no.”", "“When we're both calm, let's figure out a plan that works better.”"],
    why: "Games and short videos are built to be hard to put down. A limit your child helped set is easier to keep than one dropped on them." },
  { id: "phone", ages: "o", title: "“Everyone else has a phone”", when: "Your middle schooler wants a smartphone or social media.",
    E: "“Not happening. End of discussion.”", P: "Giving in to keep the peace, or because you don't want them left out.",
    M: ["Take the request seriously. Ask what they want it for: talking to friends, coordinating rides, not feeling left out.", "Share your reasons honestly. Wilderland's guidance is to delay smartphones until high school and social media until 16, and to avoid short-form video.", "Solve the real need: a basic phone or smartwatch for calls and texts, or set times on a shared family device.", "Talk with other families. It is much easier to wait when your child isn't the only one."],
    lines: ["“What would a phone let you do that you can't do now?”", "“Here's what I'm worried about, and here's why.”", "“Let's find a way you can stay in touch with friends that I'm also okay with.”"],
    why: "At this age, being left out is a real status threat. Respecting that need while holding your limit is the mentor move." },
  { id: "appwork", ages: "b", pt: true, title: "Off-day app work turns into a battle", when: "It's a home day and your child won't start their lessons.",
    E: "Standing over them, taking away everything until it's done.", P: "Letting it slide “just this once,” or doing problems for them.",
    M: ["Same time, same place, every school day. A routine removes the daily negotiation.", "Let them choose within the limit: “Before lunch or right after?”", "Sit nearby, phones away, and let them do the work. Stop at the daily target.", "Don't teach a different method. If they're truly stuck, tell their academic guide.", "Look at the Dashboard together once a week."],
    lines: ["“What's your target today? When do you want to start?”", "“What part is hard? Show me.”", "“Let's tell your guide this one is stuck.”"],
    why: "Mastery comes from a little practice every day. The goal is a habit your child runs, not a nightly fight you win." },
  { id: "bad", ages: "b", title: "“I'm bad at math” or “I'm stupid”", when: "Your child is frustrated and putting themselves down.",
    E: "“That's ridiculous. Just try harder.”", P: "“That's okay, you're good at other things,” and moving on.",
    M: ["Don't argue and don't agree. Name the feeling and reframe the struggle.", "Ask what they've tried. Offer the smallest hint that works, not the answer.", "Point to past proof: something that used to be hard and isn't now.", "If it keeps coming up, tell their guide. They want to know."],
    lines: ["“That feeling is your brain stretching. It's supposed to feel hard.”", "“What have you tried so far?”", "“Remember when reading chapter books felt impossible?”"],
    why: "Treating stress as a sign of growth, not of failure, helps kids keep going. Yeager's studies found this pairing of mindsets helped students in demanding courses." },
  { id: "catchup", ages: "b", pt: true, title: "Catch-up work keeps piling up", when: "The Dashboard shows a growing pile of catch-up lessons and your child feels behind.",
    E: "A weekend marathon to clear it all.", P: "Ignoring it and hoping it goes away. It doesn't. Catch-up work stays until it's done.",
    M: ["Look at the Dashboard together. Make a plan for small daily chunks; short daily catch-up beats one big session.", "Let your child propose the plan, then check it together each week.", "Talk to their academic guide about adjusting expectations. This is a normal, welcome conversation, not a failure."],
    lines: ["“How much could you do each day this week? Let's see if that clears it.”", "“Let's ask your guide if the daily target fits our week.”"],
    why: "Working in catch-up mode every day is discouraging and slows real progress. A realistic plan your child owns gets them out of it." },
  { id: "meltdown", ages: "b", title: "A big meltdown", when: "Your child is yelling, crying or shut down, and nothing you say helps.",
    E: "Lecturing, consequences on the spot, “Go to your room until you can behave.”", P: "Removing every demand so the storm stops.",
    M: ["Connection before correction. Stay calm and close; your nervous system is the most powerful tool you have.", "Validate the feeling, hold the line on behavior: “You're angry, and we don't hit.”", "Wait until everyone is calm before talking about what happened or what comes next.", "Take care of yourself so you can show up regulated."],
    lines: ["“I see this is really hard.”", "“I'm right here.”", "“We'll figure it out when we're both calm.”"],
    why: "When a child is flooded, the thinking part of the brain is offline. Logic and consequences can't land until calm comes back." },
  { id: "repeat", ages: "b", title: "The same fight keeps happening", when: "Bedtime, chores, homework: it's the same argument every week.",
    E: "Bigger rewards and bigger punishments.", P: "Giving up on the expectation.",
    M: ["Pick a calm time to talk, not during the conflict.", "Empathy: “I've noticed ___ is hard. What's up?” Then just listen.", "Your concern: “My concern is ___.” No blame.", "Invitation: “I wonder if there's a way that works for both of us.” Brainstorm together, try one, check back in a week."],
    lines: ["“I've noticed bedtime has been rough. What's going on for you?”", "“My concern is that you're tired at school.”", "“What could we try?”"],
    why: "Kids do well if they can. A repeated problem usually points to a lagging skill or an unsolved problem. This is Dr. Ross Greene's Collaborative and Proactive Solutions, from our Partnership Guide." },
  { id: "bedtime", ages: "b", title: "Bedtime stalling", when: "One more glass of water, one more question, one more story.",
    E: "Escalating threats from the hallway.", P: "Letting bedtime drift later every night.",
    M: ["Count back from wake-up time to set bedtime, and keep it within an hour on weekends.", "Let your child design their wind-down routine. The bedtime itself isn't up for debate.", "Screens out of the bedroom, and off an hour or two before bed."],
    lines: ["“Bedtime is 8:30. You design the routine that gets you there.”", "“What do you need before lights out? Let's put it on your list.”"],
    why: "A tired child can look defiant. Sleep loss hits impulse control and emotional regulation first." },
  { id: "fine", ages: "b", title: "“School was fine”", when: "You ask how the day went and get one word.",
    E: "“Why won't you ever tell me anything?”", P: "Filling the silence with your own guesses and stories.",
    M: ["Ask specific, open questions. Try the car, a walk, or a side-by-side task; face-to-face can feel like an interview.", "Listen more than you fix."],
    lines: ["“What was the hardest thing you did today?”", "“What did you find outside today?”", "“Who did you help, or who helped you?”", "“What's something you want to get better at?”"],
    why: "Open questions show you're curious about them, not checking up on them." },
  { id: "quit", ages: "b", title: "“I want to quit”", when: "A challenge, a sport, an instrument or a book gets hard and your child wants out.",
    E: "“We paid for this. You're going.”", P: "“Okay, you don't have to,” right away.",
    M: ["Ask what's behind it: too hard, wrong fit, a person, a fear?", "Separate hard from wrong. Hard is worth pushing through; a real mismatch may be worth changing at a natural stopping point.", "Finish the commitment, then decide together."],
    lines: ["“What's making you want to stop?”", "“What would make it doable?”", "“Let's finish the season, then decide together.”"],
    why: "Grit grows when kids stay with something past the point where it stops being fun, with an adult in their corner." }
];

/* ---------- your week ---------- */
export const WEEK = {
  k1: {
    growth: "In our K–1 Montessori environment we expect a full year of growth each year, with the emphasis on independence and joy in learning, not speed.",
    home: ["A 20–25 minute reading routine every day", "Learning apps if you want them (optional)", "A home curriculum you choose, if you like"],
    school: ["New reading and math lessons with Montessori materials", "Life skills, challenges and nature exploration", "Tracking your child's progress and adjusting their lessons"],
    routine: [["10 min", "Read aloud", "A picture book your child chose. Point to words now and then so they see print moves left to right."], ["10–15 min", "Structured practice", "A phonics lesson (such as Teach Your Child to Read in 100 Easy Lessons) or a decodable book read together."], ["1 min", "Sound games", "In the car or at dinner: “What starts with /m/?”"]],
    pt: "Reading and number sense are built through short, daily practice, so a part-time child who relies only on school days may make fewer gains. Keeping up the routine on home days makes up much of that difference.",
    progress: [["Transparent Classroom", "https://www.transparentclassroom.com", "Your child's Montessori progress and weekly summaries. Records are moving there now."], ["Basecamp Parent Portal", "https://my.wilderland.academy", "MAP scores. At this age, app-based scores can be affected by age and comfort with technology."]],
    week: [["Mon", "Campus", "Read-aloud + phonics lesson", "Count at dinner", "Pack own backpack"], ["Tue", "Campus", "Read-aloud + decodable book", "Card game", "Pour own drink"], ["Wed", "Campus", "Read-aloud + phonics lesson", "Sort laundry", "Set and clear table"], ["Thu", "Campus", "Read-aloud + decodable book", "Dice game", "Water plants"], ["Fri", "Campus", "Library book of their choice", "Board game night", "Feed pets"], ["Weekend", "Home", "Books on a hike or at bedtime", "Count treasures outdoors", "Dress themselves"]],
    weekNote: "On campus days, keep the read-aloud; the phonics lesson can rest.",
    weekPT: [["Mon", "Campus", "Read-aloud (phonics rests)", "Count at dinner", "Pack own backpack"], ["Tue", "Home", "Read-aloud + phonics lesson", "Card game", "Pour own drink"], ["Wed", "Campus", "Read-aloud (phonics rests)", "Sort laundry", "Set and clear table"], ["Thu", "Home", "Read-aloud + decodable book", "Dice game", "Water plants"], ["Fri", "Campus", "Library book of their choice", "Board game night", "Feed pets"], ["Weekend", "Home", "Books on a hike or at bedtime", "Count treasures outdoors", "Dress themselves"]],
    weekPTNote: "Example: 3 campus days and 2 home days. On campus days your child's school day does the heavy lifting, so keep it to a read-aloud and everyday fun. Home days carry the phonics routine.",
    check: ["A set time and place for the daily reading routine", "A phonics program or decodable books on hand", "Books within reach in at least two places at home", "One daily task your child owns completely", "Logged in to Transparent Classroom"]
  },
  up: {
    growth: "In grades 2–8, where technology powers mastery-based practice, we expect learning at 2x speed when students use the program every school day.",
    home: ["Daily app work done to the assigned target, every school day", "Catch-up work finished as soon as possible", "20+ minutes of reading every day", "The Dashboard checked weekly, with your child"],
    homeFT: ["20+ minutes of reading every day, and read-alouds", "A look at the Basecamp Parent Portal each week, with your child", "Real responsibilities, a consistent bedtime and outdoor time", "Optional: extra app practice at home (see below)"],
    school: ["Daily app work, in the morning academic block", "Teaching new math methods and changing app levels", "Life skills, challenges and projects"],
    routine: [["Target", "Daily app work", "Your child has a daily target in each academic app, every school day. Unfinished lessons become catch-up work."], ["20+ min", "Reading", "Alone or aloud. Keep reading aloud even after they read well on their own."], ["Weekly", "Dashboard check", "Look together at whether daily targets were met."]],
    routineFT: [["At school", "Daily app work", "Done in the morning academic block. You aren't expected to supervise app work at home."], ["20+ min", "Reading", "Alone or aloud. Keep reading aloud even after they read well on their own."], ["Weekly", "Dashboard check", "Look together at how the week went and what's ahead."]],
    ft: "Full-time families aren't expected to support app work at home. Your child's daily work happens at school. The exception is a child who is well behind the standard: extra practice at home can help them catch up. We encourage it for any child. Competence builds confidence, and students earn Blazes for academic work done at home, too.",
    pt: "The Dashboard assigns lessons for every school day, including the days your child is at home. Those home days are on you to plan and supervise. A student on campus three days a week gets roughly 60% of the guided practice time of a full-time student, so home days have to carry their share. Pick a fixed time and place for home-day app work and treat it like a school appointment.",
    ptOpts: "Two exceptions: you follow your own curriculum on home days by arrangement with your child's academic guide, or you opt out of home-day tracking and accept the gains school days alone provide. Either way we fully support your child on campus days, but we can only promise 2x growth with daily use.",
    progress: [["Basecamp Parent Portal", "https://my.wilderland.academy", "Daily work, catch-up work and MAP data. Log in with the email address Ms. Sarah's original email was sent to."]],
    week: [["Mon", "Campus", "App work at school", "20 min, alone or aloud", "Pack own backpack"], ["Tue", "Campus", "App work at school", "Family chapter book", "Help cook"], ["Wed", "Campus", "App work at school", "Library book", "Laundry task"], ["Thu", "Campus", "App work at school", "Free-choice reading", "Manage the week's schedule"], ["Fri", "Campus", "App work at school", "Book talk at dinner", "Plan a weekend outing"], ["Weekend", "Home", "Optional extra practice; check the Dashboard together", "Book on a hike", "Outdoor time, real chores"]],
    weekNote: "Full time: five campus days, so app work happens at school. Home is reading, independence and an optional boost.",
    weekPT: [["Mon", "Campus", "App work at school. Nothing to supervise at home.", "20 min, alone or aloud", "Pack own backpack"], ["Tue", "Home", "App work at home, same time and place. Check the target was met.", "Family chapter book", "Help cook"], ["Wed", "Campus", "App work at school. Nothing to supervise at home.", "Library book", "Laundry task"], ["Thu", "Home", "App work at home, same time and place. Check the target was met.", "Free-choice reading", "Manage the week's schedule"], ["Fri", "Campus", "App work at school. Nothing to supervise at home.", "Book talk at dinner", "Plan a weekend outing"], ["Weekend", "Home", "Catch up only if needed; check the Dashboard together", "Book on a hike", "Outdoor time, real chores"]],
    weekPTNote: "Example: 3 campus days (Mon, Wed, Fri) and 2 home days. On the 3 campus days you don't monitor or orchestrate any app work; school handles it. Your app-work role is the home days (and catch-up). Your schedule may differ.",
    tips: ["Same time, same place every day.", "Sit nearby, but let them do the work.", "Phones and other screens away during app time.", "Stop at the daily target. More isn't better if it costs focus or sleep.", "Don't teach a different method. If your child is stuck, flag it for their guide."],
    check: ["Logged in to the Basecamp Parent Portal", "A set time and place for daily app work", "Books within reach in at least two places at home", "One math game on the shelf", "One daily task your child owns completely", "A consistent bedtime"],
    checkFT: ["Logged in to the Basecamp Parent Portal", "Books within reach in at least two places at home", "One math game on the shelf", "One daily task your child owns completely", "A consistent bedtime"]
  }
};

/* ---------- reading ---------- */
export const READ = {
  all: ["Read aloud 15–30 minutes a day, at any age and any reading level.", "Visit the library 1–3 times a month and bring home 5–20 books based on your child's interests.", "Read books up to three grade levels above their own reading level; the gap can be bigger for topics they love.", "Keep reading aloud after they can read alone. Listening comprehension runs ahead of reading until middle school.", "Graphic novels, manga, comics and popular fiction all count. Anytime your child chooses to read on their own, it's a win.", "Install Libby for free Weber County Library ebooks and audiobooks."],
  k1: { title: "K–1: learning to read", list: ["Play sound games: “I spy something that starts with /b/,” rhyming in the car, clapping syllables in names.", "Let your child “read” familiar books from memory or the pictures. That's real reading behavior.", "When they sound out a word, wait a few seconds before helping.", "Write together: grocery lists, labels for their shelves, a note to a grandparent.", "Read-aloud ideas: Frog and Toad, Elephant & Piggie, Owl Moon."],
    links: [["Teach Your Child to Read in 100 Easy Lessons", "https://www.abebooks.com/Teach-Child-Read-100-Easy-Lessons/32255583565/bd", "Scripted phonics, about 20 minutes a day. Check the Weber County Library first, and check with your child's guide if they already read."], ["Bob Books, Set 1", "https://www.labyrinthbooks.com/bob-books-set-1-beginning-readers", "Decodable books. The right level is one your child reads with only a few stumbles."], ["Reading Rockets: phonics activities", "https://readingrockets.org/reading-101-guide-parents/kindergarten/phonics-and-decoding-activities-your-kindergartner", "Short games with videos."], ["Khan Academy Kids", "https://apps.apple.com/us/app/khan-academy-kids/id1378467217", "Free, no ads."], ["Teach Your Monster to Read", "https://www.teachyourmonster.org/", "Free on a computer."]] },
  g24: { title: "Grades 2–4: building fluency", list: ["Take turns reading pages or characters aloud. Your fluent reading is the model.", "Rereading favorites builds speed and confidence.", "On a hard word: “Skip it, read to the end of the sentence, then come back. What would make sense?”", "Start a family chapter book a little above their level.", "Nonfiction about what they see outside: tracks, birds, weather, rocks.", "Ideas: My Father's Dragon, Charlotte's Web, The Wild Robot."] },
  g58: { title: "Grades 5–8: building thinkers", list: ["Keep reading aloud, even 10 minutes at bedtime.", "Read the same book and talk about it like adults: “Did that character make the right call?”", "Ask them to persuade you of something they read. It builds storytelling and public speaking.", "Watch for late-night screen reading replacing sleep. A paper book at bedtime is easier on rest.", "Ideas: Hatchet, My Side of the Mountain, Wonder."] }
};

/* ---------- math ---------- */
export const MATH = {
  rule: "The apps and guides teach the methods. At home, build number sense with talk and games, and never reteach a method. If your child is stuck, flag it for their guide.",
  k1: ["Count real things: stairs, pinecones, forks on the table. Touch each one as you count.", "Compare: “Who has more?” “Which stick is longer?”", "Sort laundry, toys or rocks by color, size or shape.", "Play Uno, Go Fish, dice games, Chutes and Ladders."],
  g24: ["Let them handle money: count coins, figure change, compare prices.", "Cook together and adjust recipes: “We're doubling it. How much flour now?”", "Practice facts through games, not timed drills: War, Yahtzee, Blokus, dominoes.", "Read clocks and calendars: “How many days until Saturday?”"],
  g58: ["Give them a small real budget: a grocery list, a family outing, their own spending money.", "Talk about percentages in the wild: sales, tips, sports stats.", "Use maps for scale, distance and time on hikes and road trips.", "Strategy games: chess, Catan, Set, Rush Hour.", "Ask them to explain a problem from school to you. Teaching it back deepens understanding."]
};

/* ---------- explore with your child ---------- */
export const EXPLORE = [
  { name: "Life Skills Challenges", href: "/challenges/", img: "🧗", what: "The map of “I can” challenges across Wilderland's eight Life Skills. Turn on the “Can do at home” filter to find ones your family can work on together.",
    how: ["Let your child choose the challenge. That's the autonomy.", "Coach before the attempt: practice plan, gear, encouragement. That's the support.", "Judge the attempt word for word against the “I can” sentence. No hints, no “close enough.” That's the standard."],
    more: ["Home pass-off guide for parents", "/challenges/parents.html"], note: "In K–1, challenges are run by guides at school, so this is mostly for grades 2–8." },
  { name: "Atlas of Sparks", href: "/projects/", img: "✨", what: "A giant map of real projects people have made, including standout projects by kids, to spark ideas for your child's own passion project.",
    how: ["Explore side by side and ask “Which one would you want to try?”", "Take a wild idea seriously. Ask what it would take.", "Help find gear, places and people. Leave the planning and the doing to them."], note: "Projects begin in grades 5–8. Younger children follow passion pursuits at school." },
  { name: "The Lantern Stacks", href: "/books/", img: "📚", what: "An exhibit of great books for ages 7–16, connected by theme, genre and feeling, with ways in for readers who don't think they like reading.",
    how: ["Let your child pick. Choice is what turns kids into readers.", "Bookmark a few, then hunt them down at the library or on Libby.", "Read one they picked and talk about it."], note: "You can browse without signing in. Saving happens on your child's school account." }
];

/* ---------- twelve practices (Parent Partnership Guide cheat sheet) ---------- */
export const PRACTICES = [
  ["01", "Reading aloud", "15–30 minutes daily, any age. Library 1–3 times a month. Keep going past independence."],
  ["02", "Nutrition", "Whole foods with protein. Breakfast daily, fiber at every meal, fewer refined carbs and added sugars."],
  ["03", "Sleep", "9–12 hours for ages 6–12; 8–10 for teens. Dark, cool, screen-free bedrooms. Same bedtime on weekends, within an hour."],
  ["04", "Technology", "Delay smartphones until high school and social media until 16. Avoid short-form video. Phones out of bedrooms and away at meals."],
  ["05", "Physical activity", "60 minutes a day of moderate-to-vigorous activity. Much of it already happens at school; fill the gaps with what they enjoy."],
  ["06", "Coregulation", "Calm presence first. Validate feelings, hold the line on behavior, and wait for calm before problem-solving."],
  ["07", "Unstructured play", "1–2 hours of outdoor, child-directed play with peers. Resist stepping in. Allow age-appropriate risk."],
  ["08", "Environmental toxins", "Test water in pre-1986 homes. A HEPA filter in the bedroom is the best single buy. Watch the air quality index in winter."],
  ["09", "Autonomy support", "High standards plus high support. Offer choices within limits. Teach strategies, not just effort."],
  ["10", "Collaborative problem-solving", "Empathy, your concern, then an invitation to solve it together. Build skills, not compliance."],
  ["11", "Social connection", "Playdates and peer groups over adult-led activities. Coach social skills when needed."],
  ["12", "Strengths-based development", "Notice what absorbs them. Invest in proportion to their interest. Balance corrections with recognition."]
];

/* ---------- evidence (kept small and honest) ---------- */
export const EVIDENCE = [
  { big: "36 studies", title: "Choices within limits", what: "A meta-analysis found that children of parents who support their autonomy (offering choices, explaining reasons, taking their view seriously) tend to do better in school and feel better.", note: "These studies show a link, not proof of cause, and effects vary by age.", src: ["Vasquez et al., 2016, Educational Psychology Review", "https://doi.org/10.1007/s10648-015-9329-z"] },
  { big: "17% → 71%", title: "One sentence of belief", what: "In a classroom study, seventh graders were far more likely to revise an essay when the teacher's critique came with: “I'm giving you these comments because I have very high expectations and I know that you can reach them.”", note: "A small study (44 students) by Yeager and colleagues, done at school. The rate shown is for Black students; the effect was strongest for students who trusted school least. The parent version: say why you're pushing, and that you believe they can do it.", src: ["Yeager et al., 2014", "https://sparq.stanford.edu/sites/g/files/sbiybj19021/files/media/file/yeager_et_al._2014_-_breaking_the_cycle_of_mistrust.pdf"] }
];
