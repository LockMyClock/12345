"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Printer, QrCode, Share2 } from "lucide-react"
import jsPDF from "jspdf"
import * as XLSX from "xlsx"
import type { Tournament, Fight } from "../types"

interface ReportsGeneratorProps {
  tournament: Tournament
  fights: Fight[]
  onGenerateQR?: (url: string) => void
}

export default function ReportsGenerator({ tournament, fights, onGenerateQR }: ReportsGeneratorProps) {
  const [selectedReportType, setSelectedReportType] = useState<string>("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTatamis, setSelectedTatamis] = useState<number[]>([])
  const [includePhotos, setIncludePhotos] = useState(false)
  const [includeStatistics, setIncludeStatistics] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  // Генерация PDF протокола участников
  const generateParticipantsProtocol = () => {
    setIsGenerating(true)

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      let yPosition = 20

      // Заголовок
      doc.setFontSize(16)
      doc.text("ПРОТОКОЛ УЧАСТНИКОВ", pageWidth / 2, yPosition, { align: "center" })
      yPosition += 10

      doc.setFontSize(12)
      doc.text(`Турнир: ${tournament.name}`, pageWidth / 2, yPosition, { align: "center" })
      yPosition += 8
      doc.text(`Дата: ${new Date(tournament.date).toLocaleDateString("ru-RU")}`, pageWidth / 2, yPosition, {
        align: "center",
      })
      yPosition += 8
      doc.text(`Место: ${tournament.location}`, pageWidth / 2, yPosition, { align: "center" })
      yPosition += 15

      // Статистика
      if (includeStatistics) {
        doc.setFontSize(10)
        doc.text(`Всего участников: ${tournament.participants.length}`, 20, yPosition)
        yPosition += 6
        doc.text(`Ката: ${tournament.participants.filter((p) => p.participatesInKata).length}`, 20, yPosition)
        yPosition += 6
        doc.text(`Кумитэ: ${tournament.participants.filter((p) => p.participatesInKumite).length}`, 20, yPosition)
        yPosition += 6
        doc.text(
          `Ката-группы: ${tournament.participants.filter((p) => p.participatesInKataGroup).length}`,
          20,
          yPosition,
        )
        yPosition += 15
      }

      // Таблица участников
      doc.setFontSize(8)
      const headers = ["№", "ФИО", "Возраст", "Пол", "Вес", "Пояс", "Клуб", "Дисциплины"]
      const headerY = yPosition

      let xPosition = 20
      const columnWidths = [15, 45, 15, 10, 15, 20, 35, 25]

      // Заголовки таблицы
      headers.forEach((header, index) => {
        doc.rect(xPosition, headerY, columnWidths[index], 8)
        doc.text(header, xPosition + 2, headerY + 5)
        xPosition += columnWidths[index]
      })

      yPosition += 8

      // Данные участников
      tournament.participants.forEach((participant, index) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = 20
        }

        xPosition = 20
        const rowData = [
          (index + 1).toString(),
          participant.fullName,
          participant.age.toString(),
          participant.gender,
          `${participant.weight} кг`,
          participant.belt,
          participant.club,
          [
            participant.participatesInKata ? "Ката" : "",
            participant.participatesInKumite ? "Кумитэ" : "",
            participant.participatesInKataGroup ? "Ката-гр" : "",
          ]
            .filter(Boolean)
            .join(", "),
        ]

        rowData.forEach((data, colIndex) => {
          doc.rect(xPosition, yPosition, columnWidths[colIndex], 6)
          doc.text(data, xPosition + 1, yPosition + 4)
          xPosition += columnWidths[colIndex]
        })

        yPosition += 6
      })

      // Подписи
      yPosition += 20
      doc.setFontSize(10)
      doc.text("Главный судья: ________________________", 20, yPosition)
      yPosition += 15
      doc.text("Главный секретарь: ________________________", 20, yPosition)
      yPosition += 15
      doc.text(`Дата составления: ${new Date().toLocaleDateString("ru-RU")}`, 20, yPosition)

      doc.save(`participants_protocol_${tournament.name}_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Ошибка генерации PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Генерация протокола судей
  const generateJudgesProtocol = () => {
    setIsGenerating(true)

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      let yPosition = 20

      // Заголовок
      doc.setFontSize(16)
      doc.text("ПРОТОКОЛ СУДЕЙ", pageWidth / 2, yPosition, { align: "center" })
      yPosition += 10

      doc.setFontSize(12)
      doc.text(`Турнир: ${tournament.name}`, pageWidth / 2, yPosition, { align: "center" })
      yPosition += 8
      doc.text(`Дата: ${new Date(tournament.date).toLocaleDateString("ru-RU")}`, pageWidth / 2, yPosition, {
        align: "center",
      })
      yPosition += 15

      // Таблица судей
      doc.setFontSize(8)
      const headers = ["№", "ФИО", "Степень", "Пояс", "Клуб", "Подпись"]
      const headerY = yPosition

      let xPosition = 20
      const columnWidths = [15, 50, 30, 20, 40, 25]

      // Заголовки таблицы
      headers.forEach((header, index) => {
        doc.rect(xPosition, headerY, columnWidths[index], 8)
        doc.text(header, xPosition + 2, headerY + 5)
        xPosition += columnWidths[index]
      })

      yPosition += 8

      // Данные судей
      tournament.judges.forEach((judge, index) => {
        xPosition = 20
        const rowData = [(index + 1).toString(), judge.fullName, judge.degree, judge.belt, judge.club, ""]

        rowData.forEach((data, colIndex) => {
          doc.rect(xPosition, yPosition, columnWidths[colIndex], 8)
          doc.text(data, xPosition + 1, yPosition + 5)
          xPosition += columnWidths[colIndex]
        })

        yPosition += 8
      })

      doc.save(`judges_protocol_${tournament.name}_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Ошибка генерации PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Генерация турнирной сетки
  const generateTournamentBracket = (categoryId: string) => {
    setIsGenerating(true)

    try {
      const category = tournament.categories.find((c) => c.id === categoryId)
      if (!category) return

      const doc = new jsPDF("landscape")
      const pageWidth = doc.internal.pageSize.width
      let yPosition = 20

      // Заголовок
      doc.setFontSize(14)
      doc.text(`ТУРНИРНАЯ СЕТКА: ${category.name}`, pageWidth / 2, yPosition, { align: "center" })
      yPosition += 15

      const categoryFights = fights.filter((f) => f.categoryId === categoryId)

      if (category.systemType === "round-robin") {
        // Круговая система - таблица результатов
        doc.setFontSize(10)
        doc.text("Система: Круговая", 20, yPosition)
        yPosition += 10

        // Создаем таблицу результатов
        const participants = category.participants
        const tableSize = participants.length
        const cellSize = 15
        const startX = 50
        const startY = yPosition + 20

        // Заголовки участников
        participants.forEach((participant, index) => {
          doc.text(`${index + 1}`, startX + (index + 1) * cellSize + 5, startY - 5)
          doc.text(`${index + 1}. ${participant.fullName}`, 20, startY + index * cellSize + 10)
        })

        // Сетка результатов
        for (let i = 0; i <= tableSize; i++) {
          for (let j = 0; j <= tableSize; j++) {
            doc.rect(startX + j * cellSize, startY + i * cellSize, cellSize, cellSize)

            if (i > 0 && j > 0 && i !== j) {
              // Ищем результат боя между участниками i-1 и j-1
              const fight = categoryFights.find(
                (f) =>
                  (f.participant1?.id === participants[i - 1].id && f.participant2?.id === participants[j - 1].id) ||
                  (f.participant1?.id === participants[j - 1].id && f.participant2?.id === participants[i - 1].id),
              )

              if (fight?.result) {
                const winner = fight.result.winner === "red" ? fight.participant1 : fight.participant2
                const isWinner = winner?.id === participants[i - 1].id
                doc.text(isWinner ? "П" : "П", startX + j * cellSize + 5, startY + i * cellSize + 10)
              }
            }
          }
        }
      } else {
        // Олимпийская система - дерево поединков
        doc.setFontSize(10)
        doc.text("Система: Олимпийская", 20, yPosition)
        yPosition += 15

        // Группируем бои по раундам
        const rounds = new Map<string, Fight[]>()
        categoryFights.forEach((fight) => {
          if (!rounds.has(fight.round)) {
            rounds.set(fight.round, [])
          }
          rounds.get(fight.round)!.push(fight)
        })

        // Рисуем раунды
        const roundOrder = ["1/16", "1/8", "1/4", "1/2", "3rd-place", "final"]
        let xPos = 30

        roundOrder.forEach((roundName) => {
          if (rounds.has(roundName)) {
            doc.setFontSize(8)
            doc.text(roundName, xPos, yPosition)

            const roundFights = rounds.get(roundName)!
            let yPos = yPosition + 15

            roundFights.forEach((fight) => {
              // Рисуем поединок
              doc.rect(xPos, yPos, 60, 20)
              doc.text(`#${fight.fightNumber}`, xPos + 2, yPos + 5)
              doc.text(fight.participant1?.fullName || "TBD", xPos + 2, yPos + 10)
              doc.text(fight.participant2?.fullName || "TBD", xPos + 2, yPos + 15)

              if (fight.result) {
                const winner = fight.result.winner === "red" ? fight.participant1 : fight.participant2
                doc.setFontSize(6)
                doc.text(`Победитель: ${winner?.fullName}`, xPos + 2, yPos + 18)
              }

              yPos += 30
            })

            xPos += 80
          }
        })
      }

      doc.save(`bracket_${category.name}_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Ошибка генерации турнирной сетки:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Экспорт результатов в Excel
  const exportResultsToExcel = () => {
    setIsGenerating(true)

    try {
      const workbook = XLSX.utils.book_new()

      // Лист участников
      const participantsData = tournament.participants.map((participant, index) => ({
        "№": index + 1,
        Фамилия: participant.lastName,
        Имя: participant.firstName,
        Отчество: participant.middleName,
        ФИО: participant.fullName,
        Возраст: participant.age,
        Пол: participant.gender,
        Вес: participant.weight,
        Пояс: participant.belt,
        Уровень: participant.isExperienced ? "Опытный" : "Новичок",
        Клуб: participant.club,
        Город: participant.city,
        Ката: participant.participatesInKata ? "Да" : "Нет",
        Кумитэ: participant.participatesInKumite ? "Да" : "Нет",
        "Ката-группы": participant.participatesInKataGroup ? "Да" : "Нет",
        Тренер: participant.trainer,
      }))

      const participantsSheet = XLSX.utils.json_to_sheet(participantsData)
      XLSX.utils.book_append_sheet(workbook, participantsSheet, "Участники")

      // Лист результатов
      const resultsData = fights
        .filter((f) => f.status === "completed" && f.result)
        .map((fight, index) => {
          const winner = fight.result!.winner === "red" ? fight.participant1 : fight.participant2
          const loser = fight.result!.winner === "red" ? fight.participant2 : fight.participant1

          return {
            "№": index + 1,
            Бой: fight.fightNumber,
            Категория: tournament.categories.find((c) => c.id === fight.categoryId)?.name || "",
            Раунд: fight.round,
            Татами: fight.tatami,
            Красный: fight.participant1?.fullName || "",
            Синий: fight.participant2?.fullName || "",
            Победитель: winner?.fullName || "",
            Результат: fight.result!.type,
            "Время начала": fight.startTime ? new Date(fight.startTime).toLocaleString("ru-RU") : "",
            "Время окончания": fight.endTime ? new Date(fight.endTime).toLocaleString("ru-RU") : "",
            Комментарий: fight.result!.comment || "",
          }
        })

      const resultsSheet = XLSX.utils.json_to_sheet(resultsData)
      XLSX.utils.book_append_sheet(workbook, resultsSheet, "Результаты")

      // Лист статистики по клубам
      const clubStats = new Map<string, { participants: number; wins: number; fights: number }>()

      tournament.participants.forEach((participant) => {
        if (!clubStats.has(participant.club)) {
          clubStats.set(participant.club, { participants: 0, wins: 0, fights: 0 })
        }
        clubStats.get(participant.club)!.participants++
      })

      fights
        .filter((f) => f.status === "completed" && f.result)
        .forEach((fight) => {
          const winner = fight.result!.winner === "red" ? fight.participant1 : fight.participant2
          const loser = fight.result!.winner === "red" ? fight.participant2 : fight.participant1

          if (winner && clubStats.has(winner.club)) {
            clubStats.get(winner.club)!.wins++
          }
          if (winner && clubStats.has(winner.club)) {
            clubStats.get(winner.club)!.fights++
          }
          if (loser && clubStats.has(loser.club)) {
            clubStats.get(loser.club)!.fights++
          }
        })

      const clubStatsData = Array.from(clubStats.entries()).map(([club, stats], index) => ({
        "№": index + 1,
        Клуб: club,
        Участников: stats.participants,
        "Боёв проведено": stats.fights,
        Побед: stats.wins,
        "Процент побед": stats.fights > 0 ? Math.round((stats.wins / stats.fights) * 100) : 0,
      }))

      const clubStatsSheet = XLSX.utils.json_to_sheet(clubStatsData)
      XLSX.utils.book_append_sheet(workbook, clubStatsSheet, "Статистика клубов")

      XLSX.writeFile(workbook, `tournament_results_${tournament.name}_${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error) {
      console.error("Ошибка экспорта в Excel:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Генерация QR-кода для публичного доступа
  const generatePublicQR = () => {
    const publicUrl = `${window.location.origin}/public/${tournament.id}`
    if (onGenerateQR) {
      onGenerateQR(publicUrl)
    }

    // Копируем ссылку в буфер обмена
    navigator.clipboard.writeText(publicUrl).then(() => {
      alert(`Ссылка скопирована в буфер обмена: ${publicUrl}`)
    })
  }

  const reportTypes = [
    { id: "participants", name: "Протокол участников", action: generateParticipantsProtocol },
    { id: "judges", name: "Протокол судей", action: generateJudgesProtocol },
    { id: "results", name: "Результаты (Excel)", action: exportResultsToExcel },
    { id: "statistics", name: "Статистика турнира", action: exportResultsToExcel },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Генерация отчётов и документов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Быстрые отчёты */}
            <div className="space-y-3">
              <h3 className="font-medium">Быстрые отчёты</h3>
              {reportTypes.map((report) => (
                <Button
                  key={report.id}
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={report.action}
                  disabled={isGenerating}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {report.name}
                </Button>
              ))}
            </div>

            {/* Турнирные сетки */}
            <div className="space-y-3">
              <h3 className="font-medium">Турнирные сетки</h3>
              {tournament.categories.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  className="w-full justify-start text-left bg-transparent"
                  onClick={() => generateTournamentBracket(category.id)}
                  disabled={isGenerating}
                >
                  <Download className="h-4 w-4 mr-2" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{category.name}</div>
                    <div className="text-xs text-gray-500">
                      {category.systemType === "olympic" ? "Олимпийская" : "Круговая"} • {category.participants.length}{" "}
                      участников
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            {/* Дополнительные функции */}
            <div className="space-y-3">
              <h3 className="font-medium">Дополнительно</h3>

              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={generatePublicQR}>
                <QrCode className="h-4 w-4 mr-2" />
                QR-код для зрителей
              </Button>

              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Печать текущей страницы
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => {
                  const url = `${window.location.origin}/public/${tournament.id}`
                  window.open(url, "_blank")
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Открыть публичную страницу
              </Button>
            </div>
          </div>

          {/* Настройки отчётов */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Настройки отчётов</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="includePhotos" checked={includePhotos} onCheckedChange={setIncludePhotos} />
                  <label htmlFor="includePhotos" className="text-sm">
                    Включать фотографии
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="includeStatistics" checked={includeStatistics} onCheckedChange={setIncludeStatistics} />
                  <label htmlFor="includeStatistics" className="text-sm">
                    Включать статистику
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Фильтр по категориям:</label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Все категории" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      {tournament.categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика турнира */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика турнира</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{tournament.participants.length}</div>
              <div className="text-sm text-gray-600">Участников</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {fights.filter((f) => f.status === "completed").length}
              </div>
              <div className="text-sm text-gray-600">Завершено боёв</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{tournament.categories.length}</div>
              <div className="text-sm text-gray-600">Категорий</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(tournament.participants.map((p) => p.club)).size}
              </div>
              <div className="text-sm text-gray-600">Клубов</div>
            </div>
          </div>

          {/* Топ клубов */}
          <div className="mt-6">
            <h3 className="font-medium mb-3">Топ клубов по участникам</h3>
            <div className="space-y-2">
              {Array.from(
                tournament.participants.reduce((acc, participant) => {
                  acc.set(participant.club, (acc.get(participant.club) || 0) + 1)
                  return acc
                }, new Map<string, number>()),
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([club, count], index) => (
                  <div key={club} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{club}</span>
                    </div>
                    <Badge>{count} участников</Badge>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
