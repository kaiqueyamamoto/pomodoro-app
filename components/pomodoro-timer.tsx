"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ProgressCircle } from "@/components/progress-circle"
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  BarChart3,
  Plus,
  Check,
  Trophy,
  Volume2,
  Target,
  Lightbulb,
  Heart,
  Coffee,
  Zap,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

type TimerState = "idle" | "running" | "paused"
type SessionType = "focus" | "short-break" | "long-break"

interface TimerSettings {
  focusTime: number
  shortBreakTime: number
  longBreakTime: number
  soundEnabled: boolean
  ambientSound: string
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  longBreakInterval: number
  dailyGoal: number
  theme: string
}

interface Task {
  id: string
  title: string
  description: string
  estimatedPomodoros: number
  completedPomodoros: number
  completed: boolean
  createdAt: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  progress: number
  target: number
}

interface Session {
  id: string
  date: string
  type: SessionType
  duration: number
  completed: boolean
  taskId?: string
  mood?: number
  productivity?: number
  completedEarly?: boolean
  timeSaved?: number
}

interface TeamSession {
  id: string
  name: string
  participants: string[]
  startTime: string
  duration: number
  active: boolean
}

const STORAGE_KEYS = {
  SETTINGS: "pomodoro-settings",
  SESSIONS: "pomodoro-sessions",
  TIMER_STATE: "pomodoro-timer-state",
  TASKS: "pomodoro-tasks",
  ACHIEVEMENTS: "pomodoro-achievements",
  TEAM_SESSIONS: "pomodoro-team-sessions",
  USER_PROFILE: "pomodoro-user-profile",
}

const AMBIENT_SOUNDS = [
  { id: "none", name: "Nenhum", url: "" },
  { id: "rain", name: "Chuva", url: "https://www.soundjay.com/misc/sounds/rain-01.wav" },
  { id: "forest", name: "Floresta", url: "https://www.soundjay.com/nature/sounds/forest-01.wav" },
  { id: "ocean", name: "Oceano", url: "https://www.soundjay.com/nature/sounds/ocean-01.wav" },
  { id: "cafe", name: "Café", url: "https://www.soundjay.com/misc/sounds/cafe-01.wav" },
  { id: "white-noise", name: "Ruído Branco", url: "https://www.soundjay.com/misc/sounds/white-noise-01.wav" },
]

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-pomodoro",
    title: "Primeiro Passo",
    description: "Complete seu primeiro pomodoro",
    icon: "🍅",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "daily-goal",
    title: "Meta Diária",
    description: "Atinja sua meta diária de pomodoros",
    icon: "🎯",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "week-streak",
    title: "Semana Consistente",
    description: "Complete pelo menos 1 pomodoro por 7 dias seguidos",
    icon: "🔥",
    unlocked: false,
    progress: 0,
    target: 7,
  },
  {
    id: "century",
    title: "Centenário",
    description: "Complete 100 pomodoros",
    icon: "💯",
    unlocked: false,
    progress: 0,
    target: 100,
  },
  {
    id: "early-bird",
    title: "Madrugador",
    description: "Complete um pomodoro antes das 8h",
    icon: "🌅",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "night-owl",
    title: "Coruja",
    description: "Complete um pomodoro depois das 22h",
    icon: "🦉",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "efficient",
    title: "Eficiente",
    description: "Complete uma atividade antes do tempo acabar",
    icon: "⚡",
    unlocked: false,
    progress: 0,
    target: 1,
  },
]

export function PomodoroTimer() {
  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [currentSession, setCurrentSession] = useState<SessionType>("focus")
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [cycleCount, setCycleCount] = useState(0)
  const [currentTask, setCurrentTask] = useState<string | null>("defaultTask")
  const [sessionMood, setSessionMood] = useState<number | null>(null)
  const [sessionProductivity, setSessionProductivity] = useState<number | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [initialSessionDuration, setInitialSessionDuration] = useState<number>(25 * 60)

  const [settings, setSettings] = useState<TimerSettings>({
    focusTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    soundEnabled: true,
    ambientSound: "none",
    autoStartBreaks: false,
    autoStartPomodoros: false,
    longBreakInterval: 4,
    dailyGoal: 8,
    theme: "default",
  })

  const [tasks, setTasks] = useState<Task[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS)
  const [teamSessions, setTeamSessions] = useState<TeamSession[]>([])
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showTeamDialog, setShowTeamDialog] = useState(false)
  const [showInsights, setShowInsights] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null)

  // Load data from localStorage on mount
  useEffect(() => {
    loadFromStorage()
    audioRef.current = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
    )
  }, [])

  // Save data to localStorage
  useEffect(() => {
    const timerData = { timerState, currentSession, timeLeft, cycleCount, currentTask }
    localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(timerData))
  }, [timerState, currentSession, timeLeft, cycleCount, currentTask])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements))
  }, [achievements])

  // Ambient sound management
  useEffect(() => {
    if (settings.ambientSound !== "none" && timerState === "running") {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause()
      }
      // In a real app, you'd load actual audio files
      // For demo, we'll just simulate
      console.log(`Playing ambient sound: ${settings.ambientSound}`)
    } else if (ambientAudioRef.current) {
      ambientAudioRef.current.pause()
    }
  }, [settings.ambientSound, timerState])

  const loadFromStorage = () => {
    try {
      // Load settings
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }

      // Load tasks
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS)
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks))
      }

      // Load achievements
      const savedAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)
      if (savedAchievements) {
        setAchievements(JSON.parse(savedAchievements))
      } else {
        setAchievements(INITIAL_ACHIEVEMENTS)
      }

      // Load timer state
      const savedTimerState = localStorage.getItem(STORAGE_KEYS.TIMER_STATE)
      if (savedTimerState) {
        const parsedState = JSON.parse(savedTimerState)
        setTimerState("idle")
        setCurrentSession(parsedState.currentSession || "focus")
        setCycleCount(parsedState.cycleCount || 0)
        setCurrentTask(parsedState.currentTask || "defaultTask")
        const defaultSettings = savedSettings ? JSON.parse(savedSettings) : settings
        const duration = getSessionDuration(parsedState.currentSession || "focus", defaultSettings)
        setTimeLeft(duration)
        setInitialSessionDuration(duration)
      }
    } catch (error) {
      console.error("Error loading from storage:", error)
    }
  }

  const getSessionDuration = (type: SessionType, settingsToUse = settings) => {
    switch (type) {
      case "focus":
        return settingsToUse.focusTime * 60
      case "short-break":
        return settingsToUse.shortBreakTime * 60
      case "long-break":
        return settingsToUse.longBreakTime * 60
    }
  }

  const saveSession = (
    type: SessionType,
    duration: number,
    completed: boolean,
    completedEarly = false,
    timeSaved = 0,
  ) => {
    try {
      const existingSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS)
      const sessions: Session[] = existingSessions ? JSON.parse(existingSessions) : []

      const newSession: Session = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type,
        duration: Math.max(0, duration), // Ensure duration is not negative
        completed,
        taskId: currentTask && currentTask !== "defaultTask" ? currentTask : undefined,
        mood: sessionMood,
        productivity: sessionProductivity,
        completedEarly,
        timeSaved: Math.max(0, timeSaved), // Ensure timeSaved is not negative
      }

      sessions.push(newSession)
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))

      // Update task progress
      if (currentTask && currentTask !== "defaultTask" && completed && type === "focus") {
        updateTaskProgress(currentTask)
      }

      // Check achievements
      checkAchievements(sessions)
    } catch (error) {
      console.error("Error saving session:", error)
    }
  }

  const updateTaskProgress = (taskId: string) => {
    if (taskId === "defaultTask") return

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, completedPomodoros: task.completedPomodoros + 1 } : task)),
    )
  }

  const checkAchievements = (sessions: Session[]) => {
    const completedFocusSessions = sessions.filter((s) => s.type === "focus" && s.completed)
    const today = new Date().toDateString()
    const todaySessions = completedFocusSessions.filter((s) => new Date(s.date).toDateString() === today)
    const earlyCompletions = sessions.filter((s) => s.completedEarly)

    setAchievements((prev) =>
      prev.map((achievement) => {
        let newProgress = achievement.progress
        let unlocked = achievement.unlocked

        switch (achievement.id) {
          case "first-pomodoro":
            newProgress = completedFocusSessions.length > 0 ? 1 : 0
            break
          case "daily-goal":
            newProgress = todaySessions.length >= settings.dailyGoal ? 1 : 0
            break
          case "century":
            newProgress = completedFocusSessions.length
            break
          case "early-bird":
            newProgress = completedFocusSessions.some((s) => new Date(s.date).getHours() < 8) ? 1 : 0
            break
          case "night-owl":
            newProgress = completedFocusSessions.some((s) => new Date(s.date).getHours() >= 22) ? 1 : 0
            break
          case "efficient":
            newProgress = earlyCompletions.length > 0 ? 1 : 0
            break
        }

        if (newProgress >= achievement.target && !unlocked) {
          unlocked = true
          // Show achievement notification
          if (Notification.permission === "granted") {
            new Notification("🏆 Conquista Desbloqueada!", {
              body: `${achievement.icon} ${achievement.title}: ${achievement.description}`,
            })
          }
        }

        return {
          ...achievement,
          progress: newProgress,
          unlocked,
          unlockedAt: unlocked && !achievement.unlocked ? new Date().toISOString() : achievement.unlockedAt,
        }
      }),
    )
  }

  // Timer logic
  useEffect(() => {
    if (timerState === "running" && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerState, timeLeft])

  // Handle session completion
  useEffect(() => {
    if (timeLeft === 0 && timerState === "running") {
      completeSessionNaturally()
    }
  }, [timeLeft, timerState])

  // When starting a new session, store its initial duration
  useEffect(() => {
    if (timerState === "running" && sessionStartTime === null) {
      setSessionStartTime(Date.now())
      setInitialSessionDuration(getSessionDuration(currentSession))
    }
  }, [timerState, sessionStartTime, currentSession])

  const completeSessionNaturally = () => {
    try {
      setTimerState("idle")

      const totalDuration = initialSessionDuration || getSessionDuration(currentSession)

      // Save session
      saveSession(currentSession, totalDuration, true, false, 0)

      // Play notification sound
      if (settings.soundEnabled && audioRef.current) {
        audioRef.current.play().catch(console.error)
      }

      // Show browser notification
      if (Notification.permission === "granted") {
        new Notification("Pomodoro Concluído!", {
          body: getNotificationMessage(),
          icon: "/favicon.ico",
        })
      }

      // Auto-advance to next session
      if (settings.autoStartBreaks || settings.autoStartPomodoros) {
        setTimeout(() => {
          advanceToNextSession()
          if (
            (currentSession === "focus" && settings.autoStartBreaks) ||
            (currentSession !== "focus" && settings.autoStartPomodoros)
          ) {
            setTimerState("running")
          }
        }, 2000)
      } else {
        advanceToNextSession()
      }

      // Reset session feedback
      setSessionMood(null)
      setSessionProductivity(null)
      setSessionStartTime(null)
    } catch (error) {
      console.error("Error completing session naturally:", error)
    }
  }

  const completeActivity = () => {
    try {
      if (currentSession !== "focus") return

      setTimerState("idle")

      const totalDuration = initialSessionDuration || getSessionDuration(currentSession)
      const timeUsed = totalDuration - timeLeft
      const timeSaved = timeLeft

      // Save session with early completion
      saveSession(currentSession, timeUsed, true, true, timeSaved)

      // Play notification sound
      if (settings.soundEnabled && audioRef.current) {
        audioRef.current.play().catch(console.error)
      }

      // Show browser notification
      if (Notification.permission === "granted") {
        const message = `Atividade concluída! Você economizou ${Math.floor(timeSaved / 60)}:${(timeSaved % 60)
          .toString()
          .padStart(2, "0")}`

        new Notification("Atividade Concluída!", {
          body: message,
          icon: "/favicon.ico",
        })
      }

      // Auto-advance to next session
      if (settings.autoStartBreaks || settings.autoStartPomodoros) {
        setTimeout(() => {
          advanceToNextSession()
          if (settings.autoStartBreaks) {
            setTimerState("running")
          }
        }, 2000)
      } else {
        advanceToNextSession()
      }

      // Reset session feedback
      setSessionMood(null)
      setSessionProductivity(null)
      setSessionStartTime(null)
    } catch (error) {
      console.error("Error completing activity:", error)
    }
  }

  const getNotificationMessage = () => {
    switch (currentSession) {
      case "focus":
        return "Tempo de fazer uma pausa!"
      case "short-break":
        return "Pausa finalizada. Hora de focar!"
      case "long-break":
        return "Pausa longa finalizada. Novo ciclo!"
    }
  }

  const advanceToNextSession = () => {
    if (currentSession === "focus") {
      const newCycleCount = cycleCount + 1
      setCycleCount(newCycleCount)

      if (newCycleCount % settings.longBreakInterval === 0) {
        setCurrentSession("long-break")
        const duration = settings.longBreakTime * 60
        setTimeLeft(duration)
        setInitialSessionDuration(duration)
      } else {
        setCurrentSession("short-break")
        const duration = settings.shortBreakTime * 60
        setTimeLeft(duration)
        setInitialSessionDuration(duration)
      }
    } else {
      setCurrentSession("focus")
      const duration = settings.focusTime * 60
      setTimeLeft(duration)
      setInitialSessionDuration(duration)
    }
  }

  const startTimer = () => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission()
    }
    setTimerState("running")
    setSessionStartTime(Date.now())
  }

  const pauseTimer = () => {
    setTimerState("paused")
  }

  const resetTimer = () => {
    setTimerState("idle")
    setCurrentSession("focus")
    const duration = settings.focusTime * 60
    setTimeLeft(duration)
    setInitialSessionDuration(duration)
    setCycleCount(0)
    setCurrentTask("defaultTask")
    setSessionMood(null)
    setSessionProductivity(null)
    setSessionStartTime(null)
  }

  const updateSettings = (newSettings: TimerSettings) => {
    setSettings(newSettings)
    if (timerState === "idle") {
      const duration = getSessionDuration(currentSession, newSettings)
      setTimeLeft(duration)
      setInitialSessionDuration(duration)
    }
  }

  const addTask = (title: string, description: string, estimatedPomodoros: number) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      estimatedPomodoros,
      completedPomodoros: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) => [...prev, newTask])
  }

  const toggleTaskComplete = (taskId: string) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))
  }

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getSessionTitle = () => {
    switch (currentSession) {
      case "focus":
        return "Foco"
      case "short-break":
        return "Pausa Curta"
      case "long-break":
        return "Pausa Longa"
    }
  }

  const getSessionColor = () => {
    switch (currentSession) {
      case "focus":
        return "text-black dark:text-white"
      case "short-break":
        return "text-green-600 dark:text-green-400"
      case "long-break":
        return "text-blue-600 dark:text-blue-400"
    }
  }

  const getProgressColor = () => {
    switch (currentSession) {
      case "focus":
        return "text-black dark:text-white"
      case "short-break":
        return "text-green-500"
      case "long-break":
        return "text-blue-500"
    }
  }

  const getInsights = () => {
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || "[]")
    const focusSessions = sessions.filter((s: Session) => s.type === "focus" && s.completed)

    if (focusSessions.length === 0) return []

    const insights = []

    // Best time of day
    const hourCounts = focusSessions.reduce((acc: any, session: Session) => {
      const hour = new Date(session.date).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {})

    const bestHourEntries = Object.entries(hourCounts)
    if (bestHourEntries.length > 0) {
      const bestHour = bestHourEntries.reduce((a: any, b: any) => (hourCounts[a[0]] > hourCounts[b[0]] ? a : b))[0]

      insights.push({
        icon: "🕐",
        title: "Melhor Horário",
        description: `Você é mais produtivo às ${bestHour}h`,
      })
    }

    // Average session length
    if (focusSessions.length > 0) {
      const avgDuration = focusSessions.reduce((acc: number, s: Session) => acc + s.duration, 0) / focusSessions.length
      insights.push({
        icon: "⏱️",
        title: "Duração Média",
        description: `Suas sessões duram em média ${Math.round(avgDuration / 60)} minutos`,
      })
    }

    // Streak
    const today = new Date()
    let streak = 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayStr = date.toDateString()
      const hasSessions = focusSessions.some((s: Session) => new Date(s.date).toDateString() === dayStr)
      if (hasSessions) {
        streak++
      } else {
        break
      }
    }

    if (streak > 0) {
      insights.push({
        icon: "🔥",
        title: "Sequência Atual",
        description: `${streak} dia${streak > 1 ? "s" : ""} consecutivo${streak > 1 ? "s" : ""}`,
      })
    }

    // Early completions
    const earlyCompletions = sessions.filter((s: Session) => s.completedEarly)
    if (earlyCompletions.length > 0) {
      const totalTimeSaved = earlyCompletions.reduce((acc: number, s: Session) => acc + (s.timeSaved || 0), 0)
      insights.push({
        icon: "⚡",
        title: "Eficiência",
        description: `Você economizou ${Math.round(totalTimeSaved / 60)} minutos completando tarefas antecipadamente`,
      })
    }

    return insights
  }

  const totalTime = initialSessionDuration || getSessionDuration(currentSession)
  const progress = ((totalTime - timeLeft) / totalTime) * 100
  const unlockedAchievements = achievements.filter((a) => a.unlocked)
  const activeTasks = tasks.filter((t) => !t.completed)
  const currentTaskData = currentTask && currentTask !== "defaultTask" ? tasks.find((t) => t.id === currentTask) : null

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-gray-100 dark:bg-gray-900 border-0">
          <TabsTrigger
            value="timer"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-black"
          >
            Timer
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-black"
          >
            <Target className="w-4 h-4 mr-2" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger
            value="achievements"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-black"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Conquistas
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-black"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-black"
          >
            <Settings className="w-4 h-4 mr-2" />
            Config
          </TabsTrigger>
          <TabsTrigger value="stats" asChild>
            <Link
              href="/dashboard"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-black"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-8 mt-8">
          <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-4 mb-2">
                <CardTitle className={`text-3xl font-semibold ${getSessionColor()}`}>{getSessionTitle()}</CardTitle>
                {unlockedAchievements.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Trophy className="w-3 h-3 mr-1" />
                    {unlockedAchievements.length}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ciclo {cycleCount + 1} • {Math.round(progress)}% completo
              </p>
              {currentTaskData && (
                <Badge variant="outline" className="mt-2">
                  {currentTaskData.title} ({currentTaskData.completedPomodoros}/{currentTaskData.estimatedPomodoros})
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex justify-center">
                <ProgressCircle progress={progress} size={240} strokeWidth={6} className={getProgressColor()}>
                  <div className="text-center">
                    <div className="text-5xl font-mono font-light tracking-tight text-black dark:text-white">
                      {formatTime(timeLeft)}
                    </div>
                    {settings.ambientSound !== "none" && timerState === "running" && (
                      <div className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        {AMBIENT_SOUNDS.find((s) => s.id === settings.ambientSound)?.name}
                      </div>
                    )}
                  </div>
                </ProgressCircle>
              </div>

              {/* Task Selection */}
              {currentSession === "focus" && timerState === "idle" && (
                <div className="flex justify-center">
                  <Select value={currentTask || "defaultTask"} onValueChange={setCurrentTask}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Selecionar tarefa (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="defaultTask">Nenhuma tarefa</SelectItem>
                      {activeTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title} ({task.completedPomodoros}/{task.estimatedPomodoros})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-center gap-3">
                {timerState === "idle" && (
                  <Button
                    onClick={startTimer}
                    size="lg"
                    className="px-8 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Iniciar
                  </Button>
                )}

                {timerState === "running" && (
                  <>
                    <Button
                      onClick={pauseTimer}
                      size="lg"
                      variant="outline"
                      className="px-8 border-gray-200 dark:border-gray-800"
                    >
                      <Pause className="w-5 h-5 mr-2" />
                      Pausar
                    </Button>

                    {currentSession === "focus" && (
                      <Button
                        onClick={completeActivity}
                        size="lg"
                        className="px-6 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Concluir Atividade
                      </Button>
                    )}
                  </>
                )}

                {timerState === "paused" && (
                  <>
                    <Button
                      onClick={startTimer}
                      size="lg"
                      className="px-8 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Continuar
                    </Button>

                    {currentSession === "focus" && (
                      <Button
                        onClick={completeActivity}
                        size="lg"
                        className="px-6 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Concluir Atividade
                      </Button>
                    )}
                  </>
                )}

                <Button
                  onClick={resetTimer}
                  size="lg"
                  variant="outline"
                  className="border-gray-200 dark:border-gray-800"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Resetar
                </Button>
              </div>

              {/* Session Feedback */}
              {timerState === "paused" && currentSession === "focus" && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="font-medium text-center">Como você se sente?</h4>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((mood) => (
                      <Button
                        key={mood}
                        variant={sessionMood === mood ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSessionMood(mood)}
                      >
                        {mood === 1 ? "😴" : mood === 2 ? "😐" : mood === 3 ? "🙂" : mood === 4 ? "😊" : "🤩"}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-8">
          <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold text-black dark:text-white">Tarefas</CardTitle>
                <p className="text-gray-600 dark:text-gray-400">Organize seu trabalho em pomodoros</p>
              </div>
              <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Tarefa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      addTask(
                        formData.get("title") as string,
                        formData.get("description") as string,
                        Number(formData.get("pomodoros")),
                      )
                      setShowTaskDialog(false)
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input id="title" name="title" required />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea id="description" name="description" />
                    </div>
                    <div>
                      <Label htmlFor="pomodoros">Pomodoros Estimados</Label>
                      <Input id="pomodoros" name="pomodoros" type="number" min="1" defaultValue="1" required />
                    </div>
                    <Button type="submit" className="w-full">
                      Adicionar Tarefa
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma tarefa criada ainda</p>
                  <p className="text-sm">Adicione uma tarefa para começar</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={task.completed} onCheckedChange={() => toggleTaskComplete(task.id)} />
                      <div>
                        <h4 className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {task.completedPomodoros}/{task.estimatedPomodoros} 🍅
                          </Badge>
                          {task.completedPomodoros >= task.estimatedPomodoros && (
                            <Badge variant="default" className="text-xs bg-green-500">
                              <Check className="w-3 h-3 mr-1" />
                              Completa
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="mt-8">
          <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-black dark:text-white flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Conquistas
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                {unlockedAchievements.length} de {achievements.length} desbloqueadas
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 border rounded-lg ${
                      achievement.unlocked
                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4
                          className={`font-medium ${achievement.unlocked ? "text-yellow-800 dark:text-yellow-200" : ""}`}
                        >
                          {achievement.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{achievement.description}</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${achievement.unlocked ? "bg-yellow-500" : "bg-gray-400"}`}
                            style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {achievement.progress}/{achievement.target}
                          {achievement.unlocked && achievement.unlockedAt && (
                            <span className="ml-2">
                              • Desbloqueada em {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-8">
          <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-black dark:text-white flex items-center gap-2">
                <Lightbulb className="w-6 h-6" />
                Insights Personalizados
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">Descubra padrões em sua produtividade</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getInsights().map((insight, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="text-2xl">{insight.icon}</div>
                    <div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{insight.description}</p>
                    </div>
                  </div>
                ))}

                {getInsights().length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Complete algumas sessões para ver seus insights</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">💡 Dica do Dia</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Tente fazer uma caminhada de 5 minutos durante suas pausas longas para melhorar o foco.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">🎯 Meta Sugerida</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Baseado no seu histórico, tente completar {Math.max(settings.dailyGoal, 6)} pomodoros hoje.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-8">
          <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-black dark:text-white">Configurações</CardTitle>
              <p className="text-gray-600 dark:text-gray-400">Personalize sua experiência Pomodoro</p>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Timer Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tempos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="focus-time">Foco (minutos)</Label>
                    <Input
                      id="focus-time"
                      type="number"
                      min="1"
                      max="60"
                      value={settings.focusTime}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          focusTime: Number.parseInt(e.target.value) || 25,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="short-break">Pausa Curta (minutos)</Label>
                    <Input
                      id="short-break"
                      type="number"
                      min="1"
                      max="30"
                      value={settings.shortBreakTime}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          shortBreakTime: Number.parseInt(e.target.value) || 5,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="long-break">Pausa Longa (minutos)</Label>
                    <Input
                      id="long-break"
                      type="number"
                      min="1"
                      max="60"
                      value={settings.longBreakTime}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          longBreakTime: Number.parseInt(e.target.value) || 15,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Audio Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Áudio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <Label htmlFor="sound-enabled">Notificações Sonoras</Label>
                      <p className="text-xs text-gray-500">Som quando sessão terminar</p>
                    </div>
                    <Switch
                      id="sound-enabled"
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => updateSettings({ ...settings, soundEnabled: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ambient-sound">Som Ambiente</Label>
                    <Select
                      value={settings.ambientSound}
                      onValueChange={(value) => updateSettings({ ...settings, ambientSound: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AMBIENT_SOUNDS.map((sound) => (
                          <SelectItem key={sound.id} value={sound.id}>
                            {sound.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Automation Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Automação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <Label htmlFor="auto-start-breaks">Iniciar Pausas Automaticamente</Label>
                      <p className="text-xs text-gray-500">Pausas começam sozinhas</p>
                    </div>
                    <Switch
                      id="auto-start-breaks"
                      checked={settings.autoStartBreaks}
                      onCheckedChange={(checked) => updateSettings({ ...settings, autoStartBreaks: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <Label htmlFor="auto-start-pomodoros">Iniciar Pomodoros Automaticamente</Label>
                      <p className="text-xs text-gray-500">Foco começa após pausas</p>
                    </div>
                    <Switch
                      id="auto-start-pomodoros"
                      checked={settings.autoStartPomodoros}
                      onCheckedChange={(checked) => updateSettings({ ...settings, autoStartPomodoros: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Goals Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Metas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="daily-goal">Meta Diária (pomodoros)</Label>
                    <Input
                      id="daily-goal"
                      type="number"
                      min="1"
                      max="20"
                      value={settings.dailyGoal}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          dailyGoal: Number.parseInt(e.target.value) || 8,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="long-break-interval">Intervalo Pausa Longa</Label>
                    <Input
                      id="long-break-interval"
                      type="number"
                      min="2"
                      max="8"
                      value={settings.longBreakInterval}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          longBreakInterval: Number.parseInt(e.target.value) || 4,
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">A cada quantos ciclos fazer pausa longa</p>
                  </div>
                </div>
              </div>

              {/* Well-being */}
              <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <h4 className="font-medium">Bem-estar</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Lembre-se de se hidratar, alongar e descansar os olhos durante as pausas.
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Coffee className="w-3 h-3 mr-1" />
                    Hidrate-se
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Alongue-se
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
