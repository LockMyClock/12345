"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Calendar, Users, AlertTriangle, Download, Settings, Coffee, Trophy } from "lucide-react"
import type { Tournament, Fight, Category } from "../types"

interface ScheduleItem {
  id: string
  type: "fight" | "break" | "ceremony"
  startTime: string
  endTime: string
  duration: number
  tatami?: number
  fight?: Fight
  title: string
  description?: string
}

interface SchedulePlannerProps {
  tournament: Tournament
  fights: Fight[]
  onScheduleUpdate: (schedule: ScheduleItem[]) => void
}

export default function SchedulePlanner({ tournament, fights, onScheduleUpdate }: SchedulePlannerProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [settings, setSettings] = useState({
    startTime: "09:00",
    endTime: "18:00",
    fightDuration: 3, // минуты
    breakBetweenFights: 2, // минуты
    lunchBreakStart: "13:00",
    lunchBreakDuration: 60, // минуты
    technicalBreakInterval: 10, // каждые N боев
    technicalBreakDuration: 15, // минуты
    bufferBetweenCategories: 10, // минуты
    includeCeremonies: true,
    openingCeremonyDuration: 30,
    closingCeremonyDuration: 45,
  })

  // Генерация автоматического расписания
  const generateSchedule = async () => {
    setIsGenerating(true)

    try {
      const newSchedule: ScheduleItem[] = []
      let currentTime = new Date(`2024-01-01T${settings.startTime}:00`)

      // Церемония открытия
      if (settings.includeCeremonies) {
        newSchedule.push({
          id: crypto.randomUUID(),
          type: "ceremony",
          startTime: currentTime.toTimeString().slice(0, 5),
          endTime: new Date(currentTime.getTime() + settings.openingCeremonyDuration * 60000)
            .toTimeString()
            .slice(0, 5),
          duration: settings.openingCeremonyDuration,
          title: "Церемония открытия турнира",
          description: "Приветствие участников, представление судей, гимн",
        })
        currentTime = new Date(currentTime.getTime() + settings.openingCeremonyDuration * 60000)
      }

      // Группировка боев по категориям и приоритетам
      const categorizedFights = groupFightsByCategory(fights)
      const sortedCategories = sortCategoriesByPriority(categorizedFights, tournament.categories)

      let fightCounter = 0

      for (const categoryId of sortedCategories) {
        const categoryFights = categorizedFights[categoryId]
        const category = tournament.categories.find((c) => c.id === categoryId)

        if (!categoryFights || categoryFights.length === 0) continue

        // Буфер между категориями
        if (newSchedule.length > 1) {
          currentTime = new Date(currentTime.getTime() + settings.bufferBetweenCategories * 60000)
        }

        // Добавляем заголовок категории
        newSchedule.push({
          id: crypto.randomUUID(),
          type: "ceremony",
          startTime: currentTime.toTimeString().slice(0, 5),
          endTime: new Date(currentTime.getTime() + 5 * 60000).toTimeString().slice(0, 5),
          duration: 5,
          title: `Начало категории: ${category?.name}`,
          description: `${categoryFights.length} поединков`,
        })
        currentTime = new Date(currentTime.getTime() + 5 * 60000)

        // Распределение боев по татами
        const fightsByTatami = distributeFightsByTatami(categoryFights, tournament.tatamisCount)

        // Планирование боев
        const maxFightsInTatami = Math.max(...Object.values(fightsByTatami).map((fights) => fights.length))

        for (let fightIndex = 0; fightIndex < maxFightsInTatami; fightIndex++) {
          // Проверка на обеденный перерыв
          if (shouldAddLunchBreak(currentTime, settings)) {
            const lunchStart = new Date(`2024-01-01T${settings.lunchBreakStart}:00`)
            currentTime = lunchStart
            newSchedule.push({
              id: crypto.randomUUID(),
              type: "break",
              startTime: currentTime.toTimeString().slice(0, 5),
              endTime: new Date(currentTime.getTime() + settings.lunchBreakDuration * 60000).toTimeString().slice(0, 5),
              duration: settings.lunchBreakDuration,
              title: "Обеденный перерыв",
              description: "Перерыв для участников и судей",
            })
            currentTime = new Date(currentTime.getTime() + settings.lunchBreakDuration * 60000)
          }

          // Технический перерыв
          if (fightCounter > 0 && fightCounter % settings.technicalBreakInterval === 0) {
            newSchedule.push({
              id: crypto.randomUUID(),
              type: "break",
              startTime: currentTime.toTimeString().slice(0, 5),
              endTime: new Date(currentTime.getTime() + settings.technicalBreakDuration * 60000)
                .toTimeString()
                .slice(0, 5),
              duration: settings.technicalBreakDuration,
              title: "Технический перерыв",
              description: "Отдых для участников и судей",
            })
            currentTime = new Date(currentTime.getTime() + settings.technicalBreakDuration * 60000)
          }

          // Добавляем бои для каждого татами параллельно
          for (let tatami = 1; tatami <= tournament.tatamisCount; tatami++) {
            const tatamieFights = fightsByTatami[tatami] || []
            if (fightIndex < tatamieFights.length) {
              const fight = tatamieFights[fightIndex]
              newSchedule.push({
                id: crypto.randomUUID(),
                type: "fight",
                startTime: currentTime.toTimeString().slice(0, 5),
                endTime: new Date(currentTime.getTime() + settings.fightDuration * 60000).toTimeString().slice(0, 5),
                duration: settings.fightDuration,
                tatami,
                fight,
                title: `Бой #${fight.fightNumber}`,
                description: `${fight.participant1?.fullName} vs ${fight.participant2?.fullName}`,
              })
              fightCounter++
            }
          }

          currentTime = new Date(currentTime.getTime() + (settings.fightDuration + settings.breakBetweenFights) * 60000)
        }
      }

      // Церемония закрытия
      if (settings.includeCeremonies) {
        newSchedule.push({
          id: crypto.randomUUID(),
          type: "ceremony",
          startTime: currentTime.toTimeString().slice(0, 5),
          endTime: new Date(currentTime.getTime() + settings.closingCeremonyDuration * 60000)
            .toTimeString()
            .slice(0, 5),
          duration: settings.closingCeremonyDuration,
          title: "Церемония закрытия турнира",
          description: "Награждение победителей, заключительное слово",
        })
      }

      setSchedule(newSchedule)
      onScheduleUpdate(newSchedule)
    } catch (error) {
      console.error("Ошибка генерации расписания:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Группировка боев по категориям
  const groupFightsByCategory = (fights: Fight[]) => {
    return fights.reduce(
      (acc, fight) => {
        if (!acc[fight.categoryId]) {
          acc[fight.categoryId] = []
        }
        acc[fight.categoryId].push(fight)
        return acc
      },
      {} as { [categoryId: string]: Fight[] },
    )
  }

  // Сортировка категорий по приоритету
  const sortCategoriesByPriority = (categorizedFights: { [categoryId: string]: Fight[] }, categories: Category[]) => {
    return Object.keys(categorizedFights).sort((a, b) => {
      const categoryA = categories.find((c) => c.id === a)
      const categoryB = categories.find((c) => c.id === b)

      // Приоритет: ката -> ката-группы -> кумитэ
      const priorityOrder = { kata: 1, "kata-group": 2, kumite: 3 }
      const priorityA = priorityOrder[categoryA?.type || "kumite"]
      const priorityB = priorityOrder[categoryB?.type || "kumite"]

      return priorityA - priorityB
    })
  }

  // Распределение боев по татами
  const distributeFightsByTatami = (fights: Fight[], tatamisCount: number) => {
    const distribution: { [tatami: number]: Fight[] } = {}

    // Инициализация
    for (let i = 1; i <= tatamisCount; i++) {
      distribution[i] = []
    }

    // Равномерное распределение
    fights.forEach((fight, index) => {
      const tatami = (index % tatamisCount) + 1
      distribution[tatami].push({ ...fight, tatami })
    })

    return distribution
  }

  // Проверка необходимости обеденного перерыва
  const shouldAddLunchBreak = (currentTime: Date, settings: any) => {
    const lunchTime = new Date(`2024-01-01T${settings.lunchBreakStart}:00`)
    return currentTime.getHours() >= lunchTime.getHours() && currentTime.getMinutes() >= lunchTime.getMinutes()
  }

  // Экспорт расписания в CSV
  const exportSchedule = () => {
    const csvContent = [
      ["Время начала", "Время окончания", "Татами", "Тип", "Название", "Описание"],
      ...schedule.map((item) => [
        item.startTime,
        item.endTime,
        item.tatami || "",
        item.type === "fight" ? "Поединок" : item.type === "break" ? "Перерыв" : "Церемония",
        item.title,
        item.description || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `schedule_${tournament.name.replace(/[^a-zA-Z0-9]/g, "_")}.csv`
    link.click()
  }

  // Статистика расписания
  const getScheduleStats = () => {
    const totalFights = schedule.filter((item) => item.type === "fight").length
    const totalDuration = schedule.reduce((sum, item) => sum + item.duration, 0)
    const endTime = schedule.length > 0 ? schedule[schedule.length - 1].endTime : settings.startTime

    return {
      totalFights,
      totalDuration,
      endTime,
      estimatedEnd: endTime,
      isOvertime: endTime > settings.endTime,
    }
  }

  const stats = getScheduleStats()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Планировщик расписания турнира
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="settings">Настройки</TabsTrigger>
              <TabsTrigger value="schedule">Расписание</TabsTrigger>
              <TabsTrigger value="statistics">Статистика</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Основные настройки времени */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Время турнира</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="startTime">Начало турнира</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={settings.startTime}
                        onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">Планируемое окончание</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={settings.endTime}
                        onChange={(e) => setSettings({ ...settings, endTime: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Настройки поединков */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Поединки</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="fightDuration">Длительность боя (мин)</Label>
                      <Input
                        id="fightDuration"
                        type="number"
                        value={settings.fightDuration}
                        onChange={(e) => setSettings({ ...settings, fightDuration: Number(e.target.value) })}
                        min="1"
                        max="10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="breakBetweenFights">Перерыв между боями (мин)</Label>
                      <Input
                        id="breakBetweenFights"
                        type="number"
                        value={settings.breakBetweenFights}
                        onChange={(e) => setSettings({ ...settings, breakBetweenFights: Number(e.target.value) })}
                        min="0"
                        max="10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bufferBetweenCategories">Буфер между категориями (мин)</Label>
                      <Input
                        id="bufferBetweenCategories"
                        type="number"
                        value={settings.bufferBetweenCategories}
                        onChange={(e) => setSettings({ ...settings, bufferBetweenCategories: Number(e.target.value) })}
                        min="0"
                        max="30"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Настройки перерывов */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Перерывы</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="lunchBreakStart">Обеденный перерыв</Label>
                      <Input
                        id="lunchBreakStart"
                        type="time"
                        value={settings.lunchBreakStart}
                        onChange={(e) => setSettings({ ...settings, lunchBreakStart: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lunchBreakDuration">Длительность обеда (мин)</Label>
                      <Input
                        id="lunchBreakDuration"
                        type="number"
                        value={settings.lunchBreakDuration}
                        onChange={(e) => setSettings({ ...settings, lunchBreakDuration: Number(e.target.value) })}
                        min="30"
                        max="120"
                      />
                    </div>
                    <div>
                      <Label htmlFor="technicalBreakInterval">Техперерыв каждые N боев</Label>
                      <Input
                        id="technicalBreakInterval"
                        type="number"
                        value={settings.technicalBreakInterval}
                        onChange={(e) => setSettings({ ...settings, technicalBreakInterval: Number(e.target.value) })}
                        min="5"
                        max="20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="technicalBreakDuration">Длительность техперерыва (мин)</Label>
                      <Input
                        id="technicalBreakDuration"
                        type="number"
                        value={settings.technicalBreakDuration}
                        onChange={(e) => setSettings({ ...settings, technicalBreakDuration: Number(e.target.value) })}
                        min="10"
                        max="30"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Церемонии */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Церемонии</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeCeremonies"
                        checked={settings.includeCeremonies}
                        onChange={(e) => setSettings({ ...settings, includeCeremonies: e.target.checked })}
                      />
                      <Label htmlFor="includeCeremonies">Включить церемонии</Label>
                    </div>
                    {settings.includeCeremonies && (
                      <>
                        <div>
                          <Label htmlFor="openingCeremonyDuration">Церемония открытия (мин)</Label>
                          <Input
                            id="openingCeremonyDuration"
                            type="number"
                            value={settings.openingCeremonyDuration}
                            onChange={(e) =>
                              setSettings({ ...settings, openingCeremonyDuration: Number(e.target.value) })
                            }
                            min="15"
                            max="60"
                          />
                        </div>
                        <div>
                          <Label htmlFor="closingCeremonyDuration">Церемония закрытия (мин)</Label>
                          <Input
                            id="closingCeremonyDuration"
                            type="number"
                            value={settings.closingCeremonyDuration}
                            onChange={(e) =>
                              setSettings({ ...settings, closingCeremonyDuration: Number(e.target.value) })
                            }
                            min="30"
                            max="90"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4">
                <Button onClick={generateSchedule} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700">
                  <Settings className="h-4 w-4 mr-2" />
                  {isGenerating ? "Генерация..." : "Сгенерировать расписание"}
                </Button>
                {schedule.length > 0 && (
                  <Button onClick={exportSchedule} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Экспорт в CSV
                  </Button>
                )}
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <Progress value={66} className="w-full" />
                  <div className="text-sm text-gray-600 text-center">Оптимизация расписания...</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              {schedule.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Расписание турнира</h3>
                    <Badge variant="outline">{schedule.length} событий</Badge>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {schedule.map((item, index) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border ${
                          item.type === "fight"
                            ? "bg-blue-50 border-blue-200"
                            : item.type === "break"
                              ? "bg-yellow-50 border-yellow-200"
                              : "bg-green-50 border-green-200"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {item.type === "fight" && <Users className="h-4 w-4 text-blue-600" />}
                              {item.type === "break" && <Coffee className="h-4 w-4 text-yellow-600" />}
                              {item.type === "ceremony" && <Trophy className="h-4 w-4 text-green-600" />}
                              <span className="font-medium">{item.title}</span>
                              {item.tatami && <Badge variant="outline">Татами {item.tatami}</Badge>}
                            </div>
                            <div className="text-sm text-gray-600">{item.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm">
                              {item.startTime} - {item.endTime}
                            </div>
                            <div className="text-xs text-gray-500">{item.duration} мин</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Расписание не сгенерировано</p>
                  <p className="text-sm">Настройте параметры и нажмите "Сгенерировать расписание"</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalFights}</div>
                    <div className="text-sm text-gray-600">Всего боёв</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{Math.floor(stats.totalDuration / 60)}ч</div>
                    <div className="text-sm text-gray-600">Общая длительность</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.estimatedEnd}</div>
                    <div className="text-sm text-gray-600">Планируемое окончание</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-bold ${stats.isOvertime ? "text-red-600" : "text-green-600"}`}>
                      {stats.isOvertime ? "Превышение" : "В норме"}
                    </div>
                    <div className="text-sm text-gray-600">Статус времени</div>
                  </CardContent>
                </Card>
              </div>

              {stats.isOvertime && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">Предупреждение о превышении времени</span>
                    </div>
                    <p className="text-sm text-red-700">
                      Турнир может закончиться позже запланированного времени. Рекомендуется:
                    </p>
                    <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                      <li>Сократить длительность перерывов</li>
                      <li>Уменьшить время между боями</li>
                      <li>Добавить дополнительные татами</li>
                      <li>Начать турнир раньше</li>
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Распределение по татами</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: tournament.tatamisCount }, (_, i) => i + 1).map((tatami) => {
                      const tatamieFights = schedule.filter((item) => item.tatami === tatami && item.type === "fight")
                      const percentage = stats.totalFights > 0 ? (tatamieFights.length / stats.totalFights) * 100 : 0

                      return (
                        <div key={tatami} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Татами {tatami}</span>
                            <span>
                              {tatamieFights.length} боёв ({Math.round(percentage)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
