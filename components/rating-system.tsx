"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Trophy, Target, Users, Star, Award } from "lucide-react"
import type { Participant, Fight, Tournament } from "../types"

interface ParticipantRating {
  participant: Participant
  fights: number
  wins: number
  losses: number
  winRate: number
  points: number
  averageTime: number
  techniques: { [key: string]: number }
  rating: number
  rank: number
  trend: "up" | "down" | "stable"
}

interface ClubRating {
  club: string
  participants: number
  totalFights: number
  totalWins: number
  winRate: number
  averageRating: number
  topParticipants: Participant[]
}

interface RatingSystemProps {
  tournament: Tournament
  fights: Fight[]
}

export default function RatingSystem({ tournament, fights }: RatingSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"rating" | "wins" | "winRate" | "fights">("rating")
  const [viewMode, setViewMode] = useState<"participants" | "clubs" | "techniques">("participants")

  // Вычисление рейтингов участников
  const participantRatings = useMemo((): ParticipantRating[] => {
    const ratings: ParticipantRating[] = []

    tournament.participants.forEach((participant) => {
      const participantFights = fights.filter(
        (f) =>
          (f.participant1?.id === participant.id || f.participant2?.id === participant.id) &&
          f.status === "completed" &&
          f.result,
      )

      if (selectedCategory !== "all") {
        const categoryFights = participantFights.filter((f) => f.categoryId === selectedCategory)
        if (categoryFights.length === 0) return
      }

      const wins = participantFights.filter((f) => {
        if (!f.result) return false
        const winner = f.result.winner === "red" ? f.participant1 : f.participant2
        return winner?.id === participant.id
      }).length

      const losses = participantFights.length - wins
      const winRate = participantFights.length > 0 ? (wins / participantFights.length) * 100 : 0

      // Подсчёт очков по системе
      let points = 0
      const techniques: { [key: string]: number } = {}

      participantFights.forEach((fight) => {
        if (!fight.result) return

        const isWinner =
          (fight.result.winner === "red" && fight.participant1?.id === participant.id) ||
          (fight.result.winner === "blue" && fight.participant2?.id === participant.id)

        if (isWinner) {
          switch (fight.result.type) {
            case "ippon":
              points += 10
              break
            case "wazari":
              points += 7
              break
            case "hantei":
              points += 5
              break
            case "technique":
              points += 8
              break
            case "disqualification":
              points += 3
              break
          }

          techniques[fight.result.type] = (techniques[fight.result.type] || 0) + 1
        }
      })

      // Средняя продолжительность боя
      const fightTimes = participantFights
        .filter((f) => f.startTime && f.endTime)
        .map((f) => new Date(f.endTime!).getTime() - new Date(f.startTime!).getTime())
      const averageTime = fightTimes.length > 0 ? fightTimes.reduce((a, b) => a + b, 0) / fightTimes.length : 0

      // Расчёт рейтинга (комплексная формула)
      const rating = Math.round(
        points * 0.4 + // 40% - очки за победы
          winRate * 0.3 + // 30% - процент побед
          participantFights.length * 2 + // активность
          (averageTime > 0 ? Math.max(0, 300000 - averageTime) / 10000 : 0), // бонус за быстрые победы
      )

      ratings.push({
        participant,
        fights: participantFights.length,
        wins,
        losses,
        winRate,
        points,
        averageTime,
        techniques,
        rating,
        rank: 0, // будет установлен после сортировки
        trend: "stable", // упрощённо
      })
    })

    // Сортировка и присвоение рангов
    ratings.sort((a, b) => {
      switch (sortBy) {
        case "wins":
          return b.wins - a.wins
        case "winRate":
          return b.winRate - a.winRate
        case "fights":
          return b.fights - a.fights
        default:
          return b.rating - a.rating
      }
    })

    ratings.forEach((rating, index) => {
      rating.rank = index + 1
    })

    return ratings
  }, [tournament.participants, fights, selectedCategory, sortBy])

  // Вычисление рейтингов клубов
  const clubRatings = useMemo((): ClubRating[] => {
    const clubMap = new Map<string, ClubRating>()

    participantRatings.forEach((rating) => {
      const club = rating.participant.club
      if (!clubMap.has(club)) {
        clubMap.set(club, {
          club,
          participants: 0,
          totalFights: 0,
          totalWins: 0,
          winRate: 0,
          averageRating: 0,
          topParticipants: [],
        })
      }

      const clubRating = clubMap.get(club)!
      clubRating.participants++
      clubRating.totalFights += rating.fights
      clubRating.totalWins += rating.wins
    })

    // Вычисляем средние показатели
    clubMap.forEach((clubRating) => {
      clubRating.winRate = clubRating.totalFights > 0 ? (clubRating.totalWins / clubRating.totalFights) * 100 : 0

      const clubParticipants = participantRatings.filter((r) => r.participant.club === clubRating.club)
      clubRating.averageRating =
        clubParticipants.length > 0
          ? clubParticipants.reduce((sum, r) => sum + r.rating, 0) / clubParticipants.length
          : 0

      clubRating.topParticipants = clubParticipants
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3)
        .map((r) => r.participant)
    })

    return Array.from(clubMap.values()).sort((a, b) => b.averageRating - a.averageRating)
  }, [participantRatings])

  // Статистика техник
  const techniqueStats = useMemo(() => {
    const stats: { [key: string]: { count: number; percentage: number } } = {}
    let totalTechniques = 0

    participantRatings.forEach((rating) => {
      Object.entries(rating.techniques).forEach(([technique, count]) => {
        stats[technique] = stats[technique] || { count: 0, percentage: 0 }
        stats[technique].count += count
        totalTechniques += count
      })
    })

    // Вычисляем проценты
    Object.keys(stats).forEach((technique) => {
      stats[technique].percentage = totalTechniques > 0 ? (stats[technique].count / totalTechniques) * 100 : 0
    })

    return Object.entries(stats)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
  }, [participantRatings])

  const getTechniqueLabel = (technique: string): string => {
    const labels: { [key: string]: string } = {
      ippon: "Иппон",
      wazari: "Вазари",
      hantei: "Хантей",
      technique: "Техническая",
      disqualification: "Дисквалификация",
    }
    return labels[technique] || technique
  }

  const getRankColor = (rank: number): string => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800"
    if (rank === 2) return "bg-gray-100 text-gray-800"
    if (rank === 3) return "bg-orange-100 text-orange-800"
    if (rank <= 10) return "bg-blue-50 text-blue-700"
    return "bg-gray-50 text-gray-600"
  }

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return `${rank}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Рейтинговая система
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="text-sm font-medium">Категория:</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {tournament.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Сортировка:</label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Рейтинг</SelectItem>
                  <SelectItem value="wins">Победы</SelectItem>
                  <SelectItem value="winRate">% побед</SelectItem>
                  <SelectItem value="fights">Активность</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Вид:</label>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="participants">Участники</SelectItem>
                  <SelectItem value="clubs">Клубы</SelectItem>
                  <SelectItem value="techniques">Техники</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Общая статистика */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{participantRatings.length}</div>
              <div className="text-sm text-gray-600">Активных участников</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {fights.filter((f) => f.status === "completed").length}
              </div>
              <div className="text-sm text-gray-600">Завершённых боёв</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">
                {Math.round(participantRatings.reduce((sum, r) => sum + r.winRate, 0) / participantRatings.length || 0)}
                %
              </div>
              <div className="text-sm text-gray-600">Средний % побед</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-xl font-bold text-orange-600">{clubRatings.length}</div>
              <div className="text-sm text-gray-600">Клубов</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Рейтинг участников */}
      {viewMode === "participants" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Рейтинг участников
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Место</TableHead>
                  <TableHead>Участник</TableHead>
                  <TableHead>Клуб</TableHead>
                  <TableHead>Рейтинг</TableHead>
                  <TableHead>Бои</TableHead>
                  <TableHead>Победы</TableHead>
                  <TableHead>% побед</TableHead>
                  <TableHead>Очки</TableHead>
                  <TableHead>Техники</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participantRatings.slice(0, 50).map((rating) => (
                  <TableRow key={rating.participant.id} className={getRankColor(rating.rank)}>
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getRankIcon(rating.rank)}</span>
                        <span>{rating.rank}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{rating.participant.fullName}</div>
                      <div className="text-xs text-gray-500">
                        {rating.participant.age}л, {rating.participant.belt}
                      </div>
                    </TableCell>
                    <TableCell>{rating.participant.club}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold">{rating.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>{rating.fights}</TableCell>
                    <TableCell className="text-green-600 font-medium">{rating.wins}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={rating.winRate} className="w-16 h-2" />
                        <span className="text-sm">{Math.round(rating.winRate)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{rating.points}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {Object.entries(rating.techniques)
                          .slice(0, 3)
                          .map(([technique, count]) => (
                            <Badge key={technique} variant="outline" className="text-xs">
                              {getTechniqueLabel(technique)}: {count}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Рейтинг клубов */}
      {viewMode === "clubs" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Рейтинг клубов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clubRatings.map((club, index) => (
                <div key={club.club} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getRankIcon(index + 1)}</span>
                        <span className="font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-bold text-lg">{club.club}</div>
                        <div className="text-sm text-gray-600">
                          {club.participants} участников • {club.totalFights} боёв
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <span className="font-bold text-xl">{Math.round(club.averageRating)}</span>
                      </div>
                      <div className="text-sm text-gray-600">{Math.round(club.winRate)}% побед</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Топ участники:</div>
                    <div className="flex gap-2">
                      {club.topParticipants.map((participant, pIndex) => (
                        <Badge key={participant.id} variant="outline" className="text-xs">
                          {pIndex + 1}. {participant.fullName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Статистика техник */}
      {viewMode === "techniques" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              Статистика техник
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {techniqueStats.map(([technique, stats]) => (
                <div key={technique} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{getTechniqueLabel(technique)}</div>
                    <Badge variant="outline">{stats.count} раз</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={stats.percentage} className="w-32" />
                    <span className="text-sm font-medium w-12">{Math.round(stats.percentage)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
