// Импортируем компонент стартовой страницы
import HomePage from "./home/page"

export default function RootPage() {
  return <HomePage />
}

// Экспортируем также основной компонент турнирной системы для использования в /management
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Trophy,
  Users,
  UserCheck,
  Shuffle,
  Monitor,
  FileText,
  Heart,
  Bell,
  Database,
  TrendingUp,
  Calendar,
} from "lucide-react"
import ParticipantRegistration from "../components/participant-registration"
import JudgeRegistration from "../components/judge-registration"
import TournamentDraw from "../components/tournament-draw"
import TatamiOperator from "../components/tatami-operator"
import SchedulePlanner from "../components/schedule-planner"
import type { Participant, Judge, Category, Fight, Tournament, FightResult } from "../types"
import ParticipantsList from "../components/participants-list"
import LiveDisplay from "../components/live-display"
import PublicViewer from "../components/public-viewer"
import ReportsGenerator from "../components/reports-generator"
import JudgesManagement from "../components/judges-management"
import MedicalPenalties from "../components/medical-penalties"
import NotificationsSystem from "../components/notifications-system"
import BackupSystem from "../components/backup-system"
import RatingSystem from "../components/rating-system"
import BracketsViewer from "../components/brackets-viewer"

export function TournamentSystem() {
  const [tournament, setTournament] = useState<Tournament>({
    id: crypto.randomUUID(),
    name: "Турнир по Киокушинкай каратэ",
    date: new Date().toISOString().split("T")[0],
    location: "Спортивный зал",
    categories: [],
    judges: [],
    participants: [],
    tatamisCount: 4,
    status: "registration",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const [fights, setFights] = useState<Fight[]>([])
  const [selectedTatami, setSelectedTatami] = useState(1)
  const [liveData, setLiveData] = useState<{ [tatami: number]: any }>({})
  const [medicalRecords, setMedicalRecords] = useState<any[]>([])
  const [participantStatuses, setParticipantStatuses] = useState<{
    [id: string]: "active" | "medical" | "disqualified"
  }>({})
  const [notifications, setNotifications] = useState<any[]>([])
  const [schedule, setSchedule] = useState<any[]>([])

  const handleAddParticipant = (participant: Participant) => {
    setTournament((prev) => ({
      ...prev,
      participants: [...prev.participants, participant],
      updatedAt: new Date().toISOString(),
    }))
  }

  const handleImportFromExcel = (file: File) => {
    // TODO: Implement Excel import logic
    console.log("Importing from Excel:", file.name)
  }

  const handleEditParticipant = (updatedParticipant: Participant) => {
    setTournament((prev) => ({
      ...prev,
      participants: prev.participants.map((p) => (p.id === updatedParticipant.id ? updatedParticipant : p)),
      updatedAt: new Date().toISOString(),
    }))
  }

  const handleDeleteParticipant = (participantId: string) => {
    setTournament((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.id !== participantId),
      updatedAt: new Date().toISOString(),
    }))
  }

  const handleAddJudge = (judge: Judge) => {
    setTournament((prev) => ({
      ...prev,
      judges: [...prev.judges, judge],
      updatedAt: new Date().toISOString(),
    }))
  }

  const handleEditJudge = (updatedJudge: Judge) => {
    setTournament((prev) => ({
      ...prev,
      judges: prev.judges.map((judge) => (judge.id === updatedJudge.id ? updatedJudge : judge)),
      updatedAt: new Date().toISOString(),
    }))
  }

  const handleDeleteJudge = (judgeId: string) => {
    setTournament((prev) => ({
      ...prev,
      judges: prev.judges.filter((judge) => judge.id !== judgeId),
      updatedAt: new Date().toISOString(),
    }))
  }

  const handleCategoriesCreated = (categories: Category[]) => {
    setTournament((prev) => ({
      ...prev,
      categories,
      status: "draw",
      updatedAt: new Date().toISOString(),
    }))
  }

  const handleFightsGenerated = (generatedFights: Fight[]) => {
    setFights(generatedFights)
    setTournament((prev) => ({
      ...prev,
      status: "in-progress",
      updatedAt: new Date().toISOString(),
    }))
  }

  const handleFightResult = (fightId: string, result: FightResult) => {
    setFights((prev) =>
      prev.map((fight) => (fight.id === fightId ? { ...fight, result, endTime: new Date().toISOString() } : fight)),
    )
  }

  const handleFightStatusChange = (fightId: string, status: Fight["status"]) => {
    setFights((prev) =>
      prev.map((fight) =>
        fight.id === fightId
          ? {
              ...fight,
              status,
              startTime: status === "in-progress" ? new Date().toISOString() : fight.startTime,
            }
          : fight,
      ),
    )
  }

  const handleLiveUpdate = (tatami: number, data: any) => {
    setLiveData((prev) => ({
      ...prev,
      [tatami]: data,
    }))
  }

  const handleMedicalRecord = (record: any) => {
    setMedicalRecords((prev) => [...prev, record])
  }

  const handleParticipantStatusChange = (participantId: string, status: "active" | "medical" | "disqualified") => {
    setParticipantStatuses((prev) => ({
      ...prev,
      [participantId]: status,
    }))
  }

  const handleAssignJudge = (fightId: string, judgeId: string, role: "main" | "side1" | "side2" | "reserve") => {
    // Логика назначения судьи
    console.log(`Assigned judge ${judgeId} as ${role} to fight ${fightId}`)
  }

  const handleSendNotification = (notification: any) => {
    setNotifications((prev) => [...prev, notification])
  }

  const handleRestoreData = (data: { tournament: Tournament; fights: Fight[] }) => {
    setTournament(data.tournament)
    setFights(data.fights)
  }

  const handleScheduleUpdate = (newSchedule: any[]) => {
    setSchedule(newSchedule)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2 flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-600" />
            Система управления турнирами по Киокушинкай каратэ
          </h1>
          <div className="text-center text-gray-600">
            <Badge variant="outline" className="mr-2">
              {tournament.name}
            </Badge>
            <Badge variant="outline" className="mr-2">
              {tournament.date}
            </Badge>
            <Badge variant="outline">
              Статус:{" "}
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

        <Tabs defaultValue="participants" className="w-full">
          <TabsList className="grid w-full grid-cols-13">
            <TabsTrigger value="participants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Участники
            </TabsTrigger>
            <TabsTrigger value="judges" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Судьи
            </TabsTrigger>
            <TabsTrigger value="draw" className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Жеребьёвка
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Расписание
            </TabsTrigger>
            <TabsTrigger value="brackets" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Сетки
            </TabsTrigger>
            <TabsTrigger value="tatami" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Татами
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Live
            </TabsTrigger>
            <TabsTrigger value="medical" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Медицина
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Результаты
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Отчёты
            </TabsTrigger>
            <TabsTrigger value="public" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Публичный просмотр
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Уведомления
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Бэкап
            </TabsTrigger>
            <TabsTrigger value="rating" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Рейтинги
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{tournament.participants.length}</div>
                    <div className="text-sm text-gray-600">Всего участников</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {tournament.participants.filter((p) => p.participatesInKata).length}
                    </div>
                    <div className="text-sm text-gray-600">Ката</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {tournament.participants.filter((p) => p.participatesInKumite).length}
                    </div>
                    <div className="text-sm text-gray-600">Кумитэ</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {tournament.participants.filter((p) => p.participatesInKataGroup).length}
                    </div>
                    <div className="text-sm text-gray-600">Ката-группы</div>
                  </CardContent>
                </Card>
              </div>

              <ParticipantRegistration
                onAddParticipant={handleAddParticipant}
                onImportFromExcel={handleImportFromExcel}
              />

              <ParticipantsList
                participants={tournament.participants}
                onEditParticipant={handleEditParticipant}
                onDeleteParticipant={handleDeleteParticipant}
              />
            </div>
          </TabsContent>

          <TabsContent value="judges" className="mt-6">
            <Tabs defaultValue="registration" className="w-full">
              <TabsList>
                <TabsTrigger value="registration">Регистрация</TabsTrigger>
                <TabsTrigger value="management">Управление</TabsTrigger>
              </TabsList>

              <TabsContent value="registration">
                <JudgeRegistration
                  judges={tournament.judges}
                  onAddJudge={handleAddJudge}
                  onEditJudge={handleEditJudge}
                  onDeleteJudge={handleDeleteJudge}
                />
              </TabsContent>

              <TabsContent value="management">
                <JudgesManagement tournament={tournament} fights={fights} onAssignJudge={handleAssignJudge} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="draw" className="mt-6">
            <TournamentDraw
              participants={tournament.participants}
              onCategoriesCreated={handleCategoriesCreated}
              onFightsGenerated={handleFightsGenerated}
            />
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <SchedulePlanner tournament={tournament} fights={fights} onScheduleUpdate={handleScheduleUpdate} />
          </TabsContent>

          <TabsContent value="brackets" className="mt-6">
            <BracketsViewer
              tournament={tournament}
              fights={fights}
              onFightClick={(fight) => {
                // Переключаемся на соответствующий татами
                setSelectedTatami(fight.tatami)
                // Можно добавить логику для автоматического перехода на вкладку татами
              }}
              onUpdateResult={handleFightResult}
            />
          </TabsContent>

          <TabsContent value="tatami" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Выбор татами</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {Array.from({ length: tournament.tatamisCount }, (_, i) => i + 1).map((tatami) => (
                      <button
                        key={tatami}
                        onClick={() => setSelectedTatami(tatami)}
                        className={`px-4 py-2 rounded-lg border ${
                          selectedTatami === tatami
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        Татами {tatami}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <TatamiOperator
                tatami={selectedTatami}
                fights={fights}
                onFightResult={handleFightResult}
                onFightStatusChange={handleFightStatusChange}
                onLiveUpdate={handleLiveUpdate}
              />
            </div>
          </TabsContent>

          <TabsContent value="live" className="mt-6">
            <LiveDisplay fights={fights} categories={tournament.categories} liveData={liveData} />
          </TabsContent>

          <TabsContent value="medical" className="mt-6">
            <MedicalPenalties
              participants={tournament.participants}
              fights={fights}
              onMedicalRecord={handleMedicalRecord}
              onParticipantStatusChange={handleParticipantStatusChange}
            />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Результаты турнира</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tournament.categories.map((category) => (
                    <div key={category.id} className="border rounded-lg p-4">
                      <h3 className="font-medium mb-3">{category.name}</h3>
                      <div className="space-y-2">
                        {fights
                          .filter((fight) => fight.categoryId === category.id && fight.status === "completed")
                          .map((fight) => (
                            <div key={fight.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-4">
                                <Badge variant="outline">#{fight.fightNumber}</Badge>
                                <span className="text-sm">
                                  {fight.participant1?.fullName} vs {fight.participant2?.fullName}
                                </span>
                              </div>
                              {fight.result && (
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={
                                      fight.result.winner === "red"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-blue-100 text-blue-800"
                                    }
                                  >
                                    {fight.result.winner === "red" ? "Красный" : "Синий"} - {fight.result.type}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportsGenerator
              tournament={tournament}
              fights={fights}
              onGenerateQR={(url) => console.log("QR generated:", url)}
            />
          </TabsContent>
          <TabsContent value="public" className="mt-6">
            <PublicViewer tournament={tournament} fights={fights} liveData={liveData} />
          </TabsContent>
          <TabsContent value="notifications" className="mt-6">
            <NotificationsSystem tournament={tournament} fights={fights} onSendNotification={handleSendNotification} />
          </TabsContent>

          <TabsContent value="backup" className="mt-6">
            <BackupSystem tournament={tournament} fights={fights} onRestore={handleRestoreData} />
          </TabsContent>

          <TabsContent value="rating" className="mt-6">
            <RatingSystem tournament={tournament} fights={fights} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
