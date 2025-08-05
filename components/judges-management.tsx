"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCheck, Users, Shuffle, AlertTriangle } from "lucide-react"
import type { Fight, Tournament } from "../types"

interface JudgesManagementProps {
  tournament: Tournament
  fights: Fight[]
  onAssignJudge: (fightId: string, judgeId: string, role: "main" | "side1" | "side2" | "reserve") => void
}

interface JudgeAssignment {
  fightId: string
  judgeId: string
  role: "main" | "side1" | "side2" | "reserve"
  categoryId: string
  tatami: number
}

export default function JudgesManagement({ tournament, fights, onAssignJudge }: JudgesManagementProps) {
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedTatami, setSelectedTatami] = useState<number>(0)
  const [autoAssignMode, setAutoAssignMode] = useState<"category" | "tatami" | "all">("category")

  // Автоматическое распределение судей
  const autoAssignJudges = () => {
    const newAssignments: JudgeAssignment[] = []
    const judgeWorkload = new Map<string, number>()

    // Инициализируем нагрузку судей
    tournament.judges.forEach((judge) => {
      judgeWorkload.set(judge.id, 0)
    })

    let fightsToAssign = fights.filter((f) => f.status === "pending")

    // Фильтруем по выбранным критериям
    if (selectedCategory !== "all") {
      fightsToAssign = fightsToAssign.filter((f) => f.categoryId === selectedCategory)
    }
    if (selectedTatami > 0) {
      fightsToAssign = fightsToAssign.filter((f) => f.tatami === selectedTatami)
    }

    // Сортируем бои по времени/номеру
    fightsToAssign.sort((a, b) => a.fightNumber - b.fightNumber)

    fightsToAssign.forEach((fight) => {
      // Получаем доступных судей (с минимальной нагрузкой)
      const availableJudges = tournament.judges
        .map((judge) => ({
          judge,
          workload: judgeWorkload.get(judge.id) || 0,
        }))
        .sort((a, b) => a.workload - b.workload)

      // Назначаем главного судью
      if (availableJudges.length > 0) {
        const mainJudge = availableJudges[0].judge
        newAssignments.push({
          fightId: fight.id,
          judgeId: mainJudge.id,
          role: "main",
          categoryId: fight.categoryId,
          tatami: fight.tatami,
        })
        judgeWorkload.set(mainJudge.id, (judgeWorkload.get(mainJudge.id) || 0) + 3)
      }

      // Назначаем боковых судей
      if (availableJudges.length > 1) {
        const side1Judge = availableJudges[1].judge
        newAssignments.push({
          fightId: fight.id,
          judgeId: side1Judge.id,
          role: "side1",
          categoryId: fight.categoryId,
          tatami: fight.tatami,
        })
        judgeWorkload.set(side1Judge.id, (judgeWorkload.get(side1Judge.id) || 0) + 1)
      }

      if (availableJudges.length > 2) {
        const side2Judge = availableJudges[2].judge
        newAssignments.push({
          fightId: fight.id,
          judgeId: side2Judge.id,
          role: "side2",
          categoryId: fight.categoryId,
          tatami: fight.tatami,
        })
        judgeWorkload.set(side2Judge.id, (judgeWorkload.get(side2Judge.id) || 0) + 1)
      }

      // Назначаем резервного судью если есть
      if (availableJudges.length > 3) {
        const reserveJudge = availableJudges[3].judge
        newAssignments.push({
          fightId: fight.id,
          judgeId: reserveJudge.id,
          role: "reserve",
          categoryId: fight.categoryId,
          tatami: fight.tatami,
        })
        judgeWorkload.set(reserveJudge.id, (judgeWorkload.get(reserveJudge.id) || 0) + 0.5)
      }
    })

    setAssignments((prev) => [...prev, ...newAssignments])

    // Уведомляем родительский компонент
    newAssignments.forEach((assignment) => {
      onAssignJudge(assignment.fightId, assignment.judgeId, assignment.role)
    })
  }

  // Получение назначений для конкретного боя
  const getFightAssignments = (fightId: string) => {
    return assignments.filter((a) => a.fightId === fightId)
  }

  // Получение нагрузки судьи
  const getJudgeWorkload = (judgeId: string) => {
    return assignments
      .filter((a) => a.judgeId === judgeId)
      .reduce((total, assignment) => {
        switch (assignment.role) {
          case "main":
            return total + 3
          case "side1":
          case "side2":
            return total + 1
          case "reserve":
            return total + 0.5
          default:
            return total
        }
      }, 0)
  }

  // Проверка конфликтов (судья не может судить участников из своего клуба)
  const getJudgeConflicts = (judgeId: string, fightId: string) => {
    const judge = tournament.judges.find((j) => j.id === judgeId)
    const fight = fights.find((f) => f.id === fightId)

    if (!judge || !fight) return []

    const conflicts = []
    if (fight.participant1?.club === judge.club) {
      conflicts.push(`Конфликт с ${fight.participant1.fullName} (${judge.club})`)
    }
    if (fight.participant2?.club === judge.club) {
      conflicts.push(`Конфликт с ${fight.participant2.fullName} (${judge.club})`)
    }

    return conflicts
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "main":
        return "bg-blue-100 text-blue-800"
      case "side1":
        return "bg-green-100 text-green-800"
      case "side2":
        return "bg-green-100 text-green-800"
      case "reserve":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "main":
        return "Главный"
      case "side1":
        return "Боковой 1"
      case "side2":
        return "Боковой 2"
      case "reserve":
        return "Резерв"
      default:
        return role
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-6 w-6" />
            Управление судьями
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium">Категория:</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Все категории" />
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
              <label className="text-sm font-medium">Татами:</label>
              <Select value={selectedTatami.toString()} onValueChange={(value) => setSelectedTatami(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Все татами" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Все татами</SelectItem>
                  {Array.from({ length: tournament.tatamisCount }, (_, i) => i + 1).map((tatami) => (
                    <SelectItem key={tatami} value={tatami.toString()}>
                      Татами {tatami}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Режим назначения:</label>
              <Select
                value={autoAssignMode}
                onValueChange={(value: "category" | "tatami" | "all") => setAutoAssignMode(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">По категории</SelectItem>
                  <SelectItem value="tatami">По татами</SelectItem>
                  <SelectItem value="all">Все бои</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={autoAssignJudges} className="w-full">
                <Shuffle className="h-4 w-4 mr-2" />
                Автоназначение
              </Button>
            </div>
          </div>

          {/* Статистика судей */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{tournament.judges.length}</div>
              <div className="text-sm text-gray-600">Всего судей</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{new Set(assignments.map((a) => a.judgeId)).size}</div>
              <div className="text-sm text-gray-600">Назначено</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-xl font-bold text-orange-600">
                {assignments.filter((a) => a.role === "main").length}
              </div>
              <div className="text-sm text-gray-600">Главных судей</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">
                {
                  assignments.filter((a) => {
                    const conflicts = getJudgeConflicts(a.judgeId, a.fightId)
                    return conflicts.length > 0
                  }).length
                }
              </div>
              <div className="text-sm text-gray-600">Конфликтов</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица назначений */}
      <Card>
        <CardHeader>
          <CardTitle>Назначения судей</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Бой</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Татами</TableHead>
                <TableHead>Участники</TableHead>
                <TableHead>Главный судья</TableHead>
                <TableHead>Боковые судьи</TableHead>
                <TableHead>Резерв</TableHead>
                <TableHead>Конфликты</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fights
                .filter((f) => f.status === "pending")
                .filter((f) => selectedCategory === "all" || f.categoryId === selectedCategory)
                .filter((f) => selectedTatami === 0 || f.tatami === selectedTatami)
                .slice(0, 20)
                .map((fight) => {
                  const fightAssignments = getFightAssignments(fight.id)
                  const mainJudge = fightAssignments.find((a) => a.role === "main")
                  const sideJudges = fightAssignments.filter((a) => a.role === "side1" || a.role === "side2")
                  const reserveJudge = fightAssignments.find((a) => a.role === "reserve")
                  const category = tournament.categories.find((c) => c.id === fight.categoryId)

                  const allConflicts = fightAssignments.flatMap((assignment) =>
                    getJudgeConflicts(assignment.judgeId, fight.id),
                  )

                  return (
                    <TableRow key={fight.id}>
                      <TableCell>
                        <Badge variant="outline">#{fight.fightNumber}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{category?.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{fight.tatami}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{fight.participant1?.fullName}</div>
                        <div className="text-gray-500">vs</div>
                        <div>{fight.participant2?.fullName}</div>
                      </TableCell>
                      <TableCell>
                        {mainJudge ? (
                          <Badge className={getRoleColor("main")}>
                            {tournament.judges.find((j) => j.id === mainJudge.judgeId)?.fullName}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">Не назначен</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {sideJudges.map((assignment) => (
                            <Badge key={assignment.judgeId} className={getRoleColor(assignment.role)} variant="outline">
                              {tournament.judges.find((j) => j.id === assignment.judgeId)?.fullName}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {reserveJudge ? (
                          <Badge className={getRoleColor("reserve")} variant="outline">
                            {tournament.judges.find((j) => j.id === reserveJudge.judgeId)?.fullName}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {allConflicts.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <Badge variant="destructive">{allConflicts.length}</Badge>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Нагрузка судей */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Нагрузка судей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournament.judges.map((judge) => {
              const workload = getJudgeWorkload(judge.id)
              const judgeAssignments = assignments.filter((a) => a.judgeId === judge.id)

              return (
                <div key={judge.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{judge.fullName}</div>
                    <Badge variant="outline">{workload} баллов</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {judge.degree} • {judge.club}
                  </div>

                  <div className="space-y-1">
                    {judgeAssignments.slice(0, 3).map((assignment) => {
                      const fight = fights.find((f) => f.id === assignment.fightId)
                      return (
                        <div key={assignment.fightId} className="flex items-center justify-between text-xs">
                          <span>Бой #{fight?.fightNumber}</span>
                          <Badge className={getRoleColor(assignment.role)} variant="outline">
                            {getRoleName(assignment.role)}
                          </Badge>
                        </div>
                      )
                    })}
                    {judgeAssignments.length > 3 && (
                      <div className="text-xs text-gray-500">+{judgeAssignments.length - 3} ещё</div>
                    )}
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
