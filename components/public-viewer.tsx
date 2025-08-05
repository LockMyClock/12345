"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Trophy, Users, Clock, Search, Calendar, MapPin } from "lucide-react"
import type { Fight, Tournament } from "../types"

interface PublicViewerProps {
  tournament: Tournament
  fights: Fight[]
  liveData?: { [tatami: number]: any }
}

export default function PublicViewer({ tournament, fights, liveData = {} }: PublicViewerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
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

  const filteredParticipants = tournament.participants.filter(
    (participant) =>
      participant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.club.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredCategories = selectedCategory
    ? tournament.categories.filter((cat) => cat.id === selectedCategory)
    : tournament.categories

  const getResultsForCategory = (categoryId: string) => {
    const categoryFights = fights.filter((f) => f.categoryId === categoryId && f.status === "completed")
    const winners = categoryFights.map((f) => {
      if (!f.result) return null
      return f.result.winner === "red" ? f.participant1 : f.participant2
    })
    return winners.filter(Boolean)
  }

  const getCurrentFights = () => {
    return fights.filter((f) => f.status === "in-progress")
  }

  const getUpcomingFights = () => {
    return fights.filter((f) => f.status === "pending").slice(0, 10)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="h-8 w-8 text-yellow-600" />
                {tournament.name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(tournament.date).toLocaleDateString("ru-RU")}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {tournament.location}
                </div>
                <Badge
                  variant="outline"
                  className={
                    tournament.status === "in-progress"
                      ? "bg-green-100 text-green-800"
                      : tournament.status === "completed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {tournament.status === "registration"
                    ? "Регистрация"
                    : tournament.status === "draw"
                      ? "Жеребьёвка"
                      : tournament.status === "in-progress"
                        ? "В процессе"
                        : "Завершён"}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold">{currentTime.toLocaleTimeString("ru-RU")}</div>
              <div className="text-sm text-gray-600">{currentTime.toLocaleDateString("ru-RU")}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="schedule">Расписание</TabsTrigger>
            <TabsTrigger value="results">Результаты</TabsTrigger>
            <TabsTrigger value="participants">Участники</TabsTrigger>
            <TabsTrigger value="categories">Категории</TabsTrigger>
          </TabsList>

          {/* Live трансляция */}
          <TabsContent value="live" className="mt-6">
            <div className="space-y-6">
              {/* Текущие бои */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-6 w-6 text-red-600" />
                    Идут сейчас
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getCurrentFights().length > 0 ? (
                    <div className="grid gap-4">
                      {getCurrentFights().map((fight) => (
                        <div key={fight.id} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-600">Татами {fight.tatami}</Badge>
                              <Badge variant="outline">Бой #{fight.fightNumber}</Badge>
                            </div>
                            {liveData[fight.tatami]?.timer !== undefined && (
                              <div className="font-mono text-xl font-bold text-blue-600">
                                {formatTime(liveData[fight.tatami].timer)}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-red-100 rounded border-2 border-red-300">
                              <div className="font-bold text-red-800">КРАСНЫЙ</div>
                              <div className="font-medium mt-1">{fight.participant1?.fullName}</div>
                              <div className="text-sm text-gray-600">{fight.participant1?.club}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {fight.participant1?.age}л, {fight.participant1?.weight}кг, {fight.participant1?.belt}
                              </div>
                            </div>
                            <div className="text-center p-3 bg-blue-100 rounded border-2 border-blue-300">
                              <div className="font-bold text-blue-800">СИНИЙ</div>
                              <div className="font-medium mt-1">{fight.participant2?.fullName}</div>
                              <div className="text-sm text-gray-600">{fight.participant2?.club}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {fight.participant2?.age}л, {fight.participant2?.weight}кг, {fight.participant2?.belt}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>В данный момент бои не проводятся</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Следующие бои */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-orange-600" />
                    Следующие бои
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {getUpcomingFights().map((fight, index) => (
                      <div
                        key={fight.id}
                        className={`p-3 rounded-lg border ${
                          index < 3 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Татами {fight.tatami}</Badge>
                            <Badge variant="outline">#{fight.fightNumber}</Badge>
                            {index < 3 && <Badge className="bg-green-100 text-green-800">Скоро</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-red-600 font-medium">{fight.participant1?.fullName}</span>
                          <span className="text-gray-400 mx-2">vs</span>
                          <span className="text-blue-600 font-medium">{fight.participant2?.fullName}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                          <span>{fight.participant1?.club}</span>
                          <span>{fight.participant2?.club}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Расписание */}
          <TabsContent value="schedule" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Расписание поединков</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(new Set(fights.map((f) => f.tatami)))
                    .sort()
                    .map((tatami) => {
                      const tatamieFights = fights.filter((f) => f.tatami === tatami)
                      return (
                        <div key={tatami} className="border rounded-lg p-4">
                          <h3 className="font-bold mb-3">Татами {tatami}</h3>
                          <div className="space-y-2">
                            {tatamieFights.slice(0, 10).map((fight) => (
                              <div key={fight.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">#{fight.fightNumber}</Badge>
                                  <span className="text-sm">
                                    {fight.participant1?.fullName} vs {fight.participant2?.fullName}
                                  </span>
                                </div>
                                <Badge
                                  className={
                                    fight.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : fight.status === "in-progress"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {fight.status === "completed"
                                    ? "Завершён"
                                    : fight.status === "in-progress"
                                      ? "Идёт"
                                      : "Ожидает"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Результаты */}
          <TabsContent value="results" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Результаты по категориям</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tournament.categories.map((category) => {
                    const categoryFights = fights.filter(
                      (f) => f.categoryId === category.id && f.status === "completed",
                    )
                    return (
                      <div key={category.id} className="border rounded-lg p-4">
                        <h3 className="font-medium mb-3">{category.name}</h3>
                        {categoryFights.length > 0 ? (
                          <div className="space-y-2">
                            {categoryFights.map((fight) => (
                              <div key={fight.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">#{fight.fightNumber}</Badge>
                                  <span className="text-sm">
                                    {fight.participant1?.fullName} vs {fight.participant2?.fullName}
                                  </span>
                                </div>
                                {fight.result && (
                                  <Badge
                                    className={
                                      fight.result.winner === "red"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-blue-100 text-blue-800"
                                    }
                                  >
                                    Победа:{" "}
                                    {fight.result.winner === "red"
                                      ? fight.participant1?.fullName
                                      : fight.participant2?.fullName}{" "}
                                    ({fight.result.type})
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Результатов пока нет</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Участники */}
          <TabsContent value="participants" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Участники ({tournament.participants.length})</span>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Поиск участника..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredParticipants.map((participant) => (
                    <div key={participant.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{participant.fullName}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {participant.club} • {participant.age} лет • {participant.weight} кг • {participant.belt}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {participant.participatesInKata && (
                          <Badge variant="outline" className="text-xs">
                            Ката
                          </Badge>
                        )}
                        {participant.participatesInKumite && (
                          <Badge variant="outline" className="text-xs">
                            Кумитэ
                          </Badge>
                        )}
                        {participant.participatesInKataGroup && (
                          <Badge variant="outline" className="text-xs">
                            Ката-группы
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Категории */}
          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Категории турнира ({tournament.categories.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tournament.categories.map((category) => (
                    <div key={category.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{category.name}</h3>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {category.type === "kata" ? "Ката" : category.type === "kumite" ? "Кумитэ" : "Ката-группы"}
                          </Badge>
                          <Badge variant="outline">{category.participants.length} участников</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {category.participants.map((participant) => (
                          <div key={participant.id} className="text-sm p-2 bg-gray-50 rounded">
                            <div className="font-medium">{participant.fullName}</div>
                            <div className="text-gray-600">{participant.club}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
