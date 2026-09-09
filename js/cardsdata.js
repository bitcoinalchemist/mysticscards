window.SUIT_PIP_SVG = {
  '♠': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,8 C30,26 6,50 6,66 C6,82 22,90 36,82 C42,78 47,74 50,70 L40,95 L60,95 L50,70 C53,74 58,78 64,82 C78,90 94,82 94,66 C94,50 70,26 50,8 Z"/></svg>',
  '♥': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,86 C45,79 15,58 15,34 C15,22 24,14 35,14 C43,14 48,20 50,27 C52,20 57,14 65,14 C76,14 85,22 85,34 C85,58 55,79 50,86 Z"/></svg>',
  '♦': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,6 L86,50 L50,94 L14,50 Z"/></svg>',
  '♣': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="30" r="20"/><circle cx="27" cy="58" r="20"/><circle cx="73" cy="58" r="20"/><path d="M44,46 L40,96 L60,96 L56,46 Z"/></svg>'
};
window.pipMark = function (sym) { return window.SUIT_PIP_SVG[sym] || sym; };

// ── Life Scripts ─────────────────────────────────────────────────
// Script order in array: [Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune]
// Display order in modal: Neptune → Mercury (left → right), matching the Quadration grid.
const LIFE_SCRIPTS = {
  'A_hearts':  ['A♦','Q♦','5♥','3♣','3♠','9♥','7♣'],
  '2_hearts':  ['K♥','K♦','6♥','4♣','2♦','J♠','8♣'],
  '3_hearts':  ['A♣','Q♣','10♠','5♣','3♦','A♠','7♥'],
  '4_hearts':  ['4♦','2♠','8♥','6♣','6♠','Q♥','10♣'],
  '5_hearts':  ['3♣','3♠','9♥','7♣','5♦','Q♠','J♣'],
  '6_hearts':  ['4♣','2♦','J♠','8♣','6♦','4♠','10♥'],
  '7_hearts':  ['7♦','5♠','J♥','9♣','9♠','2♥','K♥'],
  '8_hearts':  ['6♣','6♠','Q♥','10♣','8♦','K♠','3♥'],
  '9_hearts':  ['7♣','5♦','Q♠','J♣','9♦','7♠','2♣'],
  '10_hearts': ['10♦','8♠','A♥','A♦','Q♦','5♥','3♣'],
  'J_hearts':  ['9♣','9♠','2♥','K♥','K♦','6♥','4♣'],
  'Q_hearts':  ['10♣','8♦','K♠','3♥','A♣','Q♣','10♠'],
  'K_hearts':  ['K♦','6♥','4♣','2♦','J♠','8♣','6♦'],

  'A_clubs':   ['Q♣','10♠','5♣','3♦','A♠','7♥','7♦'],
  '2_clubs':   ['K♣','J♦','4♥','4♦','2♠','8♥','6♣'],
  '3_clubs':   ['3♠','9♥','7♣','5♦','Q♠','J♣','9♦'],
  '4_clubs':   ['2♦','J♠','8♣','6♦','4♠','10♥','10♦'],
  '5_clubs':   ['3♦','A♠','7♥','7♦','5♠','J♥','9♣'],
  '6_clubs':   ['6♠','Q♥','10♣','8♦','K♠','3♥','A♣'],
  '7_clubs':   ['5♦','Q♠','J♣','9♦','7♠','2♣','K♣'],
  '8_clubs':   ['6♦','4♠','10♥','10♦','8♠','A♥','A♦'],
  '9_clubs':   ['9♠','2♥','K♥','K♦','6♥','4♣','2♦'],
  '10_clubs':  ['8♦','K♠','3♥','A♣','Q♣','10♠','5♣'],
  'J_clubs':   ['9♦','7♠','2♣','K♣','J♦','4♥','4♦'],
  'Q_clubs':   ['10♠','5♣','3♦','A♠','7♥','7♦','5♠'],
  'K_clubs':   ['J♦','4♥','4♦','2♠','8♥','6♣','6♠'],

  'A_diamonds':  ['Q♦','5♥','3♣','3♠','9♥','7♣','5♦'],
  '2_diamonds':  ['J♠','8♣','6♦','4♠','10♥','10♦','8♠'],
  '3_diamonds':  ['A♠','7♥','7♦','5♠','J♥','9♣','9♠'],
  '4_diamonds':  ['2♠','8♥','6♣','6♠','Q♥','10♣','8♦'],
  '5_diamonds':  ['Q♠','J♣','9♦','7♠','2♣','K♣','J♦'],
  '6_diamonds':  ['4♠','10♥','10♦','8♠','A♥','A♦','Q♦'],
  '7_diamonds':  ['5♠','J♥','9♣','9♠','2♥','K♥','K♦'],
  '8_diamonds':  ['K♠','3♥','A♣','Q♣','10♠','5♣','3♦'],
  '9_diamonds':  ['7♠','2♣','K♣','J♦','4♥','4♦','2♠'],
  '10_diamonds': ['8♠','A♥','A♦','Q♦','5♥','3♣','3♠'],
  'J_diamonds':  ['4♥','4♦','2♠','8♥','6♣','6♠','Q♥'],
  'Q_diamonds':  ['5♥','3♣','3♠','9♥','7♣','5♦','Q♠'],
  'K_diamonds':  ['6♥','4♣','2♦','J♠','8♣','6♦','4♠'],

  'A_spades':  ['7♥','7♦','5♠','J♥','9♣','9♠','2♥'],
  '2_spades':  ['8♥','6♣','6♠','Q♥','10♣','8♦','K♠'],
  '3_spades':  ['9♥','7♣','5♦','Q♠','J♣','9♦','7♠'],
  '4_spades':  ['10♥','10♦','8♠','A♥','A♦','Q♦','5♥'],
  '5_spades':  ['J♥','9♣','9♠','2♥','K♥','K♦','6♥'],
  '6_spades':  ['Q♥','10♣','8♦','K♠','3♥','A♣','Q♣'],
  '7_spades':  ['2♣','K♣','J♦','4♥','4♦','2♠','8♥'],
  '8_spades':  ['A♥','A♦','Q♦','5♥','3♣','3♠','9♥'],
  '9_spades':  ['2♥','K♥','K♦','6♥','4♣','2♦','J♠'],
  '10_spades': ['5♣','3♦','A♠','7♥','7♦','5♠','J♥'],
  'J_spades':  ['8♣','6♦','4♠','10♥','10♦','8♠','A♥'],
  'Q_spades':  ['J♣','9♦','7♠','2♣','K♣','J♦','4♥'],
  'K_spades':  ['3♥','A♣','Q♣','10♠','5♣','3♦','A♠'],
};

const LS_SUIT_FROM_SYM = { '♥':'hearts', '♦':'diamonds', '♣':'clubs', '♠':'spades' };

function lsParseCard(str) {
  const sym = str.slice(-1);
  return { rank: str.slice(0, -1), sym, suit: LS_SUIT_FROM_SYM[sym] };
}

const SPREAD_SUITS  = ['hearts','clubs','diamonds','spades'];
const SPREAD_SYMS   = { hearts:'♥', clubs:'♣', diamonds:'♦', spades:'♠' };
const SPREAD_RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SPREAD_PLANETS = ['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'];
const SPREAD_PLANET_SYM = { Mercury:'☿', Venus:'♀', Mars:'♂', Jupiter:'♃', Saturn:'♄', Uranus:'♅', Neptune:'♆', Pluto:'♇', Moon:'☽', Sun:'☉', Crown:'♛' };

const SPREAD_CARDS = [];
SPREAD_SUITS.forEach(suit => {
  SPREAD_RANKS.forEach(rank => {
    SPREAD_CARDS.push({ suit, rank, sym: SPREAD_SYMS[suit] });
  });
});

const QUADRATION_P = [
  26,13, 0,42,29,16, 7,45,32,23,10,48,14, 1,
  39,30,17, 4,46,33,20,11,49,36, 2,40,27,18,
   5,43,34,21, 8,50,37,24,41,28,15, 6,44,31,
  22, 9,47,38,25,12, 3,19,35,51
];

const _spreadCache = {};
function deckAtAge(age) {
  age = ((age % 90) + 90) % 90;
  if (_spreadCache[age]) return _spreadCache[age];
  let perm = Array.from({length: 52}, (_, i) => i);
  let power = QUADRATION_P.slice();
  let n = age;
  while (n > 0) {
    if (n & 1) perm = perm.map(i => power[i]);
    power = power.map(i => power[i]);
    n >>= 1;
  }
  const deck = new Array(52);
  for (let i = 0; i < 52; i++) deck[perm[i]] = i;
  _spreadCache[age] = deck;
  return deck;
}

function slDisplaces(idx)   { const s = deckAtAge(90), l = deckAtAge(1); return s[l.indexOf(idx)]; }
function slDisplacedBy(idx) { const s = deckAtAge(90), l = deckAtAge(1); return l[s.indexOf(idx)]; }

const PIP_LAYOUTS = {
  'A':  [[50,50,0]],
  '2':  [[50,8,0],[50,92,1]],
  '3':  [[50,8,0],[50,50,0],[50,92,1]],
  '4':  [[25,8,0],[75,8,0],[25,92,1],[75,92,1]],
  '5':  [[25,8,0],[75,8,0],[50,50,0],[25,92,1],[75,92,1]],
  '6':  [[25,8,0],[75,8,0],[25,50,0],[75,50,0],[25,92,1],[75,92,1]],
  '7':  [[25,8,0],[75,8,0],[50,29,0],[25,50,0],[75,50,0],[25,92,1],[75,92,1]],
  '8':  [[25,8,0],[75,8,0],[50,29,0],[25,50,0],[75,50,0],[50,71,1],[25,92,1],[75,92,1]],
  '9':  [[25,8,0],[75,8,0],[25,36,0],[75,36,0],[50,50,0],[25,64,1],[75,64,1],[25,92,1],[75,92,1]],
  '10': [[25,8,0],[75,8,0],[50,22,0],[25,36,0],[75,36,0],[25,64,1],[75,64,1],[50,78,1],[25,92,1],[75,92,1]],
  'J':  [[25,8,0],[75,8,0],[50,22,0],[25,36,0],[75,36,0],[50,50,0],[25,64,1],[75,64,1],[50,78,1],[25,92,1],[75,92,1]],
  'Q':  [[25,8,0],[50,8,0],[75,8,0],[25,36,0],[50,36,0],[75,36,0],[25,64,1],[50,64,1],[75,64,1],[25,92,1],[50,92,1],[75,92,1]],
  'K':  [[25,8,0],[75,8,0],[50,-5,0],[50,22.5,0],[25,36,0],[75,36,0],[50,50,0],[25,64,1],[75,64,1],[50,77.5,1],[25,92,1],[75,92,1],[50,105,1]]
};

const COURT_PIP_DEFAULT = [31, 23.1];
const COURT_PIP_POS = {};

function spreadCardPips(c) {
  const { rank, sym } = c;
  if (c.suit === 'joker') {
    // Original "Quinta Essentia" art. The classic
    // Joker corners are drawn live like a court index: a Jack-style "J"
    // (same serif + position as J/Q/K) with "oker" descending vertically,
    // mirrored bottom-right.
    const jokerCorner = (cls) =>
      `<div class="card-corner ${cls}"><span class="cc-rank">J</span>` +
      `<span class="cc-rest">oker</span></div>`;
    return jokerCorner('card-tl') + jokerCorner('card-br') +
      `<img class="court-art" src="assets/cards/JOKER.webp" alt="Joker — Quinta Essentia">`;
  }
  const corners =
    `<div class="card-corner card-tl"><span class="cc-rank">${rank}</span></div>` +
    `<div class="card-corner card-br"><span class="cc-rank">${rank}</span></div>`;
  if (['J','Q','K'].includes(rank)) {
    const courtKey = rank + (c.suit === 'hearts' ? 'H' : c.suit === 'diamonds' ? 'D' : c.suit === 'clubs' ? 'C' : 'S');
    const mark = window.pipMark(sym);
    const pos = COURT_PIP_POS[courtKey] || COURT_PIP_DEFAULT;
    const courtPips =
      `<span class="court-pip" style="left:${pos[0]}%;top:${pos[1]}%">${mark}</span>` +
      `<span class="court-pip" style="left:${100 - pos[0]}%;top:${100 - pos[1]}%;transform:translate(-50%,-50%) rotate(180deg)">${mark}</span>`;
    const altPips = '<div class="card-pips court-only">' +
      (PIP_LAYOUTS[rank] || []).map(([x,y,inv]) =>
        `<span class="pip${inv ? ' inv' : ''}" style="left:${x}%;top:${y}%">${mark}</span>`
      ).join('') + '</div>';
    return corners + courtPips + `<img class="court-art" src="assets/cards/${courtKey}.webp" alt="${rank} of ${c.suit}">` + altPips;
  }
  const layout = PIP_LAYOUTS[rank];
  const aceLarge = rank === 'A' && c.suit === 'spades';
  const mark = window.pipMark(sym);
  return corners + '<div class="card-pips">' +
    layout.map(([x,y,inv]) =>
      `<span class="pip${inv?' inv':''}${aceLarge?' ace':''}" style="left:${x}%;top:${y}%">${mark}</span>`
    ).join('') + '</div>';
}

// ── About / Reading data ─────────────────────────────────────────────
// 52 card readings — one entry per Ace..King × Hearts/Clubs/Diamonds/
// Spades — plus the Joker (pushed below, keyed '✦_joker'). Locked Sage
// voice. Subtitle/vow for every card, including the Joker, live in the
// SUBTITLES / VOWS maps further down this file.
//
// Shape per entry: { rank, suit, sym, name, dates, teaser, kws[],
// personality, strengths[], challenges[] }. Data intentionally
// duplicated across CARDS (array in solar order, matching SPREAD_CARDS
// indexing) and CARD_READINGS (map keyed by `${rank}_${suit}` for O(1)
// lookup from the Finder's rendered pick).
const CARDS = [
  // HEARTS
  { rank:'A',  suit:'hearts',   sym:'♥', name:'Ace of Hearts',    dates:'Dec 30',
    teaser:'The very first beat of the deck, and its oldest hunger: the need to love and to be loved in return. Magnetic and quick to read the true worth of things, you spend a lifetime learning whether the heart and worldly success can ever be held at once.',
    kws:['Desire','New beginnings','Emotional depth','Self-discovery'],
    personality:'The Ace of Hearts carries the first impulse of desire into the realm of feeling. There is a powerful need to love, connect, and discover what the heart truly values. Warm, perceptive, and emotionally responsive, you often recognise potential in people before they recognise it in themselves. This sensitivity can support creative work, close relationships, and an intuitive understanding of both people and opportunity.\n\nMuch of the path involves learning the difference between love freely expressed and love sought as proof of worth. Longing can become dependency when it is allowed to determine your value, while ambition can pull against the intimacy you genuinely need. As self-knowledge deepens, these forces no longer have to compete: emotional intelligence becomes a source of strength, and worldly accomplishment can grow from—rather than replace—an open heart.',
    strengths:['Intense, devoted love','Magnetic and emotionally intelligent','Ambitious and quick-minded','Sees potential in people before others do'],
    challenges:['The longing to be loved can tip into dependency','Emotional overwhelm','Difficulty detaching from people or outcomes','Balancing the pull between love and material success'] },
  { rank:'2',  suit:'hearts',   sym:'♥', name:'Two of Hearts',    dates:'Dec 29',
    teaser:'The Lovers of the deck, a soul wired for deep connection and almost spiritual about what partnership could be. Your ideals of love run so high they become the very thing you struggle to live up to.',
    kws:['Union','Partnership','Devotion','Idealism'],
    personality:'The Two of Hearts brings the principle of union into its most natural home. Connection matters deeply to you, and you are finely attuned to the emotional atmosphere between people. Loyal, affectionate, and instinctively cooperative, you often know how to create peace, sustain a bond, and help two lives move as one without losing the tenderness that first brought them together.\n\nBecause partnership carries so much meaning, the wish for harmony can make distance or disapproval feel larger than it is. Ideals of love may become standards no ordinary person can consistently meet, while fear of being alone can tempt you to accept less than genuine reciprocity. The mature Two discovers that intimacy is strongest when it is chosen by two whole people: support becomes mutual, sensitivity becomes discernment, and love is allowed to be real rather than perfect.',
    strengths:['Deep loyalty and devoted love','Natural peacemaker with a gift for harmony','Powerful intuition about people and relationships','Ability to nurture and sustain bonds over time'],
    challenges:['Unrealistic ideals leading to repeated disappointment','Fear of being alone driving compromised choices','Can feel profoundly misunderstood by others'] },
  { rank:'3',  suit:'hearts',   sym:'♥', name:'Three of Hearts',  dates:'Nov 30, Dec 28',
    teaser:'Love and imagination running on the same current, an expressive heart paired with a restless, brilliant mind. The gift is real feeling poured into art and words; the catch is scattering it across too many beginnings that never find an ending.',
    kws:['Creativity','Expression','Versatility','Restlessness'],
    personality:'The Three of Hearts meets feeling at a crossroads, where more than one desire, affection, or creative possibility asks to be heard. Imaginative, expressive, and socially alive, you can translate a rich inner world into words, art, humour, or performance. Your openness gives others permission to feel more freely, and your versatility allows inspiration to arrive through many different forms.\n\nThe difficulty is not a lack of feeling but an abundance of it. Attention can divide, choices can remain suspended, and inspired beginnings can multiply faster than they are completed. When emotion has no chosen channel, it may surface as worry, moodiness, or restlessness in love. Your development lies in giving one true feeling enough time and form to become something real; commitment does not diminish your creativity, but gathers its scattered light.',
    strengths:['Artistic and richly expressive','Persistent and self-motivated when passion is engaged','Warm, entertaining social presence','Wide range of creative talents'],
    challenges:['Scattered energy and creative indecision','Emotional restlessness in relationships','Persistent worry and mental chatter'] },
  { rank:'4',  suit:'hearts',   sym:'♥', name:'Four of Hearts',   dates:'Oct 31, Nov 29, Dec 27',
    teaser:'The builder of the Hearts suit, quietly devoted to creating a home and a love that others can lean on. The same steadiness that makes you safe to love can harden into a resistance to the changes you actually need.',
    kws:['Stability','Security','Loyalty','Home'],
    personality:'The Four of Hearts builds a secure place for love to live. Loyalty, consistency, and emotional reliability come naturally, and people often experience you as someone who can be counted on when circumstances become uncertain. Home, family, and enduring bonds carry particular importance, while your steady care can translate into healing, teaching, creative work, or practical leadership.\n\nThe instinct to protect what has been built can also make necessary change feel like a threat. Familiar arrangements may be preserved beyond their natural life, or care may become control when security feels uncertain. Your strongest foundation is not an unchanging outer structure but the trust you create through presence and integrity. When you allow relationships to breathe and adapt, your steadiness becomes a shelter rather than a boundary wall.',
    strengths:['Unwavering loyalty and reliability','Natural protector and homemaker','Emotional consistency others can trust','Practical and grounded in relationships'],
    challenges:['Stubbornness and resistance to change','Fear of instability leading to controlling behaviour','Difficulty adapting when circumstances shift unexpectedly'] },
  { rank:'5',  suit:'hearts',   sym:'♥', name:'Five of Hearts',   dates:'Oct 30, Nov 28, Dec 26',
    teaser:'The restless heart that wants all of it at once, love, security, variety, and a horizon to chase. Your whole reward in life is hidden in one hard thing: finding something you love and staying long enough to watch it bloom.',
    kws:['Freedom','Change','Adventure','Restlessness'],
    personality:'The Five of Hearts seeks growth through emotional experience. New people, places, and possibilities quicken you, and your warmth makes it easy to enter unfamiliar rooms and form connections there. Adaptable, sociable, and alive to opportunity, you often flourish where life offers movement, variety, travel, or regular contact with others. Change renews your feelings and teaches you how many forms love can take.\n\nYet movement can become a reflex whenever closeness asks for patience or repetition. Commitment may look like confinement, and the promise of a fresh horizon can pull attention away just before a relationship or vocation develops real depth. Freedom becomes more meaningful when it is exercised consciously rather than used as escape. Your great reward lies in recognising what is truly alive for you—and staying with it long enough for change to become growth rather than another beginning.',
    strengths:['Adventurous and enthusiastically open-hearted','Highly adaptable and energetic','Magnetic and engaging social presence','Able to reinvent yourself across many stages of life'],
    challenges:['Emotional restlessness and inconsistency in love','Difficulty sustaining long-term commitment','Tendency to move on before depth is reached'] },
  { rank:'6',  suit:'hearts',   sym:'♥', name:'Six of Hearts',    dates:'Oct 29, Nov 27, Dec 25',
    teaser:'The card of karmic love, forever smoothing conflict and healing the people around you, often at your own expense. Love returned is love earned here, and the one key you keep circling back to is simply taking action.',
    kws:['Karma','Responsibility','Compassion','Peace'],
    personality:'The Six of Hearts understands relationship as a field of responsibility and return. Kind, affectionate, and sensitive to the needs of others, you are often the person who restores peace, keeps a promise, or carries a burden until harmony can be found again. Good judgment and emotional intelligence support a genuine gift for mediation, teaching, care, and communication.\n\nYour lesson is reciprocity: what is given in love eventually asks to be balanced, and peace that depends upon your continual self-sacrifice is not true peace. You may postpone necessary action, absorb feelings that belong to others, or avoid conflict until the cost becomes heavier than honesty would have been. When compassion includes clear boundaries and timely action, responsibility stops being a burden and becomes the steady expression of love you are here to embody.',
    strengths:['Deep compassion and genuine empathy','Natural peacemaker and skilled mediator','Strong sense of responsibility toward those you love','Emotionally wise beyond your years'],
    challenges:['Taking on others\' emotional burdens as your own','Avoiding necessary conflict in the name of peace','Resistance to accepting karmic lessons on their own terms'] },
  { rank:'7',  suit:'hearts',   sym:'♥', name:'Seven of Hearts',  dates:'Sep 30, Oct 28, Nov 26, Dec 24',
    teaser:'The Mystic Heart, tuned to a high frequency and able to read the inner worlds of others with rare accuracy. Beauty keeps you well and giving keeps you alive, but the quiet danger is the martyrdom that grows when you give without ever being filled back up.',
    kws:['Spirituality','Intuition','Forgiveness','Inner life'],
    personality:'The Seven of Hearts is the Mystic Heart, seeking truth through love, beauty, and the unseen life of feeling. Intuitive and deeply receptive, you can sense what others carry beneath their words and may be drawn toward counselling, healing, teaching, art, or spiritual inquiry. Solitude, beauty, and honest reflection restore you, allowing sensitivity to become insight rather than overwhelm.\n\nLove is also the place where faith is tested. Suspicion, jealousy, or disappointment can arise when intuition becomes entangled with fear, while generous care can quietly turn into martyrdom if you never permit yourself to receive. The path is neither withdrawal nor endless sacrifice, but a more spacious love that does not grasp or keep score. When you trust without abandoning discernment, forgiveness becomes strength and your emotional depth becomes a source of guidance for others.',
    strengths:['Profound emotional and spiritual intelligence','Natural healer, counsellor, or teacher','Magnetic and charismatic presence','Deep and genuine capacity for forgiveness'],
    challenges:['Over-sensitivity and emotional overwhelm','Risk of self-sacrifice tipping into martyrdom','Suspicion or jealousy in close relationships when depleted'] },
  { rank:'8',  suit:'hearts',   sym:'♥', name:'Eight of Hearts',  dates:'Aug 31, Sep 29, Oct 27, Nov 25, Dec 23',
    teaser:'Here love stops being soft and becomes a force, healing, magnetic, and asking to be used with real integrity. Your deepest work is self-love, because everything you draw toward you rests on that one foundation.',
    kws:['Self-love','Emotional power','Healing','Transformation'],
    personality:'The Eight of Hearts carries emotional power: a magnetic warmth capable of healing, inspiring, and moving other people. Strength of feeling combines with real personal authority, giving you influence in relationships and the potential for mastery in creative, therapeutic, or people-centred work. When grounded in self-respect, your presence gathers others naturally and helps them recognise their own capacity for love.\n\nPower in the heart must be handled with care. Affection can become possessive, charisma can become control, and strength can be used to avoid the vulnerability that intimacy requires. Worry often appears when you try to manage every emotional outcome. Your deeper work is self-love—not as admiration, but as an inner foundation that frees you from needing to command another person’s response. Used with integrity, your influence becomes protective, generous, and genuinely transformative.',
    strengths:['Magnetic personal warmth and emotional authority','Deep capacity for emotional healing and renewal','Self-aware and genuinely introspective','Resilient and steady through relational challenges'],
    challenges:['Power struggles within intimate relationships','Possessiveness or need for emotional control','Difficulty allowing true vulnerability'] },
  { rank:'9',  suit:'hearts',   sym:'♥', name:'Nine of Hearts',   dates:'Aug 30, Sep 28, Oct 26, Nov 24, Dec 22',
    teaser:'One of the most emotionally profound cards in the deck, the place where love is learned by giving more than most know how to receive. They call it the wish card, and its whole lesson is the hardest one: learning to let go, of people, of outcomes, of the need to hold love to prove it is real.',
    kws:['Completion','Universal love','Generosity','Release'],
    personality:'The Nine of Hearts brings the emotional cycle toward fulfilment. Known as the Wish Card, it carries an immense capacity to love, give, and imagine happiness not only for one person but for a wider human circle. You are often generous with feeling and may be drawn toward service, creativity, healing, or any work that allows personal experience to become something useful to others.\n\nFulfilment here depends upon release. Expectations in love can become so elevated that ordinary relationships struggle beneath them, while giving without discernment may end in depletion or disillusionment. Some people, hopes, and identities must be allowed to complete their season without being judged as failures. When you loosen the need to possess the outcome, your generosity becomes cleaner and more powerful. The Nine of Hearts is a semi-fixed card and the Spiritual Twin of the Seven of Diamonds.',
    strengths:['Immense and genuine capacity for love and generosity','Deeply empathetic and emotionally wise','Naturally inspiring and magnetic','Called toward service in a meaningful and lasting way'],
    challenges:['Emotional depletion from chronic over-giving','Idealism cycling into disillusionment','Difficulty with endings, loss, and letting go'] },
  { rank:'10', suit:'hearts',   sym:'♥', name:'Ten of Hearts',    dates:'Jul 31, Aug 29, Sep 27, Oct 25, Nov 23, Dec 21',
    teaser:'Love turned outward and lit up for a crowd, warmth that can move a whole room at once. The shadow is subtle: magnificent in public, you can quietly withdraw from the real intimacy that happens in private.',
    kws:['Abundance','Social love','Ambition','Success'],
    personality:'The Ten of Hearts expresses love on a broad and visible scale. Warm, independent, and socially magnetic, you can unite a room, inspire a group, or create a sense of shared celebration wherever people gather. Emotional intelligence combines with ambition and a formidable capacity for reason, supporting success in public, creative, entrepreneurial, or leadership roles.\n\nThe applause of the many can sometimes feel safer than the intimacy of one. A polished public presence may conceal private uncertainty, and the drive for recognition can quietly replace the closeness that achievement was meant to support. Your fullest success arrives when warmth remains personal as well as universal. By allowing yourself to be known without performance, you bring the same courage to private love that you naturally bring to the larger world.',
    strengths:['Naturally charismatic and emotionally generous','Gifted at connecting with and inspiring large groups','Ambitious with penetrating emotional focus','Warm, magnanimous spirit'],
    challenges:['Emotional distance or guardedness in intimate relationships','Risk of isolation behind a polished public persona','Need for recognition can overshadow authentic connection'] },
  { rank:'J',  suit:'hearts',   sym:'♥', name:'Jack of Hearts',   dates:'Jul 30, Aug 28, Sep 26, Oct 24, Nov 22, Dec 20',
    teaser:'Eternal youth and a giving heart, the natural teacher who shows the way of love by example, often from somewhere behind the scenes. Beloved almost everywhere you go, your secret task is to give some of that devotion back to yourself.',
    kws:['Charm','Service','Youthfulness','Idealism'],
    personality:'The Jack of Hearts joins a youthful spirit with a heart inclined toward service. Warm, charismatic, and naturally engaging, you often teach through example rather than authority and can bring playfulness, hope, or compassion into difficult places. People respond to the freshness of your feeling, while creative expression and work that benefits others offer natural channels for your gifts.\n\nThe Jack’s crown is earned through maturity. Charm and good intentions cannot replace consistency, and giving to everyone else can become another way of avoiding your own unfinished dreams. Carelessness, denial, or escape may appear when responsibility feels too confining. Your path is to let devotion include yourself: honouring boundaries, remaining present when love becomes difficult, and giving your ideals a lived form. The Jack of Hearts is a fixed card in the Life Spread.',
    strengths:['Irresistible personal magnetism and natural warmth','Genuine compassion and desire to be of service','Creative, playful, and energising to others','Natural leader who inspires through love rather than authority'],
    challenges:['Avoiding responsibility or emotional depth','Charm used as deflection from difficult truths','Inconsistency or restlessness in committed relationships'] },
  { rank:'Q',  suit:'hearts',   sym:'♥', name:'Queen of Hearts',  dates:'Jul 29, Aug 27, Sep 25, Oct 23, Nov 21, Dec 19',
    teaser:'The promoter of dreams and the deck\'s image of unconditional love, holding a vision of harmony wide enough to take in people, animals, art, and spirit alike. The trouble is the one direction the love rarely flows: inward, toward the Queen herself.',
    kws:['Nurturing','Unconditional love','Artistry','Devotion'],
    personality:'The Queen of Hearts is receptive authority expressed through care. Nurturing, warm, and deeply invested in the flourishing of others, you can hold a vision of harmony broad enough to include family, community, animals, art, nature, and spiritual life. Intuition, creativity, and communication support natural gifts for teaching, guidance, management, and any work in which people need to feel understood.\n\nBecause giving comes so readily, your own needs may become difficult to hear. You can continue sustaining a person or situation after its season has ended, or carry emotional weight that was never yours to resolve. The Queen’s wisdom is not endless availability but discerning love: knowing what to nurture, what to release, and when to receive. When care flows inward as freely as it flows outward, your generosity becomes renewable rather than sacrificial.',
    strengths:['Vast and genuine capacity for unconditional love','Naturally gifted in the arts and creative expression','Emotionally steady and sustaining in relationships','Devoted, consistent, and deeply caring'],
    challenges:['Neglecting self-care in service of others','Attempting to sustain relationships that have run their course','Taking on emotional weight that belongs to someone else'] },
  { rank:'K',  suit:'hearts',   sym:'♥', name:'King of Hearts',   dates:'Jul 28, Aug 26, Sep 24, Oct 22, Nov 20, Dec 18',
    teaser:'The master of love, ruling by warmth rather than force and most himself when his actions bless the people around him. Watch for the quiet pile of disappointment that gathers when others fall short of you, because left alone it hardens into the very distance you stand against.',
    kws:['Wisdom','Mastery','Authority','Love'],
    personality:'The King of Hearts represents mature authority in the realm of feeling. Emotional wisdom and practical intelligence meet in a leadership style that relies on warmth rather than force. Others often trust your counsel because your authority does not need constant announcement; you are at your best when teaching, guiding, creating, or making decisions that allow other people to flourish.\n\nThe deeper test lies in disappointment. When others fail to meet your standards, hurt can accumulate silently and harden into guardedness, distance, or an attempt to control what love will not guarantee. True mastery does not require invulnerability. By naming what you feel, allowing others their limitations, and remaining open without abandoning discernment, you become the safe harbour this card promises: strong enough to protect, gentle enough to forgive, and secure enough to let love remain free.',
    strengths:['Emotionally wise and naturally authoritative','Gifted teacher, leader, or counsellor','Intellectually sharp with deep intuitive read of people','Loyal, principled, and magnetically trustworthy'],
    challenges:['Disappointment in others leading to emotional guardedness','Difficulty showing genuine vulnerability','Setting expectations that become impossible standards'] },

  // CLUBS
  { rank:'A',  suit:'clubs',    sym:'♣', name:'Ace of Clubs',     dates:'Dec 17',
    teaser:'The brightest, most restless mind in the deck, a pioneer in thought driven by a hunger to know that never quite switches off. You were the child who asked why ten thousand times, and the work of a lifetime is grounding all that brilliance in real human connection.',
    kws:['Knowledge','Curiosity','Independence','Pioneering'],
    personality:'The Ace of Clubs brings the first impulse of desire into the realm of the mind. Curiosity is a driving force: you want to know, understand, question, and discover for yourself. Quick-witted and multi-talented, you are often at your best when developing a new idea or finding an original approach to an old problem. Beneath the intellectual independence is a sincere wish to improve the world and leave something useful behind.\n\nA mind this hungry can race beyond practical details, sustained commitment, or the needs of the people nearby. Independence may become self-absorption, while too many interests can divide energy before any one of them reaches completion. Your development lies in choosing what deserves your attention and grounding thought in real human connection. The Ace of Clubs is a semi-fixed card and the Spiritual Twin of the Two of Hearts.',
    strengths:['Brilliant, wide-ranging mind with genuine pioneering instincts','Natural ability to inspire confidence and curiosity in others','Multi-talented across many creative and intellectual fields','Driven by authentic desire to understand and improve the world around them'],
    challenges:['Tendency to neglect practical or financial details in pursuit of ideas','Independence that can shade into self-absorption','Scattering energy across too many interests without completion'] },
  { rank:'2',  suit:'clubs',    sym:'♣', name:'Two of Clubs',     dates:'Dec 16',
    teaser:'A natural diplomat living in the space between minds, happiest one to one and quietly brilliant at building bridges between people who disagree. Seeing every side so clearly has a cost, the indecision and avoidance that can quietly stand in for an honest hard truth.',
    kws:['Communication','Partnership','Diplomacy','Duality'],
    personality:'The Two of Clubs lives in the meeting place between ideas and people. Clever, articulate, and naturally diplomatic, you relate especially well one-to-one and often help different minds find common ground. Conversation stimulates you, partnership strengthens your thinking, and a finely tuned imagination produces ideas you genuinely enjoy sharing. Even debate can be a form of connection: a way to test a thought and discover what another person sees.\n\nThe ability to understand several perspectives can make resolution difficult. Diplomacy may postpone a necessary truth, mental sparring can become defensiveness, and constant exchange may leave too little quiet in which to hear your own mind. You need both intelligent companionship and genuine privacy. When cooperation is balanced by inner steadiness, your gift becomes more than agreeable communication: you create the trust in which two people can think more clearly together.',
    strengths:['Natural communicator and skilled diplomatic thinker','Able to hold and synthesise multiple perspectives at once','Warm, cooperative, and intellectually generous','Gifted at building bridges between opposing minds'],
    challenges:['Indecision from seeing every side with equal clarity','Avoiding necessary confrontation in the name of harmony','Mental restlessness when not anchored to a clear purpose'] },
  { rank:'3',  suit:'clubs',    sym:'♣', name:'Three of Clubs',   dates:'Dec 15',
    teaser:'The Writer\'s Card, a prolific mind that turns feeling into words and ideas faster than it can ever finish them. All that indecision you feel is really creative energy looking for somewhere to land.',
    kws:['Creativity','Expression','Ideas','Versatility'],
    personality:'Known as the Writer\'s Card, the Three of Clubs carries a prolific, inventive mind with an unusual ability to turn ideas into words, art, or communication. You notice meaning where others overlook it and can approach the same subject from several illuminating angles. Versatility is a genuine gift, as is the generosity with which you share what you discover.\n\nThe abundance of mental possibility can scatter your effort across too many projects or keep you circling among equally appealing choices. Inspired beginnings then accumulate without the satisfaction of form or completion. Indecision is often creative energy waiting for a worthy direction rather than evidence that no direction exists. When you learn to govern attention and remain with what you love, expression becomes more than possibility: it becomes a body of work.',
    strengths:['Prolific creative thinker with a gift for expression','Natural ability to find and create value in new ways','Versatile and effective across many fields','Warm, engaging, and genuinely inspiring to others'],
    challenges:['Creative energy scattered across too many unfinished projects','Mental worry and chronic indecision','Risk of generating value for others while neglecting their own direction'] },
  { rank:'4',  suit:'clubs',    sym:'♣', name:'Four of Clubs',    dates:'Dec 14',
    teaser:'Mental structure made into a gift, the natural teacher whose counsel others trust because it has been earned. Two things test you: certainty that hardens into stubbornness, and a streak of self-doubt that can quietly become your worst enemy.',
    kws:['Knowledge','Stability','Teaching','Reliability'],
    personality:'The Four of Clubs builds dependable structures of knowledge. Detailed, thoughtful, and persistent, you can organise information, master a subject, and explain it in a way others can trust. Sound judgment and sharp intuition support natural gifts for teaching, writing, communication, and any work that rewards a well-ordered mind. Your counsel carries weight because it is considered rather than improvised.\n\nThe same structure that makes thought reliable can become rigid. Certainty may harden into stubbornness, while an unexpected current of self-doubt can make you defend a position more strongly than necessary. Your foundation grows stronger, not weaker, when it can admit new evidence and revise itself. By trusting what you have earned while remaining open to what you have not yet learned, you become a builder of knowledge sturdy enough to evolve.',
    strengths:['Deeply reliable and practically intelligent','Natural teacher with well-organised, grounded knowledge','Persevering and methodical in all intellectual pursuits','Instinctive sense of the right course of action'],
    challenges:['Intellectual rigidity and resistance to perspectives outside their own','Overcritical of those who think differently','Can become fixed in established ways of knowing long past their usefulness'] },
  { rank:'5',  suit:'clubs',    sym:'♣', name:'Five of Clubs',    dates:'Dec 13',
    teaser:'The Adventurer, a born explorer of ideas and places who is never quite satisfied with what is already known. The catch is depth, because a mind always moving on to the next thing rarely tastes the reward of staying.',
    kws:['Curiosity','Change','Adventure','Restlessness'],
    personality:'The Five of Clubs is the Adventurer of the mind, drawn toward new ideas, places, people, and perspectives. Warm, playful, and mentally quick, you learn by moving through experience and rarely remain satisfied with the limits of what you already know. Variety keeps intelligence alive, and your ability to adapt can open fortunate doors in communication, travel, enterprise, and social life.\n\nA mind always reaching for the next discovery may leave before the present one reveals its depth. Speed can outrun reflection, enthusiasm can scatter into unfinished plans, and freedom can become an answer to boredom rather than a chosen direction. The secret is not to suppress movement but to give it continuity. When you slow down enough to think and follow through on the ideas that matter, experience gathers into knowledge instead of passing novelty.',
    strengths:['Insatiably curious and highly adaptable thinker','Thrives on intellectual variety and new horizons','Quick-witted, engaging, and energising communicator','Natural adventurer across both ideas and the physical world'],
    challenges:['Difficulty sustaining focus or long-term commitment','Restlessness that undermines consistency in work and relationships','Can mistake constant motion and novelty for genuine progress'] },
  { rank:'6',  suit:'clubs',    sym:'♣', name:'Six of Clubs',     dates:'Dec 12',
    teaser:'The Messenger, carrying a karmic responsibility in how truth is spoken and a powerful instinct for honest words. Many born here quietly fear their own gifts, and the worry and restlessness that follow are simply the price of that avoidance.',
    kws:['Intuition','Responsibility','Communication','Karma'],
    personality:'Known as the Messenger, the Six of Clubs carries an intuitive intelligence and a particular responsibility for the spoken and written word. You are sensitive to truth, often artistically gifted, and capable of giving language to ideas other people sense but cannot yet express. Once a principle or practice feels genuinely sound, commitment to it can unite spiritual purpose with practical success.\n\nThe responsibility of knowing asks for action. Doubt about intuition may turn into worry, procrastination, or restless searching for one more piece of proof, while unused insight becomes a burden rather than a gift. Your words matter, so honesty must include what you say, what you withhold, and whether your actions support either. A disciplined practice gives the mind a channel; when knowledge is lived and shared carefully, the Messenger fulfils the promise of the card.',
    strengths:['Powerful and often psychic intuition','Deeply attuned to truth in speech and communication','Principled, reliable, and innately trustworthy','Strong natural sense of justice and responsibility'],
    challenges:['Fear of or resistance to their own psychic abilities','Chronic restlessness when avoiding their core mission','Karmic patterns connected to the misuse of power or words'] },
  { rank:'7',  suit:'clubs',    sym:'♣', name:'Seven of Clubs',   dates:'Dec 11',
    teaser:'One of the most intellectually gifted minds in the deck, sharpest where cool analysis meets genuine intuition. The same discernment can curdle into chronic worry and a demand for proof that blocks the very knowing that is your gift.',
    kws:['Analysis','Intuition','Spiritual inquiry','Perfectionism'],
    personality:'The Seven of Clubs refines the mind through inquiry, intuition, and the search for truth. Intellectually gifted and alert to what could make the world better, you can unite analytical skill with a subtler way of knowing. Charm, kindness, and enthusiasm help you share ideas widely, organise people around them, and inspire movement rather than merely winning an argument.\n\nDiscernment can become chronic doubt when nothing feels sufficiently proven. Worry, scepticism, or fear of being mistaken may close the very intuitive channel that distinguishes your intelligence. Faith here does not mean abandoning reason; it means allowing reason and inner perception to test and strengthen one another. When integrity matters more than certainty, your mind stops defending itself against mystery and becomes a trustworthy instrument for discovering it.',
    strengths:['Brilliant analytical mind with genuine creative originality','Highly intuitive and spiritually perceptive','Keenly aware of both human nature and broader social need','Natural ability to take ideas and bring them into the world'],
    challenges:['Chronic mental worry and inner tension','Demand for logical proof that blocks intuitive knowing','Tendency toward agnosticism or scepticism as a form of self-protection'] },
  { rank:'8',  suit:'clubs',    sym:'♣', name:'Eight of Clubs',   dates:'Dec 10',
    teaser:'Mental power and material mastery converging in one of the most fortunate cards in the deck, able to aim the mind at a goal and simply arrive. Undirected, that same force turns domineering and closed; its richest rewards come when it stays open and works alongside others.',
    kws:['Mental power','Success','Focus','Psychic strength'],
    personality:'The Eight of Clubs concentrates mental power. Clear, psychologically perceptive, and capable of sustained focus, you can direct thought toward a goal with unusual force and bring substantial results into being. Sensitivity to environment is part of the gift, which is why beauty, harmony, and intelligent company can materially affect your wellbeing and your work.\n\nUndirected power can become domination, inflexibility, or certainty closed to every outside view. The richer expression is not solitary control but focused partnership: remaining receptive while giving your will a constructive purpose. When strength is used to develop and share knowledge, success becomes stewardship rather than possession. The Eight of Clubs is a fixed card in the Life Spread and a member of the Mystical Family of Seven.',
    strengths:['Extraordinary mental focus and clarity of intention','Naturally gifted at manifestation and achieving success','Psychic sensitivity combined with psychological depth','Highly capable and effective in virtually any field chosen'],
    challenges:['Rigidity in mental structures and deeply fixed ideas','Stubbornness in relationships when challenged intellectually','The intensity of this mind can be overwhelming to others'] },
  { rank:'9',  suit:'clubs',    sym:'♣', name:'Nine of Clubs',    dates:'Dec 9',
    teaser:'Universal wisdom and the close of the mental cycle, where every ending quietly opens onto something new. The great work is learning when to let go, of old beliefs, familiar patterns, and the need to always have the answer.',
    kws:['Completion','Wisdom','Letting go','Universal mind'],
    personality:'The Nine of Clubs gathers a wide range of knowledge at the completion of the mental cycle. Thought is expansive, creative, and continually renewed by revelation; you may spend a lifetime learning across many fields and finding connections among them. The deeper calling is to share what you know in service of others, allowing personal intelligence to contribute to a broader understanding.\n\nCompletion requires release. Familiar theories, intellectual identities, and the need to possess the answer can outlive their usefulness, while pleasure or over-indulgence may distract from the responsibility carried by such a capable mind. Letting go is not the loss of knowledge but the clearing that makes new perception possible. When wisdom remains generous and revisable, every ending becomes the beginning of a larger way of seeing.',
    strengths:['Broad intellectual range and genuine, hard-won wisdom','Naturally drawn to education and the service of knowledge','Generous and inspiring in sharing insight and experience','Philosophical mind that grasps the largest possible picture'],
    challenges:['Difficulty releasing mental patterns that have run their course','Chaos or instability when out of alignment with their path','Tendency to connect with people or ideas that no longer serve growth'] },
  { rank:'10', suit:'clubs',    sym:'♣', name:'Ten of Clubs',     dates:'Dec 8',
    teaser:'The first of the Crown line and one of the most powerful minds in the deck, able to work circles around almost anyone. The danger is that when talent comes this easily it can be coasted on, and the full measure of what you could do goes unmet.',
    kws:['Achievement','Leadership','Discipline','Mental power'],
    personality:'The Ten of Clubs carries mental accomplishment into the Crown line. Independent, energetic, and intellectually powerful, you can teach, heal, lead, or complete demanding work with remarkable force. Family and community often benefit from your dependability, while an active mind gives you the capacity to outwork expectations and make a substantial contribution in your chosen field.\n\nSo much mental drive can make rest difficult and control tempting. Career may feel more straightforward than relationship, where another person cannot be organised like a problem or project. Abundant ability also creates the danger of relying on talent without developing the discipline that turns it into mastery. Practices that quiet the mind are practical necessities, not luxuries. When ambition, relationship, and inner stillness are given their rightful places, accomplishment becomes complete rather than merely impressive.',
    strengths:['Exceptional intellectual potential and breadth of capability','Natural leader and authority in their chosen field','Generous and inspiring in sharing knowledge','Capable of achieving genuine world-class mastery'],
    challenges:['Self-discipline challenges that arise from things coming too easily','Can exceed traditional structures in ways that create isolation','Must learn to work within the limits of emotional connection, not above it'] },
  { rank:'J',  suit:'clubs',    sym:'♣', name:'Jack of Clubs',    dates:'Dec 7',
    teaser:'The mental magician of the deck: a quick, inventive mind that turns curiosity into ideas, and ideas into something other people can use. The gift is real, but it needs focus and follow-through to become more than a dazzling beginning.',
    kws:['Wit','Curiosity','Creative mind','Mental discipline'],
    personality:'The Jack of Clubs is the deck\'s perpetual student: quick-witted, curious, creative, and alert to what could be improved. Ideas, language, systems, and puzzles naturally engage you, and you can find the pattern inside something complex before returning it in a form other people understand. The messenger, inventor, teacher, and mental magician all live in this card’s capacity to make knowledge useful, memorable, or transformative.\n\nYour mind may move faster than the room and faster than your own patience. Attention can scatter, cleverness can become a shield, and commitment may weaken once discovery gives way to repetition. Brilliance becomes wisdom when you choose one worthy idea and remain long enough for it to acquire substance. The Jack earns the crown by discovering that discipline does not imprison originality; it gives originality a life beyond the first spark.',
    strengths:['Quick, inventive, and naturally engaging mind','Gift for explaining complex ideas with clarity and originality','Sees possibilities and connections other people overlook','Playful independence and courage to think differently'],
    challenges:['Scattering energy across too many ideas or beginnings','Using humour, debate, or cleverness to avoid emotional depth','Must learn to value sustained commitment as much as discovery'] },
  { rank:'Q',  suit:'clubs',    sym:'♣', name:'Queen of Clubs',   dates:'Dec 6',
    teaser:'The administrator of knowledge, pairing genuine intellectual mastery with a rare spiritual sensitivity, gifted less at knowing than at passing what she knows to others. Stretched too thin, that strong will can tip into stress and drama, so a solid inner base is what keeps her balanced.',
    kws:['Intuition','Knowledge','Wisdom','Balance'],
    personality:'The Queen of Clubs is the administrator of knowledge, joining intellectual mastery with rare intuitive sensitivity. Your real talent is not merely knowing but transmitting: teaching, counselling, organising, or guiding others toward truth with warmth and precision. A brilliant mind and gracious manner can carry you far, especially when your work allows intuition and disciplined understanding to support one another.\n\nPride naturally accompanies strong ability, but the need to prove that ability can lead to over-extension, stress, or a will that becomes dramatic when certainty falters. You do not need to carry every question or every person’s confusion. Honest self-expression, clear boundaries, and a sound inner practice keep receptivity from becoming overload. The Queen’s authority is already present; it grows most convincing when it no longer has to announce itself.',
    strengths:['Exceptional intuitive intelligence and mental clarity','Natural counsellor, teacher, and guide','Balances intellectual rigour with genuine spiritual openness','Nurturing and generous in the sharing of knowledge and insight'],
    challenges:['Can carry the mental and emotional weight of others as her own','Sacrifice patterns that need to be managed consciously','Difficulty maintaining clear boundaries around energy and time'] },
  { rank:'K',  suit:'clubs',    sym:'♣', name:'King of Clubs',    dates:'Dec 5',
    teaser:'This King rules by what he knows, a specialist and authority who rarely bends to anyone else\'s doctrine. The crown he wears is authenticity, and keeping it asks for constant self-transformation, the willingness to question and rebuild himself again and again.',
    kws:['Mental mastery','Authority','Wisdom','Self-transformation'],
    personality:'The King of Clubs rules through knowledge. A specialist, thinker, and natural authority, you can master a field and communicate what you understand with clarity and presence. Independent judgment keeps you from being bound too easily by another person’s doctrine, while grace and humour make intellectual authority more accessible to those around you.\n\nMastery is not the end of questioning. Knowledge can harden into dogma, debate into dominance, and a well-earned reputation into resistance to ideas that disturb it. The inner work of this King is continual self-transformation: releasing what has become incomplete, listening without surrendering discernment, and rebuilding understanding when truth demands it. Your crown rests not on always being right, but on remaining capable of learning at the height of authority.',
    strengths:['Mastery-level intellectual authority in their chosen field','Natural leader and specialist who earns deep, lasting respect','Driven by ideas, knowledge, and the ongoing pursuit of growth','Excellent at building powerful and purposeful professional networks'],
    challenges:['Argumentativeness or mental rigidity when their authority is challenged','Spiritually minded but can be practically demanding and exacting','True growth requires releasing as much as acquiring, a hard lesson for a King'] },

  // DIAMONDS
  { rank:'A',  suit:'diamonds', sym:'♦', name:'Ace of Diamonds',  dates:'',
    teaser:'Imagination put straight into action, a visionary and natural pioneer in the making of value. The lifelong tension sits between the drive to achieve and the longing for real love, because fierce independence can quietly crowd out the very intimacy you want.',
    kws:['Ambition','Independence','Value','Pioneering'],
    personality:'The Ace of Diamonds brings desire into the realm of value and material possibility. Imaginative, resourceful, and naturally enterprising, you can recognise opportunity and give practical form to an idea before others see what it might become. Ambition is joined by charm, perceptiveness, and a wish to improve the quality of life, making commerce, invention, travel, and creative enterprise natural fields of expression.\n\nThe desire to achieve can become so compelling that it eclipses the connection achievement was meant to support. Fierce independence may complicate intimacy, while the pursuit of the next valuable thing can obscure what is already worthwhile. Your development lies in defining value broadly enough to include love, time, integrity, and inner freedom. When ambition serves those values, material success and genuine relationship no longer have to compete.',
    strengths:['Brilliant, resourceful, and naturally entrepreneurial','Powerful charm and rare ability to inspire confidence in others','Quick mind with an innate instinct for where value lies','Pioneer energy that drives genuine originality and innovation'],
    challenges:['Independence that can shade into isolation or avoidance of real intimacy','Love and personal life can suffer in the relentless pursuit of achievement','Fear of negotiation or compromise must be overcome to fully thrive'] },
  { rank:'2',  suit:'diamonds', sym:'♦', name:'Two of Diamonds',  dates:'',
    teaser:'Where logic meets intuition, a natural negotiator who builds arrangements that genuinely work for everyone involved. The shadow is bringing that same transactional eye home, into relationships where worth was never meant to be measured.',
    kws:['Partnership','Values','Balance','Negotiation'],
    personality:'The Two of Diamonds brings partnership into the world of value and exchange. Logic and intuition work well together, supporting a natural ability to negotiate, organise, and create arrangements that benefit everyone involved. You are often happiest when productive and may possess an instinctive feeling for business, money, timing, and the practical relationships through which an idea becomes viable.\n\nA transactional intelligence useful in enterprise does not translate perfectly into intimate life. Care, loyalty, and human worth cannot always be measured, balanced, or justified like the terms of a bargain. Partnership becomes deepest when cooperation is not dependent upon usefulness alone. By trusting intuition while keeping agreements clear, you can build exchanges that are both materially sound and genuinely humane.',
    strengths:['Natural negotiator and skilled architect of strong partnerships','Deeply attuned to the value of people, agreements, and situations','Cooperative and strategically thoughtful','Exceptional ability to find common ground and create mutual benefit'],
    challenges:['Unconsciously measuring relationships in terms of return or fairness','Indecision when two paths appear equally valuable','Fear of being undervalued or taken advantage of in agreements'] },
  { rank:'3',  suit:'diamonds', sym:'♦', name:'Three of Diamonds', dates:'',
    teaser:'A colourful, inventive mind that finds worth in the places other people overlook and refuses to be like everyone else. The familiar pull between freedom and security can spin into worry-driven circles until that restless creativity finally gets a channel.',
    kws:['Creativity','Versatility','Expression','Uncertainty'],
    personality:'The Three of Diamonds creates value through imagination. Bright, inventive, artistic, and drawn toward the unusual, you can recognise worth in neglected places and find original ways to express it. The mind needs stimulation and freedom, while a colourful individual style resists being reduced to convention. This is a genuine gift for creative enterprise, communication, design, and work that turns perception into something tangible.\n\nFreedom and security can pull in different directions, producing worry or indecision when several possibilities seem equally alive. Creativity left unapplied may dissolve into confusion, while fear of limitation can prevent the sustained commitment that gives an idea real value. Love is often where this lesson becomes most personal. When you choose without abandoning your originality, discipline becomes the ground on which freedom can build.',
    strengths:['Bright, inventive, and creatively original mind','Natural talent for finding, making, and promoting value','Versatile and effective across many fields and ventures','Expressive, socially engaging, and genuinely inspiring'],
    challenges:['Uncertainty and restlessness as a recurring life pattern','Difficulty committing to one path or project long enough to master it','Can move between ventures, jobs, or relationships before depth is fully reached'] },
  { rank:'4',  suit:'diamonds', sym:'♦', name:'Four of Diamonds', dates:'',
    teaser:'One of the most financially grounded cards in the deck, a steady builder of lasting value and the dependable backbone of any enterprise. The paradox is the restlessness hidden inside all that stability, and the rigidity that can quietly close you off from the growth only change brings.',
    kws:['Security','Stability','Material foundation','Discipline'],
    personality:'The Four of Diamonds builds lasting value. Financially grounded, diligent, and practical, you often become the dependable backbone of an enterprise or household. Work brings genuine satisfaction when it produces something stable, useful, and aligned with your standards. Integrity is central: you want what is built to deserve the confidence placed in it.\n\nAn inner restlessness can exist beneath the composed exterior, surfacing as insecurity or doubt about choices already made. The wish to protect hard-earned stability may then become stubbornness, closing the structure against the change it needs to remain alive. True security is not immobility but a foundation capable of supporting growth. When values remain firm and methods remain flexible, your careful effort produces abundance that can endure.',
    strengths:['Exceptional capacity for building lasting financial security','Detailed, organised, and practically gifted in material matters','Deeply reliable in commitments, agreements, and partnerships','Intellectually motivated with a continuously evolving career'],
    challenges:['Rigidity or stubbornness in financial and material thinking','Can become so focused on security that joy and flexibility are squeezed out','Physical and psychological self-development requires sustained, deliberate effort'] },
  { rank:'5',  suit:'diamonds', sym:'♦', name:'Five of Diamonds', dates:'',
    teaser:'A seeker of truth and one of the most adaptable cards in the deck, turning setbacks into stepping stones through sheer trial and error. The risk is spending all that energy forever moving on, rather than building something that lasts.',
    kws:['Change','Resourcefulness','Values','Freedom'],
    personality:'The Five of Diamonds searches for value through change and experience. Resourceful, adaptable, and guided by strong intuition, you learn through trial and error and can turn setbacks into useful openings. People often trust your enthusiasm because it is most persuasive when attached to something you genuinely believe in. Travel, enterprise, sales, and changing fields of interest can all become ways of discovering what matters.\n\nConstant movement can unsettle resources, work, and relationship before any of them have time to deepen. The freedom to explore loses meaning when every discomfort becomes a reason to leave. Your task is not to become fixed, but to carry a stable measure of value through changing conditions. With deliberate grounding, versatility becomes resilience and experience accumulates into something that lasts.',
    strengths:['Highly resourceful and skilled at improving difficult situations','Adapts quickly and thrives when problem-solving is required','Practically useful, energetic, and committed in their work','Natural ability to reach and communicate with many different people'],
    challenges:['Instability in finances or material resources as a recurring life pattern','Difficulty settling on one path of value long enough to reach mastery','Must consciously shed unhealthy patterns rather than simply moving on from them'] },
  { rank:'6',  suit:'diamonds', sym:'♦', name:'Six of Diamonds',  dates:'',
    teaser:'A card of karmic return, where abundance arrives in exact proportion to what you put in and nothing here is ever passive. The lesson hiding inside the effort is a quiet one: knowing when enough is truly enough.',
    kws:['Karma','Intuition','Fulfilment','Sustained effort'],
    personality:'The Six of Diamonds concerns responsibility, exchange, and the return created by sustained effort. Intelligent and intuitive, you can understand both practical accounts and the less visible balance operating between people. Financial responsibility, counselling, athletics, or any field linking discipline with measurable results may draw out your gifts. There is often real contentment in using what life provides well.\n\nSuccess here is not passive. Strong will must be balanced by flexibility, and a desire to settle every account can become exhausting when applied without proportion. The deeper karmic lesson is not simply to earn what you receive, but to recognise when an exchange is fair and when enough has truly been reached. In harmonious surroundings, responsibility becomes steady abundance rather than an endless debt to the future.',
    strengths:['Powerful intuition, often bordering on the psychic','Exceptional counselling wisdom and practical insight','Deeply attuned to the art of finding fulfilment in the present','Steady, sustained success built through genuine dedicated effort'],
    challenges:['Success demands constant energy and cannot be taken for granted','Reaching for more than this card\'s natural harvest leads to discontentment','Karmic lessons around knowing when enough is truly enough'] },
  { rank:'7',  suit:'diamonds', sym:'♦', name:'Seven of Diamonds', dates:'',
    teaser:'The millionaire\'s card, the meeting of spirit and matter, where money becomes the very place you learn faith and trust. It asks for a narrow, single-pointed focus and the willingness to release the values and relationships that have outlived their use.',
    kws:['Discernment','Self-development','Focus','Transformation'],
    personality:'Known as the Millionaire’s Card, the Seven of Diamonds tests the relationship between spirit and matter. Creative, nurturing, and protective of those you love, you can manifest substantial results when imagination is given practical form. Money becomes a field in which faith, trust, and the meaning of security are examined more deeply than the size of any account.\n\nWorry eases when focus replaces divided effort and value is no longer confused with possession. Self-sacrifice, outdated skills, inherited beliefs, or relationships that have completed their purpose may all need to be released to clear the way forward. Receiving is as important as giving. The Seven of Diamonds is a semi-fixed card and the Spiritual Twin of the Nine of Hearts; its richest promise emerges when material success expresses inner value rather than attempting to prove it.',
    strengths:['Extraordinary potential for material and financial achievement','Deeply self-directed and capable of sustained single-pointed focus','Tough, resilient, and forged by the challenges that define them','Highly discerning about what is truly worth their time and energy'],
    challenges:['Must be willing to release anything no longer aligned with their vision','Scattered focus produces very little; the path to success is a narrow one','Constant change in career and business is a feature, not a flaw, of this card'] },
  { rank:'8',  suit:'diamonds', sym:'♦', name:'Eight of Diamonds', dates:'',
    teaser:'The Sun Card, genuine material power and a mind that draws money in with surprising ease, best of all when it answers to no boss but itself. Beneath the steel runs real care for others, shadowed by a mistrust of intimacy that quietly argues with the heart\'s own longing.',
    kws:['Power','Material mastery','Organisation','Responsibility'],
    personality:'Sometimes called the Sun Card, the Eight of Diamonds carries genuine material power. You can manage, organise, and govern resources with unusual focus, combining creative intelligence with a practical instinct for how value is produced. Respect often follows the strength of your work, and independence may suit you better than environments that leave no room for your judgment.\n\nBeneath a capable exterior is a strong concern for fairness and a more private longing for trust. Power can become stubbornness or domination when expectations of others rise beyond what relationship can bear, while mistrust of intimacy may contradict the heart’s wish to be known. The mature Eight treats authority as stewardship. When strength protects rather than controls, prosperity becomes a resource that supports both achievement and human connection.',
    strengths:['Exceptional organisational ability and material mastery','Strong sense of fairness, trustworthiness, and practical responsibility','Deep inner drive to protect and empower others','High capacity to manifest and build lasting material success'],
    challenges:['Deep mistrust of intimate relationships as a lifelong undercurrent','Can become domineering when the power instinct is not consciously tempered','Must develop self-worth that is genuinely independent of financial standing'] },
  { rank:'9',  suit:'diamonds', sym:'♦', name:'Nine of Diamonds', dates:'',
    teaser:'The one who gives, among the most generous cards in the deck, called to champion the underdog and bring people together around their gifts. Its whole lesson is release, because money flows most freely through you when it is something to pass on rather than to hold.',
    kws:['Completion','Generosity','Philanthropy','Release'],
    personality:'The Nine of Diamonds is the giver at the completion of the material cycle. Generous, communicative, and broad in outlook, you can bring people together and help their separate gifts serve a shared purpose. Intelligence and discernment reveal what is genuinely worthwhile, while sympathy for the overlooked may draw you toward philanthropy, advocacy, education, or service.\n\nThe central lesson is release from attachment to material wealth. Resources tend to move most meaningfully through you when they are understood as instruments rather than proof of identity or security. Giving does not require carelessness, nor does service require self-erasure; discernment must decide where value can do the greatest good. When the hand opens consciously, endings become redistribution and abundance discovers its purpose.',
    strengths:['Genuinely generous, open-hearted, and naturally philanthropic','Powerful manifesting ability when backed by real self-worth','Deep intuitive and psychic attunement to truth in situations','Natural orator with an engaging, warm, and often humorous presence'],
    challenges:['Resentment when power or recognition feels withheld or unearned','Spendthrift tendencies when the card\'s shadow side is expressed','Must release attachment to material outcomes in order to fully receive them'] },
  { rank:'10', suit:'diamonds', sym:'♦', name:'Ten of Diamonds',  dates:'',
    teaser:'A card of fortunate blessings that holds the entire Diamond suit, optimistic and sure of its own worth even down to the last dollar. The secret is almost too simple: work hard for what you want, and be grateful for what you already have.',
    kws:['Abundance','Self-worth','Optimism','Responsibility'],
    personality:'The Ten of Diamonds gathers the full material range of the suit into accomplishment. Optimistic, active, and supported by a strong sense of personal worth, you can regenerate resources even after a setback and inspire confidence in the people with whom you work. Public-facing enterprise often suits you, especially when focused effort can turn a substantial vision into visible results.\n\nFortunate momentum still requires grounded stewardship. Activity can become relentless, optimism can overlook detail, and success can create obligations as quickly as it creates freedom. The simple discipline is to work for what you value, remain grateful for what is already present, and manage expansion without losing proportion. When accomplishment rests on responsibility, prosperity becomes durable rather than merely impressive.',
    strengths:['Naturally optimistic with a strongly developed sense of self-worth','Broad capacity for achievement spanning the full range of material values','Understands deeply that real abundance has a price, and pays it willingly','Steady and sustained in engaging with financial responsibilities'],
    challenges:['Overoptimism or unrealistic self-assessment can create expensive blind spots','The weight of constant responsibility must be actively and consciously managed','Developing emotional connections alongside material ones is ongoing work'] },
  { rank:'J',  suit:'diamonds', sym:'♦', name:'Jack of Diamonds', dates:'',
    teaser:'The golden child of the suit, quick-witted and charming, with sharp financial instincts and a gift for persuasion that can manifest things at startling speed. The shadow is immaturity, the clever charm that turns unreliable, so the real work is pouring all that brilliance into genuine integrity.',
    kws:['Persuasion','Resourcefulness','Independence','Youthful values'],
    personality:'The Jack of Diamonds carries creative independence into the world of value. Quick-witted, persuasive, and highly intuitive, you may possess sharp financial instincts and an ability to make opportunities appear with remarkable speed. Exuberance and charm support enterprise, communication, counselling, or healing, while a private side periodically needs distance from the attention you can so easily attract.\n\nFreedom without character can become unreliability. Cleverness may seek the shortcut, promises may lose force once excitement passes, and persuasion can become manipulation when immediate gain matters more than trust. The Jack earns the crown by giving brilliance an ethical center. When commitment becomes as important as possibility, instinct matures into judgment and creative independence produces value others can safely believe in.',
    strengths:['Sharp financial instincts and a natural, disarming gift for persuasion','Exuberant, magnetic, and genuinely enjoyable to be around','Thrives on independence, self-direction, and entrepreneurial enterprise','Fast-moving mind with a real visionary streak and strong intuition'],
    challenges:['Immaturity, unreliability, or the breaking of promises','Can become absorbed in their own story to the point of self-deception','Life will periodically place deep challenges in the path to force true self-awareness'] },
  { rank:'Q',  suit:'diamonds', sym:'♦', name:'Queen of Diamonds', dates:'',
    teaser:'The cultivator of high value, determined and cultured, who knows exactly what she wants and earns it through sheer consistency. The path is genuinely hard, and her own high standards can turn critical and demanding if she lets them run unchecked.',
    kws:['Refinement','Excellence','Determination','Material mastery'],
    personality:'The Queen of Diamonds cultivates value with intelligence, perception, and endurance. Cultured, determined, and clear about what she wants, this card approaches its aims with a consistency that naturally earns authority. You can read people as readily as practical conditions, combining generosity and courage with an inventive ability to provide, organise, and build toward excellence.\n\nThe path may demand real resilience, and high standards can become criticism when difficulty narrows the field of view. Judgment is most useful when it distinguishes value without diminishing the person who has not yet realised it. You are not required to prove worth through strain alone. When discernment remains humane and ambition remains connected to purpose, the life built by your own hand becomes not only excellent but sustaining.',
    strengths:['Exceptional ability to identify, develop, and elevate genuine value','Determined, diligent, and strong of character under real pressure','Refined focus capable of producing world-class, lasting results','Earns deep and lasting respect through consistent effort and excellence'],
    challenges:['The path is genuinely demanding and rarely without serious obstacles','Risk of hardness or dominance when under prolonged pressure','Unrealistically high standards, when unchecked, breed chronic dissatisfaction'] },
  { rank:'K',  suit:'diamonds', sym:'♦', name:'King of Diamonds', dates:'',
    teaser:'Master of higher values, ruling money and manifestation through a rare blend of decisive action and real care for people over numbers. The old portrait shows him in profile with one eye hidden, a quiet warning about the one-sided thinking he has to work against.',
    kws:['Financial mastery','Leadership','Self-awareness','Wisdom'],
    personality:'The King of Diamonds masters value through decisive action, disciplined thought, and practical wisdom. A natural leader in business, commerce, or any field of manifestation, you understand how resources move and how a sound principle becomes a working structure. Warmth and fairness temper ambition at your best, keeping people ahead of numbers and making prosperity a form of responsible distribution.\n\nThe classic one-eyed profile offers the card’s warning: authority can become one-sided when confidence no longer turns to look again. Stubbornness, material certainty, or the company of success alone may narrow otherwise excellent judgment. Lasting dominion depends upon perspective, cooperation, and values strong enough to govern power. When mastery remains accountable to integrity, abundance becomes something you can command without being commanded by it.',
    strengths:['Phenomenally gifted in business, value creation, and material leadership','Leads with genuine fairness and a deep care for the people around them','Passionate about self-improvement and relentlessly committed to growth','Sociable, magnanimous, and genuinely inspiring in their presence'],
    challenges:['Psychological and health challenges that periodically force necessary inner work','Can feel profoundly stuck until the inward journey is honestly undertaken','Must eventually learn that material wealth, for all its beauty, cannot purchase true fulfilment'] },

  // SPADES
  { rank:'A',  suit:'spades',   sym:'♠', name:'Ace of Spades',    dates:'',
    teaser:'The Key to the Mystery of Life, pictured as the Magician and the most spiritually charged card in the whole deck, a soul that reinvents itself through hardship and comes back stronger each time. The lifelong tug is between the hunger for wisdom and the drive to succeed, and the secret is making room for the love the whole journey is actually for.',
    kws:['Transformation','Spirituality','Wisdom','Independence'],
    personality:'Called the Key to the Mystery of Life, the Ace of Spades brings desire to the path of transformation. Magnetic, intelligent, and unusually perceptive, you may reinvent yourself several times as experience strips away an identity that has become too small. Others can be drawn to you for guidance before you fully understand the source of what you know.\n\nA powerful tension runs between the wish for wisdom and the drive for worldly achievement. Either can become an escape from the other: spiritual ambition can avoid ordinary life, while material success can postpone the deeper questions pressing from within. Self-definition is important, but it must make room for love and relationship. When inner and outer mastery support one another, adversity becomes initiation rather than merely something survived.',
    strengths:['Deeply spiritual, psychic, and magnetically compelling to others','Extraordinary capacity for self-transformation and personal renewal','Courageous ability to look unflinchingly into the self','Remarkable precision in reading people and situations'],
    challenges:['Intense independence and drive for self-definition can come at the cost of loved ones','Must learn to balance ambition with genuine emotional availability','The path requires repeated, sometimes painful, shedding of identity'] },
  { rank:'2',  suit:'spades',   sym:'♠', name:'Two of Spades',    dates:'',
    teaser:'The friendship card, a soul building real self-sufficiency through honest connection and the discovery of its own strength. The truth it keeps proving, over and over, is that the finest resource you will ever meet is the one already inside you.',
    kws:['Partnership','Self-reliance','Inner strength','Health'],
    personality:'Known as the friendship card, the Two of Spades develops strength through companionship and shared work. Supportive, compassionate, and naturally inclined toward partnership, you can offer practical guidance and may grow into teaching or leadership along a spiritual path. Determination and passion are stronger than your manner always reveals, giving weight to the help you provide.\n\nWhen confidence falters, strength can collapse into fear, passivity, or shyness, and the need for support may obscure the resources already present within you. Partnership is not meant to substitute for self-reliance but to awaken it. The finest companion confirms rather than supplies your power. As inner steadiness grows, cooperation becomes a choice between capable equals and your guidance carries conviction without intimidation.',
    strengths:['Powerful capacity to develop genuine inner strength and self-sufficiency','Natural ability to attract the right partnerships and healing at the right time','Authentic, individualistic, and solid in their unique way of being','Real grit and resilience through life\'s most demanding passages'],
    challenges:['Can find themselves in difficult situations before recognising their own power to handle them','Partnership energy must be balanced with genuine personal independence','Learning not to outsource inner knowing to the opinions of others'] },
  { rank:'3',  suit:'spades',   sym:'♠', name:'Three of Spades',  dates:'',
    teaser:'The Artist card, a powerhouse of creative energy and warmth with an unexpected head for business underneath. The familiar shadow is indecision around work, the gift left unused in the safety of the status quo, until you finally believe in yourself.',
    kws:['Creativity','Expression','Indecision','Work'],
    personality:'Known as the Artist Card, the Three of Spades gives creative expression a powerful capacity for work. Talent, warmth, and magnetism are joined by a practical intelligence that can understand both art and enterprise. You may feel called to help others through what you make, and sustained effort can turn natural ability into visible, meaningful success.\n\nThe central difficulty is indecision about where that ability belongs. Several vocations may be possible, while the safety of the familiar can leave the most important gifts unused. Confidence cannot wait for certainty to arrive first; it develops through choosing, practising, and allowing the work to answer doubt. As self-respect grows, creative power becomes less dependent on approval and more capable of carrying love into form.',
    strengths:['Powerfully creative with genuine, broad artistic talent','Magnetic personality and instinctive desire to help','Warm, strong social presence that draws people in','Naturally aligned with strong mentors, particularly women in leadership'],
    challenges:['Work-related indecision as a recurring karmic theme','Risk of settling far below what these gifts actually deserve','Worry about reputation, gossip, and the opinions of others'] },
  { rank:'4',  suit:'spades',   sym:'♠', name:'Four of Spades',   dates:'',
    teaser:'The builder of the Spades suit, with a focus and willpower so unmatched you will often choose the harder road on purpose. The work is staying loose enough to play, letting worry and routine give way before they quietly turn into stagnation.',
    kws:['Stability','Discipline','Work ethic','Security'],
    personality:'The Four of Spades is the builder of the suit, combining focused will with exceptional endurance. Work matters deeply, especially when it produces something useful and allows independence of judgment. Reliable, intelligent, and intuitive, you can move through obstacles that stop others and often provide an equally dependable foundation for the people you love.\n\nStrength may become attached to the hardest route simply because difficulty proves endurance. Routine can crowd out play, worry can disguise itself as responsibility, and self-reliance can resist help that would improve the structure rather than weaken it. The mature Four remains flexible without abandoning discipline. When effort is guided by purpose instead of hardship alone, your formidable capacity for work builds a life sturdy enough to include adventure and rest.',
    strengths:['Exceptional work ethic and capacity for sustained, disciplined effort','Deeply reliable and genuinely organised in all that they undertake','Finds real satisfaction and pride in honest, thorough work','Natural builder of security, health, and enduring structure'],
    challenges:['Can become so anchored in routine that necessary change is resisted','Overcritical when others do not meet the same high standards of effort','Must ensure that the stability they build does not quietly become stagnation'] },
  { rank:'5',  suit:'spades',   sym:'♠', name:'Five of Spades',   dates:'',
    teaser:'Change itself, a card whose very presence tends to set it in motion, and one of the most driven self-improvement energies in the deck. The shadow is the intensity of all that restlessness, the constant moving, and learning to balance company with solitude.',
    kws:['Change','Progress','Self-improvement','Restlessness'],
    personality:'The Five of Spades is a catalyst for change. Intuitive, engaging, and motivated by experience, you can push beyond ordinary limits and reinvent the conditions around you as readily as yourself. Travel, adventure, new people, and demanding goals all feed self-awareness, while a strong instinct for improvement turns disruption into genuine progress.\n\nThe intensity of movement can make stillness feel empty and produce frequent changes of place, work, or relationship before experience has been integrated. Attention from others may be welcome and overwhelming in equal measure, creating a need to balance company with solitude. Accomplishment need not be the only measure of a life, but change becomes most valuable when it has a direction. Pausing long enough to understand what an experience changed within you keeps freedom from becoming flight.',
    strengths:['Extraordinary natural capacity for self-transformation at every level','Driven and deeply resourceful in the face of health and life challenges','Makes bold, decisive leaps in personal growth when the time is right','Converts negative energy and old habits into real, lasting strength'],
    challenges:['Restlessness producing frequent moves, career changes, or relationship transitions','The consolidation periods between leaps feel deeply uncomfortable','The intensity of this inner drive can be genuinely difficult for others to keep pace with'] },
  { rank:'6',  suit:'spades',   sym:'♠', name:'Six of Spades',    dates:'',
    teaser:'Often called the conscience of humanity, carrying one of the heaviest karmic legacies in the deck, with many born here sensing their lives are somehow fated. They are, but the power short-circuits into inertia whenever the will goes unsupported; align with something higher and act, and life turns genuinely magical.',
    kws:['Karma','Responsibility','Conscience','Adjustment'],
    personality:'Often called the conscience of humanity, the Six of Spades carries a profound sense of consequence and responsibility. Honesty, fairness, and kindness can make you a force for alignment between practical life and the principles you believe should govern it. There is substantial power here, and recognition often follows once you accept that power as something to be exercised rather than merely contemplated.\n\nThe card is also dreamy, and vision without action can settle into fantasy, procrastination, or inertia. When feeling is confused and will lacks support, unused energy turns inward and fate seems like something imposed from outside. Responsibility begins with the next concrete act. By placing imagination in service of disciplined work, you participate in the pattern you once felt bound by and allow higher ideals to become visible in ordinary life.',
    strengths:['Tremendous willpower, inner determination, and staying power','Deep karmic potential when responsibility is honestly embraced','Vision and conscience for aligning reality with higher principle','Highly creative and capable of extraordinary achievement when inspired'],
    challenges:['Indecision and confusion in matters of love as a persistent karmic challenge','Inertia when responsibilities feel overwhelming or in conflict with personal goals','Power can be short-circuited by superficiality, gossip, or avoidance of depth'] },
  { rank:'7',  suit:'spades',   sym:'♠', name:'Seven of Spades',  dates:'',
    teaser:'The card of the mystic and the artist, an old soul asked to build unshakeable faith through the repeated testing of the material world. Its trap is aiming that inner power at outward magnificence, when the real treasure has always lived within.',
    kws:['Wisdom','Faith','Spiritual testing','Self-mastery'],
    personality:'The Seven of Spades belongs to the mystic and the artist, developing faith through repeated encounters with material limitation. Highly intuitive and sensitive to atmosphere, you often understand human nature from behind the scenes rather than through display. Beauty, quiet, and serenity are essential forms of nourishment, while ingenuity can support meaningful work in art, healing, or metaphysical inquiry.\n\nInner power may be misdirected toward outward magnificence when invisible gifts feel insufficiently recognised. Material tests then appear to deny worth rather than reveal where faith is still dependent upon proof. The real treasure of this card cannot be taken away because it is a way of seeing. When you stop asking appearance to validate inner knowledge, difficulty becomes refinement and sensitivity becomes the strength to perceive beyond apparent limits.',
    strengths:['Profound accumulated wisdom and perceptive understanding of people','Exceptional memory, psychological acuity, and natural insight','Capable of genuine self-mastery when the inward journey is embraced','Natural psychologist, writer, or world traveller'],
    challenges:['Material discontent when life is lived beyond natural and sustainable means','Health and stress challenges tied to worry and frustrated ambition','Must redirect power inward, from the longing for magnificence to the finding of it'] },
  { rank:'8',  suit:'spades',   sym:'♠', name:'Eight of Spades',  dates:'',
    teaser:'Endurance in a single word, an intense, almost psychic force of will working from somewhere deep inside rather than out front. The whole task is giving that force a grounded direction, because the same will that moves mountains can, misdirected, turn against the self.',
    kws:['Willpower','Inner power','Transformation','Discipline'],
    personality:'Endurance is the signature of the Eight of Spades. Its power works from within as an intense force of will, determination, and the ability to follow a difficult course through to completion. Healing, medicine, business, technology, and demanding creative work can all benefit from your capacity to overcome adversity and concentrate effort where substantial results are required.\n\nThe same will that moves mountains can turn against the self when it has no constructive or spiritually grounded direction. Recognition may spur excellence, but the body cannot be treated as another obstacle to conquer indefinitely. Power includes the wisdom to guard health, receive support, and distinguish persistence from self-punishment. When endurance serves life rather than merely proving strength, it becomes one of the deck’s most dependable forms of mastery.',
    strengths:['Extraordinary inner willpower and depth of concentration','Natural overcomer of obstacles, adversity, and serious health challenges','Genuine capacity to heal and transform others through presence and will','Develops superb leadership ability under real, sustained pressure'],
    challenges:['Tendency toward a negative or fatalistic outlook that must be actively and consciously countered','Can feel profoundly stuck until the inner journey is honestly undertaken','The intensity of this card\'s power is a genuine responsibility, not merely a gift'] },
  { rank:'9',  suit:'spades',   sym:'♠', name:'Nine of Spades',   dates:'',
    teaser:'Spiritual liberation, one of the most magnetic and emotionally intense cards in the deck, of unlimited possibility for those who read their lives the right way. The shadow is the sheer depth of that intensity, and the path to freedom runs directly through it, never around.',
    kws:['Completion','Spiritual liberation','Service','Letting go'],
    personality:'The Nine of Spades carries the possibility of spiritual liberation. Intelligent, artistic, original, and often musically gifted, you can draw upon a depth of feeling and higher perception that gives unusual magnetism to your work. Leadership becomes most powerful when directed toward universal service, allowing personal experience to help others cross a threshold you have already faced.\n\nThe same intensity can interpret every ending as disappointment or every loss as a judgment on the self. Liberation asks for an impersonal perspective—not coldness, but enough spaciousness to let experience complete its work without becoming identity. Emotion must be passed through rather than escaped or enthroned. When you release what has finished and offer its wisdom forward, unlimited possibility emerges from the place where an older life ended.',
    strengths:['Tremendous personal magnetism and natural authority in any room','Genuine, deep calling toward service, leadership, and the healing of others','Capable of managing significant responsibilities and large-scale endeavours','Original, unconventional, and deeply spiritual approach to wisdom'],
    challenges:['Intense inner emotional conflicts and psychosomatic stress as recurring patterns','Flirtatious or restless in love, with difficulty sustaining genuine depth','Must learn to sublimate rather than suppress the emotional intensity that defines them'] },
  { rank:'10', suit:'spades',   sym:'♠', name:'Ten of Spades',    dates:'',
    teaser:'Success is the keyword, a card both deeply materialistic and highly spiritual, with the whole challenge living in the polarity between the two. The great secret runs against everything its drive believes: surrender, let yourself be nurtured, and the freedom hidden inside acceptance opens up.',
    kws:['Effort','Mastery','Self-love','Abundance'],
    personality:'Success is the keyword of the Ten of Spades, where material mastery and spiritual aspiration meet. Driven, intelligent, and capable of completing demanding goals, you can build substantial worldly achievement without abandoning the inward journey. Like-minded company strengthens you, and collaborative purpose often carries this card further than isolated ambition can.\n\nWork and love may compete when achievement feels more controllable than feeling. Too much weight on career can starve relationship, while isolation can diminish both wellbeing and perspective. The secret is surrender—not giving up the goal, but releasing the belief that strength must provide everything alone. By allowing yourself to feel, receive care, and be changed by connection, you discover the freedom that accomplishment by itself could never secure.',
    strengths:['Exceptional capacity for sustained, demanding work across every dimension of the self','Encompasses the full breadth of Spades wisdom within one lifetime','Developing profound self-love and the ability to feel at home in all of life','Can reach extraordinary levels of mastery through committed self-development'],
    challenges:['The weight of constant responsibility must be actively and consciously managed','Must guard against the inner critic turning the same high standards against the self','Learning to surrender to what the path truly asks, rather than resist it'] },
  { rank:'J',  suit:'spades',   sym:'♠', name:'Jack of Spades',   dates:'',
    teaser:'The Divine Trickster, the actor and the initiate, brimming with creative power not yet claimed and a path that is genuinely yours to choose. Genius and charisma are real here, but they are not yet wisdom, and wisdom is exactly what this card came to earn.',
    kws:['Creativity','Spiritual initiation','Rebellion','Self-discovery'],
    personality:'The Jack of Spades is the actor, trickster, and spiritual initiate: creative potential and mental power not yet fully claimed. Individualistic and endlessly capable of reinvention, you can use the mind to initiate almost anything. Enthusiasm becomes conviction quickly, and charisma allows you to inhabit roles, ideas, and possibilities that other people would hesitate to approach.\n\nThe path can rise toward the responsible authority of the King or turn toward the clever shortcut. Talent may impersonate mastery, performance may replace sincerity, and intelligence may justify what character has not earned. Genius and magnetism are real, but they are not yet wisdom. The Jack earns initiation by choosing integrity when evasion would be easier and giving extraordinary potential a purpose worthy of its power.',
    strengths:['Immense creative and mental power across a wide range of expression','Deeply individualistic with a genuine, ever-renewing capacity for self-discovery','Naturally resonant with the public and capable of real artistic or healing success','Innovative in finding new approaches to health, psychology, and self-knowledge'],
    challenges:['This card\'s power can lead to either the highest expression or the most self-destructive','Temptation toward clever shortcuts over genuine depth and earned wisdom','A solid, early-formed value system is essential to where these gifts ultimately land'] },
  { rank:'Q',  suit:'spades',   sym:'♠', name:'Queen of Spades',  dates:'',
    teaser:'Self-mastery is its very name, a quietly formidable card ambitious not for fame but to prove something real to herself, able to take in turmoil and come out wiser. The danger is forgetting the crown, pouring yourself into everyone else\'s needs while your own potential waits.',
    kws:['Ambition','Inner strength','Self-mastery','Resilience'],
    personality:'The Queen of Spades is devoted to self-mastery. Her ambition is less about display than the inward need to prove something real through experience. Intuitive, formidable, and capable of learning from immense turmoil, you can emerge from difficulty stronger and wiser, then use that earned perception to lead, heal, or bring a deeply held vision into form.\n\nThe danger is forgetting the crown: losing yourself in minor duties, tending everyone else’s needs, or allowing hardship to define the scale of what you attempt. Mental discipline and focus are essential, but they must rest upon self-love rather than relentless self-correction. Happiness depends on authentic growth. When you give your own potential the care so readily given to responsibility, strength becomes sovereignty rather than survival.',
    strengths:['Quietly formidable inner strength and genuine psychological resilience','Driven by self-mastery in the truest sense, not recognition or external validation','Emotionally mature and centred in ways that consistently surprise others','Able to take the most demanding experiences and convert them into lasting wisdom'],
    challenges:['The drive to grow stronger can be pushed so hard it forgets compassion for the self','Must ensure that building resilience doesn\'t mean building walls','Long-term commitments to people, practices, or spiritual paths are the true transformative agent'] },
  { rank:'K',  suit:'spades',   sym:'♠', name:'King of Spades',   dates:'',
    teaser:'Master of the deck and the highest card of all, ruling a single day of the year, one who has endured everything and built something unassailable from it. Its authority runs straight through the deepest limitations a life can hold, turning them, slowly and honestly, into a presence that needs no announcement.',
    kws:['Mastery','Authority','Wisdom','Responsibility'],
    personality:'Master of the deck, the King of Spades governs a single day of the year: January 1. Wisdom, authority, and self-mastery gather here in a person often asked to carry adult responsibility early. Independent and strong-willed, you may value freedom and new horizons over conventional arrangements. What others experience as reserve or secrecy is often the private concentration required to hold an unusual weight.\n\nThe path passes through physical, psychological, or existential limitations that cannot be bypassed by status or force. Slowly and honestly, those encounters can become an authority that needs no announcement because it has been lived. The danger is refusing guidance simply because autonomy has been hard-won. The King of Spades is a fixed card and a member of the Mystical Family of Seven; mastery reaches its highest form when strength remains teachable.',
    strengths:['The pinnacle of authority and accumulated wisdom in the entire deck','Brilliant, strategic mind capable of shouldering the heaviest of burdens','Deeply responsible, resilient, and genuinely protective of those in their care','When fully realised, a presence that commands deep and lasting respect'],
    challenges:['The weight of this card is real and requires sustained, honest inner work throughout life','Reluctance to bend even to constructive guidance; autonomy is a double-edged gift','The path includes serious physical, psychological, and life challenges that cannot be bypassed or rushed'] },
];

// Joker — outside the 52-card system (kept here, rather than pushed at
// runtime from finder.js, so cardsdata.js is the single
// source of truth for reading data). Keyed '✦_joker' via the CARD_READINGS
// build below, matching SUBTITLES / VOWS' '✦_joker' key.
CARDS.push({
  rank:'✦', suit:'joker', sym:'✦', name:'The Joker', dates:'Dec 31',
  teaser:'Alpha and Omega, valued at zero, pure potential standing between the Ace of Hearts and the King of Spades and belonging to no suit at all. The whole task of a life lived here is discovering which card you are truly choosing to play, and why.',
  kws:['Wild card','5th element','Fool'],
  personality:'The Joker stands outside the ordered sequence of fifty-two cards. Its value is zero—not emptiness, but the unformed possibility from which every role may arise. Ruling December 31, the remnant that completes the solar calendar, it belongs to every season while being contained by none. Adaptable, inventive, magnetic, and difficult to define, you may move naturally between identities, fields, and communities, revealing a different facet wherever life places you.\n\nFreedom this complete makes conscious choice the central task. Being “all things to all people” can become a gift for healing, performance, invention, and change, or a habit of shifting shape for approval, prestige, or escape. No suit or fixed pattern decides the path on your behalf; as the old teaching suggests, you hold and guard the key to yourself. The mature Joker chooses deliberately, joining the open possibility of the Ace of Hearts with the disciplined wisdom of the King of Spades while remaining answerable to neither.',
  strengths:['Extraordinary adaptability, genuinely able to inhabit any role, field, or environment','Remarkable creative potential, with a natural affinity for performance, music, and art','Personal magnetism that draws people in across every context and culture','Unconstrained by the fixed path of any single card; the full deck is available to you'],
  challenges:['The absence of a fixed identity can make sustained commitment feel genuinely elusive','Chameleon energy, when unconscious, can shade into dishonesty or shape-shifting for approval','Prestige and control are shadow poles worth examining honestly when they arise','Emotional insecurity, reflected in the 3 of Hearts, can cloud judgement and create mistrust','The freedom of this card is also its greatest responsibility: choose your card deliberately']
});

const CARD_READINGS = {};
CARDS.forEach(c => { CARD_READINGS[`${c.rank}_${c.suit}`] = c; });
window.CARDS         = CARDS;
window.CARD_READINGS = CARD_READINGS;

window.LONG_CARD_READINGS = {};

// Subtitles — one line per card. Shown under the card name in the
// Finder About header. Joker has its own entry keyed '✦_joker'.
const SUBTITLES = {
  'A_hearts':   'The Quickening Flame',  '2_hearts':  'The Twin Flame',
  '3_hearts':   'The Wavering Flame',    '4_hearts':  'The Guarded Flame',
  '5_hearts':   'The Wandering Flame',   '6_hearts':  'The Faithful Flame',
  '7_hearts':   'The Dreaming Heart',    '8_hearts':  'The Magnetic Heart',
  '9_hearts':   'The All-Loving Heart',  '10_hearts': 'The Radiant Host',
  'J_hearts':   'The Ardent Youth',      'Q_hearts':  'The Mother of Flame',
  'K_hearts':   'The Lord of Flame',

  'A_clubs':    'The Waking Word',       '2_clubs':   'The Whispered Accord',
  '3_clubs':    'The Threefold Doubt',   '4_clubs':   'The Tempered Mind',
  '5_clubs':    'The Wind-Taught Mind',  '6_clubs':   'The Illumined Mind',
  '7_clubs':    'The Inner Oracle',      '8_clubs':   'The Mind Unbound',
  '9_clubs':    'The Mind of Many Lives','10_clubs':  "The Sage's Light",
  'J_clubs':    'The Quicksilver Mind',  'Q_clubs':   'The Oracle Queen',
  'K_clubs':    'The Master of the Word',

  'A_diamonds': 'The First Breath',      '2_diamonds':'The Sacred Clasp',
  '3_diamonds': 'The Trembling Vessel',  '4_diamonds':'The Cornerstone',
  '5_diamonds': 'The Untethered One',    '6_diamonds':'The Even Hand',
  '7_diamonds': 'The Hidden Gold',       '8_diamonds':'The Hand of Plenty',
  '9_diamonds': 'The Open Palm',         '10_diamonds':'The Golden Harvest',
  'J_diamonds': 'The Silver Tongue',     'Q_diamonds':'The Keeper of Beauty',
  'K_diamonds': 'The Lord of Plenty',

  'A_spades':   'The Opening Gate',      '2_spades':  'The Companion Soul',
  '3_spades':   'The Vale of Sorrows',   '4_spades':  'The Keeper of the Law',
  '5_spades':   'The Stormbringer',      '6_spades':  'The Wheel of Fate',
  '7_spades':   'The Dark Night of the Soul', '8_spades': 'The Adamant Will',
  '9_spades':   'The Great Reckoning',   '10_spades': 'The Crown of Toil',
  'J_spades':   'The Shadow Walker',     'Q_spades':  'The Veiled Crone',
  'K_spades':   'The Grand Magus',

  '✦_joker':    'Quinta Essentia',
};
window.SUBTITLES = SUBTITLES;

// Vows / mottos — one italic quote per card, shown under the subtitle
// in the Finder About header. Joker has '✦_joker'.
const VOWS = {
  'A_hearts':   'I am the first warmth that wakes the heart.',
  '2_hearts':   'I am made whole in the meeting of another.',
  '3_hearts':   'I burn in three directions and must choose one.',
  '4_hearts':   'I keep the hearth so others may come home.',
  '5_hearts':   'I follow my longing wherever it leads.',
  '6_hearts':   'I love steadily, and ask the same in return.',
  '7_hearts':   'I believe in what I have not yet seen.',
  '8_hearts':   'I draw to me what I most deeply feel.',
  '9_hearts':   'I open my arms to all and keep nothing back.',
  '10_hearts':  'I gather the many and we shine as one.',
  'J_hearts':   'I love with the whole fire of the first time.',
  'Q_hearts':   'I hold the fire that warms all who come near.',
  'K_hearts':   'I rule my heart, and so I rule with mercy.',

  'A_clubs':    'I am the question that begins all knowing.',
  '2_clubs':    'I am the truth two minds discover together.',
  '3_clubs':    'I learn by holding the question open.',
  '4_clubs':    'I am the calm that thought returns to.',
  '5_clubs':    'I learn from everything I cannot hold.',
  '6_clubs':    'I see clearly, and light the way for others.',
  '7_clubs':    'I trust the voice beneath my thoughts.',
  '8_clubs':    'I bend the world with the force of my thought.',
  '9_clubs':    'I remember more than this one life has taught.',
  '10_clubs':   'I carry the knowing of those who came before.',
  'J_clubs':    'I move faster than the world expects.',
  'Q_clubs':    'I know without being told.',
  'K_clubs':    'My word orders the world around me.',

  'A_diamonds': 'I am the spark that enters flesh.',
  '2_diamonds': 'I am the hand that holds and is held.',
  '3_diamonds': 'I steady my hands against the fear of want.',
  '4_diamonds': 'I am the ground that bears the weight.',
  '5_diamonds': 'I risk the known to find the more.',
  '6_diamonds': 'I give what is owed and take what is mine.',
  '7_diamonds': 'My worth is not measured by what I hold.',
  '8_diamonds': 'What I touch with intention multiplies.',
  '9_diamonds': 'I release what is finished and am made lighter.',
  '10_diamonds':'I reap in full what I planted in faith.',
  'J_diamonds': 'I speak, and the door opens.',
  'Q_diamonds': 'I make a sanctuary of all I tend.',
  'K_diamonds': 'I command abundance and steward it well.',

  'A_spades':   'I am the soul that turns toward the light.',
  '2_spades':   'I do not walk the road alone.',
  '3_spades':   'I pass through grief and am not undone.',
  '4_spades':   'I stand by what is true when it costs me.',
  '5_spades':   'I break what is stagnant so it may live again.',
  '6_spades':   'I meet what returns to me and call it justice.',
  '7_spades':   'I walk the dark until it becomes my teacher.',
  '8_spades':   'I cannot be broken by what I refuse to fear.',
  '9_spades':   'I let the old self die so the new may rise.',
  '10_spades':  'I earn my light through the labor of my hands.',
  'J_spades':   'I move unseen between the worlds.',
  'Q_spades':   'I have seen the far side and returned with wisdom.',
  'K_spades':   'I have mastered the self, and so the rest follows.',

  '✦_joker':    'I am bound by nothing and present in all.',
};
window.VOWS = VOWS;

// ── Life Script connection helpers (added 2026-07-10) ──────────────
// Shared relationship interpretation for each planetary connection. These
// readings serve Earthly, Spiritual, and zodiac-ruling-card connections.
const PLANET_CONN_TEXT = {
  Mercury: "This is a connection of thought, language, and discovery. Conversation can move quickly between you, awakening ideas and helping each person see familiar questions differently. Its strength is honest exchange; its challenge is to listen fully rather than assuming that mental ease means complete understanding.",
  Venus:   "This connection draws you toward affection, cooperation, and shared values. Each person may help the other feel appreciated or remind them of what makes life beautiful and worth tending. The bond deepens when harmony includes honesty, allowing difference without making love or approval something that must be earned.",
  Mars:    "This is an activating connection, charged with desire, courage, and momentum. You can spur one another into action and find strength together when there is a clear shared purpose. The same energy can become rivalry or irritation, so the work is to confront what matters without turning every difference into a contest.",
  Jupiter: "This connection carries growth, encouragement, and a widening of possibility. One person may open a door for the other, strengthen their confidence, or help their world become larger through generosity and experience. Its promise is greatest when optimism remains grounded and neither person exaggerates what the bond can provide.",
  Saturn:  "This connection brings responsibility, endurance, and lessons that unfold over time. It may feel serious because each person exposes where the other must become steadier, more patient, or more accountable. The bond can build lasting trust when duty is shared, but becomes heavy when care is confused with control, judgment, or obligation.",
  Uranus:  "This connection awakens freedom, difference, and unexpected change. You may disrupt one another's assumptions, introduce new possibilities, or create a bond that does not fit familiar rules. It thrives when both people have room to remain themselves; unpredictability becomes growth when independence is balanced by clear agreements and genuine consideration.",
  Neptune: "This connection heightens intuition, imagination, and sensitivity between you. It can feel inspired or strangely familiar, as though each person senses more than the other has said. Because longing easily fills what is unknown, the bond needs clarity and grounded action so compassion can deepen without becoming projection, rescue, or escape.",
  Moon:    "This is a connection of instinct, memory, and emotional shelter. Each person may stir a powerful sense of familiarity in the other and reach needs that exist beneath explanation. Its gift is tenderness and belonging; its work is to create safety without making either person responsible for soothing every fear or repeating an old family pattern.",
  Pluto:   "This connection reaches beneath the surface and makes avoidance difficult. It can reveal hidden motives, intensify attachment, and draw both people toward a transformation that would not occur through comfort alone. Its power becomes healing when truth is welcomed freely, never used to possess, manipulate, or force the other person's change.",
  Sun:     "This connection carries a strong recognition of identity and purpose. The same card reflected through two lives can create immediate understanding, mutual affirmation, and the feeling of meeting an essential part of oneself. Similarity is not sameness, however; the bond flourishes when each person honours the other's distinct expression of the shared pattern.",
};
window.PLANET_CONN_TEXT = PLANET_CONN_TEXT;

// Is `toCard` one of `fromCard`'s seven planetary cards? If so return
// { idx, planet } describing which seat; otherwise null.
function lifeScriptConnection(fromCard, toCard) {
  const script = LIFE_SCRIPTS[`${fromCard.rank}_${fromCard.suit}`];
  if (!script) return null;
  for (let i = 0; i < script.length; i++) {
    const cc = lsParseCard(script[i]);
    if (cc.rank === toCard.rank && cc.suit === toCard.suit) {
      return { idx: i, planet: SPREAD_PLANETS[i] };
    }
  }
  return null;
}
window.lifeScriptConnection = lifeScriptConnection;

// Same shape as lifeScriptConnection — { idx, planet } or null — but the
// Spiritual Spread seats are the seven cards that immediately follow
// `fromCard` in the standard 52-card cycle (SPREAD_CARDS order: Hearts,
// Clubs, Diamonds, Spades, each A-K, wrapping past the King of Spades
// back to the Ace of Hearts), mapped in order to Mercury..Neptune. E.g.
// the Jack of Clubs' Mercury seat is the Queen of Clubs, its Venus seat
// the King of Clubs, ... through the Five of Diamonds at Neptune.
function spiritSpreadConnection(fromCard, toCard) {
  const fromIdx = SPREAD_CARDS.findIndex(c => c.rank === fromCard.rank && c.suit === fromCard.suit);
  const toIdx   = SPREAD_CARDS.findIndex(c => c.rank === toCard.rank && c.suit === toCard.suit);
  if (fromIdx < 0 || toIdx < 0) return null;
  for (let i = 1; i <= 7; i++) {
    if ((fromIdx + i) % 52 === toIdx) return { idx: i - 1, planet: SPREAD_PLANETS[i - 1] };
  }
  return null;
}
window.spiritSpreadConnection = spiritSpreadConnection;
