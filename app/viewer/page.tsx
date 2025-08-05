"use client"

import { useState, useEffect } from "react"
import PublicWebViewer from "../../components/public-web-viewer"
import type { Tournament, Fight } from "../../types"

export default function ViewerPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [fights, setFights] = useState<Fight[]>([])

  // Попытка загрузить данные из localStorage (если оператор на том же устройстве)
  // В реальном приложении данные будут приходить через WebSocket
  useEffect(() => {
    const checkForData = () => {
      try {
        const savedTournament = localStorage.getItem("tournament_data")
        const savedFights = localStorage.getItem("fights_data")

        if (savedTournament) {
          setTournament(JSON.parse(savedTournament))
        }
        if (savedFights) {
          setFights(JSON.parse(savedFights))
        }
      } catch (error) {
        console.log("Нет локальных данных, ожидание подключения к оператору")
      }
    }

    // Проверяем данные сразу
    checkForData()

    // И потом каждые 2 секунды обновляем (для демо)
    const interval = setInterval(checkForData, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <PublicWebViewer 
      initialTournament={tournament || undefined}
      initialFights={fights}
      websocketUrl="ws://localhost:8080/viewer"
    />
  )
}