"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, Send, MessageSquare, Smartphone, Mail, X } from "lucide-react"
import type { Fight, Tournament } from "../types"

interface Notification {
  id: string
  type: "fight_call" | "fight_ready" | "result" | "schedule_change" | "general" | "medical"
  title: string
  message: string
  recipients: string[]
  channels: ("sms" | "email" | "push" | "display")[]
  priority: "low" | "medium" | "high" | "urgent"
  timestamp: string
  status: "pending" | "sent" | "delivered" | "failed"
  autoSend: boolean
  scheduledTime?: string
}

interface NotificationsSystemProps {
  tournament: Tournament
  fights: Fight[]
  onSendNotification: (notification: Notification) => void
}

export default function NotificationsSystem({ tournament, fights, onSendNotification }: NotificationsSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([])
  const [newNotification, setNewNotification] = useState({
    type: "general" as Notification["type"],
    title: "",
    message: "",
    recipients: [] as string[],
    channels: ["display"] as ("sms" | "email" | "push" | "display")[],
    priority: "medium" as Notification["priority"],
    autoSend: false,
    scheduledTime: "",
  })

  // Автоматические уведомления
  useEffect(() => {
    const checkAutoNotifications = () => {
      // Уведомления о готовности к бою (за 10 минут)
      fights
        .filter((f) => f.status === "pending")
        .slice(0, 6) // Следующие 6 боёв
        .forEach((fight, index) => {
          if (index === 0) {
            // Следующий бой - вызов участников
            const existingCall = notifications.find(
              (n) => n.type === "fight_call" && n.message.includes(`#${fight.fightNumber}`),
            )

            if (!existingCall) {
              const callNotification: Notification = {
                id: crypto.randomUUID(),
                type: "fight_call",
                title: `Вызов на бой #${fight.fightNumber}`,
                message: `${fight.participant1?.fullName} и ${fight.participant2?.fullName}, пройдите к татами ${fight.tatami}`,
                recipients: [fight.participant1?.id, fight.participant2?.id].filter(Boolean) as string[],
                channels: ["display", "push"],
                priority: "high",
                timestamp: new Date().toISOString(),
                status: "pending",
                autoSend: true,
              }
              addNotification(callNotification)
            }
          } else if (index === 1) {
            // Второй бой - подготовка
            const existingReady = notifications.find(
              (n) => n.type === "fight_ready" && n.message.includes(`#${fight.fightNumber}`),
            )

            if (!existingReady) {
              const readyNotification: Notification = {
                id: crypto.randomUUID(),
                type: "fight_ready",
                title: `Подготовка к бою #${fight.fightNumber}`,
                message: `${fight.participant1?.fullName} и ${fight.participant2?.fullName}, подготовьтесь к выходу на татами ${fight.tatami}`,
                recipients: [fight.participant1?.id, fight.participant2?.id].filter(Boolean) as string[],
                channels: ["display"],
                priority: "medium",
                timestamp: new Date().toISOString(),
                status: "pending",
                autoSend: true,
              }
              addNotification(readyNotification)
            }
          }
        })
    }

    const interval = setInterval(checkAutoNotifications, 30000) // Проверяем каждые 30 секунд
    return () => clearInterval(interval)
  }, [fights, notifications])

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification])
    if (notification.autoSend) {
      sendNotification(notification)
    }
  }

  const sendNotification = (notification: Notification) => {
    // Имитация отправки
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, status: "sent" as const } : n)))

    // Добавляем в активные уведомления для отображения
    if (notification.channels.includes("display")) {
      setActiveNotifications((prev) => [...prev, notification])

      // Автоматически убираем через время в зависимости от приоритета
      const timeout = notification.priority === "urgent" ? 30000 : notification.priority === "high" ? 20000 : 10000
      setTimeout(() => {
        setActiveNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      }, timeout)
    }

    onSendNotification(notification)
  }

  const createNotification = () => {
    if (!newNotification.title || !newNotification.message) return

    const notification: Notification = {
      id: crypto.randomUUID(),
      ...newNotification,
      timestamp: new Date().toISOString(),
      status: "pending",
    }

    addNotification(notification)

    // Сброс формы
    setNewNotification({
      type: "general",
      title: "",
      message: "",
      recipients: [],
      channels: ["display"],
      priority: "medium",
      autoSend: false,
      scheduledTime: "",
    })
  }

  const dismissNotification = (notificationId: string) => {
    setActiveNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white border-red-600"
      case "high":
        return "bg-orange-500 text-white border-orange-600"
      case "medium":
        return "bg-blue-500 text-white border-blue-600"
      case "low":
        return "bg-gray-500 text-white border-gray-600"
      default:
        return "bg-blue-500 text-white border-blue-600"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "fight_call":
        return "🥋"
      case "fight_ready":
        return "⏰"
      case "result":
        return "🏆"
      case "schedule_change":
        return "📅"
      case "medical":
        return "🏥"
      default:
        return "📢"
    }
  }

  const quickNotifications = [
    {
      type: "general" as const,
      title: "Перерыв на обед",
      message: "Турнир приостанавливается на обеденный перерыв. Возобновление в 14:00",
      priority: "medium" as const,
    },
    {
      type: "general" as const,
      title: "Технический перерыв",
      message: "Технический перерыв на татами. Ожидайте дальнейших указаний",
      priority: "high" as const,
    },
    {
      type: "schedule_change" as const,
      title: "Изменение расписания",
      message: "Внимание! Изменения в расписании боёв. Следите за табло",
      priority: "high" as const,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Активные уведомления */}
      {activeNotifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {activeNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg border-l-4 ${getNotificationColor(notification.priority)} animate-in slide-in-from-right`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getTypeIcon(notification.type)}</span>
                  <div>
                    <div className="font-medium text-sm">{notification.title}</div>
                    <div className="text-xs opacity-90 mt-1">{notification.message}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissNotification(notification.id)}
                  className="text-white hover:bg-white/20 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Система уведомлений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Создание уведомления */}
            <div className="space-y-4">
              <h3 className="font-medium">Создать уведомление</h3>

              <div>
                <label className="text-sm font-medium">Тип уведомления:</label>
                <Select
                  value={newNotification.type}
                  onValueChange={(value: any) => setNewNotification({ ...newNotification, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Общее объявление</SelectItem>
                    <SelectItem value="fight_call">Вызов на бой</SelectItem>
                    <SelectItem value="fight_ready">Подготовка к бою</SelectItem>
                    <SelectItem value="result">Результат боя</SelectItem>
                    <SelectItem value="schedule_change">Изменение расписания</SelectItem>
                    <SelectItem value="medical">Медицинское</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Заголовок:</label>
                <Input
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  placeholder="Заголовок уведомления"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Сообщение:</label>
                <Textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  placeholder="Текст уведомления"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Приоритет:</label>
                <Select
                  value={newNotification.priority}
                  onValueChange={(value: any) => setNewNotification({ ...newNotification, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="urgent">Срочный</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Каналы отправки:</label>
                <div className="flex gap-4 mt-2">
                  {[
                    { id: "display", label: "Табло", icon: MessageSquare },
                    { id: "push", label: "Push", icon: Smartphone },
                    { id: "sms", label: "SMS", icon: Smartphone },
                    { id: "email", label: "Email", icon: Mail },
                  ].map((channel) => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={channel.id}
                        checked={newNotification.channels.includes(channel.id as any)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewNotification({
                              ...newNotification,
                              channels: [...newNotification.channels, channel.id as any],
                            })
                          } else {
                            setNewNotification({
                              ...newNotification,
                              channels: newNotification.channels.filter((c) => c !== channel.id),
                            })
                          }
                        }}
                      />
                      <label htmlFor={channel.id} className="text-sm flex items-center gap-1">
                        <channel.icon className="h-3 w-3" />
                        {channel.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoSend"
                  checked={newNotification.autoSend}
                  onCheckedChange={(checked) => setNewNotification({ ...newNotification, autoSend: !!checked })}
                />
                <label htmlFor="autoSend" className="text-sm">
                  Отправить немедленно
                </label>
              </div>

              <Button onClick={createNotification} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Создать уведомление
              </Button>
            </div>

            {/* Быстрые уведомления */}
            <div className="space-y-4">
              <h3 className="font-medium">Быстрые уведомления</h3>

              <div className="space-y-2">
                {quickNotifications.map((quick, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3 bg-transparent"
                    onClick={() => {
                      const notification: Notification = {
                        id: crypto.randomUUID(),
                        ...quick,
                        recipients: [],
                        channels: ["display", "push"],
                        timestamp: new Date().toISOString(),
                        status: "pending",
                        autoSend: true,
                      }
                      addNotification(notification)
                    }}
                  >
                    <div>
                      <div className="font-medium text-sm">{quick.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{quick.message}</div>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Статистика */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Статистика уведомлений</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">{notifications.length}</div>
                    <div className="text-sm text-gray-600">Всего</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {notifications.filter((n) => n.status === "sent").length}
                    </div>
                    <div className="text-sm text-gray-600">Отправлено</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">
                      {notifications.filter((n) => n.priority === "high" || n.priority === "urgent").length}
                    </div>
                    <div className="text-sm text-gray-600">Важных</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">
                      {notifications.filter((n) => n.autoSend).length}
                    </div>
                    <div className="text-sm text-gray-600">Авто</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* История уведомлений */}
      <Card>
        <CardHeader>
          <CardTitle>История уведомлений ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getTypeIcon(notification.type)}</span>
                    <div>
                      <div className="font-medium text-sm">{notification.title}</div>
                      <div className="text-xs text-gray-500">{notification.message}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleString("ru-RU")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getNotificationColor(notification.priority)} variant="outline">
                      {notification.priority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        notification.status === "sent"
                          ? "bg-green-50 text-green-700"
                          : notification.status === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-50 text-gray-700"
                      }
                    >
                      {notification.status === "sent"
                        ? "Отправлено"
                        : notification.status === "failed"
                          ? "Ошибка"
                          : "Ожидает"}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
