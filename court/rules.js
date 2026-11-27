// Student Court and Our Code: the shared words and rules, used by /code/, /court/ and the staff desk /guides/court/.
// The Behavior Guide (/behavior/data.js) is the source of truth for tiers, counts, send-home and Freedom Levels. This
// file only says the same things in students' words, plus how the court works. If the Behavior Guide changes, change
// this to match. History: the Aug 2026 Behavior Handbook (Student Judicial System, "Solve It First", restorations by
// rule) and the 2026-27 Accountability System (Tiers 0-3, Peace Talks, SMART Restore). The court hears Tier 1 and
// Tier 2 problems between students in grades 2 to 8. Never Tier 0 (things a student can't help yet), never Tier 3
// (safety: staff only), never K–1.
window.WLCourt = (function () {
  // What a complaint can be about. tier: where it usually lands (the judge confirms it). Restore: the usual repair.
  var CATS = [
    { id: "bother", tier: 1, t: "Kept bothering me while I was working, or after I asked them to stop", restore: "space" },
    { id: "stuff", tier: 1, t: "Touched, moved or hid my things", restore: "service" },
    { id: "touch", tier: 1, t: "Touched me without asking (poking, grabbing, tickling, tugging)", restore: "ack" },
    { id: "words", tier: 1, t: "Unkind words, teasing or name-calling", restore: "appreciate" },
    { id: "push", tier: 2, t: "Pushed, tripped, shoved or blocked me, and no one got hurt", restore: "ack" },
    { id: "mock", tier: 2, t: "Humiliated me, or mocked my family or how I look", restore: "appreciate" },
    { id: "exclude", tier: 2, t: "Left me out on purpose, again and again", restore: "include" },
    { id: "rumor", tier: 2, t: "Spread a rumor or shared something embarrassing about me", restore: "rumor" },
    { id: "damage", tier: 2, t: "Broke or damaged my things, or took them and won't give them back", restore: "fix" },
    { id: "follow", tier: 2, t: "Kept following me after I asked for space", restore: "service" },
    { id: "reckless", tier: 2, t: "Played rough or unsafe and it put me at risk", restore: "safeplay" }
  ];
  // Not for the court: these go straight to a guide (Tier 3), privately.
  var TIER3 = [
    "Hit, kicked or hurt me, or someone got hurt",
    "Threatened to seriously hurt me or someone else",
    "Bullies me again and again, or a group is ganging up on me",
    "Touched private parts, or said or showed something sexual",
    "Hateful words about my race, religion, disability or who I am",
    "A weapon, or something dangerous",
    "An adult is hurting me, or I don't feel safe at home"
  ];
  // Restorations: how a student makes it right after an upheld complaint (a SMART Restore matched to the harm).
  // Due by the end of the next school day. Only the student's Field Guide (or another guide) signs it off.
  var RESTORES = {
    ack: { t: "Letter of acknowledgment", how: "Write a real letter to the person: what you did, why it wasn't okay, how it affected them, and one specific thing you'll do differently. For the rest of the day, give them the space they want." },
    appreciate: { t: "Appreciation letter, read aloud", how: "Write five specific, true sentences about the person: something you appreciate, a real moment you saw it, and why it mattered. Read it to them with the judge there. They decide if it sounds genuine; vague sentences get rewritten." },
    service: { t: "Letter of accountability and a SMART act of service", how: "Write what you did and why it crossed a line, how it affected them, and one act of service: “I will [action] for [person] by [date] so that [impact].” Your Field Guide checks it." },
    fix: { t: "Fix, return or replace it, plus a letter", how: "Return what you took, or fix or replace what was damaged (a guide helps decide how), and write a short letter of accountability." },
    rumor: { t: "Set the record straight", how: "With a guide there, tell the people who heard the rumor that it wasn't true or wasn't yours to share. Then write a short letter of accountability to the person." },
    include: { t: "A plan to include them", how: "Write a short plan for including the person in something they care about this week, agree it with them and a guide, and do it. Your guide checks in at the end of the week." },
    space: { t: "A quiet workspace, and an apology", how: "Work in a spot your guide chooses for the rest of the day, and write an apology to the people you distracted: what you did, how it affected them, what you'll do instead. Check in with a guide before rejoining." },
    safeplay: { t: "Learn safe play, then teach it", how: "Sit out the next outdoor game or nature walk activity, watching from a spot your guide picks and writing down what safe play looks like. Then teach safe play to the class at Town Hall, in a way you choose." }
  };
  // Repeats with the same student and the same kind of problem this school year. More support, not more punishment.
  var REPEAT = [
    "First time: the usual repair.",
    "Second time, same kind of problem: the usual repair, plus a plan made with your Field Guide at your next Summit Session.",
    "Third time or more: the usual repair, the plan, and the guides get involved, which may include a Freedom Level review."
  ];
  // How court runs.
  var STEPS = [
    ["Cool down", "Wait until you're calm. Strong feelings are real, but they aren't the time to decide anything."],
    ["Try a Peace Talk", "Talk it out with the Peace Object, or ask a guide to help. Most problems end here."],
    ["File a complaint", "Only if a Peace Talk didn't fix it, or a guide said you could skip it. Tell the truth, including your own part."],
    ["The judge checks it", "Incomplete complaints come back to you with a note. Some go to a guide instead."],
    ["Court day", "Tuesdays and Thursdays. Private: the two of you, the judge and a guide nearby. Each person speaks without interruption."],
    ["Make it right", "If the complaint is upheld, the other student makes it right by the end of the next school day. A guide signs it off."]
  ];
  var STATUS = {
    filed: "Waiting for the judge", returned: "Sent back to you", referred: "Passed to a guide", scheduled: "Court day set",
    restoring: "Upheld: making it right", not_upheld: "Not upheld", closed: "Closed", withdrawn: "Withdrawn"
  };
  // The next court day (Tuesday or Thursday) after a date (never the same day, so the other student has notice), and
  // "end of the next school day". Neither knows about holidays; the judge or guide can change the date.
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function nextCourtDay(from) { var d = from ? new Date(from) : new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + 1); for (var i = 0; i < 8; i++) { if (d.getDay() === 2 || d.getDay() === 4) return iso(d); d.setDate(d.getDate() + 1); } return iso(d); }
  function nextSchoolDay(from) { var d = from ? new Date(from) : new Date(); d.setHours(12, 0, 0, 0); do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6); return iso(d); }
  function schoolYearStart(d) { d = d || new Date(); var y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return new Date(y, 7, 1).getTime(); }
  var CAT = {}; CATS.forEach(function (c) { CAT[c.id] = c; });
  return { CATS: CATS, CAT: CAT, TIER3: TIER3, RESTORES: RESTORES, REPEAT: REPEAT, STEPS: STEPS, STATUS: STATUS, BANDS: ["2–4", "5–8"],
    nextCourtDay: nextCourtDay, nextSchoolDay: nextSchoolDay, schoolYearStart: schoolYearStart, iso: iso };
})();
