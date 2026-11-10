import { useEffect, useState, type FormEvent } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { onValue, push, ref, remove, set, update } from 'firebase/database'
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  Circle,
  CircleCheck,
  ClipboardList,
  LogOut,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { auth, database, isFirebaseConfigured } from './firebase'
import './daymark.css'

type TaskFilter = 'all' | 'open' | 'completed'

interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

const todayLabel = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}).format(new Date())

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [taskSnapshot, setTaskSnapshot] = useState<{ userId: string; tasks: Task[] }>({ userId: '', tasks: [] })
  const [draft, setDraft] = useState('')
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [authLoading, setAuthLoading] = useState(Boolean(auth))
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const tasks = user?.uid === taskSnapshot.userId ? taskSnapshot.tasks : []

  useEffect(() => {
    if (!auth) return

    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        setAuthLoading(false)
      },
      (error) => {
        setFeedback(error.message)
        setAuthLoading(false)
      },
    )
  }, [])

  useEffect(() => {
    if (!database || !user) return

    return onValue(
      ref(database, `tasks/${user.uid}`),
      (snapshot) => {
        const values = snapshot.val() as Record<string, Omit<Task, 'id'>> | null
        const nextTasks = Object.entries(values ?? {})
          .map(([id, task]) => ({ id, ...task }))
          .sort((first, second) => first.createdAt - second.createdAt)

        setTaskSnapshot({ userId: user.uid, tasks: nextTasks })
      },
      (error) => setFeedback(error.message),
    )
  }, [user])

  const openCount = tasks.filter((task) => !task.completed).length
  const completedCount = tasks.length - openCount
  const visibleTasks = filter === 'open'
    ? tasks.filter((task) => !task.completed)
    : filter === 'completed'
      ? tasks.filter((task) => task.completed)
      : tasks

  async function handleGoogleSignIn() {
    if (!auth) return

    setFeedback('')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      setFeedback(errorMessage(error))
    }
  }

  async function handleSignOut() {
    if (!auth) return

    try {
      await signOut(auth)
      setFeedback('')
    } catch (error) {
      setFeedback(errorMessage(error))
    }
  }

  async function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!database || !user || !text || saving) return

    setSaving(true)
    setFeedback('')

    try {
      const taskRef = push(ref(database, `tasks/${user.uid}`))
      await set(taskRef, { text, completed: false, createdAt: Date.now() })
      setDraft('')
    } catch (error) {
      setFeedback(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleTask(task: Task) {
    if (!database || !user) return

    try {
      await update(ref(database, `tasks/${user.uid}/${task.id}`), {
        completed: !task.completed,
      })
      setFeedback('')
    } catch (error) {
      setFeedback(errorMessage(error))
    }
  }

  async function handleDeleteTask(task: Task) {
    if (!database || !user) return

    try {
      await remove(ref(database, `tasks/${user.uid}/${task.id}`))
      setFeedback('')
    } catch (error) {
      setFeedback(errorMessage(error))
    }
  }

  if (authLoading) {
    return (
      <main className="loading-screen" aria-label="Loading your account">
        <span className="loading-mark"><ClipboardList size={20} /></span>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="auth-screen">
        <div className="auth-topline">
          <a className="wordmark" href="/" aria-label="Daymark home">
            <span className="wordmark-icon"><Check size={18} strokeWidth={3} /></span>
            daymark<span className="wordmark-period">.</span>
          </a>
          <span className="auth-top-note">A quieter way to get things done</span>
        </div>

        <section className="auth-content" aria-labelledby="auth-title">
          <div className="auth-symbol"><ClipboardList size={24} strokeWidth={1.7} /></div>
          <p className="eyebrow">YOUR DAY, IN GOOD ORDER</p>
          <h1 id="auth-title">Make room for<br /><em>what matters.</em></h1>
          <p className="auth-description">A simple, personal place to gather your tasks and find your next step.</p>

          <button
            className="google-button"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={!isFirebaseConfigured}
          >
            <span className="google-g" aria-hidden="true">G</span>
            Continue with Google
            <ArrowUpRight size={17} />
          </button>

          {!isFirebaseConfigured && (
            <div className="setup-note" role="status">
              <span className="setup-dot" />
              <p>Firebase is not connected yet. Add your project values to <code>.env.local</code> to enable sign-in.</p>
            </div>
          )}

          {feedback && <p className="feedback auth-feedback" role="alert">{feedback}</p>}
          <p className="auth-footnote">Sign in securely with your Google account</p>
        </section>

        <footer className="auth-footer">
          <span>DAYMARK <span className="footer-separator">/</span> PERSONAL TASKS</span>
          <span>Made for a little more focus.</span>
        </footer>
      </main>
    )
  }

  const firstName = user.displayName?.trim().split(/\s+/)[0] || 'there'
  return (
    <div className="workspace">
      <aside className="sidebar">
        <a className="wordmark sidebar-wordmark" href="/" aria-label="Daymark home">
          <span className="wordmark-icon"><Check size={18} strokeWidth={3} /></span>
          daymark<span className="wordmark-period">.</span>
        </a>

        <div className="sidebar-section-label">WORKSPACE</div>
        <div className="sidebar-current">
          <ClipboardList size={17} />
          <span>My tasks</span>
          <span className="sidebar-count">{openCount}</span>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-caption">A clear list. A lighter mind.</div>
          <div className="profile-row">
            {user.photoURL ? (
              <img className="avatar" src={user.photoURL} alt="" />
            ) : (
              <span className="avatar avatar-fallback">{firstName.charAt(0).toUpperCase()}</span>
            )}
            <div className="profile-copy">
              <span className="profile-name">{user.displayName || 'Your account'}</span>
              <span className="profile-email">{user.email}</span>
            </div>
            <button className="icon-button signout-button" onClick={handleSignOut} type="button" title="Sign out" aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <span className="topbar-path">PERSONAL SPACE <span>/</span> MY TASKS</span>
          <span className="topbar-date">{todayLabel}</span>
        </header>

        <section className="task-page" aria-labelledby="page-title">
          <div className="greeting-row">
            <div>
              <p className="eyebrow">A FRESH PAGE</p>
              <h1 id="page-title">Good day, {firstName}<span className="heading-period">.</span></h1>
              <p className="page-subtitle">Small steps add up. What would you like to move forward?</p>
            </div>
            <div className="daymark-stamp" aria-hidden="true">
              <Sparkles size={16} />
              <span>ONE THING<br />AT A TIME</span>
            </div>
          </div>

          <div className="summary-strip" aria-label="Task summary">
            <div className="summary-item">
              <span className="summary-number">{openCount}</span>
              <span className="summary-label">TO DO</span>
            </div>
            <div className="summary-rule" />
            <div className="summary-item">
              <span className="summary-number summary-done">{completedCount}</span>
              <span className="summary-label">DONE</span>
            </div>
            <span className="summary-note">{openCount === 0 && tasks.length > 0 ? 'You made it through your list.' : 'Keep your focus on the next step.'}</span>
          </div>

          <form className="add-task-form" onSubmit={handleAddTask}>
            <Plus className="add-task-icon" size={19} />
            <input
              aria-label="New task"
              maxLength={240}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a task to your list..."
              value={draft}
            />
            <button className="add-task-button" type="submit" disabled={!draft.trim() || saving} aria-label="Add task">
              <span>{saving ? 'Adding' : 'Add task'}</span>
              <ArrowUpRight size={16} />
            </button>
          </form>

          {feedback && <p className="feedback workspace-feedback" role="alert">{feedback}</p>}

          <div className="list-toolbar">
            <h2>Your list <span>{tasks.length}</span></h2>
            <div className="filter-tabs" role="group" aria-label="Filter tasks">
              {(['all', 'open', 'completed'] as const).map((filterOption) => (
                <button
                  className={filter === filterOption ? 'filter-tab is-active' : 'filter-tab'}
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  type="button"
                >
                  {filterOption === 'all' ? 'All' : filterOption === 'open' ? 'To do' : 'Done'}
                </button>
              ))}
            </div>
          </div>

          {visibleTasks.length > 0 ? (
            <ul className="task-list">
              {visibleTasks.map((task) => (
                <li className={task.completed ? 'task-row is-complete' : 'task-row'} key={task.id}>
                  <button
                    className="task-check"
                    type="button"
                    onClick={() => void handleToggleTask(task)}
                    aria-label={task.completed ? `Mark ${task.text} as to do` : `Mark ${task.text} as done`}
                  >
                    {task.completed ? <CircleCheck size={21} /> : <Circle size={21} />}
                  </button>
                  <span className="task-text">{task.text}</span>
                  <span className="task-created">{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(task.createdAt)}</span>
                  {task.completed && <CheckCheck className="task-done-icon" size={17} aria-label="Completed" />}
                  <button className="icon-button delete-button" type="button" onClick={() => void handleDeleteTask(task)} title="Delete task" aria-label={`Delete ${task.text}`}>
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">{filter === 'completed' ? <CheckCheck size={22} /> : <Sparkles size={22} />}</div>
              <p className="empty-title">{filter === 'completed' ? 'Nothing checked off yet.' : filter === 'open' ? 'All caught up.' : 'A little room to begin.'}</p>
              <p className="empty-copy">{filter === 'completed' ? 'Finished tasks will find their place here.' : filter === 'open' ? 'You have no open tasks right now.' : 'Add the first thing on your mind above.'}</p>
            </div>
          )}

          <div className="list-footer">
            <span><span className="privacy-dot" /> Your list is private to your account</span>
            <span>{completedCount > 0 ? `${completedCount} task${completedCount === 1 ? '' : 's'} completed` : 'One step at a time'}</span>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
