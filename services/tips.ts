
export const financialTips = [
  "Save ₹10 a day, and you'll have ₹300 in a month. That's a new game or a nice meal!",
  "Carry your own water bottle. You could save up to ₹30 a week on buying drinks outside.",
  "Track your small spends. That ₹20 chai every day adds up to ₹600 a month!",
  "Challenge yourself with a 'No-Spend Day' once a week. It's a fun way to save.",
  "Your future self will thank you for the money you save today. Think long-term!",
  "Masti (fun) is important, but make sure you budget for it so you don't overspend.",
  "Saving ₹50 a week is ₹2,600 in a year! Small amounts grow bigger than you think.",
  "Rule #1: Don't spend money you don't have, not even in your mind. Avoid impulse buys.",
  "Take 5 minutes every Sunday to review your expenses. It helps you stay aware and in control.",
  "An emergency fund isn't for shopping; it's for peace of mind when unexpected things happen.",
  "Before buying online, leave items in your cart for a day. Do you still want it tomorrow?",
  "Student discounts are your best friend! Always ask if a place offers one.",
  "Differentiate between 'needs' (like a bus pass) and 'wants' (like the latest sneakers).",
  "Learn to say 'no' to plans that don't fit your budget. Your friends will understand.",
  "Borrowing books from a library instead of buying them is an easy way to save money.",
  "Cook at home or pack lunch. It's much cheaper and often healthier than eating out.",
  "Sell things you don't use anymore. Old books, clothes, or games can become extra cash.",
  "Unsubscribe from marketing emails to reduce the temptation to shop.",
  "Set specific, achievable saving goals. 'Saving ₹500 for headphones' is better than just 'saving'.",
  "Pay with cash instead of a card. It feels more real and makes you think twice before spending.",
  "Repairing something is often cheaper than replacing it. Fix that torn shirt or broken gadget!",
  "Look for free entertainment options like parks, community events, or learning a new skill online.",
  "When you get gift money, save at least half of it immediately.",
  "Automate your savings. Ask your parents to help you set aside a fixed amount every month.",
  "Talk about money with your parents or a trusted adult. Their experience can be a great guide.",
  "Check your balance regularly to stay on top of your finances.",
  "Avoid late fees on bills by paying them on time. It's like throwing money away!"
];

export const getDailyTip = (): string => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const tipIndex = dayOfYear % financialTips.length;
  return financialTips[tipIndex];
};
