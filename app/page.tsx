import { PomodoroTimer } from "@/components/pomodoro-timer"

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white mb-4">Pomodoro Timer</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Maximize sua produtividade com a técnica Pomodoro. Foque por 25 minutos, descanse por 5, e repita.
          </p>
        </div>
        <PomodoroTimer />
      </div>
    </div>
  )
}
