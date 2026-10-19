export const TOPICS = [
  'Describe your typical morning routine.',
  'Talk about a book or movie you enjoyed recently.',
  'What is your favourite place in your city, and why?',
  'Describe a skill you would like to learn this year.',
  'Talk about a person who inspires you.',
  'What was the best trip you have ever taken?',
  'Describe your favourite food and how it is made.',
  'Should students learn coding in school? Give your opinion.',
  'Talk about a challenge you overcame.',
  'How do you usually spend your weekends?',
  'Describe your dream job ten years from now.',
  'Is social media good or bad for teenagers?',
  'Talk about a festival you celebrate.',
  'What makes a good friend?',
  'Describe a piece of technology you cannot live without.',
  'Would you rather live in a big city or a small town? Why?',
  'Talk about a teacher who changed your thinking.',
  'What should governments do about air pollution?',
  'Describe a habit you want to break.',
  'Is it better to work alone or in a team?',
  'Talk about something that made you laugh this week.',
  'How will artificial intelligence change daily life?',
  'Describe your favourite way to exercise.',
  'Should money be printed more to help the poor? Debate it.',
  'Talk about a goal you achieved and how you felt.',
  'What kind of music do you like, and why?',
  'Describe a time you helped a stranger.',
  'Is homework useful or a waste of time?',
  'Talk about a country you want to visit.',
  'What does success mean to you?',
  'Describe the last photo you took and its story.',
  'Should everyone learn to cook? Why or why not?',
]

export function topicOfToday() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const day = Math.floor((now - start) / 86400000)
  return TOPICS[day % TOPICS.length]
}
