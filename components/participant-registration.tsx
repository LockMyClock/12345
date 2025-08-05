"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, FileSpreadsheet } from "lucide-react"
import type { Participant } from "../types"
import * as XLSX from "xlsx"

interface ParticipantRegistrationProps {
  onAddParticipant: (participant: Participant) => void
  onImportFromExcel: (file: File) => void
}

export default function ParticipantRegistration({ onAddParticipant, onImportFromExcel }: ParticipantRegistrationProps) {
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    gender: "М" as "М" | "Ж",
    birthDate: "",
    weight: "",
    rank: "",
    belt: "",
    participatesInKata: false,
    participatesInKumite: false,
    participatesInKataGroup: false,
    kataGroupNumber: "",
    trainer: "",
    club: "",
    country: "",
    city: "",
    territory: "",
    organization: "",
  })

  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<string>("")

  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getBeltLevel = (belt: string): number => {
    if (belt.includes("дан")) {
      const danLevel = Number.parseInt(belt.match(/\d+/)?.[0] || "1")
      return -danLevel // даны имеют отрицательные значения для правильной сортировки
    }
    if (belt.includes("кю")) {
      return Number.parseInt(belt.match(/\d+/)?.[0] || "10")
    }
    return 10 // по умолчанию новичок
  }

  const isExperienced = (beltLevel: number): boolean => {
    return beltLevel <= 8 // 8 кю и ниже (включая даны) - опытные
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const age = calculateAge(formData.birthDate)
    const beltLevel = getBeltLevel(formData.belt)
    const experienced = isExperienced(beltLevel)

    const participant: Participant = {
      id: crypto.randomUUID(),
      lastName: formData.lastName,
      firstName: formData.firstName,
      middleName: formData.middleName,
      fullName: `${formData.lastName} ${formData.firstName} ${formData.middleName}`.trim(),
      gender: formData.gender,
      birthDate: formData.birthDate,
      age,
      weight: Number.parseFloat(formData.weight),
      rank: formData.rank,
      belt: formData.belt,
      beltLevel,
      isExperienced: experienced,
      participatesInKata: formData.participatesInKata,
      participatesInKumite: formData.participatesInKumite,
      participatesInKataGroup: formData.participatesInKataGroup,
      kataGroupNumber: formData.kataGroupNumber ? Number.parseInt(formData.kataGroupNumber) : undefined,
      trainer: formData.trainer,
      club: formData.club,
      country: formData.country,
      city: formData.city,
      territory: formData.territory,
      organization: formData.organization,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onAddParticipant(participant)

    // Сброс формы
    setFormData({
      lastName: "",
      firstName: "",
      middleName: "",
      gender: "М",
      birthDate: "",
      weight: "",
      rank: "",
      belt: "",
      participatesInKata: false,
      participatesInKumite: false,
      participatesInKataGroup: false,
      kataGroupNumber: "",
      trainer: "",
      club: "",
      country: "",
      city: "",
      territory: "",
      organization: "",
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportStatus("Загрузка файла...")

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" })

      if (jsonData.length < 2) {
        throw new Error("Файл должен содержать данные")
      }

      setImportStatus("Поиск заголовков...")

      // Поиск строки с заголовками (ищем ячейку с "№")
      let headerRowIndex = -1
      let dataStartRowIndex = -1

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any[]

        // Ищем ячейку с символом "№"
        const hasNumberSign = row.some((cell) => cell && cell.toString().includes("№"))

        if (hasNumberSign && headerRowIndex === -1) {
          headerRowIndex = i
          console.log(`Найдена строка заголовков: ${i + 1}`)

          // Теперь ищем первую строку с номером "1"
          for (let j = i + 1; j < jsonData.length; j++) {
            const dataRow = jsonData[j] as any[]
            const firstCell = dataRow[0]?.toString().trim()

            if (firstCell === "1") {
              dataStartRowIndex = j
              console.log(`Найдена первая строка данных: ${j + 1}`)
              break
            }
          }
          break
        }
      }

      if (headerRowIndex === -1) {
        throw new Error("Не найдена строка заголовков с символом '№'")
      }

      if (dataStartRowIndex === -1) {
        throw new Error("Не найдена первая строка данных с номером '1'")
      }

      const headers = jsonData[headerRowIndex] as string[]
      const dataRows = jsonData.slice(dataStartRowIndex) as any[][]

      setImportStatus("Обработка данных...")

      // Поиск индексов колонок (более гибкий поиск)
      const getColumnIndex = (possibleNames: string[]) => {
        return headers.findIndex((header) => {
          if (!header) return false
          const headerLower = header.toString().toLowerCase()
          return possibleNames.some(
            (name) =>
              headerLower.includes(name.toLowerCase()) ||
              headerLower.replace(/\s+/g, "").includes(name.toLowerCase().replace(/\s+/g, "")),
          )
        })
      }

      const columnIndexes = {
        number: getColumnIndex(["№", "номер", "number", "n"]),
        lastName: getColumnIndex(["фамилия", "lastname", "surname", "фам"]),
        firstName: getColumnIndex(["имя", "firstname", "name", "им"]),
        middleName: getColumnIndex(["отчество", "middlename", "patronymic", "отч"]),
        gender: getColumnIndex(["пол", "gender", "sex"]),
        birthDate: getColumnIndex(["дата рождения", "birthdate", "birth", "дата", "др"]),
        weight: getColumnIndex(["вес", "weight", "кг"]),
        rank: getColumnIndex(["разряд", "rank", "grade", "звание"]),
        belt: getColumnIndex(["пояс", "belt", "kyu", "dan", "кю", "дан"]),
        kata: getColumnIndex(["ката", "kata"]),
        kumite: getColumnIndex(["кумитэ", "kumite", "кумите", "бой"]),
        kataGroup: getColumnIndex(["ката-группы", "kata-group", "катагруппы", "группы"]),
        trainer: getColumnIndex(["тренер", "trainer", "coach", "наставник"]),
        club: getColumnIndex(["клуб", "club", "team", "команда"]),
        city: getColumnIndex(["город", "city"]),
        country: getColumnIndex(["страна", "country"]),
        territory: getColumnIndex(["территория", "territory", "region", "область"]),
        organization: getColumnIndex(["организация", "organization", "org", "федерация"]),
      }

      console.log("Найденные колонки:", columnIndexes)

      const importedParticipants: Participant[] = []
      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        if (!row || row.length === 0) continue

        // Проверяем, что это строка с данными (первая ячейка должна быть числом)
        const firstCell = row[0]?.toString().trim()
        if (!firstCell || isNaN(Number(firstCell))) {
          continue // Пропускаем строки без номера
        }

        try {
          // Извлекаем данные с проверкой на существование колонки
          const getColumnValue = (index: number): string => {
            return index >= 0 && row[index] !== undefined ? row[index].toString().trim() : ""
          }

          const lastName = getColumnValue(columnIndexes.lastName)
          const firstName = getColumnValue(columnIndexes.firstName)
          const middleName = getColumnValue(columnIndexes.middleName)

          // Фамилия обязательна
          if (!lastName) {
            console.warn(`Строка ${dataStartRowIndex + i + 1}: отсутствует фамилия`)
            errorCount++
            continue
          }

          // Имя желательно, но не критично
          const finalFirstName = firstName || "Не указано"

          // Обработка даты рождения
          let birthDate = ""
          let age = 0
          const birthDateValue = columnIndexes.birthDate >= 0 ? row[columnIndexes.birthDate] : null

          if (birthDateValue) {
            try {
              if (typeof birthDateValue === "number") {
                // Excel дата как число
                const excelDate = new Date((birthDateValue - 25569) * 86400 * 1000)
                birthDate = excelDate.toISOString().split("T")[0]
              } else {
                // Строковая дата
                const dateStr = birthDateValue.toString()
                // Поддержка разных форматов даты
                let parsedDate: Date

                if (dateStr.includes(".")) {
                  // Формат ДД.ММ.ГГГГ
                  const parts = dateStr.split(".")
                  if (parts.length === 3) {
                    parsedDate = new Date(
                      Number.parseInt(parts[2]),
                      Number.parseInt(parts[1]) - 1,
                      Number.parseInt(parts[0]),
                    )
                  }
                } else if (dateStr.includes("/")) {
                  // Формат ММ/ДД/ГГГГ или ДД/ММ/ГГГГ
                  parsedDate = new Date(dateStr)
                } else {
                  parsedDate = new Date(dateStr)
                }

                if (parsedDate && !isNaN(parsedDate.getTime())) {
                  birthDate = parsedDate.toISOString().split("T")[0]
                }
              }

              if (birthDate) {
                age = calculateAge(birthDate)
              }
            } catch (dateError) {
              console.warn(`Ошибка обработки даты в строке ${dataStartRowIndex + i + 1}:`, dateError)
            }
          }

          // Обработка пола
          const genderValue = getColumnValue(columnIndexes.gender).toLowerCase()
          let gender: "М" | "Ж" = "М"
          if (
            genderValue.includes("ж") ||
            genderValue.includes("f") ||
            genderValue.includes("female") ||
            genderValue.includes("женский")
          ) {
            gender = "Ж"
          }

          // Обработка веса
          const weightValue = getColumnValue(columnIndexes.weight)
          const weight = weightValue ? Number.parseFloat(weightValue.replace(/[^\d.,]/g, "").replace(",", ".")) || 0 : 0

          // Обработка пояса
          const belt = getColumnValue(columnIndexes.belt) || "10 кю"
          const beltLevel = getBeltLevel(belt)
          const experienced = isExperienced(beltLevel)

          // Обработка участия в дисциплинах (более гибкая проверка)
          const checkParticipation = (value: string): boolean => {
            if (!value) return false
            const lowerValue = value.toLowerCase()
            return (
              lowerValue.includes("да") ||
              lowerValue.includes("yes") ||
              lowerValue.includes("+") ||
              lowerValue === "1" ||
              lowerValue.includes("участвует") ||
              lowerValue.includes("участие")
            )
          }

          const kataValue = getColumnValue(columnIndexes.kata)
          const kumiteValue = getColumnValue(columnIndexes.kumite)
          const kataGroupValue = getColumnValue(columnIndexes.kataGroup)

          const participatesInKata = checkParticipation(kataValue)
          const participatesInKumite = checkParticipation(kumiteValue)
          const participatesInKataGroup = checkParticipation(kataGroupValue)

          const participant: Participant = {
            id: crypto.randomUUID(),
            lastName,
            firstName: finalFirstName,
            middleName,
            fullName: `${lastName} ${finalFirstName} ${middleName}`.trim(),
            gender,
            birthDate,
            age,
            weight,
            rank: getColumnValue(columnIndexes.rank),
            belt,
            beltLevel,
            isExperienced: experienced,
            participatesInKata,
            participatesInKumite,
            participatesInKataGroup,
            trainer: getColumnValue(columnIndexes.trainer),
            club: getColumnValue(columnIndexes.club) || "Не указан",
            country: getColumnValue(columnIndexes.country),
            city: getColumnValue(columnIndexes.city),
            territory: getColumnValue(columnIndexes.territory),
            organization: getColumnValue(columnIndexes.organization),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          importedParticipants.push(participant)
          successCount++
        } catch (error) {
          console.error(`Ошибка в строке ${dataStartRowIndex + i + 1}:`, error)
          errorCount++
        }
      }

      // Добавляем всех участников
      importedParticipants.forEach((participant) => {
        onAddParticipant(participant)
      })

      setImportStatus(
        `Импорт завершен: ${successCount} участников добавлено${errorCount > 0 ? `, ${errorCount} строк пропущено` : ""}`,
      )

      // Очищаем input
      e.target.value = ""
    } catch (error) {
      console.error("Ошибка при импорте:", error)
      setImportStatus(`Ошибка при импорте: ${error.message}`)
    } finally {
      setIsImporting(false)
      // Очищаем статус через 10 секунд
      setTimeout(() => setImportStatus(""), 10000)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-6 w-6" />
          Регистрация участников
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Ручной ввод</TabsTrigger>
            <TabsTrigger value="import">Импорт из Excel</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="lastName">Фамилия *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">Имя *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="middleName">Отчество</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="gender">Пол *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value: "М" | "Ж") => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="М">Мужской</SelectItem>
                      <SelectItem value="Ж">Женский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="birthDate">Дата рождения *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Вес (кг) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="belt">Пояс *</Label>
                  <Select value={formData.belt} onValueChange={(value) => setFormData({ ...formData, belt: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите пояс" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10 кю">10 кю (белый)</SelectItem>
                      <SelectItem value="9 кю">9 кю (белый с желтой полосой)</SelectItem>
                      <SelectItem value="8 кю">8 кю (желтый)</SelectItem>
                      <SelectItem value="7 кю">7 кю (желтый с оранжевой полосой)</SelectItem>
                      <SelectItem value="6 кю">6 кю (оранжевый)</SelectItem>
                      <SelectItem value="5 кю">5 кю (оранжевый с зеленой полосой)</SelectItem>
                      <SelectItem value="4 кю">4 кю (зеленый)</SelectItem>
                      <SelectItem value="3 кю">3 кю (зеленый с коричневой полосой)</SelectItem>
                      <SelectItem value="2 кю">2 кю (коричневый)</SelectItem>
                      <SelectItem value="1 кю">1 кю (коричневый с черной полосой)</SelectItem>
                      <SelectItem value="1 дан">1 дан (черный)</SelectItem>
                      <SelectItem value="2 дан">2 дан (черный)</SelectItem>
                      <SelectItem value="3 дан">3 дан (черный)</SelectItem>
                      <SelectItem value="4 дан">4 дан (черный)</SelectItem>
                      <SelectItem value="5 дан">5 дан (черный)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rank">Разряд</Label>
                  <Input
                    id="rank"
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    placeholder="КМС, МС и т.д."
                  />
                </div>
                <div>
                  <Label htmlFor="trainer">Тренер</Label>
                  <Input
                    id="trainer"
                    value={formData.trainer}
                    onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="club">Клуб *</Label>
                  <Input
                    id="club"
                    value={formData.club}
                    onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">Город</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Страна</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Участие в дисциплинах:</Label>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="kata"
                      checked={formData.participatesInKata}
                      onCheckedChange={(checked) => setFormData({ ...formData, participatesInKata: !!checked })}
                    />
                    <Label htmlFor="kata">Ката</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="kumite"
                      checked={formData.participatesInKumite}
                      onCheckedChange={(checked) => setFormData({ ...formData, participatesInKumite: !!checked })}
                    />
                    <Label htmlFor="kumite">Кумитэ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="kataGroup"
                      checked={formData.participatesInKataGroup}
                      onCheckedChange={(checked) => setFormData({ ...formData, participatesInKataGroup: !!checked })}
                    />
                    <Label htmlFor="kataGroup">Ката-группы</Label>
                  </div>
                </div>

                {formData.participatesInKataGroup && (
                  <div className="w-32">
                    <Label htmlFor="kataGroupNumber">Номер группы</Label>
                    <Input
                      id="kataGroupNumber"
                      type="number"
                      value={formData.kataGroupNumber}
                      onChange={(e) => setFormData({ ...formData, kataGroupNumber: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">
                Добавить участника
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="import">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <Label htmlFor="excel-upload" className="cursor-pointer">
                  <span className="text-lg font-medium">{isImporting ? "Загрузка..." : "Загрузить файл Excel"}</span>
                  <p className="text-sm text-gray-500 mt-2">Поддерживаются форматы .xlsx, .xls</p>
                </Label>
                <Input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isImporting}
                />
              </div>

              {importStatus && (
                <div
                  className={`p-4 rounded-lg ${
                    importStatus.includes("Ошибка") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                  }`}
                >
                  {importStatus}
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Формат файла Excel:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Обязательные колонки:</strong> Фамилия, Имя
                  </p>
                  <p>
                    <strong>Рекомендуемые колонки:</strong> Отчество, Пол, Дата рождения, Вес, Пояс, Клуб
                  </p>
                  <p>
                    <strong>Дисциплины:</strong> Ката, Кумитэ, Ката-группы (значения: да/нет, +/-, 1/0)
                  </p>
                  <p>
                    <strong>Дополнительные:</strong> Разряд, Тренер, Город, Страна, Территория, Организация
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Примеры форматов данных:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Пол:</strong> М/Ж, мужской/женский, male/female
                  </p>
                  <p>
                    <strong>Дата рождения:</strong> ДД.ММ.ГГГГ, ГГГГ-ММ-ДД или Excel дата
                  </p>
                  <p>
                    <strong>Участие:</strong> да/нет, +/-, 1/0, yes/no
                  </p>
                  <p>
                    <strong>Пояс:</strong> "1 кю", "2 дан", "белый пояс" и т.д.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
