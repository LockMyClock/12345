"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Shuffle, Users, Target, Settings, Merge } from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Participant, Category, Fight } from "../types"
import { 
  allTournamentCategories, 
  kumiteBeginnerCategories, 
  kumiteExperiencedCategories,
  kataBeginnerCategories,
  kataExperiencedCategories,
  veteranCategories,
  kataGroupCategories,
  type TournamentCategoryData
} from "../data/tournament-categories"

interface TournamentDrawProps {
  participants: Participant[]
  onCategoriesCreated: (categories: Category[]) => void
  onFightsGenerated: (fights: Fight[]) => void
}

// Компонент для перетаскиваемого участника
function SortableParticipant({
  participant,
  onAssignId,
}: { participant: Participant; onAssignId: (id: string, newId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: participant.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getClubColor = (club: string): string => {
    const colors = [
      "bg-red-100 text-red-800 border-red-300",
      "bg-blue-100 text-blue-800 border-blue-300",
      "bg-green-100 text-green-800 border-green-300",
      "bg-yellow-100 text-yellow-800 border-yellow-300",
      "bg-purple-100 text-purple-800 border-purple-300",
      "bg-pink-100 text-pink-800 border-pink-300",
      "bg-indigo-100 text-indigo-800 border-indigo-300",
      "bg-gray-100 text-gray-800 border-gray-300",
    ]
    const hash = club.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 rounded-lg border-2 cursor-move ${getClubColor(participant.club)} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm">{participant.fullName}</div>
          <div className="text-xs opacity-75">
            {participant.age}л, {participant.weight}кг, {participant.belt}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {participant.club}
          </Badge>
          <Input
            type="text"
            value={participant.id.slice(-4)}
            onChange={(e) => onAssignId(participant.id, e.target.value)}
            className="w-16 h-6 text-xs"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  )
}

export default function TournamentDraw({ participants, onCategoriesCreated, onFightsGenerated }: TournamentDrawProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedTatamis, setSelectedTatamis] = useState<{ [categoryId: string]: number }>({})
  const [tatamisCount, setTatamisCount] = useState(4)
  const [separateByClubs, setSeparateByClubs] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedCategoryTemplates, setSelectedCategoryTemplates] = useState<string[]>([])
  const [showCategoryTemplates, setShowCategoryTemplates] = useState(false)

  // Создание категорий из предустановленных шаблонов
  const createCategoriesFromTemplates = () => {
    const newCategories: Category[] = []
    
    // Фильтруем нужные категории
    let selectedTemplates: TournamentCategoryData[] = []
    
    if (selectedCategoryTemplates.includes('kumite-beginners')) {
      selectedTemplates = [...selectedTemplates, ...kumiteBeginnerCategories]
    }
    if (selectedCategoryTemplates.includes('kumite-experienced')) {
      selectedTemplates = [...selectedTemplates, ...kumiteExperiencedCategories]
    }
    if (selectedCategoryTemplates.includes('kata-beginners')) {
      selectedTemplates = [...selectedTemplates, ...kataBeginnerCategories]
    }
    if (selectedCategoryTemplates.includes('kata-experienced')) {
      selectedTemplates = [...selectedTemplates, ...kataExperiencedCategories]
    }
    if (selectedCategoryTemplates.includes('veterans')) {
      selectedTemplates = [...selectedTemplates, ...veteranCategories]
    }
    if (selectedCategoryTemplates.includes('kata-groups')) {
      selectedTemplates = [...selectedTemplates, ...kataGroupCategories]
    }

    // Если ничего не выбрано, используем автоматическое создание
    if (selectedTemplates.length === 0) {
      createCategories()
      return
    }

    // Создаем категории и автоматически назначаем участников
    selectedTemplates.forEach((template) => {
      const eligibleParticipants = participants.filter(participant => {
        // Проверяем соответствие по возрасту
        if (participant.age < template.ageMin || participant.age > template.ageMax) {
          return false
        }

        // Проверяем соответствие по полу
        if (template.gender !== 'mixed' && participant.gender !== template.gender) {
          return false
        }

        // Проверяем соответствие по дисциплине
        if (template.type === 'kata' && !participant.participatesInKata) {
          return false
        }
        if (template.type === 'kumite' && !participant.participatesInKumite) {
          return false
        }
        if (template.type === 'kata-group' && !participant.participatesInKataGroup) {
          return false
        }

        // Проверяем соответствие по уровню опыта
        if (template.experienceLevel === 'beginner' && participant.isExperienced) {
          return false
        }
        if (template.experienceLevel === 'experienced' && !participant.isExperienced) {
          return false
        }

        return true
      })

      // Если есть участники для этой категории, создаем её
      if (eligibleParticipants.length > 0) {
        // Для кумитэ дополнительно разбиваем по весовым категориям
        if (template.type === 'kumite' && template.weightCategories && template.weightCategories.length > 0) {
          template.weightCategories.forEach((weightRange, index) => {
            const weightParticipants = filterByWeightRange(eligibleParticipants, weightRange)
            
            if (weightParticipants.length > 0) {
              const category: Category = {
                id: crypto.randomUUID(),
                name: `${template.name} - ${weightRange}`,
                type: template.type,
                ageMin: template.ageMin,
                ageMax: template.ageMax,
                gender: template.gender,
                experienceLevel: template.experienceLevel,
                participants: separateByClubs ? separateByClub(weightParticipants) : weightParticipants,
                systemType: weightParticipants.length === 3 ? "round-robin" : "olympic",
              }
              newCategories.push(category)
            }
          })
        } else {
          // Для ката и ката-групп создаем обычные категории
          const category: Category = {
            id: crypto.randomUUID(),
            name: template.name,
            type: template.type,
            ageMin: template.ageMin,
            ageMax: template.ageMax,
            gender: template.gender,
            experienceLevel: template.experienceLevel,
            participants: separateByClubs ? separateByClub(eligibleParticipants) : eligibleParticipants,
            systemType: template.type === "kata-group" || eligibleParticipants.length === 3 ? "round-robin" : "olympic",
          }
          newCategories.push(category)
        }
      }
    })

    setCategories(newCategories)
    onCategoriesCreated(newCategories)
  }

  // Фильтрация участников по весовой категории
  const filterByWeightRange = (participants: Participant[], weightRange: string): Participant[] => {
    const [min, max] = parseWeightRange(weightRange)
    return participants.filter(p => p.weight >= min && (max === -1 || p.weight <= max))
  }

  // Парсинг весовой категории
  const parseWeightRange = (range: string): [number, number] => {
    if (range.startsWith('До ')) {
      const weight = parseFloat(range.replace('До ', '').replace(' кг', ''))
      return [0, weight]
    } else if (range.startsWith('Св. ')) {
      const weight = parseFloat(range.replace('Св. ', '').replace(' кг', ''))
      return [weight + 0.1, -1] // -1 означает без верхнего ограничения
    }
    return [0, -1]
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Автоматическое создание категорий с разведением по клубам
  const createCategories = () => {
    const newCategories: Category[] = []

    // Группировка участников по дисциплинам, полу, возрасту и уровню
    const groups = {
      kata: { beginners: { male: [], female: [] }, experienced: { male: [], female: [] } },
      kumite: { beginners: { male: [], female: [] }, experienced: { male: [], female: [] } },
      kataGroup: { beginners: { male: [], female: [] }, experienced: { male: [], female: [] } },
    }

    participants.forEach((participant) => {
      const experienceLevel = participant.isExperienced ? "experienced" : "beginners"
      const gender = participant.gender === "М" ? "male" : "female"

      if (participant.participatesInKata) {
        groups.kata[experienceLevel][gender].push(participant)
      }
      if (participant.participatesInKumite) {
        groups.kumite[experienceLevel][gender].push(participant)
      }
      if (participant.participatesInKataGroup) {
        groups.kataGroup[experienceLevel][gender].push(participant)
      }
    })

    // Создание категорий для каждой группы
    Object.entries(groups).forEach(([discipline, levels]) => {
      Object.entries(levels).forEach(([level, genders]) => {
        Object.entries(genders).forEach(([gender, participantsList]) => {
          if (participantsList.length > 0) {
            // Группировка по возрастным категориям
            const ageGroups = groupByAge(participantsList as Participant[])

            ageGroups.forEach((ageGroup, index) => {
              if (discipline === "kumite") {
                // Для кумитэ дополнительно группируем по весу
                const weightGroups = groupByWeight(ageGroup, gender as "male" | "female")

                weightGroups.forEach((weightGroup, weightIndex) => {
                  // Разведение по клубам если включено
                  const finalParticipants = separateByClubs ? separateByClub(weightGroup) : weightGroup

                  const category: Category = {
                    id: crypto.randomUUID(),
                    name: `${discipline === "kata" ? "Ката" : discipline === "kumite" ? "Кумитэ" : "Ката-группы"} - ${level === "beginners" ? "Новички" : "Опытные"} - ${gender === "male" ? "Мужчины" : "Женщины"} - ${getAgeGroupName(ageGroup)} - ${getWeightGroupName(weightGroup)}`,
                    type: discipline as "kata" | "kumite" | "kata-group",
                    ageMin: Math.min(...weightGroup.map((p) => p.age)),
                    ageMax: Math.max(...weightGroup.map((p) => p.age)),
                    weightMin: Math.min(...weightGroup.map((p) => p.weight)),
                    weightMax: Math.max(...weightGroup.map((p) => p.weight)),
                    gender: gender === "male" ? "М" : "Ж",
                    experienceLevel: level as "beginner" | "experienced",
                    participants: finalParticipants,
                    systemType: finalParticipants.length === 3 ? "round-robin" : "olympic",
                  }
                  newCategories.push(category)
                })
              } else {
                // Разведение по клубам если включено
                const finalParticipants = separateByClubs ? separateByClub(ageGroup) : ageGroup

                const category: Category = {
                  id: crypto.randomUUID(),
                  name: `${discipline === "kata" ? "Ката" : discipline === "kumite" ? "Кумитэ" : "Ката-группы"} - ${level === "beginners" ? "Новички" : "Опытные"} - ${gender === "male" ? "Мужчины" : "Женщины"} - ${getAgeGroupName(ageGroup)}`,
                  type: discipline as "kata" | "kumite" | "kata-group",
                  ageMin: Math.min(...ageGroup.map((p) => p.age)),
                  ageMax: Math.max(...ageGroup.map((p) => p.age)),
                  gender: gender === "male" ? "М" : "Ж",
                  experienceLevel: level as "beginner" | "experienced",
                  participants: finalParticipants,
                  systemType: discipline === "kata-group" || finalParticipants.length === 3 ? "round-robin" : "olympic",
                }
                newCategories.push(category)
              }
            })
          }
        })
      })
    })

    setCategories(newCategories)
    onCategoriesCreated(newCategories)
  }

  // Разведение участников по клубам (избегаем встреч одноклубников в первых раундах)
  const separateByClub = (participants: Participant[]): Participant[] => {
    const clubGroups: { [club: string]: Participant[] } = {}

    // Группируем по клубам
    participants.forEach((participant) => {
      if (!clubGroups[participant.club]) {
        clubGroups[participant.club] = []
      }
      clubGroups[participant.club].push(participant)
    })

    const clubs = Object.keys(clubGroups)
    const result: Participant[] = []

    // Распределяем участников так, чтобы одноклубники встречались как можно позже
    const maxLength = Math.max(...Object.values(clubGroups).map((group) => group.length))

    for (let i = 0; i < maxLength; i++) {
      clubs.forEach((club) => {
        if (clubGroups[club][i]) {
          result.push(clubGroups[club][i])
        }
      })
    }

    return result
  }

  // Группировка по возрасту
  const groupByAge = (participants: Participant[]): Participant[][] => {
    const ageGroups: { [key: string]: Participant[] } = {}

    participants.forEach((participant) => {
      let ageGroup = ""
      if (participant.age <= 10) ageGroup = "6-10"
      else if (participant.age <= 12) ageGroup = "11-12"
      else if (participant.age <= 14) ageGroup = "13-14"
      else if (participant.age <= 16) ageGroup = "15-16"
      else if (participant.age <= 18) ageGroup = "17-18"
      else ageGroup = "19+"

      if (!ageGroups[ageGroup]) ageGroups[ageGroup] = []
      ageGroups[ageGroup].push(participant)
    })

    return Object.values(ageGroups)
  }

  // Группировка по весу для кумитэ
  const groupByWeight = (participants: Participant[], gender: "male" | "female"): Participant[][] => {
    const sorted = [...participants].sort((a, b) => a.weight - b.weight)
    const groups: Participant[][] = []

    // Простая группировка по весовым категориям
    let currentGroup: Participant[] = []
    let lastWeight = 0

    sorted.forEach((participant) => {
      if (currentGroup.length === 0 || participant.weight - lastWeight <= 5) {
        currentGroup.push(participant)
        lastWeight = participant.weight
      } else {
        if (currentGroup.length > 0) groups.push(currentGroup)
        currentGroup = [participant]
        lastWeight = participant.weight
      }
    })

    if (currentGroup.length > 0) groups.push(currentGroup)

    return groups
  }

  const getAgeGroupName = (participants: Participant[]): string => {
    const minAge = Math.min(...participants.map((p) => p.age))
    const maxAge = Math.max(...participants.map((p) => p.age))
    return `${minAge}-${maxAge} лет`
  }

  const getWeightGroupName = (participants: Participant[]): string => {
    const minWeight = Math.min(...participants.map((p) => p.weight))
    const maxWeight = Math.max(...participants.map((p) => p.weight))
    return `${minWeight}-${maxWeight} кг`
  }

  // Обработка перетаскивания участников между категориями
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event

      if (!over) return

      const activeId = active.id
      const overId = over.id

      // Найти категории участников
      const activeCategory = categories.find((cat) => cat.participants.some((p) => p.id === activeId))
      const overCategory =
        categories.find((cat) => cat.participants.some((p) => p.id === overId)) ||
        categories.find((cat) => cat.id === overId)

      if (!activeCategory || !overCategory) return

      if (activeCategory.id === overCategory.id) {
        // Перемещение внутри категории
        const oldIndex = activeCategory.participants.findIndex((p) => p.id === activeId)
        const newIndex = activeCategory.participants.findIndex((p) => p.id === overId)

        if (oldIndex !== newIndex) {
          const newParticipants = arrayMove(activeCategory.participants, oldIndex, newIndex)

          setCategories((prev) =>
            prev.map((cat) => (cat.id === activeCategory.id ? { ...cat, participants: newParticipants } : cat)),
          )
        }
      } else {
        // Перемещение между категориями
        const participant = activeCategory.participants.find((p) => p.id === activeId)
        if (!participant) return

        setCategories((prev) =>
          prev.map((cat) => {
            if (cat.id === activeCategory.id) {
              return { ...cat, participants: cat.participants.filter((p) => p.id !== activeId) }
            }
            if (cat.id === overCategory.id) {
              return { ...cat, participants: [...cat.participants, participant] }
            }
            return cat
          }),
        )
      }
    },
    [categories],
  )

  // Объединение категорий
  const mergeCategories = () => {
    if (selectedCategories.length < 2) return

    const categoriesToMerge = categories.filter((cat) => selectedCategories.includes(cat.id))
    const remainingCategories = categories.filter((cat) => !selectedCategories.includes(cat.id))

    const mergedParticipants = categoriesToMerge.flatMap((cat) => cat.participants)
    const mergedCategory: Category = {
      id: crypto.randomUUID(),
      name: `Объединенная категория: ${categoriesToMerge.map((cat) => cat.name).join(" + ")}`,
      type: categoriesToMerge[0].type,
      ageMin: Math.min(...categoriesToMerge.map((cat) => cat.ageMin)),
      ageMax: Math.max(...categoriesToMerge.map((cat) => cat.ageMax)),
      weightMin: Math.min(...categoriesToMerge.map((cat) => cat.weightMin || 0)),
      weightMax: Math.max(...categoriesToMerge.map((cat) => cat.weightMax || 200)),
      gender: categoriesToMerge[0].gender,
      experienceLevel: categoriesToMerge[0].experienceLevel,
      participants: mergedParticipants,
      systemType: mergedParticipants.length === 3 ? "round-robin" : "olympic",
    }

    setCategories([...remainingCategories, mergedCategory])
    setSelectedCategories([])
  }

  // Генерация поединков с улучшенной логикой
  const generateFights = () => {
    const allFights: Fight[] = []
    let fightNumber = 1

    // Сначала ката, потом ката-группы, потом кумитэ
    const sortedCategories = [...categories].sort((a, b) => {
      const order = { kata: 1, "kata-group": 2, kumite: 3 }
      return order[a.type] - order[b.type]
    })

    sortedCategories.forEach((category) => {
      const tatami = selectedTatamis[category.id] || 1

      if (category.systemType === "round-robin") {
        // Круговая система
        const fights = generateRoundRobinFights(category, tatami, fightNumber)
        allFights.push(...fights)
        fightNumber += fights.length
      } else {
        // Олимпийская система
        const fights = generateOlympicFights(category, tatami, fightNumber)
        allFights.push(...fights)
        fightNumber += fights.length
      }
    })

    onFightsGenerated(allFights)
  }

  const generateRoundRobinFights = (category: Category, tatami: number, startNumber: number): Fight[] => {
    const fights: Fight[] = []
    const participants = [...category.participants]

    // Каждый с каждым с интервалом минимум 7-10 боёв
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        fights.push({
          id: crypto.randomUUID(),
          categoryId: category.id,
          round: "round-robin",
          fightNumber: startNumber + fights.length,
          participant1: participants[i],
          participant2: participants[j],
          tatami,
          status: "pending",
        })
      }
    }

    // Распределяем бои с интервалами для одних и тех же участников
    return distributeRoundRobinFights(fights)
  }

  const distributeRoundRobinFights = (fights: Fight[]): Fight[] => {
    // Простая логика распределения - можно улучшить
    return fights.map((fight, index) => ({
      ...fight,
      fightNumber: fight.fightNumber + Math.floor(index / 3) * 7, // Интервал 7 боёв
    }))
  }

  const generateOlympicFights = (category: Category, tatami: number, startNumber: number): Fight[] => {
    const fights: Fight[] = []
    const participants = shuffleArray([...category.participants])

    // Определяем количество раундов
    let currentRoundParticipants = participants
    let fightNum = startNumber

    // Генерируем поединки по раундам
    while (currentRoundParticipants.length > 1) {
      const roundFights: Fight[] = []
      const nextRoundParticipants: Participant[] = []

      for (let i = 0; i < currentRoundParticipants.length; i += 2) {
        if (i + 1 < currentRoundParticipants.length) {
          const fight: Fight = {
            id: crypto.randomUUID(),
            categoryId: category.id,
            round: getRoundName(currentRoundParticipants.length),
            fightNumber: fightNum++,
            participant1: currentRoundParticipants[i],
            participant2: currentRoundParticipants[i + 1],
            tatami,
            status: "pending",
          }
          roundFights.push(fight)
        } else {
          // Нечетное количество - проходит без боя
          nextRoundParticipants.push(currentRoundParticipants[i])
        }
      }

      fights.push(...roundFights)
      currentRoundParticipants = nextRoundParticipants

      if (currentRoundParticipants.length <= 1) break
    }

    return fights
  }

  const getRoundName = (participantCount: number): string => {
    if (participantCount >= 32) return "1/16"
    if (participantCount >= 16) return "1/8"
    if (participantCount >= 8) return "1/4"
    if (participantCount >= 4) return "1/2"
    if (participantCount === 3) return "3rd-place"
    return "final"
  }

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const assignTatami = (categoryId: string, tatami: number) => {
    setSelectedTatamis((prev) => ({
      ...prev,
      [categoryId]: tatami,
    }))
  }

  const handleAssignId = (participantId: string, newId: string) => {
    // Обновляем ID участника (можно реализовать логику изменения ID)
    console.log(`Assign new ID ${newId} to participant ${participantId}`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="h-6 w-6" />
            Жеребьёвка турнира
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label>Количество татами:</label>
              <Select
                value={tatamisCount.toString()}
                onValueChange={(value) => setTatamisCount(Number.parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="separateClubs"
                checked={separateByClubs}
                onChange={(e) => setSeparateByClubs(e.target.checked)}
              />
              <label htmlFor="separateClubs">Разводить по клубам</label>
            </div>

            <Button onClick={() => setShowAdvanced(!showAdvanced)} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              {showAdvanced ? "Скрыть" : "Показать"} настройки
            </Button>

            <Button onClick={() => setShowCategoryTemplates(!showCategoryTemplates)} variant="outline">
              <Target className="h-4 w-4 mr-2" />
              {showCategoryTemplates ? "Скрыть" : "Показать"} шаблоны категорий
            </Button>

            <Button onClick={createCategories} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Автоматические категории
            </Button>

            <Button onClick={createCategoriesFromTemplates}>
              <Users className="h-4 w-4 mr-2" />
              Создать из шаблонов
            </Button>

            {categories.length > 0 && (
              <>
                <Button onClick={generateFights}>
                  <Target className="h-4 w-4 mr-2" />
                  Сгенерировать поединки
                </Button>

                {selectedCategories.length > 1 && (
                  <Button onClick={mergeCategories} variant="outline">
                    <Merge className="h-4 w-4 mr-2" />
                    Объединить категории ({selectedCategories.length})
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="grid gap-4">
            <div className="text-sm text-gray-600">
              Всего участников: {participants.length} | Ката: {participants.filter((p) => p.participatesInKata).length}{" "}
              | Кумитэ: {participants.filter((p) => p.participatesInKumite).length} | Ката-группы:{" "}
              {participants.filter((p) => p.participatesInKataGroup).length}
            </div>
          </div>
        </CardContent>
      </Card>

      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Категории ({categories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, category.id])
                            } else {
                              setSelectedCategories(selectedCategories.filter((id) => id !== category.id))
                            }
                          }}
                        />
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">
                              {category.type === "kata"
                                ? "Ката"
                                : category.type === "kumite"
                                  ? "Кумитэ"
                                  : "Ката-группы"}
                            </Badge>
                            <Badge variant="outline">
                              {category.systemType === "olympic" ? "Олимпийская" : "Круговая"}
                            </Badge>
                            <Badge variant="outline">{category.participants.length} участников</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Татами:</label>
                        <Select
                          value={selectedTatamis[category.id]?.toString() || "1"}
                          onValueChange={(value) => assignTatami(category.id, Number.parseInt(value))}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: tatamisCount }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <SortableContext
                      items={category.participants.map((p) => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {category.participants.map((participant) => (
                          <SortableParticipant
                            key={participant.id}
                            participant={participant}
                            onAssignId={handleAssignId}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                ))}
              </div>
            </DndContext>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
