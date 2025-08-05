"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCheck, Trash2, Edit } from "lucide-react"
import type { Judge } from "../types"

interface JudgeRegistrationProps {
  judges: Judge[]
  onAddJudge: (judge: Judge) => void
  onEditJudge: (judge: Judge) => void
  onDeleteJudge: (judgeId: string) => void
}

export default function JudgeRegistration({ judges, onAddJudge, onEditJudge, onDeleteJudge }: JudgeRegistrationProps) {
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    birthDate: "",
    degree: "",
    belt: "",
    club: "",
  })

  const [editingJudge, setEditingJudge] = useState<Judge | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const judge: Judge = {
      id: editingJudge?.id || crypto.randomUUID(),
      lastName: formData.lastName,
      firstName: formData.firstName,
      middleName: formData.middleName,
      fullName: `${formData.lastName} ${formData.firstName} ${formData.middleName}`.trim(),
      birthDate: formData.birthDate,
      degree: formData.degree,
      belt: formData.belt,
      club: formData.club,
      createdAt: editingJudge?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (editingJudge) {
      onEditJudge(judge)
      setEditingJudge(null)
    } else {
      onAddJudge(judge)
    }

    // Сброс формы
    setFormData({
      lastName: "",
      firstName: "",
      middleName: "",
      birthDate: "",
      degree: "",
      belt: "",
      club: "",
    })
  }

  const handleEdit = (judge: Judge) => {
    setEditingJudge(judge)
    setFormData({
      lastName: judge.lastName,
      firstName: judge.firstName,
      middleName: judge.middleName,
      birthDate: judge.birthDate,
      degree: judge.degree,
      belt: judge.belt,
      club: judge.club,
    })
  }

  const cancelEdit = () => {
    setEditingJudge(null)
    setFormData({
      lastName: "",
      firstName: "",
      middleName: "",
      birthDate: "",
      degree: "",
      belt: "",
      club: "",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-6 w-6" />
            {editingJudge ? "Редактировать судью" : "Добавить судью"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="judgeLastName">Фамилия *</Label>
                <Input
                  id="judgeLastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="judgeFirstName">Имя *</Label>
                <Input
                  id="judgeFirstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="judgeMiddleName">Отчество</Label>
                <Input
                  id="judgeMiddleName"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="judgeBirthDate">Дата рождения</Label>
                <Input
                  id="judgeBirthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="judgeDegree">Степень</Label>
                <Input
                  id="judgeDegree"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="Судья 1 категории"
                />
              </div>
              <div>
                <Label htmlFor="judgeBelt">Пояс</Label>
                <Input
                  id="judgeBelt"
                  value={formData.belt}
                  onChange={(e) => setFormData({ ...formData, belt: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="judgeClub">Клуб *</Label>
                <Input
                  id="judgeClub"
                  value={formData.club}
                  onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">{editingJudge ? "Сохранить изменения" : "Добавить судью"}</Button>
              {editingJudge && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список судей ({judges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО</TableHead>
                <TableHead>Дата рождения</TableHead>
                <TableHead>Степень</TableHead>
                <TableHead>Пояс</TableHead>
                <TableHead>Клуб</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {judges.map((judge) => (
                <TableRow key={judge.id}>
                  <TableCell className="font-medium">{judge.fullName}</TableCell>
                  <TableCell>{judge.birthDate}</TableCell>
                  <TableCell>{judge.degree}</TableCell>
                  <TableCell>{judge.belt}</TableCell>
                  <TableCell>{judge.club}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(judge)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDeleteJudge(judge.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
