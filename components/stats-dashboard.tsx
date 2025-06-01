"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import { Target, TrendingUp, Calendar, Zap, Heart, Trophy } from "lucide-react"

interface Session {
  id: string
  date: string
  type: "focus" | "short-break" | "long-break"
  duration: number
  completed: boolean
  taskId?: string
  mood?: number
  productivity?: number
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

interface Stats {
  totalSessions: number
  totalFocusTime: number
  totalBreakTime: number
  completionRate: number
  averageMood: number
  averageProductivity: number
  dailyData: Array<{ date: string; sessions: number; focusTime: number; mood: number }>
  typeDistribution: Array<{ name: string; value: number; color: string }>
  hourlyData: Array<{ hour: number; sessions: number }>
  taskProgress: Array<{ name: string; completed: number; total: number }>
  moodTrend: Array<{ date: string; mood: number; productivity: number }>
}

const STORAGE_KEYS = {
  SESSIONS: "pomodoro-sessions",
  TASKS: "pomodoro-tasks",
  SETTINGS: "pomodoro-settings",
}

export function StatsDashboard() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [period, setPeriod] = useState<"day" | "week" | "month">("week")
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    loadData()
  }, [period])

  useEffect(() => {
    if (sessions.length > 0) {
      calculateStats()
    } else {
      setEmptyStats()
    }
  }, [sessions, tasks])

  const loadData = () => {
    try {
      // Load sessions
      const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS)
      if (savedSessions) {
        const allSessions: Session[] = JSON.parse(savedSessions)
        const filteredSessions = filterSessionsByPeriod(allSessions, period)
        setSessions(filteredSessions)
      } else {
        setSessions([])
      }

      // Load tasks
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS)
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks))
      } else {
        setTasks([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setSessions([])
      setTasks([])
    }
  }

  const filterSessionsByPeriod = (allSessions: Session[], period: string) => {
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case "day":
        startDate.setHours(0, 0, 0, 0)
        break
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    return allSessions.filter((session) => new Date(session.date) >= startDate)
  }

  const setEmptyStats = () => {
    setStats({
      totalSessions: 0,
      totalFocusTime: 0,
      totalBreakTime: 0,
      completionRate: 0,
      averageMood: 0,
      averageProductivity: 0,
      dailyData: [],
      typeDistribution: [
        { name: "Foco", value: 0, color: "#000000" },
        { name: "Pausa Curta", value: 0, color: "#22c55e" },
        { name: "Pausa Longa", value: 0, color: "#3b82f6" },
      ],
      hourlyData: [],
      taskProgress: [],
      moodTrend: [],
    })
  }

  const calculateStats = () => {
    const totalSessions = sessions.length
    const completedSessions = sessions.filter((s) => s.completed).length
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

    const totalFocusTime = sessions
      .filter((s) => s.type === "focus" && s.completed)
      .reduce((acc, s) => acc + s.duration, 0)

    const totalBreakTime = sessions
      .filter((s) => (s.type === "short-break" || s.type === "long-break") && s.completed)
      .reduce((acc, s) => acc + s.duration, 0)

    // Mood and productivity averages
    const sessionsWithMood = sessions.filter((s) => s.mood !== undefined && s.mood !== null)
    const averageMood =
      sessionsWithMood.length > 0
        ? sessionsWithMood.reduce((acc, s) => acc + (s.mood || 0), 0) / sessionsWithMood.length
        : 0

    const sessionsWithProductivity = sessions.filter((s) => s.productivity !== undefined && s.productivity !== null)
    const averageProductivity =
      sessionsWithProductivity.length > 0
        ? sessionsWithProductivity.reduce((acc, s) => acc + (s.productivity || 0), 0) / sessionsWithProductivity.length
        : 0

    // Daily data with mood
    const dailyGroups = sessions.reduce(
      (acc, session) => {
        const date = new Date(session.date).toLocaleDateString("pt-BR", {
          month: "short",
          day: "numeric",
        })
        if (!acc[date]) {
          acc[date] = { sessions: 0, focusTime: 0, moods: [] }
        }
        acc[date].sessions++
        if (session.type === "focus" && session.completed) {
          acc[date].focusTime += session.duration
        }
        if (session.mood) {
          acc[date].moods.push(session.mood)
        }
        return acc
      },
      {} as Record<string, { sessions: number; focusTime: number; moods: number[] }>,
    )

    const dailyData = Object.entries(dailyGroups).map(([date, data]) => ({
      date,
      sessions: data.sessions,
      focusTime: Math.round(data.focusTime / 60),
      mood: data.moods.length > 0 ? data.moods.reduce((a, b) => a + b, 0) / data.moods.length : 0,
    }))

    // Hourly distribution
    const hourlyGroups = sessions.reduce(
      (acc, session) => {
        const hour = new Date(session.date).getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    )

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sessions: hourlyGroups[hour] || 0,
    })).filter((d) => d.sessions > 0)

    // Type distribution
    const typeGroups = sessions.reduce(
      (acc, session) => {
        if (session.completed) {
          acc[session.type] = (acc[session.type] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    const typeDistribution = [
      { name: "Foco", value: typeGroups.focus || 0, color: "#000000" },
      { name: "Pausa Curta", value: typeGroups["short-break"] || 0, color: "#22c55e" },
      { name: "Pausa Longa", value: typeGroups["long-break"] || 0, color: "#3b82f6" },
    ]

    // Task progress
    const taskProgress = tasks
      .map((task) => ({
        name: task.title.length > 20 ? task.title.substring(0, 20) + "..." : task.title,
        completed: task.completedPomodoros,
        total: task.estimatedPomodoros,
      }))
      .slice(0, 5) // Top 5 tasks

    // Mood trend
    const moodTrend = dailyData
      .filter((d) => d.mood > 0)
      .map((d) => ({
        date: d.date,
        mood: d.mood,
        productivity: d.sessions, // Using sessions as productivity proxy
      }))

    setStats({
      totalSessions,
      totalFocusTime: Math.round(totalFocusTime / 60),
      totalBreakTime: Math.round(totalBreakTime / 60),
      completionRate,
      averageMood,
      averageProductivity,
      dailyData,
      typeDistribution,
      hourlyData,
      taskProgress,
      moodTrend,
    })
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getMoodEmoji = (mood: number) => {
    if (mood >= 4.5) return "🤩"
    if (mood >= 3.5) return "😊"
    if (mood >= 2.5) return "🙂"
    if (mood >= 1.5) return "😐"
    return "😴"
  }

  const getStreakInfo = () => {
    const focusSessions = sessions.filter((s) => s.type === "focus" && s.completed)
    if (focusSessions.length === 0) return { current: 0, best: 0 }

    const dates = [...new Set(focusSessions.map((s) => new Date(s.date).toDateString()))].sort()
    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0

    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toDateString()

      if (dates.includes(dateStr)) {
        tempStreak++
        if (i === 0 || dates.includes(new Date(today.getTime() - (i - 1) * 86400000).toDateString())) {
          currentStreak = tempStreak
        }
      } else {
        bestStreak = Math.max(bestStreak, tempStreak)
        tempStreak = 0
      }
    }

    bestStreak = Math.max(bestStreak, tempStreak)
    return { current: currentStreak, best: bestStreak }
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Carregando estatísticas...</div>
      </div>
    )
  }

  const streakInfo = getStreakInfo()

  return (
    <div className="space-y-8">
      <Tabs value={period} onValueChange={(value) => setPeriod(value as any)}>
        <TabsList className="bg-gray-100 dark:bg-gray-900 border-0">
          <TabsTrigger
            value="day"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-black"
          >
            Hoje
          </TabsTrigger>
          <TabsTrigger
            value="week"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-black"
          >
            7 dias
          </TabsTrigger>
          <TabsTrigger
            value="month"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-black"
          >
            30 dias
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Sessões</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black dark:text-white">{stats.totalSessions}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">{stats.completionRate.toFixed(1)}% concluídas</p>
              {streakInfo.current > 0 && (
                <Badge variant="secondary" className="text-xs">
                  🔥 {streakInfo.current}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Tempo de Foco</CardTitle>
            <Target className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black dark:text-white">{formatTime(stats.totalFocusTime)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tempo produtivo • {Math.round(stats.totalFocusTime / 25)} pomodoros
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Bem-estar</CardTitle>
            <Heart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-black dark:text-white">
                {stats.averageMood > 0 ? stats.averageMood.toFixed(1) : "—"}
              </div>
              {stats.averageMood > 0 && <div className="text-2xl">{getMoodEmoji(stats.averageMood)}</div>}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Humor médio • {formatTime(stats.totalBreakTime)} de descanso
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black dark:text-white">{stats.completionRate.toFixed(0)}%</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Taxa de conclusão</p>
              {streakInfo.best > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Trophy className="w-3 h-3 mr-1" />
                  Melhor: {streakInfo.best}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black dark:text-white">Atividade Diária</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="#000000"
                    fill="#000000"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                Nenhuma sessão encontrada
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black dark:text-white">Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.typeDistribution.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.typeDistribution.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                Nenhuma sessão concluída
              </div>
            )}
          </CardContent>
        </Card>

        {stats.hourlyData.length > 0 && (
          <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black dark:text-white">
                Distribuição por Horário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} tickFormatter={(hour) => `${hour}h`} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    labelFormatter={(hour) => `${hour}:00`}
                  />
                  <Bar dataKey="sessions" fill="#000000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {stats.taskProgress.length > 0 && (
          <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black dark:text-white">Progresso das Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.taskProgress.map((task, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{task.name}</span>
                      <span className="text-gray-500">
                        {task.completed}/{task.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-black dark:bg-white h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((task.completed / task.total) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {stats.moodTrend.length > 0 && (
          <Card className="lg:col-span-2 border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-black dark:text-white">
                Tendência de Humor e Produtividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.moodTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} domain={[1, 5]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="mood"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                    name="Humor"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="productivity"
                    stroke="#000000"
                    strokeWidth={3}
                    dot={{ fill: "#000000", strokeWidth: 2, r: 4 }}
                    name="Sessões"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Insights Section */}
      {stats.totalSessions > 0 && (
        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Insights Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">🎯 Foco</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {stats.completionRate >= 80
                    ? "Excelente taxa de conclusão! Continue assim."
                    : "Tente reduzir distrações para melhorar o foco."}
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">⚡ Energia</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {stats.averageMood >= 4
                    ? "Seu humor está ótimo! Aproveite a energia."
                    : "Considere pausas mais longas para recarregar."}
                </p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">📈 Progresso</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {streakInfo.current >= 3
                    ? `Sequência de ${streakInfo.current} dias! Você está no ritmo.`
                    : "Tente manter consistência diária para melhores resultados."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
