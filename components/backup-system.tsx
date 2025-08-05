"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Save, Upload, Download, Database, Clock, Shield, AlertTriangle } from "lucide-react"
import type { Tournament, Fight } from "../types"

interface BackupData {
  id: string
  name: string
  tournament: Tournament
  fights: Fight[]
  timestamp: string
  size: number
  version: string
  checksum: string
}

interface BackupSystemProps {
  tournament: Tournament
  fights: Fight[]
  onRestore: (data: { tournament: Tournament; fights: Fight[] }) => void
}

export default function BackupSystem({ tournament, fights, onRestore }: BackupSystemProps) {
  const [backups, setBackups] = useState<BackupData[]>([])
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true)
  const [backupInterval, setBackupInterval] = useState(30) // минуты

  // Создание бэкапа
  const createBackup = async (name?: string) => {
    setIsCreatingBackup(true)
    setBackupProgress(0)

    try {
      // Имитация процесса создания бэкапа
      const steps = [
        "Сбор данных участников...",
        "Сохранение информации о боях...",
        "Архивирование судейских данных...",
        "Создание контрольной суммы...",
        "Сжатие данных...",
        "Финализация бэкапа...",
      ]

      for (let i = 0; i < steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        setBackupProgress(((i + 1) / steps.length) * 100)
      }

      const backupData: BackupData = {
        id: crypto.randomUUID(),
        name: name || `Автобэкап ${new Date().toLocaleString("ru-RU")}`,
        tournament: { ...tournament },
        fights: [...fights],
        timestamp: new Date().toISOString(),
        size: Math.floor(Math.random() * 1000000) + 500000, // Имитация размера
        version: "1.0.0",
        checksum: generateChecksum(),
      }

      setBackups((prev) => [backupData, ...prev])

      // Сохраняем в localStorage
      const existingBackups = JSON.parse(localStorage.getItem("tournament_backups") || "[]")
      localStorage.setItem("tournament_backups", JSON.stringify([backupData, ...existingBackups]))
    } catch (error) {
      console.error("Ошибка создания бэкапа:", error)
    } finally {
      setIsCreatingBackup(false)
      setBackupProgress(0)
    }
  }

  // Восстановление из бэкапа
  const restoreFromBackup = async (backup: BackupData) => {
    if (
      !confirm(`Вы уверены, что хотите восстановить данные из бэкапа "${backup.name}"? Текущие данные будут заменены.`)
    ) {
      return
    }

    setIsRestoring(true)

    try {
      // Имитация процесса восстановления
      await new Promise((resolve) => setTimeout(resolve, 2000))

      onRestore({
        tournament: backup.tournament,
        fights: backup.fights,
      })

      alert("Данные успешно восстановлены из бэкапа!")
    } catch (error) {
      console.error("Ошибка восстановления:", error)
      alert("Ошибка при восстановлении данных")
    } finally {
      setIsRestoring(false)
    }
  }

  // Экспорт бэкапа в файл
  const exportBackup = (backup: BackupData) => {
    const dataStr = JSON.stringify(backup, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `backup_${backup.name.replace(/[^a-zA-Z0-9]/g, "_")}_${backup.timestamp.split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  // Импорт бэкапа из файла
  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string) as BackupData

        // Валидация данных
        if (!backupData.tournament || !backupData.fights) {
          throw new Error("Неверный формат файла бэкапа")
        }

        setBackups((prev) => [backupData, ...prev])
        alert("Бэкап успешно импортирован!")
      } catch (error) {
        console.error("Ошибка импорта:", error)
        alert("Ошибка при импорте файла бэкапа")
      }
    }
    reader.readAsText(file)
  }

  // Удаление бэкапа
  const deleteBackup = (backupId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот бэкап?")) return

    setBackups((prev) => prev.filter((b) => b.id !== backupId))

    // Обновляем localStorage
    const updatedBackups = backups.filter((b) => b.id !== backupId)
    localStorage.setItem("tournament_backups", JSON.stringify(updatedBackups))
  }

  // Генерация контрольной суммы
  const generateChecksum = (): string => {
    return Math.random().toString(36).substring(2, 15)
  }

  // Форматирование размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Автоматический бэкап
  useState(() => {
    if (autoBackupEnabled) {
      const interval = setInterval(
        () => {
          createBackup(`Автобэкап ${new Date().toLocaleTimeString("ru-RU")}`)
        },
        backupInterval * 60 * 1000,
      )

      return () => clearInterval(interval)
    }
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Система резервного копирования
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Управление бэкапами */}
            <div className="space-y-4">
              <h3 className="font-medium">Управление бэкапами</h3>

              <div className="space-y-3">
                <Button
                  onClick={() => createBackup(`Ручной бэкап ${new Date().toLocaleString("ru-RU")}`)}
                  disabled={isCreatingBackup}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreatingBackup ? "Создание бэкапа..." : "Создать бэкап"}
                </Button>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input type="file" accept=".json" onChange={importBackup} className="hidden" id="import-backup" />
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <label htmlFor="import-backup" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Импорт бэкапа
                      </label>
                    </Button>
                  </div>
                </div>

                {isCreatingBackup && (
                  <div className="space-y-2">
                    <Progress value={backupProgress} className="w-full" />
                    <div className="text-sm text-gray-600 text-center">{Math.round(backupProgress)}%</div>
                  </div>
                )}
              </div>

              {/* Настройки автобэкапа */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Автоматический бэкап</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Включить автобэкап</label>
                    <input
                      type="checkbox"
                      checked={autoBackupEnabled}
                      onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Интервал (мин):</label>
                    <Input
                      type="number"
                      value={backupInterval}
                      onChange={(e) => setBackupInterval(Number(e.target.value))}
                      className="w-20"
                      min="5"
                      max="1440"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Статистика */}
            <div className="space-y-4">
              <h3 className="font-medium">Статистика</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{backups.length}</div>
                  <div className="text-sm text-gray-600">Всего бэкапов</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {formatFileSize(backups.reduce((sum, b) => sum + b.size, 0))}
                  </div>
                  <div className="text-sm text-gray-600">Общий размер</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{tournament.participants.length}</div>
                  <div className="text-sm text-gray-600">Участников</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">{fights.length}</div>
                  <div className="text-sm text-gray-600">Боёв</div>
                </div>
              </div>

              {/* Предупреждения */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Рекомендации</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Создавайте бэкап перед важными изменениями</li>
                  <li>• Регулярно экспортируйте бэкапы на внешние носители</li>
                  <li>• Проверяйте целостность бэкапов</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список бэкапов */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6" />
            История бэкапов ({backups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {backups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Нет созданных бэкапов</p>
                <p className="text-sm">Создайте первый бэкап для сохранения данных</p>
              </div>
            ) : (
              backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">{backup.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(backup.timestamp).toLocaleString("ru-RU")} • {formatFileSize(backup.size)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Участников: {backup.tournament.participants.length} • Боёв: {backup.fights.length}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      v{backup.version}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => exportBackup(backup)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreFromBackup(backup)}
                      disabled={isRestoring}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteBackup(backup.id)}>
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
