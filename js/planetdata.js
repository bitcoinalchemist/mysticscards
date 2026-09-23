// Planetary position readings for the Quadration Chart.
// Public API: window.PLANET_ORDER, window.PLANET_DATA, and
// window.QUADRATION_POSITION_DATA (row planet, then column planet).

window.PLANET_ORDER = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

// Each reading describes the relationship between a card's column and row.
// It applies to whichever card occupies that seat in the selected chart.
window.QUADRATION_POSITION_DATA = {
  Mercury: {
    Mercury: 'Mercury meets itself here, doubling the emphasis on thought, language and exchange. Ideas can travel quickly from observation to expression. The challenge is to slow down long enough to hear what is being said, including what cannot yet be put into words.',
    Venus: 'Venus seeks connection through Mercury’s world of ideas and conversation. Affection may grow through curiosity, humour and the pleasure of being understood. Harmony depends on saying what matters plainly, rather than assuming a charming exchange has settled a deeper need.',
    Mars: 'Mars brings initiative and desire into Mercury’s realm of thought and speech. Words can start things, defend a position or cut through confusion. This place asks for courage in conversation, with enough care that speed and sharpness do not outrun understanding.',
    Jupiter: 'Jupiter widens Mercury’s field of learning and exchange. A conversation can become a lesson, and a small insight can open a much larger view. The opportunity is to share knowledge generously while checking that confidence has not carried an idea further than the evidence.',
    Saturn: 'Saturn gives Mercury’s quick mind structure and staying power. Study, careful wording and repeated practice turn passing insights into reliable knowledge. This position can feel slow, but its discipline helps an important message survive beyond the moment it was first spoken.',
    Uranus: 'Uranus interrupts familiar ways of thinking in Mercury’s realm. Unusual connections, surprising news and new language can change how a situation is understood. Freedom of thought matters here, alongside the patience to make a fresh idea clear enough for others to use.',
    Neptune: 'Neptune brings imagination and intuition into Mercury’s world of words. Meaning may arrive through images, music, dreams or a feeling that is hard to name. Clear communication gives that sensitivity a form without pretending every impression is a fact.'
  },
  Venus: {
    Mercury: 'Mercury brings conversation and curiosity into Venus’s world of affection and values. Connection grows through listening, shared interests and words that make care visible. The work is to speak honestly about what matters, especially when a pleasant exchange makes it easy to avoid it.',
    Venus: 'Venus meets itself here, placing relationship, pleasure and personal values at the centre. This position notices what draws people together and what makes a bond feel mutual. Its harmony grows stronger when both people can name their needs and choose each other freely.',
    Mars: 'Mars adds heat and movement to Venus’s desire for connection. Attraction can prompt action, while differences reveal what each person truly values. This position works best when desire is expressed directly and conflict makes room for respect rather than becoming a contest to win.',
    Jupiter: 'Jupiter expands Venus’s capacity for affection, pleasure and generosity. Relationships can open new experiences and a broader sense of what is possible together. Abundance is most sustaining when giving remains mutual and enthusiasm leaves room for each person’s actual needs.',
    Saturn: 'Saturn asks Venus to give affection a dependable form. Trust grows through consistency, clear commitments and care shown over time. Limits need not diminish warmth; when spoken honestly, they help a relationship hold what both people value.',
    Uranus: 'Uranus brings change and independence into Venus’s world of relationships and values. Attraction may follow an unexpected path, and closeness needs room for difference. The connection stays alive when both people can grow without treating every change as a threat.',
    Neptune: 'Neptune draws Venus toward tenderness, beauty and an ideal of love. Compassion can deepen a bond, but longing may make it easy to see a hoped-for person instead of the one present. Gentle honesty lets care remain real.'
  },
  Mars: {
    Mercury: 'Mercury brings thought and language into Mars’s field of action. A clear plan or timely conversation can direct energy where it matters. This position asks for words that help something move, while leaving space to revise the plan when experience answers back.',
    Venus: 'Venus brings relationship and values into Mars’s field of action. Desire can motivate cooperation, advocacy or a brave move toward someone. The strongest response joins warmth with clear boundaries, so pleasing another person does not replace acting on what matters.',
    Mars: 'Mars meets itself here, concentrating initiative, courage and the will to act. Energy is available for beginnings and direct challenges. It becomes constructive when there is a chosen purpose and enough restraint to distinguish a real obstacle from a passing frustration.',
    Jupiter: 'Jupiter gives Mars a wider horizon for action. Confidence can turn effort into an opening for growth, leadership or shared opportunity. Ambition serves this position when it is matched by proportion: a bold step still needs a direction worth following.',
    Saturn: 'Saturn asks Mars to pace its effort and meet resistance steadily. What cannot be won at once may be built through practice, timing and endurance. Frustration can become skill when action respects limits without surrendering its purpose.',
    Uranus: 'Uranus brings sudden change and invention to Mars’s drive to act. A stalled situation may need an unfamiliar move or the courage to break a pattern. The energy is most useful when freedom has a purpose and speed does not create avoidable harm.',
    Neptune: 'Neptune softens Mars’s direct force with imagination and compassion. Action may be guided by an ideal, a creative impulse or a wish to help. Clear aims and practical steps keep that inspiration from dissolving into confusion or rescue without consent.'
  },
  Jupiter: {
    Mercury: 'Mercury brings questions and exchange into Jupiter’s search for meaning. Learning grows through discussion, travel of ideas and the willingness to teach what experience has shown. A belief becomes more generous when it can still listen and change.',
    Venus: 'Venus brings connection and shared values into Jupiter’s field of growth. Relationships may widen horizons through generosity, pleasure and different ways of living. The best opportunities honour mutual choice rather than assuming that more is always better.',
    Mars: 'Mars gives Jupiter’s expansive vision the drive to act. Courage can carry an idea into new territory and inspire others to move with it. Progress holds when bold promises are matched by effort and attention to their consequences.',
    Jupiter: 'Jupiter meets itself here, amplifying hope, opportunity and the search for a larger view. There may be room to learn, share and grow. This position thrives when confidence stays curious and expansion remains connected to what can be sustained.',
    Saturn: 'Saturn gives Jupiter’s ambitions structure and time. A promising opening can mature into lasting work through planning, responsibility and measured growth. Limits help distinguish an opportunity worth cultivating from one that only looks impressive at first.',
    Uranus: 'Uranus opens Jupiter’s search for meaning to unexpected possibilities. New communities, ideas or freedoms may challenge an old belief and enlarge the future. Growth comes from testing the new vision in life, not only enjoying the excitement of its discovery.',
    Neptune: 'Neptune gives Jupiter’s quest for meaning a spiritual or imaginative reach. Faith and compassion can widen what feels possible. This position asks that inspiring beliefs remain open to reality, so generosity has something solid to offer.'
  },
  Saturn: {
    Mercury: 'Mercury brings thought and communication to Saturn’s work of building. Careful study, precise agreements and useful records can make a responsibility easier to carry. A clear explanation may be as important as the structure it describes.',
    Venus: 'Venus brings affection and values into Saturn’s world of commitment. Care is expressed through reliability, shared responsibilities and choices that protect what matters. Warmth needs a place inside the structure, so duty does not become the only language of love.',
    Mars: 'Mars brings effort and resolve to Saturn’s long task. Obstacles call for sustained action rather than a single forceful push. This position turns frustration into endurance when energy is paced and each step serves a clear purpose.',
    Jupiter: 'Jupiter brings possibility into Saturn’s realm of limits and time. Growth can be built patiently, with room for ambition and respect for what resources allow. A sound structure makes expansion more than a promise.',
    Saturn: 'Saturn meets itself here, concentrating responsibility, boundaries and the passage of time. The work may ask for patience and repeated attention. What is built carefully can become dependable, provided discipline leaves room for rest and change.',
    Uranus: 'Uranus presses for freedom inside Saturn’s established forms. A rule, habit or commitment may need to change to remain useful. This position favours thoughtful reform: keep the support a structure gives while making space for what it could not previously hold.',
    Neptune: 'Neptune brings vision and sensitivity to Saturn’s practical work. An ideal asks for a schedule, a boundary or a form that can be lived. The task is to make room for compassion without letting responsibility become vague or endless.'
  },
  Uranus: {
    Mercury: 'Mercury brings language and curiosity into Uranus’s field of change. A new idea or conversation can loosen an old assumption and make a different future imaginable. The insight travels further when it is expressed clearly enough for others to take part.',
    Venus: 'Venus seeks closeness, pleasure, and shared values. Uranus asks for freedom, change, and room to be different. Together, they suggest relationships that need both connection and independence. Attraction may begin with something unexpected, while lasting harmony depends on allowing each person space to grow.',
    Mars: 'Mars brings action and desire into Uranus’s field of change. The impulse to break from an old pattern can be brave and necessary. A purposeful step gives freedom a direction, while a pause before acting can reveal which disruption will actually help.',
    Jupiter: 'Jupiter expands Uranus’s appetite for new possibilities. An unfamiliar idea, community or path can reshape a person’s sense of what the future allows. Enthusiasm becomes useful when discovery is followed by the work of making the opening accessible to others.',
    Saturn: 'Saturn meets Uranus at the point where structure needs renewal. A boundary may protect freedom, while an outdated rule may block it. This position asks for change with enough care to preserve what still supports people.',
    Uranus: 'Uranus meets itself here, intensifying the need for freedom, originality and change. A familiar pattern may suddenly show its limits. The most valuable break opens a workable new possibility, with space for others to understand and join it.',
    Neptune: 'Neptune brings imagination and sensitivity into Uranus’s push for change. A vision of a different world can inspire invention and collective care. Grounding that vision in real needs helps it reach beyond a beautiful idea.'
  },
  Neptune: {
    Mercury: 'Mercury brings words and questions into Neptune’s realm of intuition and imagination. A subtle feeling may become a story, image or conversation that others can understand. Clarity matters here because the first interpretation of an impression may not be the whole truth.',
    Venus: 'Venus brings affection and beauty into Neptune’s imaginative world. Love may feel unusually tender or full of possibility. The connection deepens when care meets the person who is present, not only the ideal that first drew the heart.',
    Mars: 'Mars gives Neptune’s vision a way to act. Compassion can move someone to create, defend or help, even when the outcome is uncertain. Clear intentions and practical boundaries keep action connected to the need it hopes to answer.',
    Jupiter: 'Jupiter widens Neptune’s sense of mystery, faith and possibility. An ideal can inspire generosity and a more compassionate view of life. Discernment helps separate a meaningful opening from a promise that has not yet been tested.',
    Saturn: 'Saturn gives Neptune’s imagination a container. A dream can become a practice, a creative work or a dependable form of care. Boundaries protect the vision by making clear what can be offered and what must remain possible to sustain.',
    Uranus: 'Uranus brings sudden insight into Neptune’s realm of dreams and ideals. An unexpected perspective may change what hope looks like. The awakening has depth when it leads to an honest, workable expression of the vision.',
    Neptune: 'Neptune meets itself here, deepening intuition, compassion and the pull of the unseen. Inspiration may be strong, but so can uncertainty about what it means. Gentle reality checks give a vision room to become something that can be lived.'
  }
};

window.PLANET_DATA = {
  Mercury: {
    glyph: '☿', epithet: 'The Messenger',
    synopsis: 'Thought, language, learning, movement and exchange.',
    text: [
      'In a Mercury position, the card speaks through the mind. Its qualities are carried by ideas, conversation, study, news and the quick exchanges that connect one part of life with another. This position shows what you are learning, how you make sense of experience, and the kind of message you are here to give or receive.',
      'Mercury asks for curiosity and clear expression. When its pace becomes restless, the card may scatter itself across too many thoughts or let words run ahead of understanding. Gather the insight, name it simply, and give it a practical destination.'
    ]
  },
  Venus: {
    glyph: '♀', epithet: 'The Harmoniser',
    synopsis: 'Relationship, attraction, values, beauty and cooperation.',
    text: [
      'In a Venus position, the card reveals how it seeks connection. Its qualities move through affection, friendship, partnership, pleasure and the values that determine what you welcome into your life. This position can describe both what draws people toward you and what helps you create harmony around the card’s central theme.',
      'Venus invites warmth without self-abandonment. Harmony is strongest when it grows from honesty, not from keeping the peace at any price. Let the card show what deserves your care, then express that care in choices, boundaries and everyday acts of reciprocity.'
    ]
  },
  Mars: {
    glyph: '♂', epithet: 'The Initiator',
    synopsis: 'Will, action, courage, desire and constructive conflict.',
    text: [
      'In a Mars position, the card becomes a source of motion. Its qualities emerge through initiative, effort, competition, sexuality and the courage to meet resistance directly. This position shows where the card wants to act, protect, pursue or cut a clear path through hesitation.',
      'Mars needs a worthy purpose. Without one, urgency can become irritation, force can become domination, and every obstacle can look like a fight. Direct the card’s heat toward decisive work, honest confrontation and the defence of what genuinely matters.'
    ]
  },
  Jupiter: {
    glyph: '♃', epithet: 'The Expander',
    synopsis: 'Growth, opportunity, confidence, generosity and influence.',
    text: [
      'In a Jupiter position, the card is enlarged. Its gifts become easier to recognise and its concerns reach into opportunity, prosperity, teaching, travel or a widening sphere of influence. This position shows where belief in the card opens doors and where its experience can become wisdom shared with others.',
      'Jupiter’s abundance still requires proportion. Confidence can overpromise, and expansion can become excess when it loses sight of what can be sustained. Receive the opening, cultivate it generously, and allow growth to deepen the card rather than merely making it bigger.'
    ]
  },
  Saturn: {
    glyph: '♄', epithet: 'The Builder',
    synopsis: 'Time, responsibility, boundaries, consequence and mastery.',
    text: [
      'In a Saturn position, the card is tested for strength and permanence. Its qualities develop through patience, duty, limitation and the repeated work that turns potential into dependable form. This position shows where life asks you to become accountable to the card and to build something that can endure.',
      'Saturn’s pressure is not a verdict; it is a process of refinement. Fear may harden into rigidity, or delay may be mistaken for denial. Accept the necessary boundary, learn from consequence, and let steady practice reveal the authority hidden inside the card.'
    ]
  },
  Uranus: {
    glyph: '♅', epithet: 'The Awakener',
    synopsis: 'Freedom, disruption, invention, foresight and change.',
    text: [
      'In a Uranus position, the card works as an agent of awakening. Its qualities appear through sudden insight, unconventional choices, collective work and changes that break an inherited pattern open. This position shows where the card needs room to experiment and where its difference can become a useful form of foresight.',
      'Uranus asks for freedom with purpose. Change pursued only for novelty can leave the card ungrounded, while resistance can turn necessary renewal into upheaval. Keep what remains alive, release what has become mechanical, and build a form spacious enough for the new understanding.'
    ]
  },
  Neptune: {
    glyph: '♆', epithet: 'The Visionary',
    synopsis: 'Imagination, intuition, compassion, distance and ideals.',
    text: [
      'In a Neptune position, the card enters the realm of image, feeling and the unseen. Its qualities may be experienced through intuition, dreams, compassion, spiritual longing, travel or influences arriving from beyond the familiar horizon. This position shows the ideal carried by the card and the larger mystery into which it opens.',
      'Neptune softens boundaries, so inspiration and projection can resemble one another. Give the vision a vessel: test the feeling, clarify the promise, and take one grounded step toward what the card imagines. What is true will become more luminous when it can also be lived.'
    ]
  },
  Crown: {
    glyph: '♛', epithet: 'The Three Masters',
    synopsis: 'Integration, sovereignty, witness and completed understanding.',
    text: [
      'The Crown stands above the seven planetary rows and is held by the Jack, Queen and King of Spades. A card in this position is not channelled through one planetary function; it is viewed from the level of integration, where experience is gathered into conscious direction and the work of the lower positions can be seen as a whole.',
      'The Crown describes a standard of maturity rather than an escape from ordinary life. It asks the card to embody its highest responsibility without aloofness or premature certainty. Mastery here means remaining present, using power carefully, and allowing understanding to become service.'
    ]
  }
};
