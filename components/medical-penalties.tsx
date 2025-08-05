"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Heart, Plus, Trash2 } from "lucide-react"
import type { Participant, Fight } from "../types"

interface MedicalRecord {
  id: string
  participantId: string
  type: "medical" | "penalty" | "warning" | "disqualification"
  reason: string
  description: string
  timestamp: string
  judgeSignature: string
  severity: "low" | "medium" | "high"
  affectedFights: string[]
}

interface MedicalPenaltiesProps {
  participants: Participant[]
  fights: Fight[]
  onMedicalRecord: (record: MedicalRecord) => void
  onParticipantStatusChange: (participantId: string, status: "active" | "medical" | "disqualified") => void
}

export default function MedicalPenalties({
  participants,
  fights,
  onMedicalRecord,
  onParticipantStatusChange,
}: MedicalPenaltiesProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [selectedParticipant, setSelectedParticipant] = useState<string>("")
  const [recordType, setRecordType] = useState<"medical" | "penalty" | "warning" | "disqualification">("warning")
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium")

  const addRecord = () => {
    if (!selectedParticipant || !reason) return

    const newRecord: MedicalRecord = {
      id: crypto.randomUUID(),
      participantId: selectedParticipant,
      type: recordType,
      reason,
      description,
      timestamp: new Date().toISOString(),
      judgeSignature: `Главный судья - ${new Date().toLocaleString("ru-RU")}`,
      severity,
      affectedFights: fights
        .filter((f) => f.participant1?.id === selectedParticipant || f.participant2?.id === selectedParticipant)
        .filter((f) => f.status === "pending")
        .map((f) => f.id),
    }

    setRecords((prev) => [...prev, newRecord])
    onMedicalRecord(newRecord)

    // Изменяем статус участника при необходимости
    if (recordType === "medical" || recordType === "disqualification") {
      onParticipantStatusChange(selectedParticipant, recordType === "medical" ? "medical" : "disqualified")
    }

    // Сброс формы
    setSelectedParticipant("")
    setReason("")
    setDescription("")
    setSeverity("medium")
  }

  const removeRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId))
  }

  const getParticipantRecords = (participantId: string) => {
    return records.filter((r) => r.participantId === participantId)
  }

  const getParticipantStatus = (participantId: string) => {
    const participantRecords = getParticipantRecords(participantId)

    if (participantRecords.some((r) => r.type === "disqualification")) {
      return "disqualified"
    }
    if (participantRecords.some((r) => r.type === "medical")) {
      return "medical"
    }
    return "active"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "medical":
        return "bg-yellow-100 text-yellow-800"
      case "disqualified":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Активен"
      case "medical":
        return "Мед. отвод"
      case "disqualified":
        return "Дисквалифицирован"
      default:
        return "Неизвестно"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "medical":
        return "bg-blue-100 text-blue-800"
      case "penalty":
        return "bg-orange-100 text-orange-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "disqualification":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case "medical":
        return "Медицинский отвод"
      case "penalty":
        return "Штраф"
      case "warning":
        return "Предупреждение"
      case "disqualification":
        return "Дисквалификация"
      default:
        return type
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const commonReasons = {
    medical: ["Травма головы", "Травма конечности", "Кровотечение", "Потеря сознания", "Боль в спине", "Другая травма"],
    penalty: [
      "Неспортивное поведение",
      "Нарушение правил",
      "Грубость к сопернику",
      "Неподчинение судье",
      "Задержка боя",
    ],
    warning: ["Пассивность", "Выход за границы", "Захват", "Толчки руками", "Атака в голову"],
    disqualification: [
      "Серьёзное нарушение правил",
      "Агрессивное поведение",
      "Повторные нарушения",
      "Медицинские противопоказания",
      "Неявка на бой",
    ],
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6" />
            Медицинские отводы и штрафы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Форма добавления записи */}
            <div className="space-y-4">
              <h3 className="font-medium">Добавить запись</h3>

              <div>
                <label className="text-sm font-medium">Участник:</label>
                <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите участника" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((participant) => (
                      <SelectItem key={participant.id} value={participant.id}>
                        {participant.fullName} ({participant.club})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Тип записи:</label>
                <Select value={recordType} onValueChange={(value: any) => setRecordType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">Предупреждение</SelectItem>
                    <SelectItem value="penalty">Штраф</SelectItem>
                    <SelectItem value="medical">Медицинский отвод</SelectItem>
                    <SelectItem value="disqualification">Дисквалификация</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Причина:</label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите причину" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonReasons[recordType].map((reasonOption) => (
                      <SelectItem key={reasonOption} value={reasonOption}>
                        {reasonOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Степень тяжести:</label>
                <Select value={severity} onValueChange={(value: any) => setSeverity(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Лёгкая</SelectItem>
                    <SelectItem value="medium">Средняя</SelectItem>
                    <SelectItem value="high">Тяжёлая</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Описание:</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Подробное описание ситуации..."
                  rows={3}
                />
              </div>

              <Button onClick={addRecord} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Добавить запись
              </Button>
            </div>

            {/* Статистика */}
            <div className="space-y-4">
              <h3 className="font-medium">Статистика</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-xl font-bold text-yellow-600">
                    {records.filter((r) => r.type === "warning").length}
                  </div>
                  <div className="text-sm text-gray-600">Предупреждений</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">
                    {records.filter((r) => r.type === "penalty").length}
                  </div>
                  <div className="text-sm text-gray-600">Штрафов</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">
                    {records.filter((r) => r.type === "medical").length}
                  </div>
                  <div className="text-sm text-gray-600">Мед. отводов</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-600">
                    {records.filter((r) => r.type === "disqualification").length}
                  </div>
                  <div className="text-sm text-gray-600">Дисквалификаций</div>
                </div>
              </div>

              {/* Участники с проблемами */}
              <div>
                <h4 className="font-medium mb-2">Участники с записями:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {participants
                    .filter((p) => getParticipantRecords(p.id).length > 0)
                    .map((participant) => {
                      const status = getParticipantStatus(participant.id)
                      const participantRecords = getParticipantRecords(participant.id)

                      return (
                        <div key={participant.id} className="p-2 border rounded">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">{participant.fullName}</div>
                            <Badge className={getStatusColor(status)}>{getStatusText(status)}</Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{participantRecords.length} записей</div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица всех записей */}
      <Card>
        <CardHeader>
          <CardTitle>Все записи ({records.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Время</TableHead>
                <TableHead>Участник</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Причина</TableHead>
                <TableHead>Тяжесть</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((record) => {
                  const participant = participants.find((p) => p.id === record.participantId)

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="text-xs">{new Date(record.timestamp).toLocaleString("ru-RU")}</TableCell>
                      <TableCell>
                        <div className="font-medium">{participant?.fullName}</div>
                        <div className="text-xs text-gray-500">{participant?.club}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(record.type)}>{getTypeText(record.type)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{record.reason}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(record.severity)} variant="outline">
                          {record.severity === "low" ? "Лёгкая" : record.severity === "medium" ? "Средняя" : "Тяжёлая"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{record.description}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeRecord(record.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
