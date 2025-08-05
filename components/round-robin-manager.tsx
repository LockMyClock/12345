"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, Users, Calculator } from "lucide-react"
import type { Participant, Fight, FightResult } from "../types"

interface RoundRobinResult {
  participant: Participant
  wins: number
  losses: number
  points: number
  timeBonus: number
  totalScore: number
  place: number
}

interface RoundRobinManagerProps {
  categoryId: string
  participants: Participant[]
  fights: Fight[]
  onUpdateResult: (fightId: string, result: FightResult) => void
}

export default function RoundRobinManager({
  categoryId,
  participants,
  fights,
  onUpdateResult,
}: RoundRobinManagerProps) {
  const [manualScores, setManualScores] = useState<{ [participantId: string]: number }>({})

  // Фильтруем бои для данной категории
  const categoryFights = fights.filter((fight) => fight.categoryId === categoryId)

  // Вычисляем результаты круговой системы
  const calculateResults = (): RoundRobinResult[] => {
    const results: RoundRobinResult[] = participants.map((participant) => ({
      participant,
      wins: 0,
      losses: 0,
      points: 0,
      timeBonus: 0,
      totalScore: manualScores[participant.id] || 0,
      place: 0,
    }))

    // Подсчитываем результаты из боёв
    categoryFights.forEach((fight) => {
      if (fight.result && fight.participant1 && fight.participant2) {
        const winner = fight.result.winner === "red" ? fight.participant1 : fight.participant2
        const loser = fight.result.winner === "red" ? fight.participant2 : fight.participant1

        const winnerResult = results.find((r) => r.participant.id === winner.id)
        const loserResult = results.find((r) => r.participant.id === loser.id)

        if (winnerResult && loserResult) {
          winnerResult.wins++
          loserResult.losses++

          // Начисляем очки в зависимости от типа победы
          switch (fight.result.type) {
            case "ippon":
              winnerResult.points += 3
              break
            case "wazari":
              winnerResult.points += 2
              break
            case "hantei":
              winnerResult.points += 1
              break
            case "technique":
              winnerResult.points += 2
              break
            default:
              winnerResult.points += 1
          }

          // Бонус за время (если бой закончился быстро)
          if (fight.duration && fight.duration < 60) {
            winnerResult.timeBonus += 1
          }
        }
      }
    })

    // Вычисляем общий счёт и места
    results.forEach((result) => {
      result.totalScore += result.points + result.timeBonus
    })

    // Сортируем по общему счёту (больше - лучше)
    results.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
      if (b.wins !== a.wins) return b.wins - a.wins
      return a.losses - b.losses
    })

    // Присваиваем места
    results.forEach((result, index) => {
      result.place = index + 1
    })

    return results
  }

  const results = calculateResults()

  const updateManualScore = (participantId: string, score: number) => {
    setManualScores((prev) => ({
      ...prev,
      [participantId]: score,
    }))
  }

  const getPlaceColor = (place: number): string => {
    switch (place) {
      case 1:
        return "bg-yellow-100 text-yellow-800"
      case 2:
        return "bg-gray-100 text-gray-800"
      case 3:
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-50 text-gray-600"
    }
  }

  const getPlaceIcon = (place: number): string => {
    switch (place) {
      case 1:
        return "🥇"
      case 2:
        return "🥈"
      case 3:
        return "🥉"
      default:
        return `${place}`
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Круговая система - Группа из {participants.length} участников
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Расписание боёв */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Расписание боёв</h3>
              <div className="space-y-2">
                {categoryFights.map((fight) => (
                  <div
                    key={fight.id}
                    className={`p-3 border rounded-lg ${
                      fight.status === "completed"
                        ? "bg-green-50 border-green-200"
                        : fight.status === "in-progress"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <Badge variant="outline" className="mb-1">
                          Бой #{fight.fightNumber}
                        </Badge>
                        <div className="text-sm">
                          <span className="text-red-600">{fight.participant1?.fullName}</span>
                          <span className="mx-2">vs</span>
                          <span className="text-blue-600">{fight.participant2?.fullName}</span>
                        </div>
                      </div>
                      {fight.result && (
                        <Badge
                          className={
                            fight.result.winner === "red" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                          }
                        >
                          {fight.result.winner === "red" ? "Красный" : "Синий"} - {fight.result.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ручное редактирование очков */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Ручное редактирование очков</h3>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{participant.fullName}</div>
                      <div className="text-xs text-gray-500">{participant.club}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Очки:</label>
                      <Input
                        type="number"
                        value={manualScores[participant.id] || 0}
                        onChange={(e) => updateManualScore(participant.id, Number.parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Итоговая таблица */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Итоговая таблица
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Место</TableHead>
                <TableHead>Участник</TableHead>
                <TableHead>Клуб</TableHead>
                <TableHead>Победы</TableHead>
                <TableHead>Поражения</TableHead>
                <TableHead>Очки за бои</TableHead>
                <TableHead>Бонус за время</TableHead>
                <TableHead>Ручные очки</TableHead>
                <TableHead>Общий счёт</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.participant.id} className={getPlaceColor(result.place)}>
                  <TableCell className="font-bold">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPlaceIcon(result.place)}</span>
                      <span>{result.place}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{result.participant.fullName}</TableCell>
                  <TableCell>{result.participant.club}</TableCell>
                  <TableCell className="text-green-600 font-medium">{result.wins}</TableCell>
                  <TableCell className="text-red-600">{result.losses}</TableCell>
                  <TableCell>{result.points}</TableCell>
                  <TableCell>{result.timeBonus}</TableCell>
                  <TableCell>{manualScores[result.participant.id] || 0}</TableCell>
                  <TableCell className="font-bold text-lg">{result.totalScore}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Кнопки действий */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button>
              <Calculator className="h-4 w-4 mr-2" />
              Пересчитать результаты
            </Button>
            <Button variant="outline">Экспорт протокола</Button>
            <Button variant="outline">Печать таблицы</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
