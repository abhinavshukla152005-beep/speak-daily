import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { topicOfToday } from '../lib/topics'
import { analyseTranscript } from '../lib/feedback'

const GOAL_SECONDS = 120

const SpeechRecognitionImpl =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

export default function Practice({ user, demo = false, onSignOut, onExitDemo }) {
  const [phase, setPhase] = useState('idle') // idle | recording | review
  const [secondsLeft, setSecondsLeft] = useState(GOAL_SECONDS)
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState(null) // { analysis, audioUrl, startedAt }
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')

  const recRef = useRef(null)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const finalTextRef = useRef('')
  const recordingRef = useRef(false)
  const startedAtRef = useRef(0)
  const timerRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    if (!demo) loadHistory()
    return () => stopEverything()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadHistory() {
    if (demo) return
    const { data } = await supabase
      .from('sessions')
      .select('id, topic, score, word_count, duration_seconds, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(7)
    setHistory(data || [])
  }

  function stopEverything() {
    recordingRef.current = false
    clearInterval(timerRef.current)
    try { recRef.current?.stop() } catch {}
    try { if (mediaRef.current?.state === 'recording') mediaRef.current.stop() } catch {}
  }

  async function start() {
    setError('')
    if (!SpeechRecognitionImpl) {
      setError('Speech recognition needs Chrome or Edge (desktop) to work.')
      return
    }
    finalTextRef.current = ''
    setTranscript('')
    chunksRef.current = []
    startedAtRef.current = Date.now()

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Microphone access was blocked. Allow the mic and try again.')
      return
    }
    streamRef.current = stream
    mediaRef.current = new MediaRecorder(stream)
    mediaRef.current.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
    mediaRef.current.onstop = () => stream.getTracks().forEach((t) => t.stop())
    mediaRef.current.start(250)

    const rec = new SpeechRecognitionImpl()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalTextRef.current += r[0].transcript + ' '
        else interim += r[0].transcript
      }
      setTranscript((finalTextRef.current + interim).trim())
    }
    rec.onend = () => {
      // Chrome stops recognition on long pauses; restart while still recording.
      if (recordingRef.current) {
        try { rec.start() } catch {}
      }
    }
    recRef.current = rec
    rec.start()

    recordingRef.current = true
    setPhase('recording')
    setSecondsLeft(GOAL_SECONDS)
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          stop()
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  async function stop() {
    if (!recordingRef.current) return
    recordingRef.current = false
    clearInterval(timerRef.current)
    const elapsed = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
    setPhase('review')

    await new Promise((resolve) => {
      if (!mediaRef.current || mediaRef.current.state !== 'recording') return resolve()
      mediaRef.current.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        resolve()
      }
      mediaRef.current.stop()
    })
    try { recRef.current?.stop() } catch {}

    const text = finalTextRef.current.trim()
    const analysis = analyseTranscript(text, elapsed)
    const audioUrl = chunksRef.current.length
      ? URL.createObjectURL(new Blob(chunksRef.current, { type: 'audio/webm' }))
      : null
    setResult({ analysis, audioUrl, text, elapsed })

    if (demo) return

    const { error: dbErr } = await supabase.from('sessions').insert({
      user_id: user.id,
      topic: topicOfToday(),
      transcript: text,
      duration_seconds: elapsed,
      word_count: analysis.total,
      wpm: analysis.wpm,
      filler_count: analysis.fillers,
      score: analysis.score,
    })
    if (dbErr) {
      setError('Your practice was analysed, but saving failed. Open the Supabase SQL Editor and run speak-daily/db/schema.sql once.')
    } else {
      loadHistory()
    }
  }

  const topic = topicOfToday()
  const mm = String(Math.floor(secondsLeft / 60)).padStart(1, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="page">
      <header className="topbar">
        <span className="brand">SpeakDaily</span>
        <span className="muted">{demo ? 'Demo mode' : `Hi, ${user.user_metadata?.full_name || user.email.split('@')[0]}`}</span>
        <button className="btn ghost" onClick={demo ? onExitDemo : onSignOut}>
          {demo ? 'Sign in to save' : 'Sign out'}
        </button>
      </header>

      <main className="stack">
        {demo && (
          <p className="banner">
            You&rsquo;re trying the demo. Feedback is calculated in your browser and nothing is uploaded.{' '}
            <button className="linkbtn" onClick={onExitDemo}>Create an account</button> to save sessions.
          </p>
        )}
        <section className="card topic-card">
          <span className="label">Today&rsquo;s topic</span>
          <h2>{topic}</h2>
          <p className="muted">Speak for up to two minutes. You get instant feedback on fluency, pace, fillers and vocabulary.</p>
        </section>

        {error && <p className="error">{error}</p>}

        {phase !== 'recording' && (
          <section className="card center">
            {phase === 'idle' && (
              <button className="btn primary big" onClick={start}>● Start recording</button>
            )}
            {result && (
              <>
                <div className="score-ring">
                  <strong>{result.analysis.score}</strong>
                  <span>/ 100</span>
                </div>
                <h3>Instant feedback</h3>
                <ul className="tips">
                  {result.analysis.tips.map((t) => <li key={t}>{t}</li>)}
                </ul>
                <div className="stat-row">
                  <div><b>{result.analysis.total}</b><span>words</span></div>
                  <div><b>{result.analysis.wpm}</b><span>words / min</span></div>
                  <div><b>{result.analysis.fillers}</b><span>filler words</span></div>
                  <div><b>{Math.round(result.analysis.diversity * 100)}%</b><span>vocab variety</span></div>
                </div>
                {result.audioUrl && <audio controls src={result.audioUrl} className="player" />}
                {result.text && <p className="transcript">“{result.text}”</p>}
                {demo && (
                  <p className="muted note">
                    This run wasn&rsquo;t saved — demo sessions stay in your browser.{' '}
                    <button className="linkbtn" onClick={onExitDemo}>Create an account</button> to keep your history.
                  </p>
                )}
                <button className="btn primary" onClick={() => { setResult(null); setPhase('idle') }}>
                  Practise again
                </button>
              </>
            )}
          </section>
        )}

        {phase === 'recording' && (
          <section className="card recording">
            <div className="timer live">{mm}:{ss}</div>
            <p className="transcript">{transcript || 'Listening… start speaking!'}</p>
            <button className="btn danger big" onClick={stop}>■ Stop &amp; get feedback</button>
          </section>
        )}

        <section className="card">
          <h3>Recent practice</h3>
          {demo ? (
            <p className="muted">
              Demo sessions aren&rsquo;t saved.{' '}
              <button className="linkbtn" onClick={onExitDemo}>Create an account</button> to keep your history and streak.
            </p>
          ) : history.length === 0 ? (
            <p className="muted">No sessions saved yet. Finish one practice round to start your streak.</p>
          ) : (
            <ul className="history">
              {history.map((h) => (
                <li key={h.id}>
                  <span className="h-topic">{h.topic}</span>
                  <span className="muted">{new Date(h.created_at).toLocaleDateString()}</span>
                  <b className={`h-score ${h.score >= 70 ? 'good' : ''}`}>{h.score}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
