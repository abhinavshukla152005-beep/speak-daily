const FILLERS = ['um', 'uh', 'er', 'like', 'basically', 'actually', 'literally', 'you know', 'kind of', 'sort of']

export function analyseTranscript(transcript, durationSeconds) {
  const words = transcript.toLowerCase().match(/[a-z']+/g) || []
  const total = words.length
  const minutes = Math.max(durationSeconds / 60, 1 / 60)
  const wpm = Math.round(total / minutes)
  const text = ` ${words.join(' ')} `
  const fillers = FILLERS.reduce(
    (acc, f) => acc + (text.split(` ${f} `).length - 1),
    0
  )
  const unique = new Set(words).size
  const diversity = total ? unique / total : 0

  const tips = []
  let score = 50

  if (total >= 150) score += 15
  else if (total >= 80) score += 8
  else tips.push('Try to speak longer — aim for at least a minute of continuous speech.')

  if (wpm >= 90 && wpm <= 160) {
    score += 15
    tips.push(`Good pace: ${wpm} words per minute feels natural.`)
  } else if (wpm < 90) {
    tips.push(`Your pace was ${wpm} wpm — a little slow. Pause less and keep the sentence flowing.`)
  } else {
    tips.push(`Your pace was ${wpm} wpm — quite fast. Slow down slightly for clarity.`)
  }

  const fillerRatio = total ? fillers / total : 1
  if (fillerRatio < 0.02) {
    score += 15
    tips.push('Very few filler words (um, uh, like). Excellent fluency control.')
  } else if (fillerRatio < 0.06) {
    score += 5
    tips.push(`${fillers} filler words detected. Replace them with short silent pauses.`)
  } else {
    tips.push(`${fillers} filler words detected — the most common fluency blocker. Practise pausing instead of saying "um".`)
  }

  if (diversity > 0.65) {
    score += 10
    tips.push('Nice range of vocabulary — you avoided repeating the same words.')
  } else if (total > 40) {
    tips.push('Try using synonyms and linking words (however, besides, as a result) to widen your vocabulary.')
  }

  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().split(/\s+/).length > 3)
  const avgLen = sentences.length ? total / sentences.length : 0
  if (avgLen >= 8 && avgLen <= 22) {
    score += 5
    tips.push('Sentence lengths are well varied — easy to follow.')
  } else if (avgLen > 22) {
    tips.push('Your sentences run long. Break them up: one idea per sentence.')
  } else if (total > 30) {
    tips.push('Try combining short sentences using "because", "which" or "so that".')
  }

  score = Math.max(5, Math.min(100, Math.round(score)))
  return { total, wpm, fillers, diversity: Math.round(diversity * 100) / 100, score, tips }
}
