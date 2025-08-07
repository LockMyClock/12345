"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Users,
  Clock,
  Search,
  Calendar,
  MapPin,
  Wifi,
  WifiOff,
  Eye,
  Heart,
  Share2,
  RefreshCw,
} from "lucide-react"
import type { Fight, Tournament } from "../types"

interface PublicWebViewerProps {
  initialTournament?: Tournament
  initialFights?: Fight[]
  websocketUrl?: string
}

interface LiveUpdate {
  tournament: Tournament
  fights: Fight[]
  liveData: { [tatami: number]: any }
  timestamp: string
  settings: {
    showScores: boolean
    showTimer: boolean
    showQueue: boolean
  }
}

export default function PublicWebViewer({
  initialTournament,
  initialFights = [],
  websocketUrl = "ws://localhost:8080/viewer",
}: PublicWebViewerProps) {
  const [tournament, setTournament] = useState<Tournament | null>(initialTournament || null)
  const [fights, setFights] = useState<Fight[]>(initialFights)
  const [liveData, setLiveData] = useState<{ [tatami: number]: any }>({})
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [viewerCount, setViewerCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [favorites, setFavorites] = useState<string[]>([])
  const [displaySettings, setDisplaySettings] = useState({
    showScores: true,
    showTimer: true,
    showQueue: true,
    autoRefresh: true,
    notifications: true,
  })

  // Подключение к WebSocket для получения обновлений от оператора
  useEffect(() => {
    connectToOperator()
    return () => disconnectFromOperator()
  }, [])

  // Обновление времени
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Автоматическое обновление
  useEffect(() => {
    if (displaySettings.autoRefresh && connectionStatus === "connected") {
      const interval = setInterval(() => {
        requestUpdate()
      }, 10000) // каждые 10 секунд
      return () => clearInterval(interval)
    }
  }, [displaySettings.autoRefresh, connectionStatus])

  const connectToOperator = () => {
    setConnectionStatus("connecting")

    try {
      const ws = new WebSocket(websocketUrl)

      ws.onopen = () => {
        setConnectionStatus("connected")
        console.log("Подключение к оператору установлено")

        // Запрос начальных данных
        ws.send(JSON.stringify({ type: "request_initial_data" }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleOperatorUpdate(data)
        } catch (error) {
          console.error("Ошибка обработки сообщения:", error)
        }
      }

      ws.onerror = (error) => {
        console.error("Ошибка WebSocket:", error)
        setConnectionStatus("disconnected")
      }

      ws.onclose = () => {
        setConnectionStatus("disconnected")
        // Попытка переподключения через 5 секунд
        setTimeout(connectToOperator, 5000)
      }
    } catch (error) {
      console.error("Ошибка подключения:", error)
      setConnectionStatus("disconnected")
    }
  }

  const disconnectFromOperator = () => {
    setConnectionStatus("disconnected")
  }

  const handleOperatorUpdate = (data: any) => {
    switch (data.type) {
      case "live_update":
        const update: LiveUpdate = data.payload
        setTournament(update.tournament)
        setFights(update.fights)
        setLiveData(update.liveData)
        setLastUpdate(update.timestamp)
        setDisplaySettings((prev) => ({ ...prev, ...update.settings }))
        break

      case "viewer_count":
        setViewerCount(data.count)
        break

      case "fight_result":
        setFights((prev) =>
          prev.map((fight) =>
            fight.id === data.fightId ? { ...fight, result: data.result, status: "completed" } : fight,
          ),
        )
        break

      case "fight_status":
        setFights((prev) =>
          prev.map((fight) => (fight.id === data.fightId ? { ...fight, status: data.status } : fight)),
        )
        break

      case "tatami_update":
        setLiveData((prev) => ({
          ...prev,
          [data.tatami]: data.data,
        }))
        break

      default:
        console.log("Неизвестный тип обновления:", data.type)
    }
  }

  const requestUpdate = () => {
    // Запрос обновления данных у оператора
    if (connectionStatus === "connected") {
      // WebSocket отправка запроса
      console.log("Запрос обновления данных")
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getCurrentFights = () => {
    return fights.filter((f) => f.status === "in-progress")
  }

  const getUpcomingFights = () => {
    return fights.filter((f) => f.status === "pending").slice(0, 10)
  }

  const addToFavorites = (fightId: string) => {
    setFavorites((prev) => [...prev, fightId])
  }

  const removeFromFavorites = (fightId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== fightId))
  }

  const shareCurrentView = () => {
    if (navigator.share) {
      navigator.share({
        title: tournament?.name || "Турнир по каратэ",
        text: "Смотрите турнир по каратэ в прямом эфире!",
        url: window.location.href,
      })
    } else {
      // Fallback для браузеров без поддержки Web Share API
      navigator.clipboard.writeText(window.location.href)
      alert("Ссылка скопирована в буфер обмена!")
    }
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="h-4 w-4 text-green-600" />
      case "connecting":
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
      default:
        return <WifiOff className="h-4 w-4 text-red-600" />
    }
  }

  const getConnectionText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Подключено"
      case "connecting":
        return "Подключение..."
      default:
        return "Отключено"
    }
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              {connectionStatus === "connecting" ? (
                <RefreshCw className="h-16 w-16 mx-auto text-blue-600 animate-spin" />
              ) : (
                <WifiOff className="h-16 w-16 mx-auto text-gray-400" />
              )}
            </div>
            <h2 className="text-xl font-bold mb-2">
              {connectionStatus === "connecting" ? "Подключение к турниру..." : "Нет подключения"}
            </h2>
            <p className="text-gray-600 mb-4">
              {connectionStatus === "connecting" ? "Ожидание данных от оператора" : "Проверьте подключение к интернету"}
            </p>
            <Button onClick={connectToOperator} disabled={connectionStatus === "connecting"}>
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
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

            <div className="flex items-center gap-4">
              {/* Статус подключения */}
              <div className="flex items-center gap-2">
                {getConnectionIcon()}
                <span className="text-sm">{getConnectionText()}</span>
                {connectionStatus === "connected" && (
                  <Badge variant="outline" className="ml-2">
                    <Eye className="h-3 w-3 mr-1" />
                    {viewerCount} зрителей
                  </Badge>
                )}
              </div>

              {/* Время */}
              <div className="text-right">
                <div className="text-xl font-mono font-bold">{currentTime.toLocaleTimeString("ru-RU")}</div>
                <div className="text-xs text-gray-600">
                  {lastUpdate && `Обновлено: ${new Date(lastUpdate).toLocaleTimeString("ru-RU")}`}
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={shareCurrentView}>
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={requestUpdate} disabled={connectionStatus !== "connected"}>
                  <RefreshCw className={`h-4 w-4 ${connectionStatus === "connecting" ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">Общая информация</TabsTrigger>
            <TabsTrigger value="live">Обновления в реальном времени</TabsTrigger>
            <TabsTrigger value="participants">Участники</TabsTrigger>
            <TabsTrigger value="brackets">Сетки</TabsTrigger>
            <TabsTrigger value="results">Результаты</TabsTrigger>
            <TabsTrigger value="streams">Прямые трансляции</TabsTrigger>
          </TabsList>

          {/* Общая информация */}
          <TabsContent value="general" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                    О турнире
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{tournament.name}</h3>
                    <p className="text-gray-600">Турнир по Киокушинкай каратэ</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Дата проведения</div>
                      <div className="font-medium">{new Date(tournament.date).toLocaleDateString("ru-RU")}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Место проведения</div>
                      <div className="font-medium">{tournament.location}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Статус</div>
                      <Badge
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
                    <div>
                      <div className="text-sm text-gray-600">Количество татами</div>
                      <div className="font-medium">{tournament.tatamisCount}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Статистика турнира</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{tournament.participants.length}</div>
                        <div className="text-sm text-gray-600">Участников</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{tournament.categories.length}</div>
                        <div className="text-sm text-gray-600">Категорий</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{fights.length}</div>
                        <div className="text-sm text-gray-600">Боёв</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    Дисциплины
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-green-800">КАТА</h4>
                        <Badge className="bg-green-100 text-green-800">
                          {tournament.participants.filter((p) => p.participatesInKata).length} участников
                        </Badge>
                      </div>
                      <p className="text-sm text-green-700">
                        Показательные соревнования - демонстрация техники выполнения форм
                      </p>
                    </div>

                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-red-800">КУМИТЭ</h4>
                        <Badge className="bg-red-100 text-red-800">
                          {tournament.participants.filter((p) => p.participatesInKumite).length} участников
                        </Badge>
                      </div>
                      <p className="text-sm text-red-700">
                        Спарринговые поединки - контактные бои между участниками
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-purple-800">ГРУППОВЫЕ КАТА</h4>
                        <Badge className="bg-purple-100 text-purple-800">
                          {tournament.participants.filter((p) => p.participatesInKataGroup).length} участников
                        </Badge>
                      </div>
                      <p className="text-sm text-purple-700">
                        Синхронное выполнение ката командами из 3 человек
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Системы турнира</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>🏆 Олимпийская система</span>
                        <span className="text-gray-600">Для категорий с 4+ участниками</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>🔄 Круговая система</span>
                        <span className="text-gray-600">Для категорий с 3 участниками</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Обновления в реальном времени */}
          <TabsContent value="live" className="mt-6">{/* Live трансляция */}
            <div className="space-y-6">
              {/* Текущие бои */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-6 w-6 text-red-600" />
                    Идут сейчас
                    {getCurrentFights().length > 0 && (
                      <Badge className="bg-red-100 text-red-800 animate-pulse">LIVE</Badge>
                    )}
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  favorites.includes(fight.id)
                                    ? removeFromFavorites(fight.id)
                                    : addToFavorites(fight.id)
                                }
                              >
                                <Heart
                                  className={`h-4 w-4 ${
                                    favorites.includes(fight.id) ? "fill-red-500 text-red-500" : "text-gray-400"
                                  }`}
                                />
                              </Button>
                            </div>
                            {displaySettings.showTimer && liveData[fight.tatami]?.timer !== undefined && (
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
                      <p className="text-sm">Следите за обновлениями</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Следующие бои */}
              {displaySettings.showQueue && (
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                favorites.includes(fight.id) ? removeFromFavorites(fight.id) : addToFavorites(fight.id)
                              }
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  favorites.includes(fight.id) ? "fill-red-500 text-red-500" : "text-gray-400"
                                }`}
                              />
                            </Button>
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
              )}

              {/* Статистика татами */}
              <Card>
                <CardHeader>
                  <CardTitle>Статистика по татами</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from(new Set(fights.map((f) => f.tatami)))
                      .sort()
                      .map((tatami) => {
                        const tatamieFights = fights.filter((f) => f.tatami === tatami)
                        const completed = tatamieFights.filter((f) => f.status === "completed").length
                        const inProgress = tatamieFights.filter((f) => f.status === "in-progress").length
                        const progress = tatamieFights.length > 0 ? (completed / tatamieFights.length) * 100 : 0

                        return (
                          <div key={tatami} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold">Татами {tatami}</h3>
                              {inProgress > 0 && (
                                <Badge className="bg-green-100 text-green-800 animate-pulse">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Live
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {completed}/{tatamieFights.length} боёв завершено
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{Math.round(progress)}%</div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Остальные вкладки */}
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
                  {tournament.participants
                    .filter(
                      (participant) =>
                        participant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        participant.club.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((participant) => (
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

      {/* Плавающая панель настроек */}
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Настройки просмотра</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-refresh" className="text-sm">
                Автообновление
              </Label>
              <input
                type="checkbox"
                id="auto-refresh"
                checked={displaySettings.autoRefresh}
                onChange={(e) => setDisplaySettings((prev) => ({ ...prev, autoRefresh: e.target.checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="text-sm">
                Уведомления
              </Label>
              <input
                type="checkbox"
                id="notifications"
                checked={displaySettings.notifications}
                onChange={(e) => setDisplaySettings((prev) => ({ ...prev, notifications: e.target.checked }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
