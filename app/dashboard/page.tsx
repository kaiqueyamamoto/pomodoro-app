import { StatsDashboard } from "@/components/stats-dashboard"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex items-center gap-6 mb-12">
          <Button asChild variant="outline" size="sm" className="border-gray-200 dark:border-gray-800">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white mb-2">Analytics</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Acompanhe seu progresso e produtividade ao longo do tempo
            </p>
          </div>
        </div>
        <StatsDashboard />
      </div>
    </div>
  )
}
