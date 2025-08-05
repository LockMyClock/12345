"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Users, Target } from "lucide-react"
import TournamentBracket from "./tournament-bracket"
import RoundRobinManager from "./round-robin-manager"
import type { Tournament, Fight } from "../types"

interface BracketsViewerProps {
  tournament: Tournament
  fights: Fight[]
  onFightClick?: (fight: Fight) => void
  onUpdateResult?: (fightId: string, result: any) => void
}

export default function BracketsViewer({ tournament, fights, onFightClick, onUpdateResult }: BracketsViewerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(tournament.categories[0]?.id || "")
  const [viewMode, setViewMode] = useState<"bracket" | "list">("bracket")

  const currentCategory = tournament.categories.find((c) => c.id === selectedCategory)

  const getCategoryStats = (categoryId: string) => {
    const categoryFights = fights.filter((f) => f.categoryId === categoryId)
    return {
      total: categoryFights.length,
      completed: categoryFights.filter((f) => f.status === "completed").length,
      inProgress: categoryFights.filter((f) => f.status === "in-progress").length,
      pending: categoryFights.filter((f) => f.status === "pending").length,
    }
  }

  const getDisciplineIcon = (type: string) => {
    switch (type) {
      case "kata":
        return <Target className="h-4 w-4" />
      case "kumite":
        return <Trophy className="h-4 w-4" />
      case "kata-group":
        return <Users className="h-4 w-4" />
      default:
        return <Trophy className="h-4 w-4" />
    }
  }

  const getDisciplineName = (type: string) => {
    switch (type) {
      case "kata":
        return "Ката"
      case "kumite":
        return "Кумитэ"
      case "kata-group":
        return "Ката-группы"
      default:
        return type
    }
  }

  if (tournament.categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Турнирные сетки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Категории не созданы</p>
            <p className="text-sm">Сначала проведите жеребьёвку</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Выбор категории */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Турнирные сетки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-sm font-medium">Категория:</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {tournament.categories.map((category) => {
                    const stats = getCategoryStats(category.id)
                    return (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          {getDisciplineIcon(category.type)}
                          <span>{category.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {stats.completed}/{stats.total}
                          </Badge>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {currentCategory && (
              <div className="flex gap-2">
                <Badge variant="outline">{getDisciplineName(currentCategory.type)}</Badge>
                <Badge variant="outline">{currentCategory.participants.length} участников</Badge>
                <Badge variant="outline">{currentCategory.systemType === "olympic" ? "Олимпийская" : "Круговая"}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Статистика категории */}
      {currentCategory && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              {(() => {
                const stats = getCategoryStats(currentCategory.id)
                return (
                  <>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                      <div className="text-sm text-gray-600">Всего боёв</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                      <div className="text-sm text-gray-600">Завершено</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
                      <div className="text-sm text-gray-600">В процессе</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{stats.pending}</div>
                      <div className="text-sm text-gray-600">Ожидает</div>
                    </div>
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Турнирная сетка */}
      {currentCategory && (
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <TabsList>
            <TabsTrigger value="bracket">Турнирная сетка</TabsTrigger>
            {currentCategory.systemType === "round-robin" && <TabsTrigger value="table">Турнирная таблица</TabsTrigger>}
          </TabsList>

          <TabsContent value="bracket">
            {currentCategory.systemType === "olympic" ? (
              <TournamentBracket category={currentCategory} fights={fights} onFightClick={onFightClick} />
            ) : (
              <RoundRobinManager
                categoryId={currentCategory.id}
                participants={currentCategory.participants}
                fights={fights}
                onUpdateResult={onUpdateResult || (() => {})}
              />
            )}
          </TabsContent>

          {currentCategory.systemType === "round-robin" && (
            <TabsContent value="table">
              <RoundRobinManager
                categoryId={currentCategory.id}
                participants={currentCategory.participants}
                fights={fights}
                onUpdateResult={onUpdateResult || (() => {})}
              />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  )
}
