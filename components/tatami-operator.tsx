"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, Square, Clock, Users, Volume2, VolumeX, Mic, Eye } from "lucide-react"
import type { Fight, FightResult } from "../types"

interface TatamiOperatorProps {
  tatami: number
  fights: Fight[]
  onFightResult: (fightId: string, result: FightResult) => void
  onFightStatusChange: (fightId: string, status: Fight["status"]) => void
  onLiveUpdate?: (tatami: number, data: any) => void
}

export default function TatamiOperatorComponent({
  tatami,
  fights,
  onFightResult,
  onFightStatusChange,
  onLiveUpdate,
}: TatamiOperatorProps) {
  const [currentFight, setCurrentFight] = useState<Fight | null>(null)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [result, setResult] = useState<Partial<FightResult>>({})
  const [comment, setComment] = useState("")
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [selectedVoice, setSelectedVoice] = useState<string>("")
  const [judgeMode, setJudgeMode] = useState(false)
  const [liveDisplayEnabled, setLiveDisplayEnabled] = useState(true)

  const speechSynthesis = useRef<SpeechSynthesis | null>(null)
  const voices = useRef<SpeechSynthesisVoice[]>([])

  // Мемоизация массивов для предотвращения лишних ререндеров
  const tatamieFightsMemo = useMemo(() => fights.filter((fight) => fight.tatami === tatami), [fights, tatami])

  const upcomingFightsMemo = useMemo(
    () => tatamieFightsMemo.filter((fight) => fight.status === "pending").slice(0, 6),
    [tatamieFightsMemo],
  )

  const currentFightDataMemo = useMemo(
    () => tatamieFightsMemo.find((fight) => fight.status === "in-progress"),
    [tatamieFightsMemo],
  )

  // Инициализация синтеза речи
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.current = window.speechSynthesis

      const loadVoices = () => {
        voices.current = speechSynthesis.current?.getVoices() || []
        // Выбираем русский голос по умолчанию только если голос еще не выбран
        if (!selectedVoice) {
          const russianVoice = voices.current.find((voice) => voice.lang.includes("ru"))
          if (russianVoice) {
            setSelectedVoice(russianVoice.name)
          }
        }
      }

      loadVoices()
      speechSynthesis.current?.addEventListener("voiceschanged", loadVoices)

      return () => {
        speechSynthesis.current?.removeEventListener("voiceschanged", loadVoices)
      }
    }
  }, []) // Убираем selectedVoice из зависимостей

  // Фильтруем поединки для данного татами
  // const tatamieFights = fights.filter((fight) => fight.tatami === tatami)
  // const upcomingFights = tatamieFights.filter((fight) => fight.status === "pending").slice(0, 6)
  // const currentFightData = tatamieFights.find((fight) => fight.status === "in-progress")

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  // Live обновления
  useEffect(() => {
    if (liveDisplayEnabled && onLiveUpdate) {
      const liveData = {
        currentFight,
        upcomingFights: upcomingFightsMemo.slice(0, 3),
        timer,
        isTimerRunning,
        completedFights: tatamieFightsMemo.filter((f) => f.status === "completed").length,
        totalFights: tatamieFightsMemo.length,
      }
      onLiveUpdate(tatami, liveData)
    }
  }, [currentFight, timer, isTimerRunning, liveDisplayEnabled, tatami]) // Убираем массивы из зависимостей

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Функция озвучки
  const speak = (text: string) => {
    if (!voiceEnabled || !speechSynthesis.current) return

    // Останавливаем предыдущую озвучку
    speechSynthesis.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8

    // Выбираем голос
    if (selectedVoice) {
      const voice = voices.current.find((v) => v.name === selectedVoice)
      if (voice) {
        utterance.voice = voice
      }
    }

    speechSynthesis.current.speak(utterance)
  }

  const startFight = (fight: Fight) => {
    setCurrentFight(fight)
    onFightStatusChange(fight.id, "in-progress")
    setTimer(0)
    setResult({})
    setComment("")

    // Озвучиваем начало поединка
    const announcement = `Татами ${tatami}. Поединок номер ${fight.fightNumber}. ${fight.participant1?.fullName} против ${fight.participant2?.fullName}. Приготовиться к бою.`
    speak(announcement)
  }

  const startTimer = () => {
    setIsTimerRunning(true)
    speak("Хаджиме!")
  }

  const pauseTimer = () => {
    setIsTimerRunning(false)
    speak("Ямэ!")
  }

  const stopTimer = () => {
    setIsTimerRunning(false)
    setTimer(0)
    speak("Стоп!")
  }

  const recordResult = (winner: "red" | "blue", type: FightResult["type"]) => {
    if (!currentFight) return

    const fightResult: FightResult = {
      type,
      winner,
      comment,
      judgeSignature: `Татами ${tatami} - ${new Date().toLocaleString()}`,
    }

    setResult(fightResult)
    onFightResult(currentFight.id, fightResult)
    onFightStatusChange(currentFight.id, "completed")

    // Озвучиваем результат
    const winnerName = winner === "red" ? currentFight.participant1?.fullName : currentFight.participant2?.fullName
    const resultText = getResultText(type)
    const announcement = `Победитель: ${winnerName}. ${resultText}. Аригато гозаимашита!`
    speak(announcement)

    // Сброс состояния
    setCurrentFight(null)
    setIsTimerRunning(false)
    setTimer(0)
    setComment("")
  }

  const getResultText = (type: FightResult["type"]): string => {
    switch (type) {
      case "ippon":
        return "Иппон"
      case "wazari":
        return "Вазари"
      case "hantei":
        return "Решение судей"
      case "technique":
        return "Техническая победа"
      case "disqualification":
        return "Дисквалификация"
      default:
        return "Победа"
    }
  }

  const getParticipantColor = (isRed: boolean) => {
    return isRed ? "bg-red-100 text-red-800 border-red-300" : "bg-blue-100 text-blue-800 border-blue-300"
  }

  const announceNextFight = () => {
    if (upcomingFightsMemo.length > 0) {
      const nextFight = upcomingFightsMemo[0]
      const announcement = `Следующий поединок на татами ${tatami}. Номер ${nextFight.fightNumber}. ${nextFight.participant1?.fullName} против ${nextFight.participant2?.fullName}. Участники, подготовьтесь.`
      speak(announcement)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Татами {tatami} - Операторский интерфейс
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setJudgeMode(!judgeMode)}
                className={judgeMode ? "bg-blue-100" : ""}
              >
                <Mic className="h-4 w-4 mr-2" />
                {judgeMode ? "Режим судьи" : "Режим оператора"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLiveDisplayEnabled(!liveDisplayEnabled)}
                className={liveDisplayEnabled ? "bg-green-100" : ""}
              >
                <Eye className="h-4 w-4 mr-2" />
                Live
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Настройки озвучки */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Настройки озвучки</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={voiceEnabled ? "bg-green-100" : "bg-red-100"}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                {voiceEnabled ? "Включено" : "Выключено"}
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm">Голос:</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Выберите голос" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.current.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={announceNextFight}>
                Объявить следующий бой
              </Button>
              <Button variant="outline" size="sm" onClick={() => speak("Проверка звука. Татами готов к работе.")}>
                Тест звука
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Текущий поединок */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Текущий поединок</h3>

              {currentFight ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      Поединок #{currentFight.fightNumber} - {currentFight.round}
                    </Badge>
                    <div className="text-4xl font-bold mb-4 font-mono">{formatTime(timer)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border-2 ${getParticipantColor(true)}`}>
                      <div className="text-center">
                        <div className="font-bold text-lg">КРАСНЫЙ</div>
                        <div className="text-sm mt-1">{currentFight.participant1?.fullName}</div>
                        <div className="text-xs text-gray-600">{currentFight.participant1?.club}</div>
                        <div className="text-xs mt-1">
                          {currentFight.participant1?.age}л, {currentFight.participant1?.weight}кг,{" "}
                          {currentFight.participant1?.belt}
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border-2 ${getParticipantColor(false)}`}>
                      <div className="text-center">
                        <div className="font-bold text-lg">СИНИЙ</div>
                        <div className="text-sm mt-1">{currentFight.participant2?.fullName}</div>
                        <div className="text-xs text-gray-600">{currentFight.participant2?.club}</div>
                        <div className="text-xs mt-1">
                          {currentFight.participant2?.age}л, {currentFight.participant2?.weight}кг,{" "}
                          {currentFight.participant2?.belt}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Управление таймером */}
                  <div className="flex justify-center gap-2">
                    <Button onClick={startTimer} disabled={isTimerRunning} className="bg-green-600 hover:bg-green-700">
                      <Play className="h-4 w-4 mr-2" />
                      Хаджиме
                    </Button>
                    <Button
                      onClick={pauseTimer}
                      disabled={!isTimerRunning}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Ямэ
                    </Button>
                    <Button onClick={stopTimer} className="bg-red-600 hover:bg-red-700">
                      <Square className="h-4 w-4 mr-2" />
                      Стоп
                    </Button>
                  </div>

                  {/* Кнопки результата */}
                  <div className="space-y-3">
                    <div className="text-center font-medium">Результат поединка:</div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-center font-medium text-red-600">КРАСНЫЙ</div>
                        <Button
                          className="w-full bg-red-600 hover:bg-red-700"
                          onClick={() => recordResult("red", "ippon")}
                        >
                          Иппон
                        </Button>
                        <Button
                          className="w-full bg-red-500 hover:bg-red-600"
                          onClick={() => recordResult("red", "wazari")}
                        >
                          Вазари
                        </Button>
                        <Button
                          className="w-full bg-red-400 hover:bg-red-500"
                          onClick={() => recordResult("red", "hantei")}
                        >
                          Хантей
                        </Button>
                        <Button
                          className="w-full bg-red-300 hover:bg-red-400"
                          onClick={() => recordResult("red", "technique")}
                        >
                          Техника
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="text-center font-medium text-blue-600">СИНИЙ</div>
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => recordResult("blue", "ippon")}
                        >
                          Иппон
                        </Button>
                        <Button
                          className="w-full bg-blue-500 hover:bg-blue-600"
                          onClick={() => recordResult("blue", "wazari")}
                        >
                          Вазари
                        </Button>
                        <Button
                          className="w-full bg-blue-400 hover:bg-blue-500"
                          onClick={() => recordResult("blue", "hantei")}
                        >
                          Хантей
                        </Button>
                        <Button
                          className="w-full bg-blue-300 hover:bg-blue-400"
                          onClick={() => recordResult("blue", "technique")}
                        >
                          Техника
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Комментарий */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Комментарий к поединку:</label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Дополнительные замечания..."
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Выберите поединок из списка ожидающих</p>
                </div>
              )}
            </div>

            {/* Очередь поединков */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Очередь поединков</h3>
                <Badge variant="outline">{upcomingFightsMemo.length} ожидает</Badge>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {upcomingFightsMemo.length > 0 ? (
                  upcomingFightsMemo.map((fight, index) => (
                    <div
                      key={fight.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        index === 0 ? "border-green-300 bg-green-50" : "border-gray-200"
                      }`}
                      onClick={() => startFight(fight)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="outline">
                          #{fight.fightNumber} - {fight.round}
                        </Badge>
                        {index === 0 && <Badge className="bg-green-100 text-green-800">Следующий</Badge>}
                        {index === 1 && <Badge className="bg-yellow-100 text-yellow-800">На подготовке</Badge>}
                      </div>

                      <div className="text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-red-600 font-medium">{fight.participant1?.fullName || "TBD"}</span>
                          <span className="text-gray-400 mx-2">vs</span>
                          <span className="text-blue-600 font-medium">{fight.participant2?.fullName || "TBD"}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-xs mt-1">
                          <span>{fight.participant1?.club}</span>
                          <span>{fight.participant2?.club}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Нет ожидающих поединков</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика татами */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Статистика татами {tatami}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600">
                {tatamieFightsMemo.filter((f) => f.status === "completed").length}
              </div>
              <div className="text-sm text-gray-600">Завершено</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {tatamieFightsMemo.filter((f) => f.status === "in-progress").length}
              </div>
              <div className="text-sm text-gray-600">В процессе</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">
                {tatamieFightsMemo.filter((f) => f.status === "pending").length}
              </div>
              <div className="text-sm text-gray-600">Ожидает</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">{tatamieFightsMemo.length}</div>
              <div className="text-sm text-gray-600">Всего боёв</div>
            </div>
          </div>

          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${tatamieFightsMemo.length > 0 ? (tatamieFightsMemo.filter((f) => f.status === "completed").length / tatamieFightsMemo.length) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="text-center text-sm text-gray-600 mt-2">
            Прогресс:{" "}
            {tatamieFightsMemo.length > 0
              ? Math.round(
                  (tatamieFightsMemo.filter((f) => f.status === "completed").length / tatamieFightsMemo.length) * 100,
                )
              : 0}
            %
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
