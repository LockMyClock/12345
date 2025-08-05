"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Trash2 } from "lucide-react"
import type { Participant } from "../types"

interface ParticipantsListProps {
  participants: Participant[]
  onEditParticipant: (participant: Participant) => void
  onDeleteParticipant: (participantId: string) => void
}

export default function ParticipantsList({
  participants,
  onEditParticipant,
  onDeleteParticipant,
}: ParticipantsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClub, setFilterClub] = useState("")
  const [filterDiscipline, setFilterDiscipline] = useState("")

  const filteredParticipants = participants.filter((participant) => {
    const matchesSearch =
      participant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.club.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClub = !filterClub || participant.club === filterClub

    const matchesDiscipline =
      !filterDiscipline ||
      (filterDiscipline === "kata" && participant.participatesInKata) ||
      (filterDiscipline === "kumite" && participant.participatesInKumite) ||
      (filterDiscipline === "kata-group" && participant.participatesInKataGroup)

    return matchesSearch && matchesClub && matchesDiscipline
  })

  const uniqueClubs = [...new Set(participants.map((p) => p.club))].filter(Boolean)

  const getDisciplineBadges = (participant: Participant) => {
    const badges = []
    if (participant.participatesInKata)
      badges.push(
        <Badge key="kata" variant="outline" className="bg-green-50">
          Ката
        </Badge>,
      )
    if (participant.participatesInKumite)
      badges.push(
        <Badge key="kumite" variant="outline" className="bg-red-50">
          Кумитэ
        </Badge>,
      )
    if (participant.participatesInKataGroup)
      badges.push(
        <Badge key="kata-group" variant="outline" className="bg-purple-50">
          Ката-группы
        </Badge>,
      )
    return badges
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            Список участников ({filteredParticipants.length} из {participants.length})
          </span>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Поиск по имени или клубу..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={filterClub}
              onChange={(e) => setFilterClub(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Все клубы</option>
              {uniqueClubs.map((club) => (
                <option key={club} value={club}>
                  {club}
                </option>
              ))}
            </select>
            <select
              value={filterDiscipline}
              onChange={(e) => setFilterDiscipline(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Все дисциплины</option>
              <option value="kata">Ката</option>
              <option value="kumite">Кумитэ</option>
              <option value="kata-group">Ката-группы</option>
            </select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО</TableHead>
                <TableHead>Возраст</TableHead>
                <TableHead>Пол</TableHead>
                <TableHead>Вес</TableHead>
                <TableHead>Пояс</TableHead>
                <TableHead>Уровень</TableHead>
                <TableHead>Дисциплины</TableHead>
                <TableHead>Клуб</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">{participant.fullName}</TableCell>
                  <TableCell>{participant.age}</TableCell>
                  <TableCell>{participant.gender}</TableCell>
                  <TableCell>{participant.weight} кг</TableCell>
                  <TableCell>{participant.belt}</TableCell>
                  <TableCell>
                    <Badge variant={participant.isExperienced ? "default" : "secondary"}>
                      {participant.isExperienced ? "Опытный" : "Новичок"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">{getDisciplineBadges(participant)}</div>
                  </TableCell>
                  <TableCell>{participant.club}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEditParticipant(participant)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDeleteParticipant(participant.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
