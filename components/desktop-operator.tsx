"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Monitor,
  Wifi,
  WifiOff,
  Settings,
  AirplayIcon as Broadcast,
  Eye,
  Volume2,
  VolumeX,
  Power,
  Activity,
  Globe,
} from "lucide-react"
import TatamiOperator from "./tatami-operator"
import LiveDisplay from "./live-display"
import type { Tournament, Fight, FightResult } from "../types"

interface DesktopOperatorProps {
  tournament: Tournament
  fights: Fight[]
  onFightResult: (fightId: string, result: FightResult) => void
  onFightStatusChange: (fightId: string, status: Fight["status"]) => void
  onBroadcastUpdate: (data: any) => void
}

interface ConnectionStatus {
  isConnected: boolean
  viewers: number
  lastUpdate: string
  serverStatus: "online" | "offline" | "error"
}

export default function DesktopOperator({
  tournament,
  fights,
  onFightResult,
  onFightStatusChange,
  onBroadcastUpdate,
}: DesktopOperatorProps) {
  const [selectedTatami, setSelectedTatami] = useState(1)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    viewers: 0,
    lastUpdate: "",
    serverStatus: "offline",
  })
  const [broadcastSettings, setBroadcastSettings] = useState({
    enabled: false,
    autoUpdate: true,
    updateInterval: 5, // секунды
    showScores: true,
    showTimer: true,
    showQueue: true,
    allowComments: false,
    moderateComments: true,
  })
  const [systemSettings, setSystemSettings] = useState({
    soundEnabled: true,
    autoBackup: true,
    backupInterval: 30, // минуты
    fullscreen: false,
    darkMode: false,
  })
  const [liveData, setLiveData] = useState<{ [tatami: number]: any }>({})

  // Подключение к серверу трансляции
  useEffect(() => {
    if (broadcastSettings.enabled) {
      connectToServer()
    } else {
      disconnectFromServer()
    }
  }, [broadcastSettings.enabled])

  // Автоматическое обновление данных для зрителей
  useEffect(() => {
    if (broadcastSettings.enabled && broadcastSettings.autoUpdate) {
      const interval = setInterval(() => {
        broadcastCurrentState()
      }, broadcastSettings.updateInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [broadcastSettings.enabled, broadcastSettings.autoUpdate, broadcastSettings.updateInterval, liveData])

  const connectToServer = async () => {
    try {
      // Имитация подключения к серверу
      setConnectionStatus((prev) => ({
        ...prev,
        isConnected: true,
        serverStatus: "online",
        lastUpdate: new Date().toLocaleTimeString(),
      }))

      // Имитация WebSocket подключения
      const ws = new WebSocket("ws://localhost:8080/operator")

      ws.onopen = () => {
        console.log("Подключение к серверу трансляции установлено")
        setConnectionStatus((prev) => ({
          ...prev,
          isConnected: true,
          serverStatus: "online",
        }))
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === "viewer_count") {
          setConnectionStatus((prev) => ({
            ...prev,
            viewers: data.count,
          }))
        }
      }

      ws.onerror = () => {
        setConnectionStatus((prev) => ({
          ...prev,
          isConnected: false,
          serverStatus: "error",
        }))
      }

      ws.onclose = () => {
        setConnectionStatus((prev) => ({
          ...prev,
          isConnected: false,
          serverStatus: "offline",
        }))
      }
    } catch (error) {
      console.error("Ошибка подключения к серверу:", error)
      setConnectionStatus((prev) => ({
        ...prev,
        isConnected: false,
        serverStatus: "error",
      }))
    }
  }

  const disconnectFromServer = () => {
    setConnectionStatus((prev) => ({
      ...prev,
      isConnected: false,
      serverStatus: "offline",
    }))
  }

  const broadcastCurrentState = () => {
    const broadcastData = {
      tournament,
      fights,
      liveData,
      timestamp: new Date().toISOString(),
      settings: {
        showScores: broadcastSettings.showScores,
        showTimer: broadcastSettings.showTimer,
        showQueue: broadcastSettings.showQueue,
      },
    }

    onBroadcastUpdate(broadcastData)
    setConnectionStatus((prev) => ({
      ...prev,
      lastUpdate: new Date().toLocaleTimeString(),
    }))
  }

  const handleLiveUpdate = (tatami: number, data: any) => {
    setLiveData((prev) => ({
      ...prev,
      [tatami]: data,
    }))

    // Автоматическая отправка обновлений зрителям
    if (broadcastSettings.enabled && broadcastSettings.autoUpdate) {
      broadcastCurrentState()
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setSystemSettings((prev) => ({ ...prev, fullscreen: true }))
    } else {
      document.exitFullscreen()
      setSystemSettings((prev) => ({ ...prev, fullscreen: false }))
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus.serverStatus) {
      case "online":
        return "text-green-600"
      case "error":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getConnectionStatusIcon = () => {
    return connectionStatus.isConnected ? (
      <Wifi className={`h-4 w-4 ${getConnectionStatusColor()}`} />
    ) : (
      <WifiOff className={`h-4 w-4 ${getConnectionStatusColor()}`} />
    )
  }

  return (
    <div className={`min-h-screen ${systemSettings.darkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      {/* Верхняя панель управления */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold">Операторская панель</h1>
              </div>
              <Badge variant="outline">{tournament.name}</Badge>
            </div>

            <div className="flex items-center gap-4">
              {/* Статус подключения */}
              <div className="flex items-center gap-2">
                {getConnectionStatusIcon()}
                <span className={`text-sm ${getConnectionStatusColor()}`}>
                  {connectionStatus.isConnected ? "Подключено" : "Отключено"}
                </span>
                {connectionStatus.isConnected && (
                  <Badge variant="outline" className="ml-2">
                    <Eye className="h-3 w-3 mr-1" />
                    {connectionStatus.viewers} зрителей
                  </Badge>
                )}
              </div>

              {/* Системные кнопки */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSystemSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                >
                  {systemSettings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSystemSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }))}
                >
                  <Power className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="tatami" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tatami">Управление татами</TabsTrigger>
            <TabsTrigger value="broadcast">Трансляция</TabsTrigger>
            <TabsTrigger value="monitor">Мониторинг</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="tatami" className="mt-6">
            <div className="space-y-6">
              {/* Выбор татами */}
              <Card>
                <CardHeader>
                  <CardTitle>Выбор татами для управления</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Array.from({ length: tournament.tatamisCount }, (_, i) => i + 1).map((tatami) => {
                      const tatamieFights = fights.filter((f) => f.tatami === tatami)
                      const activeFight = tatamieFights.find((f) => f.status === "in-progress")
                      const completedFights = tatamieFights.filter((f) => f.status === "completed").length

                      return (
                        <button
                          key={tatami}
                          onClick={() => setSelectedTatami(tatami)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedTatami === tatami
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-bold text-lg">Татами {tatami}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {completedFights}/{tatamieFights.length} боёв
                            </div>
                            {activeFight && (
                              <Badge className="mt-2 bg-green-100 text-green-800">
                                <Activity className="h-3 w-3 mr-1" />
                                Активен
                              </Badge>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Операторский интерфейс выбранного татами */}
              <TatamiOperator
                tatami={selectedTatami}
                fights={fights}
                onFightResult={onFightResult}
                onFightStatusChange={onFightStatusChange}
                onLiveUpdate={handleLiveUpdate}
              />
            </div>
          </TabsContent>

          <TabsContent value="broadcast" className="mt-6">
            <div className="space-y-6">
              {/* Настройки трансляции */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Broadcast className="h-6 w-6" />
                    Управление трансляцией
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="broadcast-enabled" className="text-base font-medium">
                        Включить трансляцию
                      </Label>
                      <p className="text-sm text-gray-600">Разрешить зрителям просматривать турнир онлайн</p>
                    </div>
                    <Switch
                      id="broadcast-enabled"
                      checked={broadcastSettings.enabled}
                      onCheckedChange={(checked) => setBroadcastSettings((prev) => ({ ...prev, enabled: checked }))}
                    />
                  </div>

                  {broadcastSettings.enabled && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-update">Автоматическое обновление</Label>
                        <Switch
                          id="auto-update"
                          checked={broadcastSettings.autoUpdate}
                          onCheckedChange={(checked) =>
                            setBroadcastSettings((prev) => ({ ...prev, autoUpdate: checked }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="update-interval">Интервал обновления (сек)</Label>
                        <Input
                          id="update-interval"
                          type="number"
                          value={broadcastSettings.updateInterval}
                          onChange={(e) =>
                            setBroadcastSettings((prev) => ({ ...prev, updateInterval: Number(e.target.value) }))
                          }
                          min="1"
                          max="60"
                          className="w-24"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="show-scores">Показывать счёт</Label>
                          <Switch
                            id="show-scores"
                            checked={broadcastSettings.showScores}
                            onCheckedChange={(checked) =>
                              setBroadcastSettings((prev) => ({ ...prev, showScores: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="show-timer">Показывать таймер</Label>
                          <Switch
                            id="show-timer"
                            checked={broadcastSettings.showTimer}
                            onCheckedChange={(checked) =>
                              setBroadcastSettings((prev) => ({ ...prev, showTimer: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="show-queue">Показывать очередь</Label>
                          <Switch
                            id="show-queue"
                            checked={broadcastSettings.showQueue}
                            onCheckedChange={(checked) =>
                              setBroadcastSettings((prev) => ({ ...prev, showQueue: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="allow-comments">Разрешить комментарии</Label>
                          <Switch
                            id="allow-comments"
                            checked={broadcastSettings.allowComments}
                            onCheckedChange={(checked) =>
                              setBroadcastSettings((prev) => ({ ...prev, allowComments: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button onClick={broadcastCurrentState} disabled={!broadcastSettings.enabled}>
                      <Broadcast className="h-4 w-4 mr-2" />
                      Обновить трансляцию
                    </Button>
                    <Button variant="outline" onClick={() => window.open("/public", "_blank")}>
                      <Globe className="h-4 w-4 mr-2" />
                      Открыть публичный просмотр
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Статистика трансляции */}
              <Card>
                <CardHeader>
                  <CardTitle>Статистика трансляции</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{connectionStatus.viewers}</div>
                      <div className="text-sm text-gray-600">Активных зрителей</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {connectionStatus.isConnected ? "Онлайн" : "Офлайн"}
                      </div>
                      <div className="text-sm text-gray-600">Статус сервера</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{connectionStatus.lastUpdate || "—"}</div>
                      <div className="text-sm text-gray-600">Последнее обновление</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{broadcastSettings.updateInterval}с</div>
                      <div className="text-sm text-gray-600">Интервал обновления</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitor" className="mt-6">
            <LiveDisplay fights={fights} categories={tournament.categories} liveData={liveData} displayMode="full" />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-6 w-6" />
                    Системные настройки
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Интерфейс</h3>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sound-enabled">Звуковые уведомления</Label>
                        <Switch
                          id="sound-enabled"
                          checked={systemSettings.soundEnabled}
                          onCheckedChange={(checked) =>
                            setSystemSettings((prev) => ({ ...prev, soundEnabled: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="dark-mode">Тёмная тема</Label>
                        <Switch
                          id="dark-mode"
                          checked={systemSettings.darkMode}
                          onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, darkMode: checked }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Резервное копирование</h3>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-backup">Автоматический бэкап</Label>
                        <Switch
                          id="auto-backup"
                          checked={systemSettings.autoBackup}
                          onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, autoBackup: checked }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="backup-interval">Интервал бэкапа (мин)</Label>
                        <Input
                          id="backup-interval"
                          type="number"
                          value={systemSettings.backupInterval}
                          onChange={(e) =>
                            setSystemSettings((prev) => ({ ...prev, backupInterval: Number(e.target.value) }))
                          }
                          min="5"
                          max="120"
                          className="w-24"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Информация о системе</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Версия системы</div>
                      <div className="text-gray-600">v2.1.0</div>
                    </div>
                    <div>
                      <div className="font-medium">Последнее обновление</div>
                      <div className="text-gray-600">{new Date().toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="font-medium">Статус лицензии</div>
                      <div className="text-green-600">Активна</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
