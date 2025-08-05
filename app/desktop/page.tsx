"use client"

import { useState, useEffect } from "react"
import DesktopOperator from "../../components/desktop-operator"
import type { Tournament, Fight, FightResult } from "../../types"

export default function DesktopOperatorPage() {
  const [tournament, setTournament] = useState<Tournament>({
    id: crypto.randomUUID(),
    name: "Турнир по Киокушинкай каратэ",
    date: new Date().toISOString().split("T")[0],
    location: "Спортивный зал",
    categories: [],
    judges: [],
    participants: [],
    tatamisCount: 4,
    status: "registration",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const [fights, setFights] = useState<Fight[]>([])

  // Загрузка данных из localStorage при инициализации
  useEffect(() => {
    const savedTournament = localStorage.getItem("tournament_data")
    const savedFights = localStorage.getItem("fights_data")

    if (savedTournament) {
      setTournament(JSON.parse(savedTournament))
    }
    if (savedFights) {
      setFights(JSON.parse(savedFights))
    }
  }, [])

  // Сохранение данных в localStorage при изменениях
  useEffect(() => {
    localStorage.setItem("tournament_data", JSON.stringify(tournament))
  }, [tournament])

  useEffect(() => {
    localStorage.setItem("fights_data", JSON.stringify(fights))
  }, [fights])

  const handleFightResult = (fightId: string, result: FightResult) => {
    setFights((prev) =>
      prev.map((fight) => (fight.id === fightId ? { ...fight, result, endTime: new Date().toISOString() } : fight)),
    )
  }

  const handleFightStatusChange = (fightId: string, status: Fight["status"]) => {
    setFights((prev) =>
      prev.map((fight) =>
        fight.id === fightId
          ? {
              ...fight,
              status,
              startTime: status === "in-progress" ? new Date().toISOString() : fight.startTime,
            }
          : fight,
      ),
    )
  }

  const handleBroadcastUpdate = (data: any) => {
    // Отправка данных зрителям через WebSocket
    console.log("Отправка обновления зрителям:", data)

    // В реальном приложении здесь будет отправка через WebSocket
    if (typeof window !== "undefined" && (window as any).tournamentWebSocket) {
      ;(window as any).tournamentWebSocket.send(
        JSON.stringify({
          type: "operator_update",
          payload: data,
        }),
      )
    }
  }

  return (
    <DesktopOperator
      tournament={tournament}
      fights={fights}
      onFightResult={handleFightResult}
      onFightStatusChange={handleFightStatusChange}
      onBroadcastUpdate={handleBroadcastUpdate}
    />
  )
}
