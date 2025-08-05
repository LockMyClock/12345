export interface Participant {
  id: string
  lastName: string
  firstName: string
  middleName: string
  fullName: string
  gender: "М" | "Ж"
  birthDate: string
  age: number
  weight: number
  rank: string // разряд
  belt: string // пояс (кю/дан)
  beltLevel: number // числовое значение пояса для сортировки
  isExperienced: boolean // опытный (8 кю и ниже) или новичок (10-9 кю)

  // Участие в дисциплинах
  participatesInKata: boolean
  participatesInKumite: boolean
  participatesInKataGroup: boolean
  kataGroupNumber?: number

  // Дополнительная информация
  trainer: string
  club: string
  country: string
  city: string
  territory: string
  organization: string

  // Категория
  categoryId?: string

  createdAt: string
  updatedAt: string
}

export interface Judge {
  id: string
  lastName: string
  firstName: string
  middleName: string
  fullName: string
  birthDate: string
  degree: string // степень
  belt: string
  club: string
  tournamentId?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  type: "kata" | "kumite" | "kata-group"
  ageMin: number
  ageMax: number
  weightMin?: number
  weightMax?: number
  gender: "М" | "Ж" | "mixed"
  experienceLevel: "beginner" | "experienced" | "mixed"
  participants: Participant[]
  tatami?: number
  systemType: "olympic" | "round-robin" // олимпийская или круговая
}

export interface Fight {
  id: string
  categoryId: string
  round: string // "1/16", "1/8", "1/4", "1/2", "3rd-place", "final"
  fightNumber: number
  participant1?: Participant
  participant2?: Participant
  winner?: Participant
  result?: FightResult
  tatami: number
  status: "pending" | "in-progress" | "completed"
  startTime?: string
  endTime?: string
  duration?: number
}

export interface FightResult {
  type: "ippon" | "wazari" | "hantei" | "technique" | "disqualification"
  winner: "red" | "blue"
  comment?: string
  judgeSignature?: string
}

export interface Tournament {
  id: string
  name: string
  date: string
  location: string
  categories: Category[]
  judges: Judge[]
  participants: Participant[]
  tatamisCount: number
  status: "registration" | "draw" | "in-progress" | "completed"
  createdAt: string
  updatedAt: string
}

export interface TatamiOperator {
  id: string
  name: string
  tatami: number
  currentFight?: Fight
  upcomingFights: Fight[]
}
