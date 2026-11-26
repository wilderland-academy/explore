// Wilderland Camp Store catalog. Prices are typical US retail in November 2026, rounded; blazes = price / $0.50.
// c = category, a = minimum age guidance, why = why it earned a spot, note = for guides/parents (optional), sup = guide supervision rule (optional)
const CATS = {
  sports:  ["Sports & Balls", "🏀", "#ffb454"],
  tricks:  ["Wheels & Tricks", "🛹", "#ffe66d"],
  build:   ["Build & Make", "🧱", "#f4b860"],
  outdoor: ["Wild Outdoors", "🌲", "#7ed37e"],
  animals: ["Animals", "🐾", "#e8c39e"],
  games:   ["Games & Puzzles", "🎲", "#f08c7a"],
  art:     ["Art & Craft", "🎨", "#d9a3f0"],
  style:   ["Style", "✨", "#ff9ec7"],
  weird:   ["Gross & Weird", "🦴", "#b6e36b"],
  science: ["Science & Tech", "🔬", "#7cc6f0"],
  tools:   ["Tools & Blades", "🔧", "#c9c0a8"],
  music:   ["Music", "🎵", "#f0a3c8"],
  books:   ["Books & Comics", "📚", "#d5f367"],
  everyday:["Everyday & Cozy", "🧦", "#a9d8c8"],
};
const PRODUCTS = [
  // ---- Build & Make ----
  {id:"lego-classic", n:"LEGO Classic Medium Creative Brick Box", c:"build", p:35, a:7, e:"🧱", why:"484 plain bricks, no instructions needed. Builds anything, lasts decades, and every piece fits every other LEGO you'll ever own."},
  {id:"lego-creator", n:"LEGO Creator 3-in-1 Exotic Parrot", c:"build", p:20, a:7, e:"🦖", why:"One box, three builds. A real LEGO set at a price you can reach in a few weeks."},
  {id:"plusplus", n:"Plus-Plus 240-piece tube", c:"build", p:20, a:7, e:"➕", why:"One shape, endless builds. Quiet, pocketable, and oddly addictive. Loved by teachers."},
  {id:"magnatiles", n:"Magna-Tiles 32-piece set", c:"build", p:50, a:7, e:"🔷", why:"The magnetic tiles every classroom fights over. Strong magnets, clear colors, guaranteed for life."},
  {id:"keva", n:"KEVA Planks 200", c:"build", p:60, a:8, e:"🪵", why:"Identical wooden planks, no glue, no connectors. Towers taller than you. Pure engineering."},
  {id:"gravitrax", n:"GraviTrax Starter Set", c:"build", p:60, a:8, e:"🎢", why:"Build marble runs with real physics: height, momentum, magnets. Expandable forever."},
  {id:"ugears", n:"UGEARS wooden mechanical model (small)", c:"build", p:28, a:10, e:"⚙️", why:"Laser-cut wooden gears that actually turn, with no glue. You build a working machine from a flat sheet."},
  {id:"kiwico", n:"KiwiCo Trebuchet project kit", c:"build", p:30, a:9, e:"📦", why:"A complete engineering project in a box: build a working trebuchet, then tune it to hit a target. Everything included."},
  {id:"balsa", n:"Guillow's Hawk balsa gliders, 3-pack", c:"build", p:12, a:7, e:"✈️", why:"The classic wooden glider. Tune the wings, see how far it goes. Cheap enough to redeem on a Friday."},
  {id:"origami", n:"Origami paper, 500 sheets in 20 colors", c:"build", p:18, a:7, e:"🦢", why:"A skill that needs nothing but paper and patience. 500 sheets is enough to get good, and the cranes make great gifts."},
  // ---- Outdoors & Nature ----
  {id:"nocs-bino", n:"Nocs Standard Issue 8x25 binoculars", c:"outdoor", p:95, a:9, e:"🔭", why:"Real glass in a kid-proof rubber body, waterproof, lifetime 'no matter what' warranty. A pair you'll still use at 30."},
  {id:"headlamp", n:"Petzl Tikkina headlamp", c:"outdoor", p:25, a:7, e:"🔦", why:"The headlamp guides actually carry. Three brightness settings, takes AAA batteries, survives being dropped."},
  {id:"compass", n:"Suunto A-10 compass", c:"outdoor", p:25, a:9, e:"🧭", why:"A real baseplate compass for map work, not a toy. Finnish-made."},
  {id:"birds-utah", n:"Birds of Utah Field Guide (Stan Tekiela)", c:"outdoor", p:17, a:7, e:"🐦", why:"Organized by color, so a 7-year-old can use it. Covers what actually lives in Ogden Valley."},
  {id:"tracks", n:"Peterson Animal Tracks field guide", c:"outdoor", p:15, a:8, e:"🐾", why:"Read the snow and mud around campus like a book."},
  {id:"rite-rain", n:"Rite in the Rain notebook", c:"outdoor", p:8, a:7, e:"📓", why:"Paper that works wet. Field notes, maps, sketches, in any weather."},
  {id:"hammock", n:"ENO SingleNest hammock", c:"outdoor", p:55, a:8, e:"🪢", why:"Packs to the size of a grapefruit, holds 400 lb. Reading in the trees is a different kind of reading. Borrow tree straps from the gear closet."},
  {id:"kite", n:"In the Breeze delta kite", c:"outdoor", p:20, a:7, e:"🪁", why:"Fiberglass frame, flies in light wind, comes with line. The meadow is made for this."},
  {id:"paracord", n:"SOL 550 paracord, 100 ft", c:"outdoor", p:12, a:8, e:"🧶", why:"100 feet of real 550 cord with a carabiner. Learn the cobra weave and make a bracelet for everyone you know."},
  {id:"firesteel", n:"Light My Fire Swedish FireSteel", c:"outdoor", p:15, a:9, e:"🔥", why:"3,000-degree sparks, works wet, lasts 12,000 strikes. A real fire skill.", sup:"Fire only with a guide, in a fire ring."},
  {id:"bugviewer", n:"Carson MicroBrite Plus pocket microscope", c:"outdoor", p:15, a:7, e:"🔍", why:"60x to 120x in your pocket with an LED. Moss, bugs, snowflakes, your own skin."},
  {id:"sled", n:"Zipfy mini luge sled", c:"outdoor", p:40, a:7, e:"🛷", why:"Steerable, nearly unbreakable, and small enough to carry up the hill one-handed."},
  // ---- Tools & Gear ----
  {id:"opinel-first", n:"Opinel My First Opinel No. 7", c:"tools", p:16, a:8, e:"🔪", why:"A real French folding knife with a rounded safety tip and a locking ring. The classic first knife.", sup:"Knife certification required before you take it home."},
  {id:"mora-scout", n:"Morakniv Scout 39 Safe", c:"tools", p:31, a:8, e:"🔪", why:"Swedish fixed blade with a blunt tip, double finger guard and leather sheath. Made for kids since the 1930s.", sup:"Knife certification required."},
  {id:"victorinox", n:"Victorinox Swiss Army Classic SD", c:"tools", p:25, a:9, e:"🇨🇭", why:"Blade, scissors, file, screwdriver, tweezers. The pocket tool that lasts a lifetime.", sup:"Knife certification required."},
  {id:"leatherman", n:"Leatherman Rev multi-tool", c:"tools", p:48, a:10, e:"🔧", why:"Pliers, blade, drivers, bottle opener. Made in Oregon, 25-year warranty. A tool, not a toy.", sup:"Knife certification required."},
  {id:"beavercraft", n:"BeaverCraft whittling kit for beginners", c:"tools", p:30, a:9, e:"🪵", why:"Knife, basswood blanks, strop, cut-resistant glove and a guide. Everything to carve your first spoon or owl.", sup:"Knife certification required."},
  {id:"gloves-cut", n:"Cut-resistant carving glove", c:"tools", p:10, a:8, e:"🧤", why:"The guard hand's best friend. Guides will love you for this."},
  // ---- Games & Puzzles ----
  {id:"spotit", n:"Spot It!", c:"games", p:12, a:7, e:"👁️", why:"Thirty seconds to learn, works with 2 to 8 players, fits in a tin. The best lunch-table game."},
  {id:"sushigo", n:"Sushi Go!", c:"games", p:12, a:8, e:"🍣", why:"Pass the cards, build the best meal. Fast, clever, and cute without being babyish."},
  {id:"kanoodle", n:"Kanoodle", c:"games", p:12, a:7, e:"🧩", why:"200 solo puzzles in a pocket case. The quiet-time toy that actually gets used."},
  {id:"rushhour", n:"Rush Hour", c:"games", p:22, a:8, e:"🚗", why:"Slide the cars to free the red one. 40 challenges from easy to maddening. A logic workout disguised as traffic."},
  {id:"rubiks", n:"Rubik's Cube (the real one)", c:"games", p:12, a:8, e:"🎲", why:"Learn the beginner method in a week and you have a party trick for life."},
  {id:"perplexus", n:"Perplexus Beast", c:"games", p:30, a:8, e:"🌀", why:"A 3D maze in a ball. 100 steps of tilt and patience. Impossible to put down."},
  {id:"chess", n:"Folding wooden chess set", c:"games", p:25, a:7, e:"♟️", why:"The game that's been cool for 1,500 years. Wooden pieces, board folds into its own box."},
  {id:"blokus", n:"Blokus", c:"games", p:25, a:7, e:"🟦", why:"Place your pieces corner to corner, block everyone else. Strategy a 7-year-old can beat a parent at."},
  {id:"kingdomino", n:"Kingdomino", c:"games", p:20, a:8, e:"👑", why:"Build a kingdom from dominoes in 15 minutes. Won game of the year. Teaches multiplication by stealth."},
  {id:"ticket", n:"Ticket to Ride: First Journey", c:"games", p:35, a:7, e:"🚂", why:"Claim train routes across America. The gateway to the famous big version."},
  {id:"catan-jr", n:"Catan Junior", c:"games", p:30, a:7, e:"🏝️", why:"Trade, build, settle islands. The family strategy classic, sized for kids."},
  {id:"catan", n:"Catan", c:"games", p:45, a:10, e:"🐑", why:"The board game that started the modern board game boom. Trade sheep for wheat, build the longest road, make enemies."},
  {id:"codenames", n:"Codenames", c:"games", p:20, a:10, e:"🕵️", why:"One-word clues, secret agents, teams. The best party game for a cabin or a classroom."},
  {id:"azul", n:"Azul", c:"games", p:35, a:9, e:"🔶", why:"Draft beautiful tiles to decorate a palace wall. Gorgeous, calm, and sneaky-competitive."},
  {id:"forbidden", n:"Forbidden Island", c:"games", p:20, a:8, e:"🌊", why:"Everyone works together to grab the treasures before the island sinks. Win or lose as a team."},
  {id:"skyjo", n:"Skyjo", c:"games", p:15, a:8, e:"🃏", why:"Flip cards, dump points, laugh. The card game families can't stop playing."},
  {id:"tacocat", n:"Taco Cat Goat Cheese Pizza", c:"games", p:10, a:7, e:"🌮", why:"Slap the pile when the word matches the card. Ten-minute rounds of chaos."},
  {id:"bananagrams", n:"Bananagrams", c:"games", p:15, a:8, e:"🍌", why:"Scrabble without the board or the waiting. Builds spelling while you race."},
  {id:"yahtzee", n:"Yahtzee", c:"games", p:10, a:7, e:"🎲", why:"Five dice, a cup, and more math than you'd think."},
  // ---- Art & Writing ----
  {id:"prismacolor", n:"Prismacolor Premier colored pencils, 24", c:"art", p:28, a:8, e:"✏️", why:"Soft, blendable, the pencils real illustrators use. Your drawings look different with these."},
  {id:"posca", n:"Posca paint markers, 8 pack", c:"art", p:22, a:8, e:"🖍️", why:"Paint pens that work on paper, wood, rocks, skateboards. Opaque, bright, no mess."},
  {id:"micron", n:"Sakura Pigma Micron pens, 6 sizes", c:"art", p:14, a:8, e:"🖊️", why:"The fine liners for comics, lettering and field sketches. Waterproof, no bleed."},
  {id:"sketchbook", n:"Strathmore 9x12 sketchbook", c:"art", p:10, a:7, e:"📒", why:"100 sheets of paper that can take pencil, pen and light paint. Every artist needs one going."},
  {id:"watercolor", n:"Sakura Koi pocket watercolor set, 24", c:"art", p:28, a:8, e:"🎨", why:"Real watercolors in a travel box with a water brush. Paint the valley from the meadow."},
  {id:"sculpey", n:"Sculpey III oven-bake clay sampler", c:"art", p:20, a:8, e:"🏺", why:"Clay that bakes hard in a home oven. Figures, beads, keychains. No dust, no mess."},
  {id:"comicbook", n:"Blank comic book, 120 pages", c:"art", p:8, a:7, e:"💥", why:"Panels already drawn. You bring the story."},
  {id:"leuchtturm", n:"Leuchtturm1917 notebook", c:"art", p:24, a:9, e:"📔", why:"The notebook writers and bullet-journalers swear by. Numbered pages, two bookmarks, lies flat."},
  {id:"frixion", n:"Pilot FriXion Ball erasable gel pens", c:"art", p:10, a:7, e:"🖋️", why:"Smooth gel ink that erases cleanly. Mistakes stop being scary."},
  {id:"lamy", n:"LAMY Safari fountain pen", c:"art", p:32, a:10, e:"🖋️", why:"A real fountain pen, German-made, nearly unbreakable. Writing with it feels like an event."},
  {id:"bracelets", n:"Friendship bracelet kit", c:"art", p:10, a:7, e:"🪢", why:"A bundle of embroidery floss and the patterns to start. Trades well."},
  // ---- Science & Tech ----
  {id:"snap-jr", n:"Snap Circuits Jr.", c:"science", p:35, a:8, e:"⚡", why:"100 working circuits that snap together, no soldering. The STEM kit every list agrees on."},
  {id:"microbit", n:"micro:bit V2 Go bundle", c:"science", p:25, a:9, e:"💻", why:"A tiny computer you program from a Chromebook. Step counter, compass, games, radio messages to a friend's."},
  {id:"makey", n:"Makey Makey Classic", c:"science", p:60, a:8, e:"🍌", why:"Turn bananas, Play-Doh or people into keyboard keys. Invention kit used in thousands of schools."},
  {id:"sphero", n:"Sphero Mini robot ball", c:"science", p:50, a:8, e:"🤖", why:"A ping-pong-ball-sized robot you drive and code from a Chromebook. Comes with mini bowling pins."},
  {id:"campsnap", n:"Camp Snap 2 screen-free camera", c:"science", p:70, a:7, e:"📷", why:"A digital camera with no screen: shoot all day, see the photos later. 2,000 shots on the card."},
  {id:"telescope", n:"Celestron FirstScope 76 tabletop telescope", c:"science", p:65, a:8, e:"🌙", why:"Moon craters, Jupiter's moons, Saturn's rings from a dark-sky valley. No tools, no setup."},
  {id:"tumbler", n:"National Geographic rock tumbler (Explorer Series)", c:"science", p:60, a:8, e:"💎", why:"Turn rough stones into polished gems over two weeks. Patience you can hold in your hand."},
  {id:"rockets", n:"Estes Tandem-X model rocket launch set", c:"science", p:40, a:10, e:"🚀", why:"Two rockets, a launch pad and a controller. Flights to 1,000 feet with a parachute return.", sup:"Launches only with a guide, engines kept by the school."},
  {id:"waythings", n:"The Way Things Work Now (David Macaulay)", c:"science", p:25, a:9, e:"📘", why:"The famous book that explains every machine with a mammoth. Read it for years."},
  // ---- Sports & Play ----
  {id:"frisbee", n:"Discraft UltraStar 175g disc", c:"sports", p:12, a:7, e:"🥏", why:"The official Ultimate disc. Flies straight, lasts forever."},
  {id:"kanjam", n:"Kan Jam", c:"sports", p:40, a:8, e:"🥏", why:"Disc toss into a can, two teams, instant tournament. The lawn game that works for all ages."},
  {id:"spikeball", n:"Spikeball standard set", c:"sports", p:60, a:9, e:"🏐", why:"Roundnet. 2-on-2, fast, and the net folds into a bag. The game middle schoolers can't stop playing."},
  {id:"jumprope", n:"Beaded jump rope", c:"sports", p:10, a:7, e:"➰", why:"Beaded ropes keep their shape and make a rhythm. Learn double-unders."},
  {id:"yoyo", n:"Duncan Butterfly XT yo-yo", c:"tricks", p:10, a:7, e:"🪀", why:"Ball-bearing axle that sleeps long enough for real tricks. Walk the dog by Friday."},
  {id:"kendama", n:"Sweets kendama", c:"tricks", p:25, a:8, e:"🎯", why:"The Japanese cup-and-ball skill toy. Hundreds of tricks, zero batteries."},
  {id:"juggling", n:"Juggling balls, set of 3", c:"tricks", p:12, a:8, e:"🤹", why:"Three-ball cascade takes about a week of ten-minute tries. Then it's yours forever."},
  {id:"slackline", n:"Gibbon ClassicLine slackline set", c:"tricks", p:80, a:9, e:"🤸", why:"50 feet of line, ratchet and tree protectors. The best-selling slackline in the world. Balance is a superpower.", sup:"Set up at knee height with a guide."},
  {id:"soccer", n:"Select Classic soccer ball, size 4", c:"sports", p:25, a:7, e:"⚽", why:"A match-quality ball that holds air and stays round. Size 4 is right for ages 8 to 12."},
  {id:"footbag", n:"Hacky sack", c:"tricks", p:8, a:7, e:"🧦", why:"The original circle game. Fits in a pocket, never needs charging."},
  {id:"scooter", n:"Micro Sprite scooter", c:"tricks", p:110, a:7, e:"🛴", why:"Swiss-made, 6 lb, folds flat, every part replaceable. The scooter that gets handed down.", sup:"Helmet required."},
  {id:"chalk", n:"Crayola sidewalk chalk, 48", c:"art", p:8, a:7, e:"🖍️", why:"Four-square courts, hopscotch, murals. Washes away in the rain."},
  // ---- Music ----
  {id:"harmonica", n:"Hohner Special 20 harmonica (key of C)", c:"music", p:45, a:8, e:"🎵", why:"The harmonica professionals start on. Fits in a pocket, sounds like a campfire."},
  {id:"ukulele", n:"Kala Makala MK-S soprano ukulele", c:"music", p:65, a:8, e:"🎸", why:"The best-selling beginner uke for a reason: real mahogany, stays in tune. Four chords, fifty songs."},
  {id:"kalimba", n:"17-key kalimba (thumb piano)", c:"music", p:25, a:7, e:"🎹", why:"Impossible to play a wrong note. Calm, pretty, and you can learn a song in an hour."},
  // ---- Books & Reading ----
  {id:"book-pb", n:"Any paperback from the Lantern Stacks", c:"books", p:12, a:7, e:"📖", why:"Pick a book from the Stacks and it's yours to keep. Your name on the inside cover."},
  {id:"book-hc", n:"Any hardcover from the Lantern Stacks", c:"books", p:20, a:7, e:"📕", why:"The keeper edition of a book you loved."},
  {id:"guinness", n:"Guinness World Records (this year's)", c:"books", p:30, a:7, e:"🏆", why:"The book that gets passed around the whole class. Nonfiction that doesn't feel like it."},
  {id:"almanac", n:"National Geographic Kids Almanac (newest edition)", c:"books", p:16, a:7, e:"🌍", why:"Facts, maps, animals, space. Reread it a hundred times."},
  {id:"calvin", n:"Calvin and Hobbes collection", c:"books", p:20, a:8, e:"🐯", why:"The best comic strip ever made, and secretly a vocabulary builder."},
  {id:"booklight", n:"Rechargeable clip-on book light", c:"books", p:15, a:7, e:"💡", why:"Three warmth settings, charges by USB. Reading after lights-out, officially approved."},
  {id:"bookmarks", n:"Magnetic bookmarks, 5-pack", c:"books", p:10, a:7, e:"🔖", why:"They clip over the page and never fall out. Useful every single day."},
  // ---- Everyday & Cozy ----
  {id:"nalgene", n:"Nalgene 32 oz wide-mouth bottle", c:"everyday", p:16, a:7, e:"🥤", why:"Indestructible, dishwasher-safe, lifetime guarantee. Cover it in stickers."},
  {id:"hydroflask", n:"Hydro Flask 21 oz", c:"everyday", p:35, a:8, e:"🧊", why:"Ice still there at 3 pm. The status water bottle, and it earns it."},
  {id:"kanken", n:"Fjällräven Kånken backpack", c:"style", p:80, a:9, e:"🎒", why:"Swedish, square, nearly indestructible, and it's been cool for 45 years."},
  {id:"beanie", n:"Carhartt watch hat", c:"style", p:20, a:7, e:"🧢", why:"The beanie everyone recognizes. Warm, washable, lasts years."},
  {id:"darntough", n:"Darn Tough kids' hiking socks", c:"everyday", p:18, a:7, e:"🧦", why:"Merino wool socks made in Vermont with a lifetime guarantee. Yes, socks. Ask anyone who owns a pair."},
  {id:"crazycreek", n:"Crazy Creek Original chair", c:"everyday", p:45, a:7, e:"🪑", why:"A folding ground chair with a back. Campfires, concerts, reading in the meadow."},
  {id:"sunglasses", n:"goodr sunglasses", c:"style", p:25, a:8, e:"🕶️", why:"Polarized, no-slip, no-bounce, and they survive being sat on."},
  {id:"tracks-cards", n:"Animal Tracks playing cards", c:"outdoor", p:8, a:7, e:"🐾", why:"A real deck of cards with a track and the animal that made it on every one. Learn the campus prints while you play War."},
  {id:"stickers", n:"Parks Project sticker", c:"everyday", p:5, a:7, e:"⭐", why:"For the water bottle, the laptop, the notebook. Quick to earn."},
  {id:"patch", n:"Wilderland embroidered patch", c:"everyday", p:5, a:7, e:"🏔️", why:"Sew it on the backpack. Only students can get these."},
  {id:"umbrella", n:"Compact umbrella", c:"everyday", p:15, a:7, e:"☂️", why:"Fits in the backpack. Suddenly rain days are fine."},
  // ---- Added Nov 2026: interest audit ----
  {id:"basketball", n:"Wilson NCAA Replica basketball", c:"sports", p:44, a:8, e:"🏀", why:"Feels like a college game ball and holds up on blacktop. Ask a guide which size fits your hands."},
  {id:"football", n:"Nerf Pro Grip football", c:"sports", p:20, a:7, e:"🏈", why:"Soft foam you can catch on a cold morning, with a grip that makes your spiral look good."},
  {id:"wiffle", n:"Wiffle ball and bat", c:"sports", p:9, a:7, e:"⚾", why:"The plastic ball with holes that curves like crazy. Made in the USA since 1953, and safe to play almost anywhere."},
  {id:"pickleball", n:"Selkirk Dude Perfect pickleball set", c:"sports", p:20, a:8, e:"🏓", why:"Two fiberglass paddles, balls, and a bag from a serious pickleball brand. Grab a friend."},
  {id:"minihoop", n:"SKLZ Pro Mini Hoop", c:"sports", p:35, a:7, e:"🏀", why:"Hangs on a door, with a shatter-resistant backboard and a spring rim. Trick shots encouraged."},
  {id:"startkick", n:"SKLZ Star-Kick solo soccer trainer", c:"sports", p:15, a:7, e:"⚽", why:"The ball comes back to you on a cord, so you can practice touches alone as long as you want."},
  {id:"pogo", n:"Flybar Foam Master pogo stick", c:"sports", p:50, a:9, e:"🦘", why:"Foam-covered and built for kids 9 and up. How many bounces in a row can you get?"},
  {id:"darts", n:"Doinkit magnetic dartboard", c:"sports", p:30, a:7, e:"🎯", why:"Magnetic darts with no sharp points. Rolls up small enough to fit in a backpack."},
  {id:"penny", n:"Penny 22\" skateboard", c:"tricks", p:75, a:8, e:"🛹", why:"The original plastic cruiser. Light, tough, and fun on any smooth path. Pair it with a helmet."},
  {id:"helmet", n:"Triple Eight Certified Sweatsaver helmet", c:"tricks", p:60, a:7, e:"⛑️", why:"Certified for bikes and skateboards. Anyone who rides anything needs one."},
  {id:"pads", n:"Triple Eight Saver Series pads, 3-pack", c:"tricks", p:45, a:7, e:"🛡️", why:"Knee pads, elbow pads, and wrist guards. Fall like a pro and get right back up."},
  {id:"bikelights", n:"Knog Frog bike light set", c:"tricks", p:38, a:8, e:"🚲", why:"Front and back lights that stretch onto any handlebar and charge over USB."},
  {id:"fingerboard", n:"Tech Deck fingerboard 4-pack", c:"tricks", p:11, a:7, e:"🛹", why:"Skate tricks you can practice at a table. Learn the ollie first."},
  {id:"diabolo", n:"Diabolo with hand sticks", c:"tricks", p:15, a:8, e:"🪀", why:"Spin it, toss it, catch it on the string. Looks impossible until the day it isn't."},
  {id:"boomerang", n:"Channel Craft boomerang", c:"tricks", p:18, a:9, e:"🪃", why:"A real returning boomerang. Needs a big empty field and some patience."},
  {id:"hotwheels", n:"Hot Wheels 5-pack", c:"tricks", p:7, a:7, e:"🏎️", why:"Five die-cast cars. Hot Wheels have been racing down ramps since 1968."},
  {id:"breyer", n:"Breyer Traditional model horse", c:"animals", p:50, a:8, e:"🐴", why:"A hand-painted model horse at real collector scale. Horse people know exactly what this is."},
  {id:"stablemates", n:"Breyer Stablemates stable with two horses", c:"animals", p:35, a:7, e:"🐎", why:"A little barn and two hand-painted horses. Start your own stable."},
  {id:"schleich", n:"Schleich Horse Club rider and horse", c:"animals", p:20, a:7, e:"🏇", why:"Detailed, hand-painted, and tough enough for years of play."},
  {id:"schleichwild", n:"Schleich Wild Life Africa set", c:"animals", p:20, a:7, e:"🦁", why:"Safari animals painted so well they look ready to move."},
  {id:"jellycat", n:"Jellycat Bashful Bunny, medium", c:"animals", p:33, a:7, e:"🐰", why:"The softest stuffed animal on the shelf. Plenty of big kids keep one too."},
  {id:"squish", n:"Squishmallow, 12 inch", c:"animals", p:20, a:7, e:"🧸", why:"The squishy pillow-friend half the school collects. You pick which one."},
  {id:"butterfly", n:"Insect Lore Butterfly Garden with live caterpillars", c:"animals", p:35, a:7, e:"🦋", why:"Watch caterpillars become butterflies, then let them go. Best ordered in spring."},
  {id:"bugjar", n:"World's Best Bug Jar", c:"animals", p:5, a:7, e:"🐞", why:"A clear jar with a magnifier lid and air holes. Catch, look closely, let go."},
  {id:"hummingbird", n:"Duncraft window hummingbird feeder", c:"animals", p:25, a:7, e:"🐦", why:"Sticks to a window so the birds come to you. Hummingbirds visit from late spring to early fall."},
  {id:"flytrap", n:"Venus flytrap, potted", c:"weird", p:10, a:8, e:"🪴", why:"A live plant that eats bugs. Give it a sunny window and rainwater."},
  {id:"seamonkeys", n:"Sea-Monkeys", c:"weird", p:10, a:7, e:"🦐", why:"Tiny brine shrimp you hatch yourself and raise in a tank on your desk."},
  {id:"nails", n:"Piggy Paint nail polish set", c:"style", p:17, a:7, e:"💅", why:"Water-based, low-odor polish made for kids."},
  {id:"clips", n:"Kitsch claw clips, 3-pack", c:"style", p:10, a:8, e:"✨", why:"Big clips that actually hold. Trade one with a friend."},
  {id:"scrunchies", n:"Kitsch satin scrunchies, 5-pack", c:"style", p:10, a:7, e:"🎀", why:"Satin is gentler on hair than plain elastic. Five colors."},
  {id:"tiedye", n:"Tulip tie-dye kit, 8 colors", c:"style", p:23, a:8, e:"🌀", why:"Bring a white T-shirt, leave with something nobody else has."},
  {id:"jibbitz", n:"Croc shoe charm", c:"style", p:4, a:7, e:"👟", why:"One charm for your Crocs. Quick to earn and very much yours."},
  {id:"tattoos", n:"Glow-in-the-dark temporary tattoos", c:"style", p:10, a:7, e:"🌙", why:"They glow after lights-out and wear off in a few days."},
  {id:"hippack", n:"Osprey Daylite mini waist pack", c:"style", p:30, a:8, e:"👝", why:"A small hip pack for a snack, a knife, and whatever you found today."},
  {id:"instax", n:"Instax Mini 12 instant camera", c:"art", p:90, a:9, e:"📸", why:"Point, shoot, and hold the photo a minute later. Film runs about a dollar a print, so make each one count."},
  {id:"owlpellet", n:"Owl Puke dissection kit", c:"weird", p:25, a:8, e:"🦉", why:"Two real, sterilized barn owl pellets full of tiny bones. Figure out what the owl ate."},
  {id:"geodes", n:"National Geographic break-open geodes", c:"weird", p:15, a:8, e:"💎", why:"Crack them open and see crystals nobody has ever seen."},
  {id:"fossils", n:"10 real fossils from around the world", c:"weird", p:20, a:7, e:"🦴", why:"Real fossils, not plaster copies. Each one is a piece of deep time."},
  {id:"crystalmine", n:"Crystal mining kit", c:"weird", p:15, a:7, e:"⛏️", why:"Chisel real gemstones out of a block. Dusty in the best way."},
  {id:"magic", n:"Jumbo box of magic tricks", c:"weird", p:20, a:7, e:"🎩", why:"Enough tricks for a full show. Practice in a mirror first, then fool a guide."},
  {id:"fishing", n:"Ugly Stik GX2 youth spincast combo", c:"outdoor", p:60, a:7, e:"🎣", why:"A famously tough rod with a push-button reel. Under 12 fishes free in Utah; 12 and up need a license ($5 for ages 12–13)."},
  {id:"walkie", n:"Midland X-Talker walkie-talkies, 3-pack", c:"outdoor", p:65, a:8, e:"📻", why:"Three radios so your crew can talk across a field or a campsite."},
  {id:"saucer", n:"Flexible Flyer snow saucer", c:"outdoor", p:15, a:7, e:"🛷", why:"The fastest way down a snowy hill. It spins, too."},
  {id:"goggles", n:"Gordini kids' snow goggles", c:"outdoor", p:20, a:7, e:"🥽", why:"See the run instead of the glare. Good for sledding days and ski days."},
  {id:"metaldetector", n:"Bounty Hunter Junior T.I.D. metal detector", c:"science", p:75, a:7, e:"🧲", why:"Beeps differently for iron, rings, and coins. Made for kids as young as 6."},
  {id:"makedo", n:"Makedo Explore cardboard kit", c:"build", p:28, a:7, e:"📦", why:"Reusable screws and a kid-safe saw for cardboard. Turn delivery boxes into forts, masks, and machines."},
  {id:"coaster", n:"Thames & Kosmos roller coaster kit", c:"build", p:50, a:9, e:"🎢", why:"Build a working coaster with loops and turns, then change the track to make it faster."},
  {id:"paperplanes", n:"Paper airplane kit", c:"build", p:17, a:7, e:"✈️", why:"Folding guides and good paper for planes that actually fly far."},
  {id:"legomc", n:"LEGO Minecraft set", c:"build", p:35, a:8, e:"⛏️", why:"Minecraft, but with bricks you can hold. Build the scene, then make up your own."},
  {id:"perler", n:"Perler bead activity kit", c:"build", p:33, a:7, e:"🟥", why:"Pixel art you can hold. Make your favorite game sprite, then iron it solid with a guide."},
  {id:"saw", n:"Silky Pocketboy folding saw", c:"tools", p:58, a:11, e:"🪚", why:"For shelter and fort building alongside a guide. Cuts branches cleanly and folds shut."},
  {id:"sharpener", n:"Coghlan's sharpening stone", c:"tools", p:9, a:9, e:"🪨", why:"A dull knife is the dangerous one. Learn to keep your own edge."},
  {id:"gluegun", n:"Low-temp mini glue gun", c:"tools", p:7, a:8, e:"🔥", why:"Low-temp, so it's much less likely to burn you. The secret weapon for cardboard builds."},
  {id:"uno", n:"UNO", c:"games", p:7, a:7, e:"🃏", why:"The card game everyone already knows the rules to."},
  {id:"kittens", n:"Exploding Kittens", c:"games", p:20, a:8, e:"🐱", why:"Draw cards, dodge the exploding kitten. Fast, funny, and over in 15 minutes."},
  {id:"dutchblitz", n:"Dutch Blitz", c:"games", p:13, a:8, e:"⚡", why:"Everyone plays at the same time, as fast as they can."},
  {id:"phase10", n:"Phase 10", c:"games", p:11, a:7, e:"🔟", why:"A card game of runs and sets. Easy to learn, hard to stop playing."},
  {id:"mclabyrinth", n:"Minecraft Labyrinth board game", c:"games", p:30, a:7, e:"🧭", why:"Shift the maze to reach your treasures. Minecraft fans pick it up fast."},
  {id:"kingoftokyo", n:"King of Tokyo", c:"games", p:40, a:8, e:"🦖", why:"Play a giant monster, roll dice, and smash your friends out of Tokyo."},
  {id:"klask", n:"Klask", c:"games", p:70, a:8, e:"🧲", why:"A magnetic table game that feels like air hockey and foosball had a kid. Two players, very fast."},
  {id:"speedcube", n:"MoYu RS3M magnetic speed cube", c:"games", p:9, a:8, e:"🧊", why:"The cube real speedcubers use. Magnets make every turn snap into place."},
  {id:"sewing", n:"Klutz Sew Mini Treats", c:"art", p:23, a:8, e:"🧵", why:"Stitch and stuff tiny felt foods with faces. No sewing experience needed."},
  {id:"embroidery", n:"Beginner embroidery kit", c:"art", p:20, a:9, e:"🪡", why:"A hoop, floss, and a pattern to follow. Calm work for busy hands."},
  {id:"bentgo", n:"Bentgo Kids lunch box", c:"everyday", p:30, a:7, e:"🍱", why:"Leak-proof compartments, so your lunch stops touching itself."},
  {id:"stars", n:"Glow-in-the-dark star set", c:"everyday", p:6, a:7, e:"⭐", why:"Turn your ceiling into a night sky."},
  {id:"headphones", n:"Yoto kids' wireless headphones", c:"music", p:45, a:7, e:"🎧", why:"Made for kids' ears, for music, audiobooks, and road trips."},
  {id:"ocarina", n:"STL 12-hole Zelda ocarina", c:"music", p:50, a:8, e:"🎶", why:"The instrument from the Zelda games. It plays the real songs."},
  {id:"loog", n:"Loog Mini acoustic guitar", c:"music", p:129, a:7, e:"🎸", why:"Three strings instead of six, so you're playing real songs in the first week."},
  {id:"dogman", n:"Dog Man (any book in the series)", c:"books", p:13, a:7, e:"🐶", why:"Dav Pilkey's half-dog, half-cop hero. Kids who \"don't like reading\" finish these in a day."},
  {id:"wimpy", n:"Diary of a Wimpy Kid (any book)", c:"books", p:15, a:8, e:"📓", why:"Greg Heffley's diary, with doodles. Funny on every page."},
  {id:"bone", n:"Bone: Out from Boneville", c:"books", p:13, a:8, e:"🦴", why:"An epic fantasy comic that starts funny and gets big. One of the best graphic novels ever made."},
  {id:"catkid", n:"Cat Kid Comic Club", c:"books", p:13, a:7, e:"🐱", why:"Baby frogs make their own comics. Might make you want to make yours."},
  {id:"weirdtrue", n:"Weird But True! (National Geographic Kids)", c:"books", p:9, a:7, e:"🤯", why:"300 facts so strange you'll read them out loud to whoever's nearby."},
  {id:"madlibs", n:"Mad Libs", c:"books", p:6, a:7, e:"✍️", why:"Fill in the blanks, then read the ridiculous story. Secretly a grammar lesson."},
  {id:"mcisland", n:"Minecraft: The Island", c:"books", p:10, a:9, e:"🏝️", why:"A real novel set inside Minecraft, by the author of World War Z. Survive the first night."},
  {id:"cookbook", n:"Complete Cookbook for Young Chefs", c:"books", p:20, a:8, e:"🍳", why:"Recipes from America's Test Kitchen that kids tested themselves. Cook dinner for your family."},
];
// ---- Experiences (category "exp") ----
// The first list (Nov 23, 2026) was full of jobs dressed up as rewards: lead a Lab, run the store, chair Town Hall. Kids
// saw through it. This list follows one rule: a reward is something a kid would pick on a free afternoon. That means
// friends, food, freedom, a little thrill and some sanctioned mischief, never a task.
// The evidence behind it:
// - What Alpha students actually buy: LEGO, merch, snacks and lounge access (MacKenzie Price, Future of Education, 2025).
// - Middle schoolers asked what they want say tangible prizes, time with peers, and good news sent home (LiveSchool
//   student-voice survey); teens preferred private praise, messages home and get-out-of-work passes (Floress et al.).
// - Around puberty, peers prime the brain's reward system, and status, impressing friends and thrills gain value (Steinberg;
//   Chein et al. 2011). So most of these are done with friends, are a little bit outrageous, or put a kid ahead of the line.
// Prices are what kids will save for: the cost to us (2 blazes a dollar plus guide time) is a floor, and the most wanted
// and scarcest ones cost more. Guides can add their own rewards for one child on this page, and those come first.
// Mischief is played WITH guides, never bought against one (Nov 24, 2026). One kid paying to tape, soak or pelt a guide
// who has to stand there turns the guide into a target money can buy, and lets a kid with a grudge hit an adult with
// permission. Research on humor points the same way: humor aimed at a person goes with more stress and a worse class
// climate, shared humor with better well-being, and a teacher laughing at themselves can make them more approachable
// (but too much and they lose standing). Teacher-student relationships matter more for engagement in middle school than
// in elementary (Roorda et al. 2011 meta-analysis). So every stunt here is two-sided (both teams throw), shared (a kid and
// a guide together) or earned by the whole crew with a guide who chose to take part.
// Not for K–1: incentives start in 2nd grade, so nothing here is offered to K–1 (Nov 25, 2026).
// g = grade bands it suits (24 58), lim = how often, sup = a rule that comes with it.
const EXPERIENCES = [
  // Play with the guides (guides opt in; both sides play, or the whole crew earns it)
  {id:"x-pie", n:"Crew pie: your crew earns a pie for a guide", e:"🥧", b:200, g:"24 58", lim:"Once a month per crew", why:"Pool blazes with your crew. When you get there, a guide who volunteered takes a whipped-cream pie, the crew picks who throws it, and then the guide gets to pie one volunteer back.", sup:"Only guides who volunteer. Outside, with towels ready."},
  {id:"x-snowfight", n:"Snowball fight: your crew vs. the guides", e:"☃️", b:80, g:"24 58", lim:"Winter, once a week", why:"Forts on both sides, guides who throw back, and you pick the moment it starts.", sup:"Soft snow, below the shoulders. Anyone can call time out."},
  {id:"x-waterfight", n:"Water balloon fight: your crew vs. the guides", e:"🎈", b:120, g:"24 58", lim:"Warm months, twice a month", why:"A few hundred balloons split between two teams. Guides get soaked too.", sup:"Below the shoulders; bring dry clothes; everyone helps pick up the scraps."},
  {id:"x-twinday", n:"Twin day with a guide", e:"👯", b:30, g:"24 58", lim:"Once a week per guide", why:"You and a guide you pick dress exactly alike for a day. Plan the outfit together and see who notices.", sup:"The guide says yes first."},
  {id:"x-outfit", n:"Pick what a guide wears tomorrow", e:"🤡", b:50, g:"24 58", lim:"Once a month per guide", why:"A banana suit, your favorite team's jersey, a tutu, a cape. They wear it all day.", sup:"Guides who sign up only; it has to be school-appropriate."},
  {id:"x-nickname", n:"Give a guide a nickname for a day", e:"🏷️", b:20, g:"24 58", lim:"Once a week", why:"Everyone, guides included, has to call them by it until pickup.", sup:"Kind names only; the guide can veto one."},
  // Friends and food
  {id:"x-restaurantlunch", n:"Order lunch in for you and a friend", e:"🍔", b:70, g:"24 58", lim:"One a week", why:"Pick from a few local spots and a guide brings it in. You and your friend eat it somewhere better than the usual table.", sup:"Up to about $25 for the two of you; families okay any allergies."},
  {id:"x-movielunch", n:"Movie lunch with three friends", e:"🍿", b:60, g:"24 58", lim:"Two a month", why:"Pizza, popcorn and the first part of a movie you pick from the approved list, in a room just for you four.", sup:"Guide-approved movies, shown under the school's movie license; a guide nearby."},
  {id:"x-cookies", n:"Fancy cookie box for your crew", e:"🍪", b:90, g:"24 58", lim:"Once a month", why:"A box of the big bakery cookies, delivered at lunch. You hand them out. Everyone knows who brought them.", sup:"Families okay any allergies."},
  {id:"x-cocoabar", n:"Hot cocoa bar for you and three friends", e:"☕", b:30, g:"24 58", lim:"Any week in winter", why:"Whipped cream, marshmallows, sprinkles, candy canes. After sledding is best.", sup:""},
  {id:"x-lunchguide", n:"Pizza lunch with your favorite guide and two friends", e:"🍕", b:45, g:"24 58", lim:"Two a week, school-wide", why:"Pizza's on us. The guide brings the stories.", sup:"In an open spot on campus."},
  {id:"x-crewparty", n:"Throw a party for your crew", e:"🎉", b:250, g:"24 58", lim:"Once a month per band", why:"You pick the theme, the music and the food. Guides set it up. A Friday afternoon your whole crew owes you for.", sup:"Guides make the final plan work."},
  // Science shows (Nov 25, 2026): crowd-pleasing demonstrations a guide runs for the crew, with the buyer at the
  // controls (picking the color, dropping the Mentos, adding the last rubber band). Priced like the rest: supplies at
  // 2 blazes a dollar plus guide time. Elephant toothpaste's big foam needs 30% hydrogen peroxide, a strong oxidizer
  // that burns skin and eyes (ten times drugstore strength), so only a guide handles it, in goggles and gloves.
  {id:"x-toothpaste", n:"Giant elephant toothpaste for your crew", e:"🧪", b:100, g:"24 58", lim:"Twice a month", why:"A guide sets it up, you pick the color and pour in the catalyst, and a tower of hot foam shoots out of the bottle while your crew watches.", sup:"Outside or on a tarp. Only the guide handles the strong peroxide; everyone wears goggles and stays back. The foam is warm and can stain: hands off till a guide says."},
  {id:"x-mentos", n:"Soda geyser launch", e:"🥤", b:35, g:"24 58", lim:"Warm months, once a week", why:"Six bottles of soda, a sleeve of Mentos each, and a countdown. You set them off and see whose geyser goes highest.", sup:"Outside, goggles on, and step back right after the drop."},
  {id:"x-watermelon", n:"Exploding watermelon challenge", e:"🍉", b:60, g:"24 58", lim:"Warm months, twice a month", why:"Your crew guesses how many rubber bands it takes, then everyone adds them one at a time until the watermelon bursts. Closest guess gets the first slice.", sup:"Outside, goggles on, and nobody leans over the melon."},
  {id:"x-dryice", n:"Dry ice fog show and smoke bubbles", e:"🌫️", b:70, g:"24 58", lim:"Twice a month", why:"Buckets of rolling fog, bubbles full of smoke you can bounce on a glove, and a smoke-ring cannon.", sup:"Only guides touch the dry ice, with thick gloves or tongs. Outside or in a well-aired room, and nothing sealed shut with dry ice inside."},
  {id:"x-rockets", n:"Water rocket launch day", e:"🚀", b:60, g:"24 58", lim:"Warm months, twice a month", why:"Turn a soda bottle into a rocket, pump it up, and launch it over the field. Longest flight wins bragging rights.", sup:"A guide runs the launcher, and everyone stands behind the line."},
  {id:"x-movienight", n:"Crew movie night at school", e:"🎬", b:300, g:"24 58", lim:"Once a term", why:"Your crew back at school in the evening: pajamas, blankets, popcorn, a giant screen and a movie you all vote on.", sup:"A guide-approved movie, shown under the school's movie license. Families sign up and pick up; two adults minimum."},
  // Your own space and time
  {id:"x-lounge", n:"Lounge pass for a week", e:"🛋️", b:60, g:"58", lim:"A few passes at a time", why:"The best room in the school, during free time and lunch, for you and anyone you invite.", sup:"Guides choose the room; it stays in sight."},
  {id:"x-fort", n:"Build a giant fort with your friends", e:"🏰", b:35, g:"24 58", lim:"One a week", why:"Blankets, tarps, rope, snow or sticks: one free block to build it, and you get to eat lunch in it.", sup:""},
  {id:"x-sledding", n:"Sledding hill takeover", e:"🛷", b:40, g:"24 58", lim:"Winter, two a week", why:"An extra 30 minutes on the hill for you and three friends while everyone else is inside.", sup:"A guide comes with you."},
  {id:"x-nerf", n:"Nerf war: your crew vs. the guides", e:"🔫", b:200, g:"24 58", lim:"Once a month", why:"Foam darts, the whole campus, guides who do not go easy. You decide when it starts.", sup:"Eye protection on; guide-run rules."},
  {id:"x-flashlight", n:"Flashlight tag night", e:"🔦", b:300, g:"58", lim:"Once a term", why:"Your crew back at school after dark for flashlight tag and capture the flag, with hot dogs.", sup:"Families sign up and pick up; two adults minimum."},
  {id:"x-lockin", n:"Crew lock-in at school", e:"🌙", b:900, g:"58", lim:"Once a year, if approved", why:"The big one. Your crew stays the evening at school: games, a movie, pizza and a midnight snack. Pool blazes with your friends.", sup:"Needs approval from the school's leaders, family permission, and enough guides."},
  {id:"x-trampoline", n:"Trampoline park or laser tag with three friends", e:"🤸", b:400, g:"24 58", lim:"A few a year", why:"A morning out at a trampoline park or laser tag arena with a guide.", sup:"Permission slips; families drive."},
  // Freedom from the usual rules
  {id:"x-headphones", n:"Your music in your ears for a week", e:"🎧", b:40, g:"58", lim:"Any week", why:"Headphones and your own playlist during independent work, all week.", sup:"Guide-approved playlist; off when a guide needs you."},
  {id:"x-earlyout", n:"Leave the work block early", e:"🏃", b:25, g:"24 58", lim:"Once a week", why:"Done with your goals? Walk out 20 minutes early and go outside.", sup:"Only after your daily goals are met."},
  {id:"x-chorepass", n:"Skip-a-chore pass", e:"🧹", b:20, g:"24 58", lim:"Twice a month", why:"Hand it in at clean-up. Someone else gets your job today.", sup:""},
  {id:"x-latestart", n:"Sleep-in pass: arrive an hour late", e:"😴", b:60, g:"58", lim:"Once a month", why:"Sleep in one morning. You still have to hit your daily goals.", sup:"Your family has to agree and drive you."},
  {id:"x-frontofline", n:"First in line for a week", e:"🥇", b:15, g:"24 58", lim:"Any week", why:"Lunch, sleds, the field trip bus. You first.", sup:""},
  {id:"x-guidechair", n:"The guide's chair for a day", e:"💺", b:15, g:"24 58", lim:"Any day", why:"The rolling chair is yours till pickup.", sup:""},
  {id:"x-dog", n:"Bring your dog to school", e:"🐕", b:40, g:"24 58", lim:"One a week", why:"Your dog, your crew, one very good hour.", sup:"Guide and family approve first."},
  {id:"x-pajamas", n:"Pajama day for you and a friend", e:"🩳", b:15, g:"24 58", lim:"Any week", why:"Slippers, hoodie, the works.", sup:""},
  {id:"x-campfire", n:"Campfire and s'mores for your crew", e:"🏕️", b:80, g:"24 58", lim:"Two a month", why:"You call it. The guide builds the fire and brings the marshmallows.", sup:"A guide runs the fire."},
  // Good news home
  {id:"x-bragcall", n:"Brag call home", e:"📞", b:15, g:"24 58", lim:"Any week", why:"A guide calls your family to tell them something specific you did well. Just them, not the whole school.", sup:""},
];

// ---- Who each product appeals to most (grade bands: 24 = 2–4, 58 = 5–8; the store isn't for K–1) ----
// The age on a product (a) is the youngest it is safe and usable for. This is different: the bands where kids actually want it.
// A Squishmallow is safe at 7 and still loved at 13, but it is a K–4 favorite; a Hydro Flask is a middle-school one.
// Anything not listed appeals to every band. Used for the grade filter and for "Picked for your grades".
const APPEAL = {
  "lego-classic":"24","lego-creator":"24","plusplus":"24","magnatiles":"24","keva":"24 58","gravitrax":"24 58","ugears":"58","kiwico":"24 58","balsa":"24 58","origami":"24 58",
  "nocs-bino":"24 58","compass":"24 58","birds-utah":"24 58","tracks":"24 58","rite-rain":"58","hammock":"58","kite":"24","paracord":"24 58","firesteel":"58","bugviewer":"24",
  "opinel-first":"24","mora-scout":"24 58","victorinox":"58","leatherman":"58","beavercraft":"58","gloves-cut":"24 58",
  "spotit":"24","sushigo":"24 58","kanoodle":"24","rushhour":"24","rubiks":"24 58","perplexus":"24","chess":"24 58","blokus":"24 58","kingdomino":"24","ticket":"24","catan-jr":"24","catan":"58","codenames":"58","azul":"24 58","forbidden":"24 58","skyjo":"24 58","tacocat":"24 58","bananagrams":"24 58","yahtzee":"24",
  "prismacolor":"58","posca":"24 58","micron":"58","sketchbook":"24 58","watercolor":"24 58","sculpey":"24 58","comicbook":"24","leuchtturm":"58","frixion":"24 58","lamy":"58","bracelets":"24 58",
  "snap-jr":"24","microbit":"58","makey":"24 58","sphero":"24 58","campsnap":"24 58","telescope":"24 58","tumbler":"24","rockets":"58","waythings":"24 58",
  "frisbee":"24 58","kanjam":"58","spikeball":"58","jumprope":"24","soccer":"24","basketball":"24 58","football":"24 58","wiffle":"24","pickleball":"58","minihoop":"24 58","startkick":"24","pogo":"24","darts":"24 58",
  "yoyo":"24 58","kendama":"24 58","juggling":"24 58","slackline":"58","footbag":"58","scooter":"24","penny":"58","helmet":"24 58","pads":"24 58","bikelights":"58","fingerboard":"24 58","diabolo":"24 58","boomerang":"24 58","hotwheels":"24","chalk":"24",
  "harmonica":"24 58","ukulele":"24 58","kalimba":"24","headphones":"24","ocarina":"58","loog":"24",
  "guinness":"24 58","almanac":"24","calvin":"24 58","booklight":"24 58","bookmarks":"24","dogman":"24","wimpy":"24","bone":"24","catkid":"24","weirdtrue":"24","madlibs":"24 58","mcisland":"24 58","cookbook":"24 58",
  "nalgene":"24 58","hydroflask":"58","crazycreek":"24 58","bentgo":"24","stars":"24",
  "kanken":"58","beanie":"24 58","sunglasses":"58","nails":"24","clips":"58","scrunchies":"24 58","tiedye":"24 58","jibbitz":"24","tattoos":"24","hippack":"58","tracks-cards":"24",
  "breyer":"24 58","stablemates":"24","schleich":"24","schleichwild":"24","jellycat":"24","squish":"24","butterfly":"24","bugjar":"24","hummingbird":"24 58",
  "flytrap":"24 58","seamonkeys":"24","owlpellet":"24 58","geodes":"24","fossils":"24","crystalmine":"24","magic":"24","instax":"58",
  "fishing":"24 58","walkie":"24 58","saucer":"24","metaldetector":"24 58","makedo":"24","coaster":"58","paperplanes":"24","legomc":"24 58","perler":"24",
  "saw":"58","sharpener":"58","gluegun":"24 58","uno":"24","kittens":"24 58","dutchblitz":"24 58","phase10":"24 58","mclabyrinth":"24","kingoftokyo":"24 58","klask":"24 58","speedcube":"24 58",
  "sewing":"24","embroidery":"24 58"
};
// "Picked for your grades": the top of the store for each band, in order, after any rewards guides made for that student.
// From grade 2 up, experiences are mixed in near the top; around 4th grade they start to beat toys.
const FEATURED = {
  "2–4": ["x-pie","x-toothpaste","lego-classic","x-nerf","x-watermelon","gravitrax","x-snowfight","perplexus","kendama","x-fort","snap-jr","fossils","x-crewparty","mcisland","minihoop","rushhour"],
  "5–8": ["x-pie","x-toothpaste","x-lounge","x-restaurantlunch","x-movienight","spikeball","x-nerf","hydroflask","x-movielunch","kanken","x-headphones","leatherman","x-crewparty","instax","x-lockin","codenames","catan","x-snowfight"]
};
