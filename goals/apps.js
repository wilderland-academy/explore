// The academic apps each grade uses in 2026–27 (from the family packet "Academic Programs by Grade"), and what a
// student can aim for in each one. "finish" lists things you complete (a Zearn mission, a Math Academy course);
// "units" are what you count. Sources for the app structures:
//   Zearn missions and titles: Zearn's 2026 curriculum alignment guides (webassets.zearn.org).
//   Math Academy courses and XP (1 XP is about 1 minute of focused work): mathacademy.com/courses and /how-it-works.
//   ST Math puzzles, objectives and Puzzle Goal Progress: help.stmath.com.
//   Membean minutes (about 45 a week, in 3 or more sessions): support.membean.com.
//   Amira stories and minutes: amiralearning.com classroom resources.
//   MobyMax modules, including Fact Fluency: support.mobymax.com.
window.WLApps = (function () {
  const zearn = {
    2: ["Add and Subtract Friendly Numbers", "Explore Length", "Counting and Place Value", "Add, Subtract, and Solve", "Add and Subtract Big Numbers", "Equal Groups", "Length, Money, and Data", "Shapes, Time, and Fractions"],
    3: ["Multiply and Divide Friendly Numbers", "Measure It", "Multiply and Divide Tricky Numbers", "Find the Area", "Fractions as Numbers", "Display Data", "Shapes and Measurement"],
    4: ["Add, Subtract, and Round", "Measure and Solve", "Multiply and Divide Big Numbers", "Construct Lines, Angles, and Shapes", "Equivalent Fractions", "Decimal Fractions", "Multiply and Measure"]
  };
  const missions = grades => grades.map(g => ({ group: "Grade " + g, items: zearn[g].map((t, i) => `Grade ${g} Mission ${i + 1}: ${t}`) }));
  const MA = ["4th Grade Math", "5th Grade Math", "Prealgebra", "Algebra I", "Geometry", "Algebra II", "Precalculus", "AP Calculus AB", "AP Calculus BC"];
  const FACTS = ["Fact Fluency: addition", "Fact Fluency: subtraction", "Fact Fluency: multiplication", "Fact Fluency: division"];

  // Each app: n name, s subject, d what it's for, finish (groups of things to complete), units (things to count).
  const A = {
    zearn: g => ({ n: "Zearn", s: "Math", d: g >= 4 ? "Only for filling gaps from before 4th grade" : "Lessons and fact fluency",
      finish: missions(g <= 2 ? [2, 3] : g === 3 ? [2, 3, 4] : [2, 3]), units: ["lessons", "minutes"] }),
    mathacademy: () => ({ n: "Math Academy", s: "Math", d: "Your main math course",
      finish: [{ group: "Courses", items: MA.map(c => "Finish " + c) }], units: ["XP", "% of my course"] }),
    stmath: g => ({ n: "ST Math", s: "Math", d: g >= 4 ? "Only while moving from Zearn to Math Academy" : "Puzzles that build math thinking",
      units: ["puzzles", "objectives", "minutes", "% Puzzle Goal Progress"] }),
    mobyfacts: () => ({ n: "MobyMax Fact Fluency", s: "Math", d: "Math facts, until you've passed them off",
      finish: [{ group: "Pass off", items: FACTS }], units: ["minutes"] }),
    books: () => ({ n: "Books", s: "Reading", d: "Free reading from the school library. Try different kinds of books.",
      units: ["books", "pages", "minutes", "new kinds of books"] }),
    readworks: () => ({ n: "ReadWorks", s: "Reading", d: "Reading comprehension", units: ["articles"] }),
    teachtales: () => ({ n: "Teach Tales", s: "Reading", d: "Stories made for you that build comprehension", units: ["stories"] }),
    amira: () => ({ n: "Amira", s: "Reading", d: "Reading aloud, fluency and phonics", units: ["stories", "minutes"] }),
    mobylang: g => ({ n: "MobyMax Language", s: "Language", d: g >= 5 ? "Grammar, spelling, writing workshop, reading comprehension" : "Grammar, vocabulary, spelling, writing workshop, reading comprehension",
      units: ["lessons", "minutes", "writing workshop pieces"] }),
    membean: () => ({ n: "Membean", s: "Language", d: "Vocabulary. Short sessions on 3 or more days work best.", units: ["minutes", "days trained"] }),
    mobysci: g => ({ n: g >= 3 ? "MobyMax Science and Wilderland science" : "MobyMax Science", s: "Science", d: g >= 3 ? "Science lessons, plus exploring real phenomena" : "Science lessons", units: ["lessons", "minutes"] }),
    mobyss: () => ({ n: "MobyMax Social Studies", s: "Social Studies", d: "Social studies lessons", units: ["lessons", "minutes"] }),
    humy: () => ({ n: "Humy.ai", s: "Social Studies", d: "Conversations with historical, scientific and cultural figures", units: ["conversations"] }),
    icivics: () => ({ n: "iCivics", s: "Social Studies", d: "Civics games and lessons", units: ["games", "lessons"] })
  };
  const BY_GRADE = {
    2: ["zearn", "stmath", "books", "readworks", "teachtales", "amira", "mobylang", "mobysci", "mobyss"],
    3: ["zearn", "stmath", "books", "readworks", "teachtales", "mobylang", "mobysci", "mobyss"],
    4: ["mathacademy", "mobyfacts", "zearn", "stmath", "books", "readworks", "mobylang", "mobysci", "mobyss"],
    5: ["mathacademy", "mobyfacts", "books", "readworks", "mobylang", "membean", "mobysci", "mobyss", "humy"],
    6: ["mathacademy", "mobyfacts", "books", "readworks", "mobylang", "membean", "mobysci", "mobyss", "humy"],
    7: ["mathacademy", "mobyfacts", "books", "readworks", "mobylang", "membean", "mobysci", "mobyss", "humy", "icivics"],
    8: ["mathacademy", "mobyfacts", "books", "readworks", "mobylang", "membean", "mobysci", "mobyss", "humy", "icivics"]
  };
  // Apps for a grade ("2" to "8"). K and 1 have no app list in the packet, so they get none.
  function forGrade(grade) {
    const g = Number(grade);
    return (BY_GRADE[g] || []).map(id => Object.assign({ id }, A[id](g)));
  }
  return { forGrade, GRADES: ["2", "3", "4", "5", "6", "7", "8"] };
})();
