export interface Participant {
  id: string
  lastName: string
  firstName: string
  middleName: string
  fullName: string
  age: number
  gender: "М" | "Ж"
  birthDate: string
  weight: number
  belt: string
  level: string
  rank: string
  danKyu: string
  disciplines: string[]
  club: string
  purchase: string
  kata: string
  cardGroupNumber: string
  favorite: string
  trainer: string
  organization: string
  countryCode: string
  territory: string
  city: string
  createdAt: string
  updatedAt: string
}
