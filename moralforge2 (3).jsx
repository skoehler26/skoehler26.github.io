import { useState, useEffect, useCallback, useRef } from "react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const T = {
  bg: "#050508",
  surface: "rgba(255,255,255,0.04)",
  surfaceHover: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.08)",
  borderBright: "rgba(255,255,255,0.15)",
  neon: "#00f5d4",
  neonDim: "rgba(0,245,212,0.15)",
  pink: "#ff2d78",
  pinkDim: "rgba(255,45,120,0.15)",
  amber: "#ffbe0b",
  amberDim: "rgba(255,190,11,0.15)",
  blue: "#3a86ff",
  blueDim: "rgba(58,134,255,0.15)",
  purple: "#c77dff",
  purpleDim: "rgba(199,125,255,0.15)",
  green: "#06d6a0",
  red: "#ef233c",
  text: "#f0f0f5",
  muted: "rgba(240,240,245,0.45)",
  faint: "rgba(240,240,245,0.18)",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&family=Syne+Mono&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes slideIn { from{transform:translateY(-10px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes glow { 0%,100%{box-shadow:0 0 12px rgba(0,245,212,0.3)} 50%{box-shadow:0 0 28px rgba(0,245,212,0.6)} }
  @keyframes fadeIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
  @keyframes barFill { from{width:0} to{width:var(--w)} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes scanline {
    0%{background-position:0 0} 100%{background-position:0 100px}
  }
`;

/* ─────────────────────────────────────────────
   GAME DATA
───────────────────────────────────────────── */
const MORAL_QUOTES = [
  { text: "Act only according to that maxim whereby you can at the same time will it become a universal law.", author: "Immanuel Kant" },
  { text: "The greatest happiness of the greatest number is the foundation of morals.", author: "Jeremy Bentham" },
  { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
  { text: "What is not good for the swarm is not good for the bee.", author: "Marcus Aurelius" },
  { text: "Character is doing the right thing when nobody's looking.", author: "J.C. Watts" },
  { text: "Out of the crooked timber of humanity, no straight thing was ever made.", author: "Immanuel Kant" },
  { text: "The good of the people is the greatest law.", author: "Cicero" },
  { text: "Virtue is not given by money, but from virtue comes money.", author: "Socrates" },
];

const CORE_TRAITS = [
  { id: "principled", name: "Principled", desc: "Rules exist for a reason. You follow them.", type: "D", bonus: "+10 Integrity, rules feel natural", drawback: "-5 happiness baseline" },
  { id: "loyal", name: "Loyal", desc: "Your word is your bond.", type: "D", bonus: "+15 Social trust", drawback: "Burnout hits harder" },
  { id: "empathetic", name: "Empathetic", desc: "You feel what others feel.", type: "V", bonus: "+15 Mood, better social", drawback: "-5 Finance efficiency" },
  { id: "courageous", name: "Courageous", desc: "You say the hard thing out loud.", type: "V", bonus: "+10 Career acceleration", drawback: "-5 Social (some find you intense)" },
  { id: "pragmatic", name: "Pragmatic", desc: "If it works, do it.", type: "C", bonus: "+10 Finance returns", drawback: "-5 Social trust baseline" },
  { id: "strategic", name: "Strategic", desc: "Every move is three moves ahead.", type: "C", bonus: "+15 Career advancement", drawback: "+10 Burnout rate" },
];

const UPBRINGINGS = [
  { id: "comfortable", name: "Comfortable", tag: "Stable home, supportive parents", startMoney: 3200, happinessBonus: 10, socialBonus: 5, financeBonus: 0 },
  { id: "working", name: "Working Class", tag: "Tight finances, strong work ethic", startMoney: 800, happinessBonus: 0, socialBonus: 0, financeBonus: 10 },
  { id: "affluent", name: "Affluent", tag: "Private school, high expectations", startMoney: 8000, happinessBonus: -5, socialBonus: 10, financeBonus: 5 },
];

// Energy costs (out of 100 daily points)
// Pay is realistic daily earnings (hourly * ~8hrs, rounded for game feel)
const JOBS = [
  { id: "barista", title: "Barista", category: "entry", pay: 95, energy: 35, burnout: 5, social: 8, moralType: "V", desc: "Serve people. Every day is different.", hourly: 12 },
  { id: "dataintern", title: "Data Entry Intern", category: "entry", pay: 110, energy: 30, burnout: 4, social: 3, moralType: "C", desc: "Accurate. Efficient. Invisible.", hourly: 14 },
  { id: "nonprofit", title: "Nonprofit Coord.", category: "entry", pay: 88, energy: 30, burnout: 3, social: 12, moralType: "D", desc: "Low pay. High purpose.", hourly: 11 },
  { id: "sales", title: "Sales Associate", category: "entry", pay: 130, energy: 40, burnout: 8, social: 10, moralType: "C", desc: "Commission-based. Push products.", hourly: 16 },
  { id: "teacher_aide", title: "Teaching Assistant", category: "mid", pay: 145, energy: 35, burnout: 6, social: 8, moralType: "V", desc: "Support students, shape futures.", hourly: 18 },
  { id: "accountant_jr", title: "Jr. Accountant", category: "mid", pay: 200, energy: 40, burnout: 7, social: 3, moralType: "D", desc: "Numbers must be right. Always.", hourly: 25 },
  { id: "marketing", title: "Marketing Coord.", category: "mid", pay: 185, energy: 35, burnout: 7, social: 9, moralType: "C", desc: "Craft messages that sell.", hourly: 23 },
  { id: "therapist_asst", title: "Therapy Assistant", category: "mid", pay: 165, energy: 35, burnout: 9, social: 6, moralType: "V", desc: "Emotionally demanding. Deeply meaningful.", hourly: 21 },
];

const EDUCATION_PATHS = [
  { id: "business", name: "Business", emoji: "💼", cost: 8000, careerBonus: 15, financeBonus: 10, moralType: "C" },
  { id: "psychology", name: "Psychology", emoji: "🧠", cost: 9000, wellnessBonus: 15, socialBonus: 10, moralType: "V" },
  { id: "cs", name: "Computer Science", emoji: "💻", cost: 10000, careerBonus: 20, financeBonus: 15, moralType: "C" },
  { id: "socialwork", name: "Social Work", emoji: "🤝", cost: 7000, socialBonus: 20, wellnessBonus: 5, moralType: "D" },
  { id: "arts", name: "Fine Arts", emoji: "🎨", cost: 7500, moodBonus: 20, socialBonus: 8, moralType: "V" },
];

// SHOP with energy system baked in
const SHOP_ITEMS = [
  // Energy boosters
  { id: "energy_drink", name: "Energy Drink", emoji: "⚡", price: 4, category: "energy", energyGain: 25, statChanges: { thirst: -15, health: -5, burnout: 5 }, desc: "Instant energy. But your body hates it.", timeCost: 0, consumable: true },
  { id: "coffee", name: "Coffee", emoji: "☕", price: 5, category: "energy", energyGain: 15, statChanges: { thirst: -5 }, desc: "The classic boost. Mild crash later.", timeCost: 0, consumable: true },
  { id: "power_nap", name: "Power Nap Kit", emoji: "😴", price: 12, category: "energy", energyGain: 30, statChanges: { burnout: -5 }, desc: "20-min nap. Legit recovery.", timeCost: 20, consumable: true },
  { id: "pre_workout", name: "Pre-Workout", emoji: "💪", price: 8, category: "energy", energyGain: 35, statChanges: { health: -8, thirst: -20, mood: -5 }, desc: "Aggressive boost. Your heart races.", timeCost: 0, consumable: true },
  // Food & drink
  { id: "water_bottle", name: "Water Bottle", emoji: "💧", price: 3, category: "food", statChanges: { thirst: 30 }, desc: "Stay hydrated.", timeCost: 0, consumable: true },
  { id: "fast_food", name: "Fast Food", emoji: "🍔", price: 9, category: "food", statChanges: { hunger: 25, health: -5 }, desc: "Quick. Cheap. Not great for you.", timeCost: 0, consumable: true },
  { id: "groceries", name: "Groceries (week)", emoji: "🛒", price: 55, category: "food", statChanges: { hunger: 60, health: 5, mood: 3 }, desc: "Cook at home. Costs time, saves money.", timeCost: 15, consumable: false },
  // Wellness
  { id: "therapy_session", name: "Therapy Session", emoji: "🛋️", price: 120, category: "wellness", statChanges: { burnout: -20, mood: 10, wellness: 8 }, desc: "Real professional support.", timeCost: 30, consumable: true },
  { id: "gym_pass", name: "Gym Pass (month)", emoji: "🏋️", price: 45, category: "wellness", statChanges: { health: 8, mood: 6, burnout: -5 }, desc: "Invest in your body.", timeCost: 25, consumable: false },
  { id: "journal", name: "Journal", emoji: "📓", price: 12, category: "wellness", statChanges: { mood: 8, burnout: -8 }, desc: "Process your thoughts. Free therapy.", timeCost: 15, consumable: false },
  { id: "multivitamin", name: "Multivitamins", emoji: "💊", price: 20, category: "wellness", statChanges: { health: 10 }, energyGain: 5, desc: "Slow burn health boost.", timeCost: 0, consumable: false },
  // Education
  { id: "book_self", name: "Self-Help Book", emoji: "📚", price: 18, category: "education", statChanges: { education: 5, mood: 3 }, desc: "Level up your thinking.", timeCost: 20, consumable: false },
  { id: "online_course_shop", name: "Online Course", emoji: "🖥️", price: 35, category: "education", statChanges: { education: 10, career: 3 }, desc: "Learn new skills anytime.", timeCost: 25, consumable: false },
  // Fun & entertainment
  { id: "video_game", name: "Video Game", emoji: "🎮", price: 60, category: "fun", statChanges: { mood: 12, social: 4, burnout: -6 }, desc: "Relax. Disconnect. Recharge.", timeCost: 20, consumable: false },
  { id: "board_games", name: "Board Game Night Kit", emoji: "🎲", price: 35, category: "fun", statChanges: { mood: 10, social: 12, burnout: -5 }, desc: "Gather friends. Make memories.", timeCost: 20, consumable: false },
  { id: "concert_ticket", name: "Concert Ticket", emoji: "🎵", price: 80, category: "fun", statChanges: { mood: 18, social: 8, wellness: 6, burnout: -8 }, desc: "Live music hits different.", timeCost: 25, consumable: true },
  { id: "movie_night", name: "Movie Night Bundle", emoji: "🎬", price: 22, category: "fun", statChanges: { mood: 10, burnout: -6 }, desc: "Popcorn. Couch. Escape.", timeCost: 15, consumable: true },
  { id: "art_supplies", name: "Art Supplies", emoji: "🎨", price: 40, category: "fun", statChanges: { mood: 12, wellness: 8, burnout: -10 }, desc: "Create something beautiful.", timeCost: 20, consumable: false },
  { id: "hiking_gear", name: "Hiking Gear", emoji: "🥾", price: 75, category: "fun", statChanges: { health: 10, mood: 12, wellness: 10, burnout: -12 }, desc: "Get outside. Touch grass.", timeCost: 30, consumable: false },
  { id: "spa_day", name: "Spa Day", emoji: "🧖", price: 95, category: "fun", statChanges: { burnout: -18, mood: 15, wellness: 12, health: 5 }, desc: "Full reset. You deserve it.", timeCost: 25, consumable: true },
  { id: "bike", name: "Bicycle", emoji: "🚲", price: 200, category: "fun", statChanges: { health: 8, mood: 6, wellness: 6 }, desc: "Free rides forever. Your city opens up.", timeCost: 0, consumable: false },
  // Pets
  { id: "cat", name: "Adopt a Cat", emoji: "🐱", price: 150, category: "pets", statChanges: { mood: 15, wellness: 12, burnout: -10, social: 5 }, desc: "Judgmental but lovable. Reduces stress scientifically.", timeCost: 0, consumable: false },
  { id: "dog", name: "Adopt a Dog", emoji: "🐶", price: 200, category: "pets", statChanges: { mood: 18, wellness: 15, health: 8, burnout: -12, social: 10 }, desc: "Unconditional love. Forces you to go outside.", timeCost: 0, consumable: false },
  { id: "fish_tank", name: "Fish Tank", emoji: "🐠", price: 80, category: "pets", statChanges: { mood: 8, wellness: 6, burnout: -6 }, desc: "Surprisingly calming. Low maintenance.", timeCost: 0, consumable: false },
  { id: "hamster", name: "Hamster", emoji: "🐹", price: 50, category: "pets", statChanges: { mood: 10, wellness: 8, burnout: -5 }, desc: "Tiny fuzzy chaos. Big mood boost.", timeCost: 0, consumable: false },
  { id: "rabbit", name: "Rabbit", emoji: "🐰", price: 100, category: "pets", statChanges: { mood: 12, wellness: 10, burnout: -8, health: 4 }, desc: "Gentle, quiet, and surprisingly affectionate.", timeCost: 0, consumable: false },
  { id: "pet_supplies", name: "Pet Supplies (month)", emoji: "🦴", price: 45, category: "pets", statChanges: { mood: 5, wellness: 4 }, desc: "Keep your pet happy and healthy.", timeCost: 0, consumable: true },
];

// ── WELLNESS ACTIVITIES ──
const WELLNESS_ACTIVITIES = [
  { id: "meditate", name: "Meditate", emoji: "🧘", epCost: 10, ethics: "V", statChanges: { burnout: -15, mood: 8, wellness: 8 }, desc: "Still the mind. Build inner resilience." },
  { id: "exercise", name: "Exercise", emoji: "🏃", epCost: 20, ethics: "V", statChanges: { health: 12, burnout: -8, mood: 6, wellness: 10 }, desc: "Push your body. Clear your head." },
  { id: "journal", name: "Journal", emoji: "📓", epCost: 8, ethics: "V", statChanges: { mood: 10, burnout: -10, wellness: 6 }, desc: "Write it out. Process the noise." },
  { id: "cook_meal", name: "Cook a Meal", emoji: "🍳", epCost: 15, ethics: "V", statChanges: { hunger: 35, health: 8, mood: 5, wellness: 5 }, desc: "Nourish yourself with intention." },
  { id: "breathwork", name: "Breathwork", emoji: "💨", epCost: 5, ethics: "D", statChanges: { burnout: -10, mood: 6, wellness: 5 }, desc: "Regulate your nervous system." },
  { id: "cold_shower", name: "Cold Shower", emoji: "🚿", epCost: 5, ethics: "D", statChanges: { health: 5, mood: 4, burnout: -5, wellness: 4 }, desc: "Discipline through discomfort." },
  { id: "therapy", name: "Self-Therapy", emoji: "💬", epCost: 15, ethics: "V", statChanges: { burnout: -18, mood: 12, wellness: 12 }, desc: "Sit with your feelings. Process them." },
  { id: "digital_detox", name: "Digital Detox", emoji: "📵", epCost: 0, ethics: "V", statChanges: { mood: 8, burnout: -12, wellness: 8 }, desc: "Disconnect to reconnect." },
  { id: "stretching", name: "Stretching", emoji: "🤸", epCost: 8, ethics: "V", statChanges: { health: 6, burnout: -6, mood: 4, wellness: 5 }, desc: "Take care of your body, slowly." },
  { id: "volunteer", name: "Volunteer Work", emoji: "🤲", epCost: 25, ethics: "C", statChanges: { social: 12, mood: 10, wellness: 8, burnout: -5 }, desc: "Give time to something bigger than yourself." },
];

// ── HOUSING ──
// dailyCost = monthly rent / 30, rounded (realistic US ranges)
const HOUSING_OPTIONS = [
  { id: "shared_room", name: "Shared Room", emoji: "🛏️", cost: 0, dailyCost: 0, moodBonus: 0, wellnessBonus: 0, desc: "Free. Cramped. Gets old fast.", tier: 0 },
  { id: "studio", name: "Studio Apartment", emoji: "🏠", cost: 800, dailyCost: 40, moodBonus: 10, wellnessBonus: 5, desc: "Your own space. First taste of independence. (~$1,200/mo)", tier: 1 },
  { id: "one_bed", name: "1-Bedroom Apt", emoji: "🏡", cost: 2000, dailyCost: 60, moodBonus: 15, wellnessBonus: 10, desc: "Room to breathe. Room to grow. (~$1,800/mo)", tier: 2 },
  { id: "townhouse", name: "Townhouse", emoji: "🏘️", cost: 5000, dailyCost: 90, moodBonus: 20, wellnessBonus: 15, desc: "A real home. Stability and comfort. (~$2,700/mo)", tier: 3 },
  { id: "house", name: "Own a Home", emoji: "🏰", cost: 15000, dailyCost: 120, moodBonus: 30, wellnessBonus: 20, desc: "Yours. You built this. (~$3,600/mo mortgage)", tier: 4 },
];

// ── VEHICLES ──
// dailyCost = insurance + gas estimate per day
const VEHICLE_OPTIONS = [
  { id: "bike", name: "Bicycle", emoji: "🚲", cost: 150, dailyCost: 0, moodBonus: 5, desc: "Free transport. Good for health.", tier: 1 },
  { id: "used_car", name: "Used Car", emoji: "🚗", cost: 1500, dailyCost: 12, moodBonus: 10, desc: "Reliable. Gets you there. (~$360/mo gas + insurance)", tier: 2 },
  { id: "new_car", name: "New Car", emoji: "🚙", cost: 6000, dailyCost: 22, moodBonus: 18, desc: "Clean. Comfortable. A statement. (~$660/mo)", tier: 3 },
  { id: "luxury_car", name: "Luxury Vehicle", emoji: "🏎️", cost: 18000, dailyCost: 40, moodBonus: 25, desc: "The kind people notice. (~$1,200/mo)", tier: 4 },
];

// ── CONTEXT-AWARE DILEMMA POOL ──
// Each dilemma has a 'trigger' function that receives game state and returns true if contextually relevant
// Ethics scores hidden from player. Three pillars: D=Deontology, V=Virtue, C=Consequentialism
const DILEMMA_POOL = [
  // ── CAREER DILEMMAS ──
  {
    id: "d_waste", title: "The Waste Dump",
    trigger: g => !!g.currentJob,
    desc: "You discover your company has been quietly dumping chemical waste. It's illegal — but exposing it would put 200 coworkers out of a job, including people with families.",
    choices: [
      { text: "Report it. The law is the law.", score: { D: 20, V: 5, C: 0 }, outcome: "You reported it. The company faced consequences. Some colleagues lost jobs. You lost sleep.", statChange: { career: -10, mood: -5, social: -5 } },
      { text: "Stay quiet. People need their paychecks.", score: { D: 0, V: 0, C: 20 }, outcome: "You said nothing. The waste kept dumping. The jobs survived. You wonder if you made the right call.", statChange: { money: 10, burnout: 10, mood: -8 } },
      { text: "Anonymously tip the regulators. Let them sort it out.", score: { D: 10, V: 10, C: 10 }, outcome: "A slow investigation started. You kept your job. The truth came out eventually.", statChange: { career: 5, mood: 3 } },
    ]
  },
  {
    id: "d_nda", title: "Sign the NDA",
    trigger: g => !!g.currentJob && g.career > 20,
    desc: "Your employer wants you to sign a non-disclosure agreement that would prevent you from discussing workplace conditions — including some practices you find troubling.",
    choices: [
      { text: "Sign it. It's just standard paperwork.", score: { D: 0, V: 0, C: 15 }, outcome: "You signed. Kept your job. Some things stayed hidden.", statChange: { career: 8, mood: -5 } },
      { text: "Refuse to sign without legal review.", score: { D: 15, V: 10, C: 5 }, outcome: "They pushed back. But you held. Eventually they accepted a modified version.", statChange: { career: -5, mood: 8 } },
      { text: "Ask what specifically is being covered up.", score: { D: 10, V: 15, C: 5 }, outcome: "The HR director looked uncomfortable. You got answers — and a grudging respect.", statChange: { career: 5, social: 5 } },
    ]
  },
  {
    id: "d_automate", title: "Automate or Not",
    trigger: g => !!g.currentJob && g.finance > 30,
    desc: "You've found a way to automate your department's workflow. It would triple output — but eliminate 30 entry-level jobs, including people who are new to the workforce.",
    choices: [
      { text: "Propose it. Progress is progress.", score: { D: 0, V: 0, C: 20 }, outcome: "You proposed it. Leadership loved it. 30 people didn't.", statChange: { career: 20, finance: 15, mood: -8, social: -5 } },
      { text: "Hold it back. People over profits.", score: { D: 5, V: 15, C: 0 }, outcome: "You stayed quiet. Those jobs survived. Your career didn't advance as fast.", statChange: { career: -5, social: 10, mood: 5 } },
      { text: "Propose it with a retraining plan for affected workers.", score: { D: 10, V: 10, C: 15 }, outcome: "Leadership was impressed by the nuance. The plan got approved. Most workers transitioned well.", statChange: { career: 15, finance: 8, mood: 5 } },
    ]
  },
  {
    id: "d_credit", title: "Whose Win Is It?",
    trigger: g => !!g.currentJob && g.career > 30,
    desc: "A project your team built together is getting major recognition. Your manager subtly suggests you take the lead in the presentation — implying you could take most of the credit.",
    choices: [
      { text: "Step up and own it. You did most of the work.", score: { D: 0, V: 0, C: 15 }, outcome: "You presented. The promotion came. Two teammates never forgot.", statChange: { career: 20, social: -10, mood: 5 } },
      { text: "Credit the team publicly. It was a team effort.", score: { D: 5, V: 20, C: 0 }, outcome: "Your team respected you deeply. Leadership noticed your character.", statChange: { career: 8, social: 15, mood: 10 } },
      { text: "Propose a joint presentation that highlights everyone.", score: { D: 10, V: 15, C: 10 }, outcome: "It worked. The whole team shone. Morale went up.", statChange: { career: 10, social: 12, mood: 8 } },
    ]
  },

  // ── EDUCATION DILEMMAS ──
  {
    id: "d_cheat", title: "The Easy Way Out",
    trigger: g => !!g.currentEducation,
    desc: "It's exam week. A classmate offers to share answers they obtained. Failing this exam could set back your graduation significantly.",
    choices: [
      { text: "Use them. Graduation matters more.", score: { D: 0, V: 0, C: 15 }, outcome: "You passed. The guilt lingered. Knowledge gaps appeared later.", statChange: { education: 10, mood: -8, burnout: 5 } },
      { text: "Refuse. If I don't know it, I don't deserve to pass.", score: { D: 20, V: 10, C: 0 }, outcome: "You struggled through honestly. A close call — but yours.", statChange: { education: 3, mood: 8 } },
      { text: "Study harder tonight instead. No shortcuts.", score: { D: 15, V: 15, C: 5 }, outcome: "You stayed up late. You made it work. That knowledge is now yours.", statChange: { education: 8, burnout: 8, mood: 5 } },
    ]
  },
  {
    id: "d_carry", title: "Carry the Group",
    trigger: g => !!g.currentEducation && g.education > 30,
    desc: "Group project is due. One teammate has done nothing all semester. If you carry them, the group passes. If you report them, they might be expelled — but you'd lose group points too.",
    choices: [
      { text: "Carry them. The grade matters for everyone.", score: { D: 0, V: 5, C: 20 }, outcome: "The group passed. They learned nothing. You resented it.", statChange: { education: 8, burnout: 10, mood: -5 } },
      { text: "Report it. They earned their own outcome.", score: { D: 20, V: 5, C: 0 }, outcome: "The school intervened. The teammate got a second chance. Your grade took a small hit.", statChange: { education: -5, mood: 5, career: 3 } },
      { text: "Confront them directly. Give them a chance to step up.", score: { D: 10, V: 20, C: 5 }, outcome: "They stepped up. Barely. The group survived. You grew as a leader.", statChange: { education: 5, social: 8, mood: 8 } },
    ]
  },
  {
    id: "d_passion_vs_prestige", title: "Passion vs Paycheck",
    trigger: g => !!g.currentEducation,
    desc: "You've been accepted to transfer into a higher-paying program. It's not what you love — but it's practical. Your current program feeds your soul but offers a harder financial path.",
    choices: [
      { text: "Transfer. The money will matter more eventually.", score: { D: 0, V: 0, C: 20 }, outcome: "You transferred. More stable future. But something feels missing.", statChange: { finance: 20, mood: -10, wellness: -5 } },
      { text: "Stay in your program. You chose this for a reason.", score: { D: 5, V: 20, C: 0 }, outcome: "You stayed. Harder path. But you wake up interested.", statChange: { mood: 12, wellness: 8, finance: -5 } },
      { text: "Explore hybrid programs that combine both.", score: { D: 5, V: 10, C: 15 }, outcome: "You found a way. Not perfect — but more whole.", statChange: { mood: 5, education: 5, finance: 5 } },
    ]
  },

  // ── SOCIAL DILEMMAS ──
  {
    id: "d_painful_truth", title: "The Hard Truth",
    trigger: g => g.friends.length > 0,
    desc: "Your closest friend is in a relationship that's clearly harming them. They seem happy — or at least think they are. Saying something could break the friendship.",
    choices: [
      { text: "Say it directly. They need to hear it.", score: { D: 10, V: 15, C: 0 }, outcome: "They were hurt. Then grateful. The friendship survived.", statChange: { social: 5, mood: 5 } },
      { text: "Stay quiet. It's not your place.", score: { D: 0, V: 5, C: 10 }, outcome: "You said nothing. Things got worse for them. You wonder.", statChange: { social: 8, mood: -5 } },
      { text: "Ask questions. Help them see it themselves.", score: { D: 5, V: 20, C: 5 }, outcome: "Slowly, they started questioning it. You didn't push. They arrived themselves.", statChange: { social: 12, mood: 10 } },
    ]
  },
  {
    id: "d_bully", title: "Bystander",
    trigger: g => g.social > 20,
    desc: "You witness someone in your social circle being publicly humiliated by someone with status in the group. Speaking up could cost you your place in the group.",
    choices: [
      { text: "Speak up. Publicly. Right now.", score: { D: 10, V: 20, C: 0 }, outcome: "It got tense. But the humiliated person never forgot your name.", statChange: { social: -5, mood: 10, ethicsV: 5 } },
      { text: "Say nothing. The group dynamic is fragile.", score: { D: 0, V: 0, C: 15 }, outcome: "Nothing changed. The person being humiliated felt very alone.", statChange: { social: 5, mood: -8 } },
      { text: "Check on the person privately afterward.", score: { D: 5, V: 15, C: 10 }, outcome: "You weren't dramatic about it. But you were there when it counted.", statChange: { social: 8, mood: 8 } },
    ]
  },
  {
    id: "d_secret", title: "The Borrowed Truth",
    trigger: g => g.friends.length >= 2,
    desc: "One friend tells you they borrowed a significant amount of money from another mutual friend — without telling them. They beg you not to say anything.",
    choices: [
      { text: "Keep it. Loyalty to the one who told you.", score: { D: 0, V: 10, C: 0 }, outcome: "You kept it. But the secret sat in every conversation.", statChange: { social: 5, mood: -5 } },
      { text: "Tell the other friend. They deserve the truth.", score: { D: 20, V: 5, C: 5 }, outcome: "The friendship triangle cracked. But honesty survived.", statChange: { social: -8, mood: 5 } },
      { text: "Give the borrower 48 hours to tell them themselves.", score: { D: 10, V: 20, C: 5 }, outcome: "They did. Barely. But they did.", statChange: { social: 10, mood: 10 } },
    ]
  },
  {
    id: "d_expose", title: "Public Exposure",
    trigger: g => g.social > 40,
    desc: "You have proof that someone in your community has been manipulating people for personal gain. Exposing them publicly would help many — but could ruin their life.",
    choices: [
      { text: "Post it. People need to know.", score: { D: 5, V: 5, C: 20 }, outcome: "The exposure was chaotic. Some appreciated it. Others called it a witch hunt.", statChange: { social: -5, mood: 5 } },
      { text: "Go to someone in authority. Handle it properly.", score: { D: 20, V: 10, C: 10 }, outcome: "Slower. But more legitimate. The outcome held.", statChange: { social: 5, career: 5, mood: 5 } },
      { text: "Confront them directly and give them a chance to make it right.", score: { D: 5, V: 20, C: 5 }, outcome: "They were cornered. Some restitution happened. Not enough — but something.", statChange: { social: 8, mood: 8 } },
    ]
  },

  // ── FINANCE DILEMMAS ──
  {
    id: "d_taxloop", title: "The Gray Area",
    trigger: g => g.money > 2000,
    desc: "Your accountant shows you a legal tax loophole that would save you significant money. It's technically lawful — but clearly not the spirit of the law.",
    choices: [
      { text: "Use it. Legal is legal.", score: { D: 0, V: 0, C: 20 }, outcome: "You saved money. And felt a little less clean.", statChange: { money: 15, mood: -5 } },
      { text: "Decline. It's not right even if it's legal.", score: { D: 20, V: 10, C: 0 }, outcome: "You paid more. Slept better.", statChange: { mood: 8, wellness: 5 } },
      { text: "Research who the loop actually hurts before deciding.", score: { D: 10, V: 15, C: 10 }, outcome: "The answer surprised you. You made a more informed decision.", statChange: { mood: 5, education: 3 } },
    ]
  },
  {
    id: "d_invest_bad", title: "The Dirty Return",
    trigger: g => g.finance > 30 && g.money > 1000,
    desc: "A strong investment opportunity comes along. High returns — but the company has a known record of labor exploitation in its supply chain.",
    choices: [
      { text: "Invest. You can't control everything.", score: { D: 0, V: 0, C: 20 }, outcome: "Strong returns. The supply chain situation stayed the same.", statChange: { money: 20, mood: -5 } },
      { text: "Pass on it. Not on my conscience.", score: { D: 10, V: 15, C: 0 }, outcome: "You missed a good return. But didn't carry that weight.", statChange: { mood: 8, wellness: 5 } },
      { text: "Invest and write a public shareholder letter calling for reform.", score: { D: 5, V: 10, C: 15 }, outcome: "A small act. Probably not enough. But a voice from inside.", statChange: { money: 10, social: 8, career: 3 } },
    ]
  },
  {
    id: "d_return_money", title: "The Mistake",
    trigger: g => true,
    desc: "You check your bank account and $800 has appeared that you didn't earn — likely a payment error from a company. No one would ever know if you kept it.",
    choices: [
      { text: "Keep it. Their mistake, your luck.", score: { D: 0, V: 0, C: 15 }, outcome: "You kept it. Six months later, they found the error and requested it back.", statChange: { money: 8, mood: -5 } },
      { text: "Return it immediately.", score: { D: 20, V: 10, C: 0 }, outcome: "They were surprised. They remembered it.", statChange: { mood: 10, career: 5, social: 3 } },
      { text: "Contact them to clarify what happened first.", score: { D: 15, V: 10, C: 5 }, outcome: "It was indeed an error. You returned it. They sent a formal thank you.", statChange: { mood: 8, career: 5 } },
    ]
  },

  // ── WELLNESS DILEMMAS ──
  {
    id: "d_overtime_health", title: "The Grind vs The Body",
    trigger: g => !!g.currentJob && g.burnout > 40,
    desc: "Your family is struggling financially. You can take on significant overtime — but your doctor has already warned you that you're running your body too hard.",
    choices: [
      { text: "Take the overtime. Family comes first.", score: { D: 5, V: 0, C: 20 }, outcome: "More money. But your body started giving you clear signals.", statChange: { money: 20, burnout: 20, health: -10 } },
      { text: "Decline. You can't give from an empty cup.", score: { D: 15, V: 15, C: 0 }, outcome: "You protected yourself. Found other ways to help.", statChange: { burnout: -10, mood: 8, wellness: 8 } },
      { text: "Take it short-term, then reassess and step back.", score: { D: 5, V: 10, C: 15 }, outcome: "You did two months. Then stopped. The balance wasn't easy — but you managed.", statChange: { money: 10, burnout: 10, health: -5, mood: 3 } },
    ]
  },
  {
    id: "d_skip_therapy", title: "Skip or Stay",
    trigger: g => g.burnout > 30,
    desc: "You have a therapy appointment. You're stretched financially and the session costs more than you're comfortable with right now. But you know you need it.",
    choices: [
      { text: "Skip it. Save the money.", score: { D: 0, V: 0, C: 10 }, outcome: "You saved the cash. The things you needed to work through didn't go anywhere.", statChange: { money: 5, burnout: 8, mood: -5 } },
      { text: "Go. Mental health is not optional.", score: { D: 10, V: 20, C: 0 }, outcome: "You went. It was hard. It helped.", statChange: { money: -6, burnout: -15, mood: 12, wellness: 10 } },
      { text: "Look for sliding-scale or free options this week.", score: { D: 10, V: 15, C: 10 }, outcome: "It took calls. But you found something. Access to care is its own kind of fight.", statChange: { burnout: -8, mood: 8, wellness: 5 } },
    ]
  },
  {
    id: "d_sober", title: "The Social Pressure",
    trigger: g => g.social > 30,
    desc: "You're at a gathering with friends. The pressure to drink is strong — socially, everyone's going along. You've been trying to cut back for your health.",
    choices: [
      { text: "Join in. It's one night.", score: { D: 0, V: 0, C: 10 }, outcome: "One night became three. The resolve slipped.", statChange: { social: 8, health: -5, burnout: 5, mood: -3 } },
      { text: "Politely decline. Your health goals matter more.", score: { D: 10, V: 20, C: 0 }, outcome: "Some people respected it. Some didn't understand. You stayed true.", statChange: { social: -3, health: 5, wellness: 8, mood: 5 } },
      { text: "Have one drink and hold it. Navigate it socially.", score: { D: 5, V: 10, C: 10 }, outcome: "You threaded the needle. Not perfect. But present.", statChange: { social: 5, health: -2, mood: 3 } },
    ]
  },
  // ── HOUSING-TRIGGERED ──
  {
    id: "d_ethics_art_sale", title: "The Buyer You Don't Trust",
    trigger: g => g.currentEducation?.id === "arts" || g.currentJob?.moralType === "V",
    desc: "Someone offers you a large sum for creative work you've made — more than you'd make in months. But they're well-known for supporting causes that actively harm marginalized communities.",
    choices: [
      { text: "Sell it. Your work, your right to benefit.", score: { D: 0, V: 0, C: 20 }, outcome: "You took the money. Your work ended up on their wall. A complicated feeling.", statChange: { money: 25, mood: -8, wellness: -5 } },
      { text: "Decline. You won't fund their image.", score: { D: 10, V: 20, C: 0 }, outcome: "A principled no. A financial sacrifice. The work stayed yours.", statChange: { money: -2, mood: 10, wellness: 8 } },
      { text: "Sell it with a public statement about the cause you believe in.", score: { D: 5, V: 15, C: 15 }, outcome: "Complex. But you kept your voice. The money and the message coexisted.", statChange: { money: 15, social: 8, mood: 5 } },
    ]
  },
];

// ── SEASON-END DILEMMAS (generated from player state) ──
function getSeasonEndDilemma(gs) {
  const job = gs.currentJob;
  const edu = gs.currentEducation;
  const broke = gs.money < 300;
  const highBurnout = gs.burnout > 60;
  const goodFriends = gs.friends.length >= 2;
  const hasDebt = gs.debt > 0;

  const pool = [];

  if (job && broke) pool.push({
    id: `sed_${gs.day}`, title: "Desperate Times",
    desc: `You're working as a ${job.title} and running low on funds. A contact offers you under-the-table work — cash, no questions asked. It's not strictly legal, but it would cover your bills.`,
    choices: [
      { text: "Take it. Survival first.", score: { D: 0, V: 0, C: 20 }, outcome: "You got through the month. But you're in someone's pocket now.", statChange: { money: 15, mood: -5 } },
      { text: "Decline. Not going down that road.", score: { D: 20, V: 10, C: 0 }, outcome: "You stayed clean. Found another way. Barely.", statChange: { mood: 8, career: 3 } },
      { text: "Ask your employer for more hours first.", score: { D: 10, V: 10, C: 10 }, outcome: "They said yes — but conditionally. You made it work.", statChange: { money: 8, career: 5, burnout: 8 } },
    ]
  });

  if (highBurnout && job) pool.push({
    id: `sed_burnout_${gs.day}`, title: "The Breaking Point",
    desc: `You've been pushing hard at ${job.title} for months. Your body is telling you something. A mentor suggests you walk away — even for a week. But you can't really afford to.`,
    choices: [
      { text: "Take the break anyway. I need this.", score: { D: 5, V: 20, C: 0 }, outcome: "You rested. Came back different. More human.", statChange: { burnout: -25, mood: 15, money: -8, wellness: 12 } },
      { text: "Push through. I've done it before.", score: { D: 0, V: 0, C: 15 }, outcome: "You kept going. The cracks got bigger.", statChange: { burnout: 15, career: 8, health: -8 } },
      { text: "Take a shorter break and set work limits going forward.", score: { D: 10, V: 15, C: 10 }, outcome: "Not perfect. But a step toward sustainable.", statChange: { burnout: -12, mood: 8, career: 3 } },
    ]
  });

  if (hasDebt && edu) pool.push({
    id: `sed_debt_${gs.day}`, title: "The Weight of Debt",
    desc: `The student loan payments keep coming. You're in ${edu.name} and it's been worthwhile — but a friend offers you a shortcut: a job that pays well but conflicts with your values.`,
    choices: [
      { text: "Take the job. Pay off the debt.", score: { D: 0, V: 0, C: 20 }, outcome: "Debt shrinks. But something else does too.", statChange: { money: 20, debt: -500, mood: -8 } },
      { text: "Stay the course. The degree is worth it.", score: { D: 10, V: 15, C: 0 }, outcome: "Still in debt. Still in school. Still yourself.", statChange: { education: 5, mood: 6, wellness: 5 } },
      { text: "Find a part-time job that doesn't compromise the plan.", score: { D: 10, V: 10, C: 15 }, outcome: "Grinding. But the compromise held.", statChange: { money: 10, burnout: 8, education: 3 } },
    ]
  });

  if (goodFriends && gs.money > 3000) pool.push({
    id: `sed_friend_biz_${gs.day}`, title: "Friends & Money",
    desc: `Two close friends ask you to invest in their new venture. You believe in them — but mixing money and friendship has risks. If it fails, you could lose both.`,
    choices: [
      { text: "Invest. You believe in them.", score: { D: 5, V: 15, C: 15 }, outcome: "You put your money in. And your trust. Time will tell.", statChange: { money: -10, social: 12, mood: 5 } },
      { text: "Decline. Protect the friendship by keeping money out.", score: { D: 5, V: 10, C: 5 }, outcome: "They understood. The friendship was safe. You watched from the side.", statChange: { social: 5, mood: 3 } },
      { text: "Offer time and connections instead of money.", score: { D: 5, V: 20, C: 10 }, outcome: "Your support was real without the financial risk. That meant something.", statChange: { social: 15, mood: 8 } },
    ]
  });

  // Fallback generic dilemma
  if (!pool.length) pool.push({
    id: `sed_generic_${gs.day}`, title: "A Line in the Sand",
    desc: `End of another season. Someone in your life asks you to compromise on something you've quietly held as a value. It's small — but it wouldn't be the first time.`,
    choices: [
      { text: "Compromise this time. It's not worth the conflict.", score: { D: 0, V: 5, C: 10 }, outcome: "You let it go. It passed. But you noticed.", statChange: { social: 5, mood: -3 } },
      { text: "Hold the line. Values aren't negotiable.", score: { D: 20, V: 10, C: 0 }, outcome: "It was uncomfortable. But you stayed whole.", statChange: { mood: 8, wellness: 5 } },
      { text: "Name what you're feeling without demanding they change.", score: { D: 10, V: 20, C: 5 }, outcome: "They listened. Surprised. The conversation mattered.", statChange: { social: 8, mood: 8 } },
    ]
  });

  return pool[Math.floor(Math.random() * pool.length)];
}

const MORAL_DILEMMAS = DILEMMA_POOL; // alias for backward compat

const FRIENDS = [
  { id: "alex", name: "Alex", emoji: "🧑", personality: "Adventurous", moralType: "C" },
  { id: "jordan", name: "Jordan", emoji: "👤", personality: "Thoughtful", moralType: "D" },
  { id: "sam", name: "Sam", emoji: "🫂", personality: "Creative", moralType: "V" },
];

/* ─────────────────────────────────────────────
   INITIAL STATE
───────────────────────────────────────────── */
function createInitialState(name, avatar, upbringing, traits) {
  return {
    name, avatar,
    day: 1, season: 1,
    energy: 100,
    maxEnergy: 100,
    money: upbringing.startMoney,
    savings: 0,
    debt: 0,
    dailyDebtPayment: 0,
    personalLoan: 0,
    personalLoanPayment: 0,
    // Cost breakdown — all start at 0, accrue as player makes choices
    dailyExpense: 0,       // total (computed from breakdown below)
    costRent: 0,           // housing
    costTransport: 0,      // vehicle
    costFood: 8,           // baseline food (~$8/day subsistence)
    costStudy: 0,          // active study daily fee
    hunger: 70, thirst: 75, health: 85,
    mood: upbringing.happinessBonus + 60,
    burnout: 5, wellness: 50,
    education: 20, career: 0,
    finance: upbringing.financeBonus || 20,
    social: upbringing.socialBonus + 30,
    upbringing, traits, miniTraits: [],
    currentJob: null, currentEducation: null,
    educationProgress: 0,
    ethicsD: 0, ethicsV: 0, ethicsC: 0,
    moralChoicesMade: 0, thirdTraitUnlocked: false,
    friends: [],
    friendsAvailable: [...FRIENDS],
    feed: [{ day: 1, season: 1, msg: `${name} just graduated. A new chapter starts now.` }],
    dilemmasSeenIds: [],
    currentDilemma: null,
    sleepLog: [],
    purchasedItems: [],
    phase: "playing",
    quoteIndex: 0,
    jobsAvailable: JOBS.slice(0, 4),
    pendingFriendOffer: null,
    notifications: [],
    workedToday: false,
    studiedToday: false,
    workDaysThisSeason: 0,
    schoolDaysThisSeason: 0,
    lastAttendanceCheckSeason: 1,
    housing: null,
    vehicle: null,
    wellnessActivitiesToday: [],
    lastDilemmaDay: 0,
    promotionProgress: 0,
  };
}

// Helper: compute total daily expense from breakdown fields
function computeDailyExpense(g) {
  return (g.costRent || 0) + (g.costTransport || 0) + (g.costFood || 8) + (g.costStudy || 0) + (g.dailyDebtPayment || 0);
}

const SEASONS = ["Spring", "Summer", "Fall", "Winter"];
const SEASON_EMOJI = ["🌸", "☀️", "🍂", "❄️"];

/* ─────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────── */
export default function MoralForge() {
  const [screen, setScreen] = useState("title");
  const [createStep, setCreateStep] = useState(0);
  const [charName, setCharName] = useState("");
  const [charAvatar, setCharAvatar] = useState("😊");
  const [selUpbringing, setSelUpbringing] = useState(null);
  const [selTraits, setSelTraits] = useState([]);
  const [gs, setGs] = useState(null);
  const [activeApp, setActiveApp] = useState("home");
  const [toast, setToast] = useState(null);
  const [enrollModal, setEnrollModal] = useState(null);

  const showToast = useCallback((msg, color = T.neon) => {
    setToast({ msg, color, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const upd = useCallback((fn) => setGs(prev => {
    const next = typeof fn === "function" ? fn(prev) : { ...prev, ...fn };
    return next;
  }), []);

  const log = useCallback((msg) => upd(g => ({
    ...g, feed: [{ day: g.day, season: g.season, msg }, ...g.feed.slice(0, 59)]
  })), [upd]);

  // ── ACTIONS ──
  const doWork = () => {
    if (!gs.currentJob) return showToast("No job! Head to Career to apply.", T.pink);
    const { energy: cost, pay, burnout: bCost, social: sGain, moralType, title } = gs.currentJob;
    if (gs.energy < cost) return showToast(`Need ${cost} EP. You only have ${gs.energy}.`, T.pink);
    if (gs.workedToday) return showToast("Already worked today.", T.amber);
    upd(g => {
      const newPromo = Math.min(100, (g.promotionProgress || 0) + 4);
      const promoted = newPromo >= 100;
      return {
        ...g,
        money: g.money + pay,
        career: Math.min(100, g.career + 3),
        promotionProgress: promoted ? 0 : newPromo,
        currentJob: promoted ? { ...g.currentJob, pay: Math.round(g.currentJob.pay * 1.15), title: g.currentJob.title + " II" } : g.currentJob,
        burnout: Math.min(100, g.burnout + bCost),
        social: Math.min(100, g.social + sGain * 0.3),
        hunger: Math.max(0, g.hunger - 15),
        thirst: Math.max(0, g.thirst - 10),
        energy: Math.max(0, g.energy - cost),
        ethicsD: g.ethicsD + (moralType === "D" ? 2 : 0),
        ethicsV: g.ethicsV + (moralType === "V" ? 2 : 0),
        ethicsC: g.ethicsC + (moralType === "C" ? 2 : 0),
        workedToday: true,
        workDaysThisSeason: g.workDaysThisSeason + 1,
        feed: [{ day: g.day, msg: promoted ? `${g.name} got promoted at ${title}! Pay is now $${Math.round(pay * 1.15)}/day.` : `${g.name} worked a shift at ${title}. Earned $${pay}.` }, ...g.feed.slice(0, 59)],
      };
    });
    showToast(`Worked! +$${pay} | −${cost}EP`, T.neon);
  };

  const doStudy = () => {
    if (!gs.currentEducation) return showToast("Not enrolled! Go to School.", T.pink);
    if (gs.energy < 30) return showToast("Need 30 EP to study.", T.pink);
    if (gs.studiedToday) return showToast("Already studied today.", T.amber);
    upd(g => {
      const newProg = g.educationProgress + 5;
      const done = newProg >= 100;
      const eduName = g.currentEducation?.name;
      return {
        ...g,
        education: Math.min(100, g.education + 5),
        educationProgress: done ? 0 : newProg,
        currentEducation: done ? null : g.currentEducation,
        costStudy: done ? 0 : g.costStudy,
        energy: Math.max(0, g.energy - 30),
        burnout: Math.min(100, g.burnout + 4),
        finance: done ? Math.min(100, g.finance + 15) : g.finance,
        career: done ? Math.min(100, g.career + 10) : g.career,
        studiedToday: true,
        schoolDaysThisSeason: g.schoolDaysThisSeason + 1,
        feed: [{ day: g.day, msg: done ? `${g.name} completed ${eduName}! 🎓` : `${g.name} studied ${eduName}.` }, ...g.feed.slice(0, 59)],
      };
    });
    showToast("Studied! +5 Education | −30EP", T.amber);
  };

  const doRest = () => {
    upd(g => ({
      ...g,
      mood: Math.min(100, g.mood + 8),
      burnout: Math.max(0, g.burnout - 12),
      wellness: Math.min(100, g.wellness + 5),
      ethicsV: g.ethicsV + 1,
      feed: [{ day: g.day, msg: `${g.name} took time to rest and recharge.` }, ...g.feed.slice(0, 59)],
    }));
    showToast("Rested. +Mood, −Burnout, +Wellness", T.purple);
  };

  const doSocialize = (friendId) => {
    if (gs.energy < 15) return showToast("Too drained to socialize. Need 15EP.", T.pink);
    upd(g => {
      const fi = g.friends.findIndex(f => f.id === friendId);
      if (fi === -1) return g;
      const friends = [...g.friends];
      const friend = friends[fi];
      friends[fi] = { ...friend, friendshipScore: Math.min(100, friend.friendshipScore + 10) };
      return {
        ...g,
        social: Math.min(100, g.social + 8),
        mood: Math.min(100, g.mood + 6),
        friends,
        energy: Math.max(0, g.energy - 15),
        feed: [{ day: g.day, msg: `${g.name} hung out with ${friend.name}.` }, ...g.feed.slice(0, 59)],
      };
    });
    showToast(`Hung out with ${gs.friends.find(f => f.id === friendId)?.name}! +Social | −15EP`, T.pink);
  };

  const addFriend = (f) => {
    upd(g => ({
      ...g,
      friends: [...g.friends, { ...f, friendshipScore: 20 }],
      friendsAvailable: g.friendsAvailable.filter(x => x.id !== f.id),
      social: Math.min(100, g.social + 5),
      pendingFriendOffer: null,
      feed: [{ day: g.day, msg: `${g.name} made a new friend: ${f.name}!` }, ...g.feed.slice(0, 59)],
    }));
    showToast(`New friend: ${f.name}! 🎉`, T.pink);
  };

  const buyItem = (item) => {
    if (gs.money < item.price) return showToast("Not enough money.", T.pink);
    const epCost = item.category === "energy" ? 0 : (item.timeCost || 0);
    if (epCost > 0 && gs.energy < epCost) return showToast(`Need ${epCost}EP for this.`, T.pink);
    upd(g => {
      const c = { money: g.money - item.price };
      if (epCost > 0) c.energy = Math.max(0, g.energy - epCost);
      if (item.energyGain) c.energy = Math.min(100, (c.energy !== undefined ? c.energy : g.energy) + item.energyGain);
      if (item.statChanges) {
        Object.entries(item.statChanges).forEach(([k, v]) => {
          if (k === "burnout") c.burnout = Math.max(0, Math.min(100, g.burnout + v));
          else if (k === "energy") c.energy = Math.min(100, (c.energy !== undefined ? c.energy : g.energy) + v);
          else if (k in g) c[k] = Math.max(0, Math.min(100, g[k] + v));
        });
      }
      const pItems = item.consumable ? g.purchasedItems : [...g.purchasedItems, item.id];
      return {
        ...g, ...c, purchasedItems: pItems,
        feed: [{ day: g.day, msg: `${g.name} bought ${item.name}.` }, ...g.feed.slice(0, 59)],
      };
    });
    showToast(`${item.emoji} ${item.name}! −$${item.price}${item.energyGain ? ` +${item.energyGain}EP` : ""}`, T.green);
  };

  const hireJob = (job) => {
    upd(g => ({
      ...g,
      currentJob: job,
      promotionProgress: 0,
      jobsAvailable: g.jobsAvailable.filter(j => j.id !== job.id),
      feed: [{ day: g.day, msg: `${g.name} started as ${job.title}!` }, ...g.feed.slice(0, 59)],
    }));
    showToast(`Now: ${job.title} 💼`, T.blue);
  };

  const doWellnessActivity = (activity) => {
    if (gs.energy < activity.epCost) return showToast(`Need ${activity.epCost}EP for this.`, T.pink);
    upd(g => {
      const c = { energy: Math.max(0, g.energy - activity.epCost) };
      Object.entries(activity.statChanges).forEach(([k, v]) => {
        if (k === "burnout") c.burnout = Math.max(0, Math.min(100, g.burnout + v));
        else if (k in g) c[k] = Math.max(0, Math.min(100, g[k] + v));
      });
      c.ethicsD = g.ethicsD + (activity.ethics === "D" ? 2 : 0);
      c.ethicsV = g.ethicsV + (activity.ethics === "V" ? 3 : 0);
      c.ethicsC = g.ethicsC + (activity.ethics === "C" ? 2 : 0);
      return {
        ...g, ...c,
        wellnessActivitiesToday: [...(g.wellnessActivitiesToday || []), activity.id],
        feed: [{ day: g.day, msg: `${g.name} did ${activity.name}.` }, ...g.feed.slice(0, 59)],
      };
    });
    showToast(`${activity.emoji} ${activity.name} | −${activity.epCost}EP`, T.purple);
  };

  const buyHousing = (housing) => {
    if (gs.money < housing.cost) return showToast("Not enough money.", T.pink);
    upd(g => ({
      ...g,
      money: g.money - housing.cost,
      housing: housing,
      costRent: housing.dailyCost,
      mood: Math.min(100, g.mood + housing.moodBonus),
      wellness: Math.min(100, g.wellness + housing.wellnessBonus),
      feed: [{ day: g.day, msg: `${g.name} moved into ${housing.name}.` }, ...g.feed.slice(0, 59)],
    }));
    showToast(`🏠 Moved to ${housing.name}! +$${housing.dailyCost}/day rent`, T.neon);
  };

  const buyVehicle = (vehicle) => {
    if (gs.money < vehicle.cost) return showToast("Not enough money.", T.pink);
    upd(g => ({
      ...g,
      money: g.money - vehicle.cost,
      vehicle: vehicle,
      costTransport: vehicle.dailyCost,
      mood: Math.min(100, g.mood + vehicle.moodBonus),
      feed: [{ day: g.day, msg: `${g.name} bought a ${vehicle.name}.` }, ...g.feed.slice(0, 59)],
    }));
    showToast(`🚗 Got a ${vehicle.name}!${vehicle.dailyCost > 0 ? ` +$${vehicle.dailyCost}/day` : ""}`, T.blue);
  };

  const upgradeVehicle = (vehicle) => {
    if (gs.money < vehicle.cost) return showToast("Not enough money.", T.pink);
    upd(g => ({
      ...g,
      money: g.money - vehicle.cost,
      vehicle: vehicle,
      costTransport: vehicle.dailyCost,
      mood: Math.min(100, g.mood + vehicle.moodBonus),
      feed: [{ day: g.day, msg: `${g.name} upgraded to a ${vehicle.name}.` }, ...g.feed.slice(0, 59)],
    }));
    showToast(`🚗 Upgraded to ${vehicle.name}!`, T.blue);
  };

  const enrollEdu = (edu) => {
    setEnrollModal(edu);
  };

  const confirmEnroll = (edu, payUpfront) => {
    setEnrollModal(null);
    const studyDailyCost = 15;
    if (payUpfront) {
      const discountedCost = Math.round(edu.cost * 0.9); // 10% off for paying upfront
      if (gs.money < discountedCost) return showToast(`Need $${discountedCost} (10% off). You have $${Math.round(gs.money)}.`, T.pink);
      upd(g => ({
        ...g, currentEducation: edu, educationProgress: 0,
        money: g.money - discountedCost,
        costStudy: studyDailyCost,
        feed: [{ day: g.day, msg: `${g.name} enrolled in ${edu.name} — paid $${discountedCost.toLocaleString()} upfront (10% discount!).` }, ...g.feed.slice(0, 59)],
      }));
      showToast(`Enrolled in ${edu.emoji} ${edu.name}! Saved $${edu.cost - discountedCost} with upfront payment.`, T.amber);
    } else {
      const deposit = Math.round(edu.cost * 0.05);
      if (gs.money < deposit) return showToast(`Need at least $${deposit} deposit!`, T.pink);
      const loanAmount = edu.cost - deposit;
      const dailyPayment = parseFloat((loanAmount / 3650).toFixed(2));
      upd(g => ({
        ...g, currentEducation: edu, educationProgress: 0,
        money: g.money - deposit,
        debt: g.debt + loanAmount,
        dailyDebtPayment: g.dailyDebtPayment + dailyPayment,
        costStudy: studyDailyCost,
        feed: [{ day: g.day, msg: `${g.name} enrolled in ${edu.name} with a student loan. $${loanAmount.toLocaleString()} owed.` }, ...g.feed.slice(0, 59)],
      }));
      showToast(`Enrolled! Student loan: $${loanAmount.toLocaleString()} · −$${dailyPayment.toFixed(2)}/day`, T.amber);
    }
  };

  const makeChoice = (dilemma, choiceIdx) => {
    const choice = dilemma.choices[choiceIdx];
    upd(g => {
      const cnt = g.moralChoicesMade + 1;
      const changes = {
        ethicsD: g.ethicsD + choice.score.D, ethicsV: g.ethicsV + choice.score.V, ethicsC: g.ethicsC + choice.score.C,
        moralChoicesMade: cnt, currentDilemma: null, phase: "playing",
        dilemmasSeenIds: [...g.dilemmasSeenIds, dilemma.id],
        thirdTraitUnlocked: cnt >= 3 ? true : g.thirdTraitUnlocked,
      };
      Object.entries(choice.statChange || {}).forEach(([k, v]) => {
        if (k === "burnout") changes.burnout = Math.max(0, Math.min(100, g.burnout + v));
        else if (k === "finance") changes.money = g.money + v * 5;
        else if (k in g) changes[k] = Math.max(0, Math.min(100, g[k] + v));
      });
      changes.feed = [{ day: g.day, msg: `${g.name} faced "${dilemma.title}": ${choice.outcome}` }, ...g.feed.slice(0, 59)];
      return { ...g, ...changes };
    });
    showToast(choice.outcome, T.purple);
  };

  // ── GENERIC TAB SUB-ACTIONS ──
  // Each action: { id, epCost, moneyCost, moneyGain, statChanges, promoGain, msg, toast }
  const doAction = (action) => {
    if (action.epCost && gs.energy < action.epCost) return showToast(`Need ${action.epCost}EP.`, T.pink);
    if (action.moneyCost && gs.money < action.moneyCost) return showToast("Not enough money.", T.pink);
    upd(g => {
      const c = {};
      if (action.epCost) c.energy = Math.max(0, g.energy - action.epCost);
      if (action.moneyCost) c.money = g.money - action.moneyCost;
      if (action.moneyGain) c.money = (c.money ?? g.money) + action.moneyGain;
      if (action.savingsGain) c.savings = Math.max(0, g.savings + action.savingsGain);
      // Special: move_savings action transfers money to savings
      if (action.id === "move_savings" && action.moneyCost) c.savings = g.savings + action.moneyCost;
      if (action.promoGain) {
        const newPromo = Math.min(100, (g.promotionProgress || 0) + action.promoGain);
        const promoted = newPromo >= 100;
        c.promotionProgress = promoted ? 0 : newPromo;
        if (promoted) c.currentJob = { ...g.currentJob, pay: Math.round(g.currentJob.pay * 1.15), title: g.currentJob.title.replace(/ II$| III$/, "") + (g.currentJob.title.includes(" III") ? " IV" : g.currentJob.title.includes(" II") ? " III" : " II") };
      }
      if (action.studyGain) {
        const newProg = Math.min(100, g.educationProgress + action.studyGain);
        const done = newProg >= 100;
        c.educationProgress = done ? 0 : newProg;
        c.education = Math.min(100, g.education + action.studyGain * 0.4);
        if (done) { c.currentEducation = null; c.costStudy = 0; c.finance = Math.min(100, g.finance + 15); c.career = Math.min(100, g.career + 10); }
      }
      if (action.statChanges) {
        Object.entries(action.statChanges).forEach(([k, v]) => {
          if (k === "burnout") c.burnout = Math.max(0, Math.min(100, g.burnout + v));
          else if (k in g) c[k] = Math.max(0, Math.min(100, (c[k] ?? g[k]) + v));
        });
      }
      if (action.ethicsType) {
        c.ethicsD = g.ethicsD + (action.ethicsType === "D" ? 2 : 0);
        c.ethicsV = g.ethicsV + (action.ethicsType === "V" ? 2 : 0);
        c.ethicsC = g.ethicsC + (action.ethicsType === "C" ? 2 : 0);
      }
      c.feed = [{ day: g.day, msg: action.msg || action.toast || "Action completed." }, ...g.feed.slice(0, 59)];
      return { ...g, ...c };
    });
    showToast(action.toast || "Done!", T.neon);
  };

  const doPersonalLoan = (amount) => {
    if (amount <= 0) return showToast("Invalid loan amount.", T.pink);
    if (amount > 5000) return showToast("Max personal loan is $5,000.", T.pink);
    // 18% APR, paid over 3 years daily = amount * 1.18 / (3*365)
    const totalRepay = Math.round(amount * 1.18);
    const dailyPmt = parseFloat((totalRepay / (3 * 365)).toFixed(2));
    upd(g => ({
      ...g,
      money: g.money + amount,
      personalLoan: (g.personalLoan || 0) + totalRepay,
      personalLoanPayment: (g.personalLoanPayment || 0) + dailyPmt,
      feed: [{ day: g.day, msg: `${g.name} took a $${amount} personal loan (18% APR). Repaying $${dailyPmt.toFixed(2)}/day.` }, ...g.feed.slice(0, 59)],
    }));
    showToast(`Loan approved! +$${amount} · −$${dailyPmt.toFixed(2)}/day (18% APR)`, T.amber);
  };

  const endDay = () => {
    upd(g => {
      const nd = g.day + 1;
      const si = Math.floor((nd - 1) / 7) % 4;
      const sn = Math.floor((nd - 1) / 7) + 1;
      const offerF = g.friendsAvailable.length > 0 && Math.random() < 0.3;
      const hungerDecay = Math.max(0, g.hunger - 20);
      const thirstDecay = Math.max(0, g.thirst - 25);

      // ── BURNOUT DAMAGE ──
      const burnoutDamage = g.burnout >= 95 ? 2 : 0;
      const newMaxEnergy = Math.max(20, (g.maxEnergy || 100) - burnoutDamage);

      // ── DAILY EXPENSE BREAKDOWN ──
      const costRent = g.costRent || 0;
      const costTransport = g.costTransport || 0;
      const costFood = g.costFood || 8;
      const costStudy = g.currentEducation ? (g.costStudy || 15) : 0;
      const debtPayment = g.debt > 0 ? (g.dailyDebtPayment || 0) : 0;
      const personalLoanPayment = (g.personalLoan || 0) > 0 ? (g.personalLoanPayment || 0) : 0;
      const totalExpenses = costRent + costTransport + costFood + costStudy + debtPayment + personalLoanPayment;

      // ── DEBT REPAYMENT ──
      const studentDebtPayment = g.debt > 0 ? Math.min(g.debt, g.dailyDebtPayment || 0) : 0;
      const newDebt = Math.max(0, g.debt - studentDebtPayment);
      const newPersonalLoan = Math.max(0, (g.personalLoan || 0) - (g.personalLoanPayment || 0));
      const newPersonalLoanPmt = newPersonalLoan === 0 ? 0 : (g.personalLoanPayment || 0);
      // Recompute combined daily debt payment based on remaining balances
      const studentDailyPmt = newDebt > 0 ? (studentDebtPayment > 0 ? studentDebtPayment : 0) : 0;
      const newDailyDebtPmt = studentDailyPmt + newPersonalLoanPmt;

      // ── DILEMMA SELECTION ──
      const endingSeasonDay = g.day % 7 === 0;
      let nextD = null;
      const alreadySeen = new Set(g.dilemmasSeenIds);
      if (endingSeasonDay) {
        nextD = getSeasonEndDilemma(g);
      } else if (nd - (g.lastDilemmaDay || 0) >= 2) {
        const contextual = DILEMMA_POOL.filter(d => !alreadySeen.has(d.id) && d.trigger && d.trigger(g));
        const fallback = DILEMMA_POOL.filter(d => !alreadySeen.has(d.id));
        const candidates = contextual.length > 0 ? contextual : fallback;
        if (candidates.length > 0) nextD = candidates[Math.floor(Math.random() * candidates.length)];
      }

      // ── ATTENDANCE CHECK ──
      let careerPenalty = 0, educationPenalty = 0, attendanceNotifs = [];
      let resetWorkDays = g.workDaysThisSeason;
      let resetSchoolDays = g.schoolDaysThisSeason;
      const WORK_REQUIRED = 4;
      const SCHOOL_REQUIRED = 3;
      if (endingSeasonDay) {
        if (g.currentJob) {
          if (g.workDaysThisSeason < WORK_REQUIRED) {
            careerPenalty = (WORK_REQUIRED - g.workDaysThisSeason) * 4;
            attendanceNotifs.push({ msg: `📋 Work: ${g.workDaysThisSeason}/${WORK_REQUIRED} days. −${careerPenalty} career.`, color: T.red });
          } else {
            attendanceNotifs.push({ msg: `✓ Work attendance met! ${g.workDaysThisSeason}/${WORK_REQUIRED} days.`, color: T.green });
          }
          resetWorkDays = 0;
        }
        if (g.currentEducation) {
          if (g.schoolDaysThisSeason < SCHOOL_REQUIRED) {
            educationPenalty = (SCHOOL_REQUIRED - g.schoolDaysThisSeason) * 5;
            attendanceNotifs.push({ msg: `📋 School: ${g.schoolDaysThisSeason}/${SCHOOL_REQUIRED} days. −${educationPenalty} edu.`, color: T.red });
          } else {
            attendanceNotifs.push({ msg: `✓ School attendance met! ${g.schoolDaysThisSeason}/${SCHOOL_REQUIRED} days.`, color: T.green });
          }
          resetSchoolDays = 0;
        }
      }

      // ── NOTIFICATIONS ──
      const notifs = [...attendanceNotifs];
      if (totalExpenses > 0) notifs.push({ msg: `💸 Daily costs: −$${totalExpenses.toFixed(0)}`, color: T.amber });
      if (hungerDecay < 20) notifs.push({ msg: "🍽️ You're very hungry!", color: T.amber });
      if (thirstDecay < 20) notifs.push({ msg: "💧 Seriously, drink something.", color: T.blue });
      if (g.burnout >= 95) notifs.push({ msg: `🔥 CRITICAL BURNOUT! Energy max dropped to ${newMaxEnergy}EP!`, color: T.red });
      else if (g.burnout >= 75) notifs.push({ msg: "🔥 Burnout is critical. Rest immediately.", color: T.red });
      const newBalance = g.money - totalExpenses;
      if (newBalance < 0) notifs.push({ msg: "⚠ You're in the red! Find income fast.", color: T.red });

      return {
        ...g, day: nd, season: sn,
        energy: newMaxEnergy,
        maxEnergy: newMaxEnergy,
        hunger: hungerDecay, thirst: thirstDecay,
        currentDilemma: nextD, phase: nextD ? "dilemma" : "playing",
        quoteIndex: (g.quoteIndex + 1) % MORAL_QUOTES.length,
        pendingFriendOffer: offerF ? g.friendsAvailable[0] : null,
        notifications: notifs,
        debt: newDebt,
        personalLoan: newPersonalLoan,
        personalLoanPayment: newPersonalLoanPmt,
        dailyDebtPayment: newDailyDebtPmt,
        dailyExpense: totalExpenses,
        costStudy: g.currentEducation ? costStudy : 0,
        money: newBalance,
        career: Math.max(0, g.career - careerPenalty),
        education: Math.max(0, g.education - educationPenalty),
        educationProgress: educationPenalty > 0 ? Math.max(0, g.educationProgress - educationPenalty) : g.educationProgress,
        workedToday: false,
        studiedToday: false,
        wellnessActivitiesToday: [],
        lastDilemmaDay: nextD ? nd : g.lastDilemmaDay,
        workDaysThisSeason: resetWorkDays,
        schoolDaysThisSeason: resetSchoolDays,
        lastAttendanceCheckSeason: endingSeasonDay ? sn : g.lastAttendanceCheckSeason,
        feed: [{ day: g.day, msg: burnoutDamage > 0 ? `${g.name} is burning out — max energy down to ${newMaxEnergy}EP.` : `${g.name} ended Day ${g.day}.` }, ...g.feed.slice(0, 59)],
      };
    });
    setActiveApp("home");
  };

  const startGame = () => {
    setGs(createInitialState(charName || "Player", charAvatar, selUpbringing, selTraits));
    setScreen("game");
  };

  if (screen === "title") return <TitleScreen onStart={() => setScreen("create")} />;
  if (screen === "create") return <CreateScreen step={createStep} setStep={setCreateStep} name={charName} setName={setCharName} avatar={charAvatar} setAvatar={setCharAvatar} upbringing={selUpbringing} setUpbringing={setSelUpbringing} traits={selTraits} setTraits={setSelTraits} onStart={startGame} />;
  if (screen === "reveal" && gs) return <RevealScreen gs={gs} onRestart={() => { setScreen("title"); setGs(null); setCreateStep(0); setSelTraits([]); setSelUpbringing(null); }} />;
  if (!gs) return null;

  return (
    <GameScreen
      gs={gs} activeApp={activeApp} setActiveApp={setActiveApp} toast={toast}
      onWork={doWork} onStudy={doStudy} onRest={doRest}
      onSocialize={doSocialize} onAddFriend={addFriend}
      onBuyItem={buyItem} onHireJob={hireJob} onEnrollEducation={enrollEdu}
      onMakeChoice={makeChoice} onEndDay={endDay}
      onEndGame={() => setScreen("reveal")}
      enrollModal={enrollModal} onConfirmEnroll={confirmEnroll} onCancelEnroll={() => setEnrollModal(null)}
      onWellnessActivity={doWellnessActivity}
      onBuyHousing={buyHousing} onBuyVehicle={buyVehicle} onUpgradeVehicle={upgradeVehicle}
      onAction={doAction} onPersonalLoan={doPersonalLoan}
    />
  );
}

/* ─────────────────────────────────────────────
   TITLE SCREEN
───────────────────────────────────────────── */
function TitleScreen({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", padding: 24, position: "relative", overflow: "hidden" }}>
      <style>{css}</style>
      {/* bg grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(0,245,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,212,0.03) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
      {/* glow orbs */}
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,245,212,0.08) 0%, transparent 70%)", top: "10%", left: "20%", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,45,120,0.06) 0%, transparent 70%)", bottom: "15%", right: "15%", filter: "blur(40px)" }} />

      <div style={{ textAlign: "center", maxWidth: 460, position: "relative", animation: "fadeIn 0.8s ease" }}>
        <div style={{ fontSize: 72, marginBottom: 12, animation: "float 3s ease-in-out infinite" }}>⚖️</div>
        <h1 style={{
          fontSize: 72, fontWeight: 800, letterSpacing: "-4px", lineHeight: 0.9,
          background: `linear-gradient(135deg, ${T.neon}, ${T.blue}, ${T.pink})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 8,
        }}>MORAL<br />FORGE</h1>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.neon, letterSpacing: 4, textTransform: "uppercase", marginBottom: 32, opacity: 0.7 }}>
          live · choose · become
        </p>
        <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.8, marginBottom: 40, fontWeight: 400 }}>
          Every choice you make shapes who you are. Live a life. Make hard decisions.
          At the end, discover the philosophy that guided you — revealed only when it's over.
        </p>
        <button onClick={onStart} style={{
          padding: "16px 52px", borderRadius: 100, border: `1px solid ${T.neon}`,
          background: `linear-gradient(135deg, rgba(0,245,212,0.15), rgba(58,134,255,0.15))`,
          color: T.neon, fontSize: 16, fontWeight: 700, cursor: "pointer",
          fontFamily: "'Syne', sans-serif", letterSpacing: 2, textTransform: "uppercase",
          transition: "all 0.3s", boxShadow: `0 0 30px rgba(0,245,212,0.2)`,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = `rgba(0,245,212,0.2)`; e.currentTarget.style.boxShadow = `0 0 50px rgba(0,245,212,0.4)`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, rgba(0,245,212,0.15), rgba(58,134,255,0.15))`; e.currentTarget.style.boxShadow = `0 0 30px rgba(0,245,212,0.2)`; }}
        >Begin Your Life</button>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.faint, marginTop: 20 }}>
          a life simulator about ethics, choices, and identity
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CREATE SCREEN
───────────────────────────────────────────── */
function CreateScreen({ step, setStep, name, setName, avatar, setAvatar, upbringing, setUpbringing, traits, setTraits, onStart }) {
  const avatars = ["😊", "😎", "🤓", "😏", "🙂", "😄", "🧑‍💼", "👩‍🎓", "👨‍🎓", "🧑‍🎤"];
  const toggleTrait = t => {
    if (traits.find(x => x.id === t.id)) setTraits(traits.filter(x => x.id !== t.id));
    else if (traits.length < 2) setTraits([...traits, t]);
  };
  const canGo = [name.length > 0, !!upbringing, traits.length === 2];
  const steps = ["Identity", "Upbringing", "Traits"];

  const typeColors = { D: T.blue, V: T.pink, C: T.neon };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", padding: 24 }}>
      <style>{css}</style>
      <div style={{ maxWidth: 500, width: "100%", animation: "fadeIn 0.4s ease" }}>
        {/* Step indicators */}
        <div style={{ display: "flex", gap: 8, marginBottom: 36, justifyContent: "center" }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: i <= step ? T.neon : "transparent", border: `2px solid ${i <= step ? T.neon : T.border}`,
                color: i <= step ? T.bg : T.muted, fontSize: 12, fontWeight: 800, transition: "all 0.3s",
              }}>{i + 1}</div>
              <span style={{ fontSize: 13, color: i === step ? T.text : T.faint, fontWeight: i === step ? 700 : 400 }}>{s}</span>
              {i < 2 && <div style={{ width: 24, height: 1, background: T.border }} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: T.text, marginBottom: 6 }}>Who are you?</h2>
            <p style={{ color: T.muted, fontSize: 14, marginBottom: 24 }}>This is just the beginning.</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name..."
              style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: `1px solid ${T.borderBright}`, background: T.surface, color: T.text, fontSize: 16, fontFamily: "'Syne', sans-serif", outline: "none", marginBottom: 24 }} />
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>Choose your avatar</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {avatars.map(a => (
                <button key={a} onClick={() => setAvatar(a)} style={{
                  fontSize: 28, padding: "8px 12px", borderRadius: 12,
                  background: avatar === a ? "rgba(0,245,212,0.15)" : T.surface,
                  border: `2px solid ${avatar === a ? T.neon : T.border}`,
                  cursor: "pointer", transition: "all 0.2s",
                }}>{a}</button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: T.text, marginBottom: 6 }}>Your roots</h2>
            <p style={{ color: T.muted, fontSize: 14, marginBottom: 24 }}>Where you start shapes where you go.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {UPBRINGINGS.map(u => (
                <div key={u.id} onClick={() => setUpbringing(u)} style={{
                  padding: "18px 20px", borderRadius: 16, cursor: "pointer",
                  border: `1px solid ${upbringing?.id === u.id ? T.neon : T.border}`,
                  background: upbringing?.id === u.id ? "rgba(0,245,212,0.08)" : T.surface,
                  transition: "all 0.2s",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: T.text }}>{u.name}</div>
                  <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{u.tag}</div>
                  <div style={{ color: T.green, fontSize: 13, marginTop: 8, fontFamily: "'DM Mono', monospace" }}>Starting balance: ${u.startMoney.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: T.text, marginBottom: 6 }}>Core traits</h2>
            <p style={{ color: T.muted, fontSize: 14, marginBottom: 4 }}>Pick 2 that define how you move through life.</p>
            <p style={{ color: T.faint, fontSize: 12, marginBottom: 20, fontFamily: "'DM Mono', monospace" }}>{traits.length}/2 selected</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto" }}>
              {CORE_TRAITS.map(t => {
                const sel = !!traits.find(x => x.id === t.id);
                return (
                  <div key={t.id} onClick={() => toggleTrait(t)} style={{
                    padding: "14px 16px", borderRadius: 14, cursor: !sel && traits.length >= 2 ? "not-allowed" : "pointer",
                    border: `1px solid ${sel ? typeColors[t.type] : T.border}`,
                    background: sel ? `${typeColors[t.type]}12` : T.surface,
                    opacity: !sel && traits.length >= 2 ? 0.4 : 1, transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, color: T.text }}>{t.name}</span>
                      {sel && <span style={{ color: typeColors[t.type], fontSize: 14 }}>✓</span>}
                    </div>
                    <div style={{ color: T.muted, fontSize: 13, marginTop: 3 }}>{t.desc}</div>
                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                      <span style={{ color: T.green, fontSize: 12 }}>+ {t.bonus}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{
              flex: 1, padding: "14px", borderRadius: 100, border: `1px solid ${T.border}`,
              background: "transparent", color: T.muted, fontSize: 14, cursor: "pointer", fontFamily: "'Syne', sans-serif",
            }}>← Back</button>
          )}
          {step < 2 ? (
            <button onClick={() => canGo[step] && setStep(step + 1)} style={{
              flex: 2, padding: "14px", borderRadius: 100, border: `1px solid ${canGo[step] ? T.neon : T.border}`,
              background: canGo[step] ? "rgba(0,245,212,0.12)" : "transparent",
              color: canGo[step] ? T.neon : T.faint, fontSize: 14, fontWeight: 700,
              cursor: canGo[step] ? "pointer" : "not-allowed", fontFamily: "'Syne', sans-serif",
            }}>Continue →</button>
          ) : (
            <button onClick={() => canGo[2] && onStart()} style={{
              flex: 2, padding: "14px", borderRadius: 100, border: `1px solid ${canGo[2] ? T.neon : T.border}`,
              background: canGo[2] ? "rgba(0,245,212,0.15)" : "transparent",
              color: canGo[2] ? T.neon : T.faint, fontSize: 14, fontWeight: 700,
              cursor: canGo[2] ? "pointer" : "not-allowed", fontFamily: "'Syne', sans-serif", letterSpacing: 1,
            }}>Start Life ⚡</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GAME SCREEN
───────────────────────────────────────────── */
const APPS = [
  { id: "home", emoji: "◉", label: "Home", color: T.neon },
  { id: "career", emoji: "💼", label: "Career", color: T.blue },
  { id: "education", emoji: "🎓", label: "School", color: T.amber },
  { id: "finance", emoji: "💰", label: "Finance", color: T.green },
  { id: "wellness", emoji: "✦", label: "Wellness", color: T.purple },
  { id: "social", emoji: "❤", label: "Social", color: T.pink },
  { id: "life", emoji: "🏠", label: "Life", color: "#ff7f50" },
  { id: "shop", emoji: "🛍", label: "Shop", color: T.neon },
  { id: "profile", emoji: "◈", label: "Profile", color: T.blue },
];

function GameScreen({ gs, activeApp, setActiveApp, toast, onWork, onStudy, onRest, onSocialize, onAddFriend, onBuyItem, onHireJob, onEnrollEducation, onMakeChoice, onEndDay, onEndGame, enrollModal, onConfirmEnroll, onCancelEnroll, onWellnessActivity, onBuyHousing, onBuyVehicle, onUpgradeVehicle, onAction, onPersonalLoan }) {
  const energyPct = gs.energy;
  const energyColor = gs.energy > 60 ? T.neon : gs.energy > 30 ? T.amber : T.red;
  const seasonIdx = Math.floor((gs.season - 1) / 1) % 4;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Syne', sans-serif", color: T.text, display: "flex", maxWidth: 960, margin: "0 auto" }}>
      <style>{css}</style>

      {/* Toast */}
      {toast && (
        <div key={toast.id} style={{
          position: "fixed", top: 20, right: 20, zIndex: 2000, maxWidth: 300,
          background: "rgba(5,5,8,0.95)", border: `1px solid ${toast.color}`,
          borderRadius: 14, padding: "12px 18px", color: toast.color,
          fontSize: 13, fontWeight: 600, animation: "slideIn 0.3s ease",
          boxShadow: `0 4px 24px ${toast.color}33`,
          backdropFilter: "blur(12px)",
        }}>{toast.msg}</div>
      )}

      {/* Dilemma overlay */}
      {gs.currentDilemma && gs.phase === "dilemma" && (
        <DilemmaOverlay dilemma={gs.currentDilemma} onChoice={idx => onMakeChoice(gs.currentDilemma, idx)} />
      )}

      {/* Enrollment modal */}
      {enrollModal && (
        <EnrollmentModal edu={enrollModal} gs={gs} onConfirm={onConfirmEnroll} onCancel={onCancelEnroll} />
      )}

      {/* ── LEFT SIDEBAR ── */}
      <div style={{
        width: 220, background: "rgba(255,255,255,0.02)", borderRight: `1px solid ${T.border}`,
        padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12,
        position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: -1, marginBottom: 4 }}>
          <span style={{ color: T.neon }}>MORAL</span><span style={{ color: T.text }}>FORGE</span>
        </div>

        {/* Character card */}
        <div style={{ background: T.surface, borderRadius: 14, padding: "12px", border: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>{gs.avatar}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{gs.name}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.muted }}>
                {gs.currentJob?.title || "Unemployed"}
              </div>
            </div>
          </div>
        </div>

        {/* Day/season */}
        <div style={{ background: T.surface, borderRadius: 12, padding: "10px 12px", border: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted }}>DAY / SEASON</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginTop: 2 }}>
            {gs.day} <span style={{ fontSize: 12, color: T.muted, fontWeight: 400 }}>{SEASON_EMOJI[seasonIdx]} {SEASONS[seasonIdx]}</span>
          </div>
        </div>

        {/* Balance */}
        <div style={{ background: T.surface, borderRadius: 12, padding: "10px 12px", border: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted }}>BALANCE</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.green, marginTop: 2 }}>${gs.money.toFixed(0)}</div>
        </div>

        {/* Energy meter */}
        <div style={{ background: T.surface, borderRadius: 12, padding: "10px 12px", border: `1px solid ${energyColor}44` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted }}>ENERGY</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: energyColor, fontWeight: 700 }}>{gs.energy}/{gs.maxEnergy || 100}EP</div>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(gs.energy / (gs.maxEnergy || 100)) * 100}%`, background: `linear-gradient(90deg, ${energyColor}, ${energyColor}aa)`, borderRadius: 4, transition: "width 0.5s ease", boxShadow: gs.energy > 60 ? `0 0 8px ${energyColor}88` : "none" }} />
          </div>
          {gs.maxEnergy < 100 && <div style={{ color: T.red, fontSize: 10, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>⚠ Max reduced by burnout</div>}
          {gs.energy < 30 && <div style={{ color: T.red, fontSize: 10, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>LOW — buy energy boost?</div>}
        </div>

        {/* Burnout indicator */}
        <div style={{ background: T.surface, borderRadius: 12, padding: "10px 12px", border: `1px solid ${gs.burnout >= 95 ? T.red : gs.burnout > 75 ? T.red : T.border}`, boxShadow: gs.burnout >= 95 ? `0 0 12px ${T.red}44` : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted }}>BURNOUT</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: gs.burnout >= 95 ? T.red : gs.burnout > 75 ? T.red : gs.burnout > 50 ? T.amber : T.green, fontWeight: 700 }}>{gs.burnout}</div>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${gs.burnout}%`, background: gs.burnout >= 95 ? T.red : gs.burnout > 75 ? T.red : gs.burnout > 50 ? T.amber : T.green, borderRadius: 3, transition: "width 0.5s" }} />
          </div>
          {gs.burnout >= 95 && <div style={{ color: T.red, fontSize: 10, marginTop: 4, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>🔥 CRITICAL — losing 2EP max/day!</div>}
        </div>

        {/* Attendance trackers */}
        {(gs.currentJob || gs.currentEducation) && (
          <AttendanceSidebar gs={gs} />
        )}

        {/* Feed */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.faint, marginBottom: 8, letterSpacing: 1 }}>ACTIVITY</div>
          <div style={{ height: 180, overflowY: "auto" }}>
            {gs.feed.map((f, i) => (
              <div key={i} style={{ fontSize: 11, color: T.muted, marginBottom: 8, lineHeight: 1.5, borderLeft: `2px solid ${T.border}`, paddingLeft: 8 }}>
                <span style={{ color: T.faint, fontFamily: "'DM Mono', monospace" }}>D{f.day} </span>{f.msg}
              </div>
            ))}
          </div>
        </div>

        {/* End game */}
        <button onClick={onEndGame} style={{
          padding: "10px", borderRadius: 10, border: `1px solid ${T.border}`,
          background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer",
          fontFamily: "'Syne', sans-serif",
        }}>End Game Early</button>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Quote bar */}
        <div style={{ background: "rgba(0,245,212,0.03)", borderBottom: `1px solid ${T.border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: T.neon, fontSize: 14 }}>✦</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted, fontStyle: "italic", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            "{MORAL_QUOTES[gs.quoteIndex].text}" — {MORAL_QUOTES[gs.quoteIndex].author}
          </span>
        </div>

        {/* Stat strip */}
        <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "10px 20px", display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[["🍽", gs.hunger, "#ff7f50"], ["💧", gs.thirst, T.blue], ["❤", gs.health, T.pink], ["😊", gs.mood, T.amber]].map(([e, v, c]) => (
            <div key={e} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13 }}>{e}</span>
              <div style={{ width: 50, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                <div style={{ width: `${v}%`, height: "100%", background: c, borderRadius: 2, transition: "width 0.4s" }} />
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.faint }}>{Math.round(v)}</span>
            </div>
          ))}

          {gs.notifications.map((n, i) => (
            <div key={i} style={{ fontSize: 12, color: n.color, fontWeight: 600, marginLeft: 8, animation: "pulse 2s infinite" }}>{n.msg}</div>
          ))}
        </div>

        {/* App nav */}
        <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 12px", display: "flex", gap: 2, overflowX: "auto" }}>
          {APPS.map(app => (
            <button key={app.id} onClick={() => setActiveApp(app.id)} style={{
              padding: "12px 14px", border: "none", background: "transparent",
              color: activeApp === app.id ? app.color : T.faint,
              fontSize: 13, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: activeApp === app.id ? 700 : 400,
              borderBottom: `2px solid ${activeApp === app.id ? app.color : "transparent"}`,
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}>{app.emoji} {app.label}</button>
          ))}
        </div>

        {/* App content */}
        <div style={{ flex: 1, padding: "24px 20px", overflowY: "auto" }}>
          {activeApp === "home" && <HomeApp gs={gs} onEndDay={onEndDay} />}
          {activeApp === "career" && <CareerApp gs={gs} onWork={onWork} onHireJob={onHireJob} onAction={onAction} onEndDay={onEndDay} />}
          {activeApp === "education" && <EducationApp gs={gs} onStudy={onStudy} onEnroll={onEnrollEducation} onAction={onAction} onEndDay={onEndDay} />}
          {activeApp === "finance" && <FinanceApp gs={gs} onAction={onAction} onPersonalLoan={onPersonalLoan} onEndDay={onEndDay} />}
          {activeApp === "wellness" && <WellnessApp gs={gs} onRest={onRest} onWellnessActivity={onWellnessActivity} onEndDay={onEndDay} />}
          {activeApp === "social" && <SocialApp gs={gs} onSocialize={onSocialize} onAddFriend={onAddFriend} onAction={onAction} onEndDay={onEndDay} />}
          {activeApp === "life" && <LifeApp gs={gs} onBuyHousing={onBuyHousing} onBuyVehicle={onBuyVehicle} onUpgradeVehicle={onUpgradeVehicle} onEndDay={onEndDay} />}
          {activeApp === "shop" && <ShopApp gs={gs} onBuy={onBuyItem} onEndDay={onEndDay} />}
          {activeApp === "profile" && <ProfileApp gs={gs} onEndDay={onEndDay} />}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ATTENDANCE SIDEBAR TRACKER
───────────────────────────────────────────── */
function AttendanceSidebar({ gs }) {
  const WORK_REQUIRED = 4;
  const SCHOOL_REQUIRED = 3;
  const TOTAL_DAYS = 7;
  const dayInSeason = ((gs.day - 1) % 7) + 1; // 1–7
  const daysLeft = TOTAL_DAYS - dayInSeason;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {gs.currentJob && (
        <AttendanceTrack
          label="WORK"
          emoji="💼"
          done={gs.workDaysThisSeason}
          required={WORK_REQUIRED}
          total={TOTAL_DAYS}
          daysLeft={daysLeft}
          color={T.blue}
          checkedToday={gs.workedToday}
        />
      )}
      {gs.currentEducation && (
        <AttendanceTrack
          label="SCHOOL"
          emoji="🎓"
          done={gs.schoolDaysThisSeason}
          required={SCHOOL_REQUIRED}
          total={TOTAL_DAYS}
          daysLeft={daysLeft}
          color={T.amber}
          checkedToday={gs.studiedToday}
        />
      )}
    </div>
  );
}

function AttendanceTrack({ label, emoji, done, required, total, daysLeft, color, checkedToday }) {
  const met = done >= required;
  const stillPossible = done + daysLeft >= required;
  const atRisk = !met && !stillPossible;
  const borderColor = atRisk ? T.red : met ? color : `${color}66`;
  const statusColor = atRisk ? T.red : met ? T.green : T.amber;

  const dots = Array.from({ length: total }, (_, i) => {
    if (i < done) return "done";
    if (i === done && checkedToday) return "done"; // just completed
    if (i < required) return "needed";
    return "extra";
  });

  return (
    <div style={{
      background: T.surface, borderRadius: 12, padding: "10px 12px",
      border: `1px solid ${borderColor}`,
      boxShadow: atRisk ? `0 0 10px ${T.red}22` : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: 1 }}>
          {emoji} {label}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: statusColor, fontWeight: 700 }}>
          {done}/{required}
        </div>
      </div>

      {/* 7-dot calendar strip */}
      <div style={{ display: "flex", gap: 3, marginBottom: 7 }}>
        {dots.map((type, i) => (
          <div key={i} style={{
            flex: 1, height: 20, borderRadius: 4,
            background: type === "done"
              ? color
              : type === "needed"
                ? `${color}18`
                : "rgba(255,255,255,0.04)",
            border: `1px solid ${type === "done" ? color : type === "needed" ? `${color}44` : T.border}`,
            boxShadow: type === "done" ? `0 0 6px ${color}66` : "none",
            position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {type === "done" && (
              <span style={{ fontSize: 9, color: "rgba(0,0,0,0.6)", fontWeight: 800 }}>✓</span>
            )}
            {/* Mark required threshold */}
            {i === (required - 1) && type !== "done" && (
              <span style={{ fontSize: 8, color: `${color}99` }}>!</span>
            )}
          </div>
        ))}
      </div>

      {/* Status message */}
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: statusColor, lineHeight: 1.4 }}>
        {met
          ? `✓ Requirement met`
          : atRisk
            ? `⚠ Can't meet — penalty incoming`
            : `Need ${required - done} more in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REUSABLE UI COMPONENTS
───────────────────────────────────────────── */
function GlassCard({ children, accent, style = {} }) {
  return (
    <div style={{
      background: accent ? `${accent}08` : T.surface,
      border: `1px solid ${accent ? `${accent}30` : T.border}`,
      borderRadius: 18, padding: "18px 20px",
      ...style,
    }}>{children}</div>
  );
}

function StatBar({ label, value, color, emoji }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: T.muted }}>{emoji} {label}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color, fontWeight: 600 }}>{Math.round(value)}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s", boxShadow: `0 0 6px ${color}66` }} />
      </div>
    </div>
  );
}

function Btn({ children, onClick, color = T.neon, disabled, full, sm }) {
  return (
    <button onClick={!disabled ? onClick : undefined} style={{
      padding: sm ? "8px 16px" : "12px 22px",
      borderRadius: 100,
      border: `1px solid ${disabled ? T.border : color}`,
      background: disabled ? "transparent" : `${color}15`,
      color: disabled ? T.faint : color,
      fontSize: sm ? 12 : 14, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Syne', sans-serif", transition: "all 0.2s",
      width: full ? "100%" : undefined, letterSpacing: 0.5,
    }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.background = `${color}25`)}
      onMouseLeave={e => !disabled && (e.currentTarget.style.background = `${color}15`)}
    >{children}</button>
  );
}

function EndDayBar({ gs, onEndDay }) {
  return (
    <div style={{
      marginTop: 28, paddingTop: 20, borderTop: `1px solid ${T.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
    }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.muted }}>
        <span style={{ color: T.neon, fontWeight: 700 }}>{gs.energy}/{gs.maxEnergy || 100}EP</span> remaining today
        {gs.burnout >= 95 && <span style={{ color: T.red, marginLeft: 12, fontWeight: 700 }}>🔥 Critical burnout!</span>}
      </div>
      <Btn onClick={onEndDay} color={T.neon}>⟶ End Day</Btn>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HOME APP
───────────────────────────────────────────── */
function HomeApp({ gs, onEndDay }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>
          <span style={{ color: T.neon }}>Good morning,</span> {gs.name} {gs.avatar}
        </h2>
        <p style={{ color: T.muted, fontSize: 14, marginTop: 4 }}>
          Day {gs.day} — {SEASONS[Math.floor((gs.season - 1) / 1) % 4]} · {gs.energy}/{gs.maxEnergy || 100}EP today
        </p>
      </div>

      {gs.pendingFriendOffer && (
        <GlassCard accent={T.pink} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: T.pink, marginBottom: 6 }}>✦ New Connection</div>
          <p style={{ color: T.muted, fontSize: 14 }}>
            You crossed paths with {gs.pendingFriendOffer.emoji} <strong style={{ color: T.text }}>{gs.pendingFriendOffer.name}</strong> — {gs.pendingFriendOffer.personality}. Head to Social to connect.
          </p>
        </GlassCard>
      )}

      {gs.burnout >= 95 && (
        <GlassCard accent={T.red} style={{ marginBottom: 16, boxShadow: `0 0 20px ${T.red}33` }}>
          <div style={{ fontWeight: 800, color: T.red, fontSize: 16 }}>🔥 CRITICAL BURNOUT — {gs.burnout}/100</div>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 6 }}>
            Your max energy is permanently dropping by <strong style={{ color: T.red }}>2EP per day</strong>. Currently capped at <strong style={{ color: T.red }}>{gs.maxEnergy || 100}EP</strong>. Rest, therapy, or wellness activities urgently needed.
          </p>
        </GlassCard>
      )}

      {gs.burnout >= 75 && gs.burnout < 95 && (
        <GlassCard accent={T.red} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: T.red }}>🔥 High Burnout Warning — {gs.burnout}/100</div>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>
            Reaching 95 will start permanently reducing your max energy. Rest and recover now.
          </p>
        </GlassCard>
      )}

      <GlassCard style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: T.text, marginBottom: 16 }}>Life Progress</div>
        <StatBar label="Education" value={gs.education} color={T.amber} emoji="🎓" />
        <StatBar label="Career" value={gs.career} color={T.blue} emoji="💼" />
        <StatBar label="Finance" value={gs.finance} color={T.green} emoji="💰" />
        <StatBar label="Social" value={gs.social} color={T.pink} emoji="❤" />
        <StatBar label="Wellness" value={gs.wellness} color={T.purple} emoji="✦" />
      </GlassCard>

      <EndDayBar gs={gs} onEndDay={onEndDay} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   CAREER APP
───────────────────────────────────────────── */
function CareerApp({ gs, onWork, onHireJob, onAction, onEndDay }) {
  const promoProgress = gs.promotionProgress || 0;
  const job = gs.currentJob;
  const overtimePay = job ? Math.round(job.pay * 0.5) : 0;

  const CAREER_ACTIONS = job ? [
    { id: "network", label: "🤝 Network at Work", desc: `+career, +social, −burnout`, epCost: 12, promoGain: 6, statChanges: { career: 4, social: 5, burnout: -5 }, toast: "Networked! +promo progress.", msg: `${gs.name} networked with colleagues.`, ethicsType: "V" },
    { id: "overtime_shift", label: "⏰ Work Overtime Shift", desc: `+$${overtimePay} overtime pay, +promo`, epCost: 25, promoGain: 12, moneyGain: overtimePay, statChanges: { career: 5, burnout: 10 }, toast: `Overtime done! +$${overtimePay} earned.`, msg: `${gs.name} worked overtime and earned $${overtimePay}.`, ethicsType: "C" },
    { id: "cover_coworker", label: "🔄 Cover Coworker's Shift", desc: `+$${Math.round(overtimePay * 0.8)} pay, +ethics, +promo`, epCost: 20, promoGain: 8, moneyGain: Math.round(overtimePay * 0.8), statChanges: { career: 4, social: 5, burnout: 8 }, toast: "Covered a shift! Good deed done.", msg: `${gs.name} covered a coworker's shift.`, ethicsType: "V" },
    { id: "upskill", label: "📚 Study Industry Skills", desc: "+career, +promo, costs $20", epCost: 15, moneyCost: 20, promoGain: 8, statChanges: { career: 6 }, toast: "Skills sharpened! Career +6.", msg: `${gs.name} upskilled in their field.`, ethicsType: "D" },
    { id: "mentor", label: "🎓 Find a Mentor", desc: "+career, big promo boost, −burnout", epCost: 10, promoGain: 12, statChanges: { career: 8, burnout: -8, mood: 6 }, toast: "Mentorship done! +12 promo.", msg: `${gs.name} had a mentorship session.`, ethicsType: "V" },
    { id: "side_gig", label: "💻 Pick Up Side Gig", desc: "Earn $60 extra, costs 20EP", epCost: 20, moneyGain: 60, statChanges: { burnout: 6, career: 2 }, toast: "Side gig done! +$60", msg: `${gs.name} completed a side gig.`, ethicsType: "C" },
  ] : [];

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: 20 }}>
        <span style={{ color: T.blue }}>Career</span>
      </h2>

      {job ? (
        <>
          <GlassCard accent={T.blue} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, color: T.text }}>{job.title}</div>
                <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{job.desc}</div>
                <div style={{ display: "flex", gap: 16, marginTop: 10, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                  <span style={{ color: T.green }}>+${job.pay}/day (~${job.hourly}/hr)</span>
                  <span style={{ color: T.blue }}>−{job.energy}EP</span>
                  <span style={{ color: T.red }}>+{job.burnout} burnout</span>
                </div>
              </div>
              <Btn onClick={onWork} color={T.blue} disabled={gs.energy < job.energy || gs.workedToday}>
                {gs.workedToday ? "✓ Done today" : `▶ Work Shift (${job.energy}EP)`}
              </Btn>
            </div>

            {/* Promotion progress */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted }}>PROMOTION PROGRESS</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.blue }}>{promoProgress}/100</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${promoProgress}%`, background: `linear-gradient(90deg, ${T.blue}, ${T.neon})`, borderRadius: 4, transition: "width 0.5s", boxShadow: promoProgress > 70 ? `0 0 10px ${T.blue}88` : "none" }} />
              </div>
              <div style={{ fontSize: 11, color: T.faint, marginTop: 5, fontFamily: "'DM Mono', monospace" }}>
                {promoProgress >= 80 ? "🔥 Almost there! Push to 100 for promotion." : promoProgress >= 50 ? "Halfway — keep the momentum." : "Earn promo points via shifts and career actions."}
              </div>
            </div>
          </GlassCard>

          <div style={{ fontWeight: 700, color: T.muted, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Career Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
            {CAREER_ACTIONS.map(a => (
              <GlassCard key={a.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 3, fontFamily: "'DM Mono', monospace" }}>
                      {a.desc}{a.moneyCost ? ` · −$${a.moneyCost}` : ""} · {a.epCost}EP
                    </div>
                  </div>
                  <Btn onClick={() => onAction(a)} color={T.blue} sm disabled={gs.energy < a.epCost || (a.moneyCost && gs.money < a.moneyCost)}>Go</Btn>
                </div>
              </GlassCard>
            ))}
          </div>
        </>
      ) : (
        <GlassCard accent={T.red} style={{ marginBottom: 24 }}>
          <div style={{ color: T.muted, fontSize: 14 }}>You're unemployed. Browse positions below.</div>
        </GlassCard>
      )}

      <div style={{ fontWeight: 700, color: T.muted, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: job ? 20 : 0 }}>Available Positions</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {gs.jobsAvailable.map(j => (
          <GlassCard key={j.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{j.title}</div>
                <div style={{ color: T.muted, fontSize: 13, marginTop: 3 }}>{j.desc}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 8, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                  <span style={{ color: T.green }}>${j.pay}/day (~${j.hourly}/hr)</span>
                  <span style={{ color: T.blue }}>−{j.energy}EP</span>
                  <span style={{ color: T.pink }}>+{j.social} social</span>
                </div>
              </div>
              <Btn onClick={() => onHireJob(j)} color={T.blue} sm>Apply</Btn>
            </div>
          </GlassCard>
        ))}
        {gs.jobsAvailable.length === 0 && <GlassCard><div style={{ color: T.faint, fontSize: 13 }}>No open positions right now.</div></GlassCard>}
      </div>

      <EndDayBar gs={gs} onEndDay={onEndDay} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   EDUCATION APP
───────────────────────────────────────────── */
function EducationApp({ gs, onStudy, onEnroll, onAction, onEndDay }) {
  const EDU_ACTIONS = gs.currentEducation ? [
    { id: "office_hours", label: "🙋 Go to Office Hours", desc: "+8% progress, −burnout", epCost: 15, studyGain: 8, statChanges: { burnout: -4, mood: 5 }, toast: "Office hours done! +8% progress.", msg: `${gs.name} attended office hours.`, ethicsType: "D" },
    { id: "study_group", label: "👥 Join Study Group", desc: "+6% progress, +social", epCost: 12, studyGain: 6, statChanges: { social: 8, burnout: 3 }, toast: "Study group done! +6% progress.", msg: `${gs.name} studied with classmates.`, ethicsType: "V" },
    { id: "library", label: "📚 Hit the Library", desc: "+10% progress, +education", epCost: 18, studyGain: 10, statChanges: { education: 4, burnout: 5 }, toast: "Library session complete! +10%.", msg: `${gs.name} spent time at the library.`, ethicsType: "D" },
    { id: "online_course_edu", label: "💻 Take Online Course", desc: "+5% progress, +education, costs $15", epCost: 10, moneyCost: 15, studyGain: 5, statChanges: { education: 6, career: 3 }, toast: "Online course done! Skills boosted.", msg: `${gs.name} completed an online course.`, ethicsType: "C" },
    { id: "tutor", label: "🎯 Hire a Tutor", desc: "+15% progress, costs $40", epCost: 8, moneyCost: 40, studyGain: 15, statChanges: { education: 8, burnout: -5 }, toast: "Tutoring session done! +15%.", msg: `${gs.name} hired a tutor.`, ethicsType: "V" },
    { id: "extra_credit", label: "✏️ Extra Credit Assignment", desc: "+12% progress, +career boost", epCost: 22, studyGain: 12, statChanges: { career: 5, burnout: 8 }, toast: "Extra credit submitted! +12%.", msg: `${gs.name} completed an extra credit assignment.`, ethicsType: "D" },
  ] : [];

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: 20 }}>
        <span style={{ color: T.amber }}>School</span>
      </h2>

      {gs.currentEducation ? (
        <>
          <GlassCard accent={T.amber} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{gs.currentEducation.emoji} {gs.currentEducation.name}</div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted }}>PROGRAM COMPLETION</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: T.amber }}>{gs.educationProgress}%</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${gs.educationProgress}%`, background: `linear-gradient(90deg, ${T.amber}, #ff7f50)`, borderRadius: 4, transition: "width 0.5s", boxShadow: `0 0 8px ${T.amber}66` }} />
              </div>
              <div style={{ fontSize: 11, color: T.faint, marginTop: 5, fontFamily: "'DM Mono', monospace" }}>
                {gs.educationProgress >= 80 ? "📍 Almost graduated! Push through." : `${100 - gs.educationProgress}% remaining`}
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <Btn onClick={onStudy} color={T.amber} disabled={gs.energy < 30 || gs.studiedToday}>
                {gs.studiedToday ? "✓ Studied today" : "📖 Core Study (30EP, +5%)"}
              </Btn>
            </div>
          </GlassCard>

          <div style={{ fontWeight: 700, color: T.muted, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Study Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
            {EDU_ACTIONS.map(a => (
              <GlassCard key={a.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 3, fontFamily: "'DM Mono', monospace" }}>
                      {a.desc}{a.moneyCost ? ` · −$${a.moneyCost}` : ""} · {a.epCost}EP
                    </div>
                  </div>
                  <Btn onClick={() => onAction(a)} color={T.amber} sm disabled={gs.energy < a.epCost || (a.moneyCost && gs.money < a.moneyCost)}>Do</Btn>
                </div>
              </GlassCard>
            ))}
          </div>
        </>
      ) : (
        <GlassCard style={{ marginBottom: 24 }}>
          <div style={{ color: T.muted, fontSize: 14 }}>Not enrolled. Choose a program below.</div>
        </GlassCard>
      )}

      <div style={{ fontWeight: 700, color: T.muted, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: gs.currentEducation ? 20 : 0 }}>Programs</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {EDUCATION_PATHS.map(edu => (
          <GlassCard key={edu.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{edu.emoji} {edu.name}</div>
                <div style={{ color: T.muted, fontSize: 12, marginTop: 3, fontFamily: "'DM Mono', monospace" }}>
                  ${edu.cost.toLocaleString()} tuition · <span style={{ color: T.green }}>pay upfront: ${Math.round(edu.cost * 0.9).toLocaleString()} (10% off)</span>
                </div>
              </div>
              <Btn onClick={() => onEnroll(edu)} color={T.amber} sm disabled={!!gs.currentEducation}>
                {gs.currentEducation ? "Enrolled" : "Enroll"}
              </Btn>
            </div>
          </GlassCard>
        ))}
      </div>

      <EndDayBar gs={gs} onEndDay={onEndDay} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   FINANCE APP
───────────────────────────────────────────── */
function FinanceApp({ gs, onAction, onPersonalLoan, onEndDay }) {
  const [loanInput, setLoanInput] = useState("");
  const [showLoan, setShowLoan] = useState(false);

  const costRent = gs.costRent || 0;
  const costTransport = gs.costTransport || 0;
  const costFood = gs.costFood || 8;
  const costStudy = gs.currentEducation ? (gs.costStudy || 15) : 0;
  const debtPayment = gs.dailyDebtPayment || 0;
  const personalLoanPayment = (gs.personalLoan || 0) > 0 ? (gs.personalLoanPayment || 0) : 0;
  const totalOut = costRent + costTransport + costFood + costStudy + debtPayment + personalLoanPayment;
  const dailyIncome = gs.currentJob ? gs.currentJob.pay : 0;
  const netDaily = dailyIncome - totalOut;
  const netColor = netDaily >= 0 ? T.green : T.red;

  const FINANCE_ACTIONS = [
    { id: "budget_review", label: "📊 Review Budget", desc: "+finance score, +mood", epCost: 5, statChanges: { finance: 6, mood: 4 }, toast: "Budget reviewed! Finance +6.", msg: `${gs.name} reviewed their budget.`, ethicsType: "D" },
    { id: "invest_small", label: "📈 Small Investment", desc: "Costs $50, returns $80", epCost: 5, moneyCost: 50, moneyGain: 80, statChanges: { finance: 8 }, toast: "Investment paid off! +$30 net.", msg: `${gs.name} made a small investment.`, ethicsType: "C" },
    { id: "move_savings", label: "🏦 Transfer $100 to Savings", desc: "Move $100 to savings account", epCost: 2, moneyCost: 100, statChanges: { finance: 4 }, toast: "Saved $100!", msg: `${gs.name} transferred $100 to savings.`, ethicsType: "D" },
    { id: "sell_items", label: "🛒 Sell Old Stuff", desc: "Earn $35 by decluttering", epCost: 8, moneyGain: 35, statChanges: { mood: 4, wellness: 3 }, toast: "Sold some stuff! +$35.", msg: `${gs.name} sold old belongings.`, ethicsType: "V" },
    { id: "financial_literacy", label: "📖 Read Finance Guide", desc: "+finance score, free", epCost: 10, statChanges: { finance: 10, mood: 2 }, toast: "Finished a finance guide! Finance +10.", msg: `${gs.name} read about personal finance.`, ethicsType: "D" },
  ];

  const breakdownRows = [
    costRent > 0 && ["🏠 Housing", costRent, T.purple],
    costFood > 0 && ["🍽 Food", costFood, "#ff7f50"],
    costTransport > 0 && ["🚗 Transport", costTransport, T.blue],
    costStudy > 0 && ["🎓 School fees", costStudy, T.amber],
    debtPayment > 0 && ["🎓 Student loan", debtPayment, T.red],
    personalLoanPayment > 0 && ["🏦 Personal loan", personalLoanPayment, T.pink],
  ].filter(Boolean);

  const loanAmt = parseInt(loanInput) || 0;
  const loanRepay = Math.round(loanAmt * 1.18);
  const loanDaily = loanAmt > 0 ? parseFloat((loanRepay / (3 * 365)).toFixed(2)) : 0;

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: 20 }}>
        <span style={{ color: T.green }}>Finances</span>
      </h2>

      {/* Summary grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <GlassCard accent={T.green}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.faint, marginBottom: 4 }}>CHECKING</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.green }}>${gs.money.toFixed(0)}</div>
        </GlassCard>
        <GlassCard accent={T.neon}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.faint, marginBottom: 4 }}>SAVINGS</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.neon }}>${gs.savings.toFixed(0)}</div>
        </GlassCard>
        {gs.debt > 0 && (
          <GlassCard accent={T.red}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.faint, marginBottom: 4 }}>STUDENT DEBT</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.red }}>${gs.debt.toFixed(0)}</div>
          </GlassCard>
        )}
        {gs.personalLoan > 0 && (
          <GlassCard accent={T.red}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.faint, marginBottom: 4 }}>PERSONAL LOAN</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.red }}>${gs.personalLoan.toFixed(0)}</div>
          </GlassCard>
        )}
        <GlassCard accent={netColor}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.faint, marginBottom: 4 }}>DAILY NET</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: netColor }}>{netDaily >= 0 ? "+" : ""}${netDaily.toFixed(0)}</div>
          <div style={{ fontSize: 10, color: T.faint, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{dailyIncome > 0 ? "income − expenses" : "no income yet"}</div>
        </GlassCard>
      </div>

      {/* Income */}
      <GlassCard accent={T.green} style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, color: T.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Daily Income</div>
        {gs.currentJob ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{gs.currentJob.title}</div>
              <div style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Mono', monospace" }}>~${gs.currentJob.hourly}/hr · 8hr shift</div>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, fontSize: 20, color: T.green }}>+${gs.currentJob.pay}</div>
          </div>
        ) : (
          <div style={{ color: T.faint, fontSize: 13 }}>No job — head to Career to find work.</div>
        )}
      </GlassCard>

      {/* Expenses */}
      <GlassCard accent={totalOut > 0 ? T.red : T.border} style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, color: T.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Daily Expenses</div>
        {breakdownRows.length === 0 ? (
          <div style={{ color: T.faint, fontSize: 13 }}>Only food ($8/day) — costs grow as you build your life.</div>
        ) : (
          <>
            {breakdownRows.map(([label, amount, color]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: T.muted, fontSize: 13 }}>{label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color, fontSize: 14 }}>−${Number(amount).toFixed(0)}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Total / day</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, fontSize: 16, color: T.red }}>−${totalOut.toFixed(0)}</span>
            </div>
          </>
        )}
      </GlassCard>

      {dailyIncome > 0 && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: netDaily >= 0 ? "rgba(6,214,160,0.08)" : "rgba(239,35,60,0.08)", border: `1px solid ${netColor}33`, marginBottom: 16 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: netColor, fontWeight: 700 }}>
            {netDaily >= 0 ? `✓ +$${netDaily.toFixed(0)}/day surplus after expenses` : `⚠ Losing $${Math.abs(netDaily).toFixed(0)}/day — find more income!`}
          </div>
        </div>
      )}

      {/* Personal Loan Panel */}
      <GlassCard accent={T.amber} style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: T.amber, marginBottom: 8 }}>🏦 Personal Loan</div>
        {!showLoan ? (
          <div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 10 }}>
              Borrow up to $5,000 at 18% APR. Repaid automatically over 3 years in daily payments.
            </div>
            {gs.personalLoan > 0 && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.red, marginBottom: 8 }}>
                Outstanding: ${gs.personalLoan.toFixed(0)} · −${gs.personalLoanPayment?.toFixed(2)}/day
              </div>
            )}
            <Btn onClick={() => setShowLoan(true)} color={T.amber} sm>Apply for Loan</Btn>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 10 }}>18% APR · 3-year term · No questions asked</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
              <input
                type="number" min="100" max="5000" step="100"
                value={loanInput}
                onChange={e => setLoanInput(e.target.value)}
                placeholder="Amount (max $5,000)"
                style={{
                  flex: 1, minWidth: 140, padding: "8px 12px", borderRadius: 10,
                  border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)",
                  color: T.text, fontFamily: "'DM Mono', monospace", fontSize: 13,
                }}
              />
              <Btn onClick={() => { onPersonalLoan(loanAmt); setShowLoan(false); setLoanInput(""); }} color={T.amber} sm disabled={loanAmt < 100 || loanAmt > 5000}>
                Borrow ${loanAmt > 0 ? loanAmt : "—"}
              </Btn>
              <Btn onClick={() => setShowLoan(false)} color={T.muted} sm>Cancel</Btn>
            </div>
            {loanAmt >= 100 && loanAmt <= 5000 && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted }}>
                Total repay: <span style={{ color: T.red }}>${loanRepay}</span> · Daily: <span style={{ color: T.red }}>−${loanDaily.toFixed(2)}/day</span>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Finance Actions */}
      <div style={{ fontWeight: 700, color: T.muted, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Finance Actions</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {FINANCE_ACTIONS.map(a => (
          <GlassCard key={a.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 3, fontFamily: "'DM Mono', monospace" }}>
                  {a.desc} · {a.epCost}EP
                </div>
              </div>
              <Btn onClick={() => onAction(a)} color={T.green} sm disabled={gs.energy < a.epCost || (a.moneyCost && gs.money < a.moneyCost)}>Do</Btn>
            </div>
          </GlassCard>
        ))}
      </div>

      <EndDayBar gs={gs} onEndDay={onEndDay} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   WELLNESS APP
───────────────────────────────────────────── */
function WellnessApp({ gs, onRest, onWellnessActivity, onEndDay }) {
  const bc = gs.burnout > 75 ? T.red : gs.burnout > 50 ? T.amber : T.green;
  const doneToday = gs.wellnessActivitiesToday || [];

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>
        <span style={{ color: T.purple }}>Wellness</span>
      </h2>
      <p style={{ color: T.muted, fontSize: 13, marginBottom: 20, fontFamily: "'DM Mono', monospace" }}>
        Taking care of yourself is a practice, not a reward.
      </p>

      {/* Burnout status */}
      <GlassCard accent={bc} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: bc }}>🔥 Burnout Level</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, fontSize: 20, color: bc }}>{gs.burnout}/100</div>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ height: "100%", width: `${gs.burnout}%`, background: bc, borderRadius: 4, transition: "width 0.5s" }} />
        </div>
        <div style={{ fontSize: 12, color: T.muted }}>
          {gs.burnout < 30 ? "✓ You're in good shape." : gs.burnout < 60 ? "⚠ Getting tired. Build in recovery." : "🔴 Danger zone. You need to rest NOW."}
        </div>
      </GlassCard>

      {/* Stats overview */}
      <GlassCard style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: T.purple, marginBottom: 12 }}>Today's Vitals</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[["Health", gs.health, T.pink, "❤"], ["Mood", gs.mood, T.amber, "😊"], ["Wellness", gs.wellness, T.purple, "✦"], ["Energy", gs.energy, T.neon, "⚡"]].map(([l, v, c, e]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.faint }}>{e} {l.toUpperCase()}</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: c, marginTop: 2 }}>{Math.round(v)}</div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 6 }}>
                <div style={{ height: "100%", width: `${v}%`, background: c, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Activities */}
      <div style={{ fontWeight: 700, color: T.muted, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
        Wellness Activities · {gs.energy}EP remaining
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {WELLNESS_ACTIVITIES.map(act => {
          const done = doneToday.includes(act.id);
          const canDo = gs.energy >= act.epCost && !done;
          const gains = Object.entries(act.statChanges).filter(([k, v]) => v > 0);
          const costs = Object.entries(act.statChanges).filter(([k, v]) => v < 0);
          return (
            <GlassCard key={act.id} accent={canDo ? T.purple : undefined} style={{ padding: "14px 14px", opacity: done ? 0.5 : 1 }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{act.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{act.name}</div>
              <div style={{ color: T.muted, fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>{act.desc}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, marginTop: 8, color: T.neon }}>
                {gains.map(([k, v]) => `+${v} ${k}`).join(" · ")}
              </div>
              {costs.length > 0 && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.red }}>
                  {costs.map(([k, v]) => `${v} ${k}`).join(" · ")}
                </div>
              )}
              <div style={{ marginTop: 10 }}>
                <Btn onClick={() => {
                  onWellnessActivity(act);
                  // Track locally via a side effect isn't clean, but we log it in state
                }} color={T.purple} sm disabled={!canDo}>
                  {done ? "✓ Done" : act.epCost > 0 ? `Do it (${act.epCost}EP)` : "Do it (free)"}
                </Btn>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Sleep log removed per design update */}

      <EndDayBar gs={gs} onEndDay={onEndDay} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   SOCIAL APP
───────────────────────────────────────────── */
function SocialApp({ gs, onSocialize, onAddFriend, onAction, onEndDay }) {
  const SOCIAL_ACTIONS = [
    { id: "community_event", label: "🎉 Attend Community Event", desc: "+social, chance to meet people", epCost: 15, statChanges: { social: 12, mood: 8, burnout: 5 }, toast: "Great time at the event! +Social", msg: `${gs.name} attended a community event.`, ethicsType: "V" },
    { id: "volunteer_social", label: "🙌 Volunteer in Community", desc: "+social, +wellness, +ethics", epCost: 20, statChanges: { social: 10, wellness: 8, mood: 10, burnout: -5 }, toast: "Volunteered! +Social, +Wellness.", msg: `${gs.name} volunteered in the community.`, ethicsType: "D" },
    { id: "message_friend", label: "💬 Send Encouraging Messages", desc: "+social, +mood, 5EP", epCost: 5, statChanges: { social: 5, mood: 6 }, toast: "Messages sent! Social +5.", msg: `${gs.name} checked in with people they care about.`, ethicsType: "V" },
    { id: "host_gathering", label: "🏠 Host a Gathering", desc: "+social boost, costs $30", epCost: 18, moneyCost: 30, statChanges: { social: 18, mood: 12, burnout: 6 }, toast: "Gathering was a hit! +Social +18.", msg: `${gs.name} hosted a gathering.`, ethicsType: "V" },
    { id: "join_club", label: "🎭 Join a Club or Group", desc: "+social, +wellness", epCost: 10, statChanges: { social: 8, wellness: 6, mood: 5 }, toast: "Joined a group! New connections made.", msg: `${gs.name} joined a social group.`, ethicsType: "D" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>
        <span style={{ color: T.pink }}>Social</span>
      </h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.muted }}>Social score: <strong style={{ color: T.pink }}>{Math.round(gs.social)}/100</strong></div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.muted }}>Friends: <strong style={{ color: T.pink }}>{gs.friends.length}</strong></div>
      </div>

      {gs.friends.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: T.muted, fontSize: 12, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>Your Friends</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {gs.friends.map(f => (
              <GlassCard key={f.id} accent={T.pink}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{f.emoji} {f.name}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{f.personality}</div>
                    <div style={{ marginTop: 8, height: 4, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${f.friendshipScore}%`, background: T.pink, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: T.faint, marginTop: 3, fontFamily: "'DM Mono', monospace" }}>{f.friendshipScore}/100 friendship</div>
                  </div>
                  <Btn onClick={() => onSocialize(f.id)} color={T.pink} sm disabled={gs.energy < 15}>Hang out (15EP)</Btn>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {gs.pendingFriendOffer && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: T.muted, fontSize: 12, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>✦ New Connection</div>
          <GlassCard accent={T.purple}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{gs.pendingFriendOffer.emoji} {gs.pendingFriendOffer.name}</div>
                <div style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>{gs.pendingFriendOffer.personality}</div>
              </div>
              <Btn onClick={() => onAddFriend(gs.pendingFriendOffer)} color={T.purple} sm>Add Friend</Btn>
            </div>
          </GlassCard>
        </div>
      )}

      {gs.friendsAvailable.length > 0 && !gs.pendingFriendOffer && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: T.muted, fontSize: 12, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>People You've Met</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {gs.friendsAvailable.map(f => (
              <GlassCard key={f.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{f.emoji} {f.name}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{f.personality}</div>
                  </div>
                  <Btn onClick={() => onAddFriend(f)} color={T.pink} sm>Add</Btn>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {gs.friends.length === 0 && gs.friendsAvailable.length === 0 && !gs.pendingFriendOffer && (
        <GlassCard style={{ marginBottom: 20 }}><p style={{ color: T.muted, fontSize: 14 }}>Go to work or school to meet people!</p></GlassCard>
      )}

      <div style={{ fontWeight: 700, color: T.muted, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Social Actions</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SOCIAL_ACTIONS.map(a => (
          <GlassCard key={a.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 3, fontFamily: "'DM Mono', monospace" }}>
                  {a.desc}{a.moneyCost ? ` · −$${a.moneyCost}` : ""} · {a.epCost}EP
                </div>
              </div>
              <Btn onClick={() => onAction(a)} color={T.pink} sm disabled={gs.energy < a.epCost || (a.moneyCost && gs.money < a.moneyCost)}>Do</Btn>
            </div>
          </GlassCard>
        ))}
      </div>

      <EndDayBar gs={gs} onEndDay={onEndDay} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHOP APP
───────────────────────────────────────────── */
function ShopApp({ gs, onBuy, onEndDay }) {
  const available = SHOP_ITEMS.filter(i => !gs.purchasedItems.includes(i.id) || i.consumable);
  const catColor = { energy: T.neon, food: T.green, wellness: T.purple, education: T.amber, fun: T.pink, pets: "#ff7f50" };
  const groups = ["energy", "food", "wellness", "education", "fun", "pets"];
  const groupNames = {
    energy: "⚡ Energy Boosters",
    food: "🍽 Food & Drink",
    wellness: "✦ Wellness",
    education: "🎓 Learning",
    fun: "🎉 Fun & Entertainment",
    pets: "🐾 Pets",
  };

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>
        <span style={{ color: "#ff7f50" }}>Shop</span>
      </h2>
      <p style={{ color: T.muted, fontSize: 14, marginBottom: 20, fontFamily: "'DM Mono', monospace" }}>
        Balance: <strong style={{ color: T.green }}>${gs.money.toFixed(0)}</strong> · {gs.energy}EP today
      </p>

      {groups.map(cat => {
        const items = available.filter(i => i.category === cat);
        if (!items.length) return null;
        const c = catColor[cat] || T.neon;
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, color: c, fontSize: 13, marginBottom: 12, letterSpacing: 1 }}>{groupNames[cat]}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {items.map(item => (
                <GlassCard key={item.id} accent={c} style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{item.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                  <div style={{ color: T.muted, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{item.desc}</div>
                  {item.energyGain && (
                    <div style={{ color: T.neon, fontSize: 11, marginTop: 6, fontFamily: "'DM Mono', monospace" }}>+{item.energyGain}EP</div>
                  )}
                  {item.statChanges && Object.entries(item.statChanges).filter(([, v]) => v > 0).length > 0 && (
                    <div style={{ color: T.green, fontSize: 11, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
                      {Object.entries(item.statChanges).filter(([, v]) => v > 0).map(([k, v]) => `+${v} ${k}`).join(" · ")}
                    </div>
                  )}
                  {item.statChanges && Object.entries(item.statChanges).filter(([, v]) => v < 0).length > 0 && (
                    <div style={{ color: T.red, fontSize: 11, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
                      ⚠ {Object.entries(item.statChanges).filter(([, v]) => v < 0).map(([k, v]) => `${k} ${v}`).join(", ")}
                    </div>
                  )}
                  {item.timeCost > 0 && (
                    <div style={{ color: T.amber, fontSize: 11, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>−{item.timeCost}EP to use</div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: T.green, fontSize: 14 }}>${item.price}</span>
                    <Btn onClick={() => onBuy(item)} color={c} sm disabled={gs.money < item.price}>Buy</Btn>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        );
      })}

      <EndDayBar gs={gs} onEndDay={onEndDay} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROFILE APP
───────────────────────────────────────────── */
function ProfileApp({ gs, onEndDay }) {
  const typeColor = { D: T.blue, V: T.pink, C: T.neon };
  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: 20 }}>
        <span style={{ color: T.blue }}>Profile</span>
      </h2>

      <GlassCard style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 56, marginBottom: 10 }}>{gs.avatar}</div>
        <div style={{ fontSize: 24, fontWeight: 800 }}>{gs.name}</div>
        <div style={{ color: T.muted, fontSize: 14, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
          Day {gs.day} · {SEASONS[Math.floor((gs.season - 1) / 1) % 4]}
        </div>
      </GlassCard>

      <GlassCard accent={T.purple} style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: T.purple, marginBottom: 14 }}>Core Traits</div>
        {gs.traits.map(t => (
          <div key={t.id} style={{ marginBottom: 10, paddingLeft: 12, borderLeft: `3px solid ${typeColor[t.type]}` }}>
            <div style={{ fontWeight: 700, color: T.text }}>{t.name}</div>
            <div style={{ color: T.muted, fontSize: 13 }}>{t.desc}</div>
          </div>
        ))}
      </GlassCard>

      <GlassCard>
        <div style={{ fontWeight: 700, color: T.muted, marginBottom: 12 }}>Background</div>
        <div style={{ fontWeight: 600, color: T.text }}>{gs.upbringing.name}</div>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{gs.upbringing.tag}</div>
      </GlassCard>

      <EndDayBar gs={gs} onEndDay={onEndDay} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   LIFE APP — Housing & Transport
───────────────────────────────────────────── */
function LifeApp({ gs, onBuyHousing, onBuyVehicle, onUpgradeVehicle, onEndDay }) {
  const currentTier = gs.housing?.tier || 0;
  const vehicleTier = gs.vehicle?.tier || 0;

  return (
    <div>
      <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>
        <span style={{ color: "#ff7f50" }}>Life</span>
      </h2>
      <p style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Where you live and how you get around shapes your daily life.</p>

      {/* Current situation */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <GlassCard accent="#ff7f50">
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.faint, marginBottom: 8 }}>CURRENT HOME</div>
          <div style={{ fontSize: 26, marginBottom: 4 }}>{gs.housing?.emoji || "🛏️"}</div>
          <div style={{ fontWeight: 700 }}>{gs.housing?.name || "Shared Room"}</div>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>{gs.housing?.desc || "Free. Cramped. Gets old fast."}</div>
          {gs.housing && <div style={{ color: T.red, fontSize: 11, fontFamily: "'DM Mono', monospace", marginTop: 6 }}>+${gs.housing.dailyCost}/day</div>}
        </GlassCard>
        <GlassCard accent={T.blue}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.faint, marginBottom: 8 }}>TRANSPORT</div>
          <div style={{ fontSize: 26, marginBottom: 4 }}>{gs.vehicle?.emoji || "🚶"}</div>
          <div style={{ fontWeight: 700 }}>{gs.vehicle?.name || "On Foot"}</div>
          <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>{gs.vehicle?.desc || "Free. Just takes longer."}</div>
          {gs.vehicle && <div style={{ color: T.red, fontSize: 11, fontFamily: "'DM Mono', monospace", marginTop: 6 }}>+${gs.vehicle.dailyCost}/day</div>}
        </GlassCard>
      </div>

      {/* Housing upgrades */}
      <div style={{ fontWeight: 700, color: T.muted, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
        🏠 Housing Options
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {HOUSING_OPTIONS.filter(h => h.tier > 0).map(h => {
          const owned = gs.housing?.id === h.id;
          const affordable = gs.money >= h.cost;
          const unlocked = h.tier <= currentTier + 1;
          return (
            <GlassCard key={h.id} accent={owned ? "#ff7f50" : undefined} style={{ opacity: unlocked ? 1 : 0.4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{h.emoji} {h.name}</div>
                  <div style={{ color: T.muted, fontSize: 13, marginTop: 3 }}>{h.desc}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 8, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                    <span style={{ color: T.green }}>Cost: ${h.cost.toLocaleString()}</span>
                    <span style={{ color: T.red }}>+${h.dailyCost}/day</span>
                    <span style={{ color: T.pink }}>+{h.moodBonus} mood</span>
                  </div>
                </div>
                {owned ? (
                  <span style={{ color: "#ff7f50", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>✓ Home</span>
                ) : (
                  <Btn onClick={() => onBuyHousing(h)} color="#ff7f50" sm disabled={!affordable || !unlocked}>
                    {!unlocked ? "🔒 Locked" : !affordable ? `Need $${(h.cost - gs.money).toLocaleString()}` : "Move In"}
                  </Btn>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Vehicle options */}
      <div style={{ fontWeight: 700, color: T.muted, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
        🚗 Transport
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {VEHICLE_OPTIONS.map(v => {
          const owned = gs.vehicle?.id === v.id;
          const affordable = gs.money >= v.cost;
          const canUpgrade = v.tier > vehicleTier;
          return (
            <GlassCard key={v.id} accent={owned ? T.blue : undefined}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{v.emoji} {v.name}</div>
                  <div style={{ color: T.muted, fontSize: 13, marginTop: 3 }}>{v.desc}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 8, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                    <span style={{ color: T.green }}>$${v.cost.toLocaleString()}</span>
                    {v.dailyCost > 0 && <span style={{ color: T.red }}>+${v.dailyCost}/day</span>}
                    <span style={{ color: T.amber }}>+{v.moodBonus} mood</span>
                  </div>
                </div>
                {owned ? (
                  <span style={{ color: T.blue, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>✓ Owned</span>
                ) : (
                  <Btn onClick={() => canUpgrade ? onUpgradeVehicle(v) : onBuyVehicle(v)} color={T.blue} sm disabled={!affordable}>
                    {!affordable ? `Need $${(v.cost - gs.money).toLocaleString()}` : canUpgrade ? "Upgrade" : "Buy"}
                  </Btn>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      <EndDayBar gs={gs} onEndDay={onEndDay} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   DILEMMA OVERLAY
───────────────────────────────────────────── */
function DilemmaOverlay({ dilemma, onChoice }) {
  const isSeasonEnd = dilemma.id?.startsWith("sed_");
  const accentColor = isSeasonEnd ? T.amber : T.purple;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(5,5,8,0.94)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      backdropFilter: "blur(16px)",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.04)", border: `1px solid ${accentColor}55`,
        borderRadius: 24, padding: "32px 28px", maxWidth: 520, width: "100%",
        boxShadow: `0 0 80px ${accentColor}18`, animation: "fadeIn 0.4s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: `${accentColor}20`,
            border: `1px solid ${accentColor}`, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>{isSeasonEnd ? "🌀" : "⚖️"}</div>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: accentColor, letterSpacing: 2, textTransform: "uppercase" }}>
              {isSeasonEnd ? "End of Season · A Crossroads" : "Moral Moment"}
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, color: T.text }}>{dilemma.title}</div>
          </div>
        </div>

        {isSeasonEnd && (
          <div style={{ background: `${T.amber}10`, border: `1px solid ${T.amber}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: T.amber, fontFamily: "'DM Mono', monospace" }}>
            ⚠ Season-end dilemmas are rooted in where your life actually is right now.
          </div>
        )}

        <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.85, marginBottom: 24 }}>
          {dilemma.desc}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dilemma.choices.map((c, i) => (
            <button key={i} onClick={() => onChoice(i)} style={{
              padding: "14px 18px", borderRadius: 14,
              border: `1px solid ${T.border}`, background: T.surface,
              color: T.text, fontSize: 14, cursor: "pointer", textAlign: "left",
              fontFamily: "'Syne', sans-serif", transition: "all 0.2s", lineHeight: 1.6,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.background = `${accentColor}12`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}
            >
              <span style={{ color: accentColor, marginRight: 8 }}>→</span>{c.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ENROLLMENT MODAL
───────────────────────────────────────────── */
function EnrollmentModal({ edu, gs, onConfirm, onCancel }) {
  const discountedCost = Math.round(edu.cost * 0.9); // 10% off upfront
  const canPayUpfront = gs.money >= discountedCost;
  const deposit = Math.round(edu.cost * 0.05);
  const loanAmount = edu.cost - deposit;
  const dailyPayment = Math.round((loanAmount / 3650) * 100) / 100;
  const canLoan = gs.money >= deposit;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(5,5,8,0.92)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      backdropFilter: "blur(12px)",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.04)", border: `1px solid ${T.amber}44`,
        borderRadius: 24, padding: "32px 28px", maxWidth: 480, width: "100%",
        boxShadow: `0 0 80px ${T.amber}22`, animation: "fadeIn 0.3s ease",
      }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.amber, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Enrollment</div>
        <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 6 }}>{edu.emoji} {edu.name}</h2>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 24 }}>
          Full tuition is <strong style={{ color: T.text }}>${edu.cost.toLocaleString()}</strong>. How do you want to pay?
        </p>

        {/* Option A: Pay upfront — 10% discount */}
        <div style={{
          padding: "18px 20px", borderRadius: 16, marginBottom: 12,
          border: `1px solid ${canPayUpfront ? T.green : T.border}`,
          background: canPayUpfront ? "rgba(6,214,160,0.07)" : "rgba(255,255,255,0.02)",
          opacity: canPayUpfront ? 1 : 0.45,
        }}>
          <div style={{ fontWeight: 700, color: canPayUpfront ? T.green : T.muted, marginBottom: 4 }}>
            ✓ Pay Upfront — ${discountedCost.toLocaleString()} <span style={{ fontSize: 12, color: T.green, fontFamily: "'DM Mono', monospace" }}>10% OFF</span>
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
            Save <span style={{ color: T.green }}>${edu.cost - discountedCost}</span> by paying in full. No debt, no daily payments.
          </div>
          <Btn onClick={() => canPayUpfront && onConfirm(edu, true)} color={T.green} disabled={!canPayUpfront}>
            {canPayUpfront ? `Pay $${discountedCost.toLocaleString()} Now` : `Need $${(discountedCost - gs.money).toLocaleString()} more`}
          </Btn>
        </div>

        {/* Option B: Student loan */}
        <div style={{
          padding: "18px 20px", borderRadius: 16, marginBottom: 20,
          border: `1px solid ${canLoan ? T.amber : T.border}`,
          background: canLoan ? "rgba(255,190,11,0.07)" : "rgba(255,255,255,0.02)",
          opacity: canLoan ? 1 : 0.45,
        }}>
          <div style={{ fontWeight: 700, color: canLoan ? T.amber : T.muted, marginBottom: 6 }}>💳 Student Loan (full price)</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.muted, lineHeight: 1.8, marginBottom: 12 }}>
            <div>Deposit today: <strong style={{ color: T.text }}>${deposit}</strong></div>
            <div>Loan amount: <strong style={{ color: T.red }}>${loanAmount.toLocaleString()}</strong></div>
            <div>Daily payment: <strong style={{ color: T.red }}>−${dailyPayment.toFixed(2)}/day</strong> (~10yr)</div>
          </div>
          <Btn onClick={() => canLoan && onConfirm(edu, false)} color={T.amber} disabled={!canLoan}>
            {canLoan ? "Take Student Loan" : `Need $${deposit} deposit`}
          </Btn>
        </div>

        <button onClick={onCancel} style={{
          background: "transparent", border: "none", color: T.muted,
          fontSize: 13, cursor: "pointer", fontFamily: "'Syne', sans-serif",
        }}>← Cancel</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REVEAL SCREEN — Full philosophy breakdown
───────────────────────────────────────────── */
const PHILOSOPHY_DATA = {
  D: {
    name: "Deontological Ethics",
    popularName: "The Rule-Keeper",
    thinkers: "Immanuel Kant, W.D. Ross",
    color: T.blue,
    gradient: `linear-gradient(135deg, ${T.blue}, #7c3aed)`,
    icon: "⚖️",
    desc: `You lived by duty and principle. In philosophy, this is called Deontological Ethics — from the Greek "deon," meaning duty. Kant, its most famous thinker, believed that some actions are right or wrong in themselves, no matter the consequences.`,
    howYouLived: "You followed rules even when it cost you. You kept promises. You held firm under pressure. When faced with moral dilemmas, you asked 'what should I do?' rather than 'what's convenient?'",
    realWorld: "Deontological thinking shows up in human rights law, medical ethics (informed consent), and why we condemn torture even for a 'good cause.' It's why your gut says some things are just wrong — full stop.",
    strengths: ["Reliable and trustworthy", "Strong personal integrity", "People know where you stand", "Creates consistent moral standards"],
    tensions: ["Can be rigid in complex situations", "Sometimes ignores real-world consequences", "Hard to handle conflicting duties"],
  },
  V: {
    name: "Virtue Ethics",
    popularName: "The Character Builder",
    thinkers: "Aristotle, Alasdair MacIntyre",
    color: T.pink,
    gradient: `linear-gradient(135deg, ${T.pink}, #fb923c)`,
    icon: "🌱",
    desc: `You lived by who you wanted to become. This is Virtue Ethics — the oldest ethical tradition, developed by Aristotle in ancient Greece. It asks not 'what should I do?' but 'what kind of person should I be?'`,
    howYouLived: "You showed empathy, courage, and care for others. Your choices were about character, not just compliance. You built real relationships. You acted from the inside out.",
    realWorld: "Virtue Ethics shapes how we raise children, coach athletes, and think about role models. It's behind phrases like 'what would a good person do?' and the idea that habits shape who we are. Modern positive psychology draws directly from it.",
    strengths: ["Authentic and genuine", "Strong relationships and emotional intelligence", "Morally grows over time", "Inspires others through example"],
    tensions: ["Can be hard to resolve dilemmas clearly", "What counts as virtuous can vary by culture", "Less useful for policy or law"],
  },
  C: {
    name: "Consequentialism / Utilitarianism",
    popularName: "The Big-Picture Thinker",
    thinkers: "Jeremy Bentham, John Stuart Mill",
    color: T.neon,
    gradient: `linear-gradient(135deg, ${T.neon}, ${T.green})`,
    icon: "📊",
    desc: `You lived by outcomes and impact. This is Consequentialism — specifically Utilitarianism, developed by Bentham and Mill. It argues that the right action is the one that produces the best results for the most people.`,
    howYouLived: "You thought strategically, weighed tradeoffs, and were willing to make hard calls if the math worked out. You cared about real impact, not just good intentions. You prioritized the greater good — sometimes at personal cost.",
    realWorld: "Consequentialist thinking drives public health policy, economic theory, and effective altruism. It's behind cost-benefit analysis, vaccine mandates, and trolley problems. Silicon Valley's 'move fast and break things' is arguably consequentialist gone wrong.",
    strengths: ["Practical and results-focused", "Good at navigating complex tradeoffs", "Can justify sacrifice for collective benefit", "Adapts to new information"],
    tensions: ["Can justify harmful means for good ends", "Hard to predict all consequences", "Individual rights can get deprioritized"],
  },
};

function RevealScreen({ gs, onRestart }) {
  const total = gs.ethicsD + gs.ethicsV + gs.ethicsC || 1;
  const pD = Math.round((gs.ethicsD / total) * 100);
  const pV = Math.round((gs.ethicsV / total) * 100);
  const pC = Math.round((gs.ethicsC / total) * 100);
  const dominant = pD >= pV && pD >= pC ? "D" : pV >= pC ? "V" : "C";
  const info = PHILOSOPHY_DATA[dominant];
  const [tab, setTab] = useState("overview");

  const scores = [
    ["D", "Deontological", pD, T.blue],
    ["V", "Virtue Ethics", pV, T.pink],
    ["C", "Consequentialism", pC, T.neon],
  ].sort((a, b) => b[2] - a[2]);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Syne', sans-serif", color: T.text, padding: "24px", maxWidth: 700, margin: "0 auto" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40, animation: "fadeIn 0.8s ease" }}>
        <div style={{ fontSize: 60, marginBottom: 12, animation: "float 3s ease-in-out infinite" }}>{info.icon}</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: T.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
          Life complete · {gs.day} days · {gs.moralChoicesMade} moral choices
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 400, color: T.muted, marginBottom: 4 }}>Your guiding philosophy was</h1>
        <h2 style={{
          fontSize: 46, fontWeight: 800, letterSpacing: -3, lineHeight: 1,
          background: info.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 8,
        }}>{info.popularName}</h2>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: T.muted }}>
          Formally: <strong style={{ color: T.text }}>{info.name}</strong>
        </div>
        <div style={{ fontSize: 12, color: T.faint, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
          Thinkers: {info.thinkers}
        </div>
      </div>

      {/* Score breakdown */}
      <GlassCard style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, color: T.muted, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Your Ethical Breakdown</div>
        {scores.map(([key, name, pct, color]) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <span style={{ fontWeight: 700, color: T.text }}>{PHILOSOPHY_DATA[key].popularName}</span>
                <span style={{ color: T.muted, fontSize: 12, marginLeft: 8 }}>{name}</span>
                {key === dominant && <span style={{ marginLeft: 8, fontSize: 11, color, background: `${color}20`, padding: "2px 8px", borderRadius: 100 }}>dominant</span>}
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, color, fontSize: 18 }}>{pct}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1.5s ease", boxShadow: `0 0 8px ${color}66` }} />
            </div>
          </div>
        ))}
      </GlassCard>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        {[["overview", "Overview"], ["real-world", "Real World"], ["tensions", "Tensions"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "10px 18px", background: "transparent", border: "none",
            color: tab === id ? info.color : T.muted, fontFamily: "'Syne', sans-serif",
            fontSize: 14, fontWeight: tab === id ? 700 : 400, cursor: "pointer",
            borderBottom: `2px solid ${tab === id ? info.color : "transparent"}`, transition: "all 0.2s",
          }}>{label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ animation: "slideIn 0.3s ease" }}>
          <GlassCard accent={info.color} style={{ marginBottom: 16 }}>
            <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.9 }}>{info.desc}</p>
          </GlassCard>
          <GlassCard style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: info.color, marginBottom: 10 }}>How you lived it</div>
            <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.8 }}>{info.howYouLived}</p>
          </GlassCard>
          <GlassCard>
            <div style={{ fontWeight: 700, color: T.text, marginBottom: 12 }}>Your strengths</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {info.strengths.map(s => (
                <span key={s} style={{ padding: "6px 14px", borderRadius: 100, background: `${info.color}15`, color: info.color, fontSize: 13, fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === "real-world" && (
        <div style={{ animation: "slideIn 0.3s ease" }}>
          <GlassCard accent={info.color}>
            <div style={{ fontWeight: 700, color: info.color, marginBottom: 12 }}>Where you see this in the real world</div>
            <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.9 }}>{info.realWorld}</p>
          </GlassCard>
          <GlassCard style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, color: T.muted, marginBottom: 16 }}>The other philosophies — briefly</div>
            {Object.entries(PHILOSOPHY_DATA).filter(([k]) => k !== dominant).map(([key, data]) => (
              <div key={key} style={{ marginBottom: 14, paddingLeft: 14, borderLeft: `3px solid ${data.color}` }}>
                <div style={{ fontWeight: 700, color: data.color }}>{data.popularName} — {data.name}</div>
                <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{data.desc.split(".")[0]}.</div>
              </div>
            ))}
          </GlassCard>
        </div>
      )}

      {tab === "tensions" && (
        <div style={{ animation: "slideIn 0.3s ease" }}>
          <GlassCard accent={T.amber} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.amber, marginBottom: 12 }}>Where {info.popularName} gets complicated</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {info.tensions.map(t => (
                <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: T.amber, flexShrink: 0 }}>→</span>
                  <span style={{ color: T.muted, fontSize: 14, lineHeight: 1.6 }}>{t}</span>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard>
            <div style={{ fontWeight: 700, color: T.text, marginBottom: 12 }}>No one philosophy wins everything</div>
            <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.8 }}>
              Most real moral decisions blend all three approaches. Your score shows tendencies, not absolutes.
              Moral philosophers themselves disagree about which framework is "right."
              What matters is that you thought about it — and made conscious choices.
            </p>
          </GlassCard>
        </div>
      )}

      {/* Life summary */}
      <GlassCard style={{ marginTop: 24 }}>
        <div style={{ fontWeight: 700, color: T.muted, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Life Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
          {[
            ["Final Career", gs.currentJob?.title || "Freelancer", T.blue],
            ["Balance", `$${gs.money.toFixed(0)}`, T.green],
            ["Friends", `${gs.friends.length} made`, T.pink],
            ["Education", `${Math.round(gs.education)}/100`, T.amber],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: T.surface, borderRadius: 10, padding: "12px" }}>
              <div style={{ color: T.faint, fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
              <div style={{ color: c, fontWeight: 700, fontSize: 16 }}>{v}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <button onClick={onRestart} style={{
          padding: "16px 52px", borderRadius: 100,
          border: `1px solid ${info.color}`,
          background: `${info.color}15`,
          color: info.color, fontSize: 16, fontWeight: 700, cursor: "pointer",
          fontFamily: "'Syne', sans-serif", letterSpacing: 1, textTransform: "uppercase",
          transition: "all 0.3s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = `${info.color}25`}
          onMouseLeave={e => e.currentTarget.style.background = `${info.color}15`}
        >Live Again</button>
      </div>
    </div>
  );
}
