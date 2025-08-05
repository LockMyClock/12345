"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Printer, ZoomIn, ZoomOut } from "lucide-react"
import type { Fight, Category, Participant } from "../types"

interface BracketNode {
  id: string
  fightNumber?: number
  participant1?: Participant
  participant2?: Participant
  winner?: Participant
  round: string
  level: number
  position: number
  children?: BracketNode[]
  fight?: Fight
}

interface TournamentBracketProps {
  category: Category
  fights: Fight[]
  onFightClick?: (fight: Fight) => void
}

export default function TournamentBracket({ category, fights, onFightClick }: TournamentBracketProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [selectedRound, setSelectedRound] = useState<string>("all")

  // Построение дерева турнира
  const bracketTree = useMemo((): BracketNode[] => {
    const categoryFights = fights.filter((f) => f.categoryId === category.id)

    if (category.systemType === "round-robin") {
      return [] // Для круговой системы используем другой компонент
    }

    // Группируем бои по раундам
    const roundGroups = new Map<string, Fight[]>()
    categoryFights.forEach((fight) => {
      if (!roundGroups.has(fight.round)) {
        roundGroups.set(fight.round, [])
      }
      roundGroups.get(fight.round)!.push(fight)
    })

    // Определяем порядок раундов
    const roundOrder = ["1/16", "1/8", "1/4", "1/2", "3rd-place", "final"]
    const existingRounds = roundOrder.filter((round) => roundGroups.has(round))

    // Строим дерево снизу вверх (от финала к первому раунду)
    const levels: BracketNode[][] = []

    existingRounds.reverse().forEach((round, levelIndex) => {
      const roundFights = roundGroups.get(round)!.sort((a, b) => a.fightNumber - b.fightNumber)
      const nodes: BracketNode[] = []

      roundFights.forEach((fight, position) => {
        const node: BracketNode = {
          id: fight.id,
          fightNumber: fight.fightNumber,
          participant1: fight.participant1,
          participant2: fight.participant2,
          winner: fight.result ? (fight.result.winner === "red" ? fight.participant1 : fight.participant2) : undefined,
          round,
          level: levelIndex,
          position,
          fight,
        }
        nodes.push(node)
      })

      levels.push(nodes)
    })

    return levels.flat()
  }, [category, fights])

  // Группировка узлов по уровням для отрисовки
  const levelGroups = useMemo(() => {
    const groups = new Map<number, BracketNode[]>()
    bracketTree.forEach((node) => {
      if (!groups.has(node.level)) {
        groups.set(node.level, [])
      }
      groups.get(node.level)!.push(node)
    })
    return groups
  }, [bracketTree])

  const maxLevel = Math.max(...Array.from(levelGroups.keys()))

  const getRoundName = (round: string): string => {
    const names: { [key: string]: string } = {
      "1/16": "1/16 финала",
      "1/8": "1/8 финала",
      "1/4": "1/4 финала",
      "1/2": "1/2 финала",
      "3rd-place": "За 3-е место",
      final: "Финал",
    }
    return names[round] || round
  }

  const getParticipantInfo = (participant?: Participant) => {
    if (!participant) return { name: "TBD", region: "", flag: "" }

    return {
      name: participant.fullName,
      region: participant.city || participant.club,
      flag: getRegionFlag(participant.territory || participant.country),
    }
  }

  const getRegionFlag = (region: string): string => {
    // Простая логика для флагов регионов
    const flags: { [key: string]: string } = {
      Москва: "🏛️",
      "Санкт-Петербург": "🏰",
      "Московская область": "🌲",
      "Ленинградская область": "🌊",
      "Новосибирская область": "🏔️",
      "Ростовская область": "🌾",
      "Ульяновская область": "🏭",
      "Республика Хакасия": "⛰️",
    }
    return flags[region] || "🏴"
  }

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.5))

  const exportBracket = () => {
    window.print()
  }

  if (bracketTree.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Турнирная сетка - {category.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Турнирная сетка не создана</p>
            <p className="text-sm">Сначала проведите жеребьёвку</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Управление */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Турнирная сетка - {category.name}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">{Math.round(zoomLevel * 100)}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={exportBracket}>
                <Printer className="h-4 w-4 mr-2" />
                Печать
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium">Показать раунд:</label>
              <Select value={selectedRound} onValueChange={setSelectedRound}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все раунды</SelectItem>
                  {Array.from(new Set(bracketTree.map((n) => n.round))).map((round) => (
                    <SelectItem key={round} value={round}>
                      {getRoundName(round)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline">{category.participants.length} участников</Badge>
            <Badge variant="outline">Олимпийская система</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Турнирная сетка */}
      <div
        className="bg-gray-900 rounded-lg p-6 overflow-auto"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}
      >
        <div className="flex gap-8 min-w-max">
          {Array.from({ length: maxLevel + 1 }, (_, levelIndex) => {
            const levelNodes = levelGroups.get(maxLevel - levelIndex) || []
            if (levelNodes.length === 0) return null

            const roundName = levelNodes[0]?.round
            if (selectedRound !== "all" && selectedRound !== roundName) return null

            return (
              <div key={levelIndex} className="flex flex-col justify-center space-y-4">
                {/* Заголовок раунда */}
                <div className="text-center mb-4">
                  <Badge className="bg-red-600 text-white">{getRoundName(roundName)}</Badge>
                </div>

                {/* Узлы раунда */}
                <div className="space-y-8">
                  {levelNodes.map((node, nodeIndex) => (
                    <div key={node.id} className="relative">
                      {/* Бой */}
                      <div
                        className={`bg-gray-800 border-2 rounded-lg p-4 w-80 cursor-pointer transition-all hover:bg-gray-700 ${
                          node.fight?.status === "completed"
                            ? "border-green-500"
                            : node.fight?.status === "in-progress"
                              ? "border-blue-500"
                              : "border-gray-600"
                        }`}
                        onClick={() => node.fight && onFightClick?.(node.fight)}
                      >
                        {/* Номер боя */}
                        <div className="text-center mb-3">
                          <Badge variant="outline" className="bg-red-600 text-white border-red-500">
                            {node.fightNumber}
                          </Badge>
                        </div>

                        {/* Участники */}
                        <div className="space-y-2">
                          {/* Участник 1 */}
                          <div
                            className={`flex items-center justify-between p-2 rounded ${
                              node.winner?.id === node.participant1?.id ? "bg-green-700" : "bg-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getParticipantInfo(node.participant1).flag}</span>
                              <div>
                                <div className="text-white font-medium text-sm">
                                  {getParticipantInfo(node.participant1).name}
                                </div>
                                <div className="text-gray-300 text-xs">
                                  {getParticipantInfo(node.participant1).region}
                                </div>
                              </div>
                            </div>
                            {node.winner?.id === node.participant1?.id && (
                              <Trophy className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>

                          {/* Участник 2 */}
                          <div
                            className={`flex items-center justify-between p-2 rounded ${
                              node.winner?.id === node.participant2?.id ? "bg-green-700" : "bg-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getParticipantInfo(node.participant2).flag}</span>
                              <div>
                                <div className="text-white font-medium text-sm">
                                  {getParticipantInfo(node.participant2).name}
                                </div>
                                <div className="text-gray-300 text-xs">
                                  {getParticipantInfo(node.participant2).region}
                                </div>
                              </div>
                            </div>
                            {node.winner?.id === node.participant2?.id && (
                              <Trophy className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                        </div>

                        {/* Результат */}
                        {node.fight?.result && (
                          <div className="mt-2 text-center">
                            <Badge className="bg-blue-600 text-white text-xs">
                              {node.fight.result.type === "ippon"
                                ? "Иппон"
                                : node.fight.result.type === "wazari"
                                  ? "Вазари"
                                  : node.fight.result.type === "hantei"
                                    ? "Хантей"
                                    : node.fight.result.type === "technique"
                                      ? "Техника"
                                      : "Дисквалификация"}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Соединительные линии */}
                      {levelIndex < maxLevel && <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-red-500"></div>}

                      {/* Вертикальные соединители */}
                      {levelIndex < maxLevel && nodeIndex % 2 === 0 && nodeIndex + 1 < levelNodes.length && (
                        <>
                          <div className="absolute top-1/2 -right-4 w-4 h-0.5 bg-red-500"></div>
                          <div
                            className="absolute -right-4 bg-red-500 w-0.5"
                            style={{
                              top: "50%",
                              height: `${(8 + 4) * 16}px`, // расстояние между боями
                            }}
                          ></div>
                          <div
                            className="absolute -right-4 w-4 h-0.5 bg-red-500"
                            style={{ top: `calc(50% + ${(8 + 4) * 16}px)` }}
                          ></div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Легенда */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600 border-2 border-gray-600 rounded"></div>
              <span>Ожидает</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600 border-2 border-blue-500 rounded"></div>
              <span>В процессе</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600 border-2 border-green-500 rounded"></div>
              <span>Завершён</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-700 rounded"></div>
              <span>Победитель</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span>Прошёл в следующий раунд</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
