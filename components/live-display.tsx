"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Monitor, Clock, Trophy, Tv } from "lucide-react"
import type { Fight, Participant, Category } from "../types"

interface LiveDisplayProps {
  fights: Fight[]
  categories: Category[]
  liveData?: { [tatami: number]: any }
  displayMode?: "full" | "compact" | "queue"
}

export default function LiveDisplay({ fights, categories, liveData = {}, displayMode = "full" }: LiveDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getParticipantDisplay = (participant: Participant | undefined, isRed: boolean) => {
    if (!participant) return { name: "TBD", club: "", details: "" }

    return {
      name: participant.fullName,
      club: participant.club,
      details: `${participant.age}л, ${participant.weight}кг, ${participant.belt}`,
      color: isRed ? "text-red-600" : "text-blue-600",
    }
  }

  const getTatamiStats = (tatamiNumber: number) => {
    const tatamieFights = fights.filter((f) => f.tatami === tatamiNumber)
    return {
      total: tatamieFights.length,
      completed: tatamieFights.filter((f) => f.status === "completed").length,
      inProgress: tatamieFights.filter((f) => f.status === "in-progress").length,
      pending: tatamieFights.filter((f) => f.status === "pending").length,
    }
  }

  const getAllTatamis = () => {
    const tatamis = new Set(fights.map((f) => f.tatami))
    return Array.from(tatamis).sort((a, b) => a - b)
  }

  if (displayMode === "queue") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tv className="h-6 w-6" />
                Очередь поединков
              </div>
              <div className="text-sm font-normal text-gray-500">{currentTime.toLocaleTimeString("ru-RU")}</div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {getAllTatamis().map((tatamiNumber) => {
                const upcomingFights = fights
                  .filter((f) => f.tatami === tatamiNumber && f.status === "pending")
                  .slice(0, 3)
                const currentFight = fights.find((f) => f.tatami === tatamiNumber && f.status === "in-progress")

                return (
                  <div key={tatamiNumber} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg">Татами {tatamiNumber}</h3>
                      <Badge variant="outline">{upcomingFights.length} в очереди</Badge>
                    </div>

                    {currentFight && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-blue-600">ИДЁТ БОЙ #{currentFight.fightNumber}</Badge>
                          {liveData[tatamiNumber]?.timer !== undefined && (
                            <div className="font-mono text-lg font-bold">
                              {formatTime(liveData[tatamiNumber].timer)}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-red-600 font-medium">
                            {getParticipantDisplay(currentFight.participant1, true).name}
                            <div className="text-xs text-gray-500">
                              {getParticipantDisplay(currentFight.participant1, true).club}
                            </div>
                          </div>
                          <div className="text-blue-600 font-medium">
                            {getParticipantDisplay(currentFight.participant2, false).name}
                            <div className="text-xs text-gray-500">
                              {getParticipantDisplay(currentFight.participant2, false).club}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {upcomingFights.map((fight, index) => (
                        <div
                          key={fight.id}
                          className={`p-2 rounded border ${
                            index === 0 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs">
                              #{fight.fightNumber}
                            </Badge>
                            {index === 0 && <Badge className="bg-green-100 text-green-800 text-xs">Следующий</Badge>}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-red-600">
                              {getParticipantDisplay(fight.participant1, true).name}
                              <div className="text-xs text-gray-500">
                                {getParticipantDisplay(fight.participant1, true).club}
                              </div>
                            </div>
                            <div className="text-blue-600">
                              {getParticipantDisplay(fight.participant2, false).name}
                              <div className="text-xs text-gray-500">
                                {getParticipantDisplay(fight.participant2, false).club}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-6 w-6" />
              Live-трансляция турнира
            </div>
            <div className="text-lg font-mono">{currentTime.toLocaleTimeString("ru-RU")}</div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Общая статистика */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Общая статистика
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
              <div className="text-sm text-gray-600">Категорий</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {fights.filter((f) => f.status === "completed").length}
              </div>
              <div className="text-sm text-gray-600">Завершено боёв</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {fights.filter((f) => f.status === "pending").length}
              </div>
              <div className="text-sm text-gray-600">Ожидает</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{fights.length}</div>
              <div className="text-sm text-gray-600">Всего боёв</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статус татами */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getAllTatamis().map((tatamiNumber) => {
          const stats = getTatamiStats(tatamiNumber)
          const currentFight = fights.find((f) => f.tatami === tatamiNumber && f.status === "in-progress")
          const nextFights = fights.filter((f) => f.tatami === tatamiNumber && f.status === "pending").slice(0, 2)

          return (
            <Card key={tatamiNumber}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Татами {tatamiNumber}</span>
                  <Badge variant="outline">
                    {stats.completed}/{stats.total}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Текущий бой */}
                {currentFight ? (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-blue-600">БОЙ #{currentFight.fightNumber}</Badge>
                      {liveData[tatamiNumber]?.timer !== undefined && (
                        <div className="font-mono text-lg font-bold">{formatTime(liveData[tatamiNumber].timer)}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-red-600 font-medium text-sm">
                          {getParticipantDisplay(currentFight.participant1, true).name}
                        </span>
                        <span className="text-blue-600 font-medium text-sm">
                          {getParticipantDisplay(currentFight.participant2, false).name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{getParticipantDisplay(currentFight.participant1, true).club}</span>
                        <span>{getParticipantDisplay(currentFight.participant2, false).club}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">Ожидание</div>
                  </div>
                )}

                {/* Следующие бои */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Следующие:</h4>
                  {nextFights.length > 0 ? (
                    nextFights.map((fight, index) => (
                      <div key={fight.id} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">
                            #{fight.fightNumber}
                          </Badge>
                          {index === 0 && <Badge className="bg-green-100 text-green-800 text-xs">Следующий</Badge>}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-red-600">{getParticipantDisplay(fight.participant1, true).name}</span>
                          <span className="text-blue-600">{getParticipantDisplay(fight.participant2, false).name}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 text-center py-2">Нет ожидающих боёв</div>
                  )}
                </div>

                {/* Прогресс */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Прогресс</span>
                    <span>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
