// Предустановленные категории на основе скриншотов пользователя
export interface TournamentCategoryData {
  name: string
  type: "kata" | "kumite" | "kata-group"
  ageMin: number
  ageMax: number
  weightCategories?: string[]
  gender: "М" | "Ж" | "mixed"
  experienceLevel: "beginner" | "experienced" | "mixed"
  kataList?: string[]
}

// Категории КУМИТЭ - Начинающие
export const kumiteBeginnerCategories: TournamentCategoryData[] = [
  // Мальчики 6-7 лет
  {
    name: "Мальчики 6-7 лет",
    type: "kumite",
    ageMin: 6,
    ageMax: 7,
    weightCategories: ["До 20 кг", "До 25 кг", "До 30 кг", "До 35 кг", "Св. 35 кг"],
    gender: "М",
    experienceLevel: "beginner"
  },
  // Девочки 6-7 лет  
  {
    name: "Девочки 6-7 лет",
    type: "kumite",
    ageMin: 6,
    ageMax: 7,
    weightCategories: ["До 20 кг", "До 25 кг", "До 30 кг", "До 35 кг", "Св. 35 кг"],
    gender: "Ж",
    experienceLevel: "beginner"
  },
  // Мальчики 8-9 лет
  {
    name: "Мальчики 8-9 лет",
    type: "kumite",
    ageMin: 8,
    ageMax: 9,
    weightCategories: ["До 25 кг", "До 30 кг", "До 35 кг", "До 40 кг", "Св. 40 кг"],
    gender: "М",
    experienceLevel: "beginner"
  },
  // Девочки 8-9 лет
  {
    name: "Девочки 8-9 лет", 
    type: "kumite",
    ageMin: 8,
    ageMax: 9,
    weightCategories: ["До 25 кг", "До 30 кг", "До 35 кг", "До 40 кг", "Св. 40 кг"],
    gender: "Ж",
    experienceLevel: "beginner"
  },
  // Мальчики 10-11 лет
  {
    name: "Мальчики 10-11 лет",
    type: "kumite",
    ageMin: 10,
    ageMax: 11,
    weightCategories: ["До 30 кг", "До 35 кг", "До 40 кг", "До 45 кг", "До 50 кг", "Св. 50 кг"],
    gender: "М",
    experienceLevel: "beginner"
  },
  // Девочки 10-11 лет
  {
    name: "Девочки 10-11 лет",
    type: "kumite", 
    ageMin: 10,
    ageMax: 11,
    weightCategories: ["До 30 кг", "До 35 кг", "До 40 кг", "До 45 кг", "До 50 кг", "Св. 50 кг"],
    gender: "Ж",
    experienceLevel: "beginner"
  },
  // Юноши 12-13 лет
  {
    name: "Юноши 12-13 лет",
    type: "kumite",
    ageMin: 12,
    ageMax: 13,
    weightCategories: ["До 35 кг", "До 40 кг", "До 45 кг", "До 50 кг", "До 55 кг", "Св. 55 кг"],
    gender: "М",
    experienceLevel: "beginner"
  },
  // Девушки 12-13 лет
  {
    name: "Девушки 12-13 лет",
    type: "kumite",
    ageMin: 12,
    ageMax: 13,
    weightCategories: ["До 35 кг", "До 40 кг", "До 45 кг", "До 50 кг", "До 55 кг", "Св. 55 кг"],
    gender: "Ж", 
    experienceLevel: "beginner"
  },
  // Юноши 14-15 лет
  {
    name: "Юноши 14-15 лет",
    type: "kumite",
    ageMin: 14,
    ageMax: 15,
    weightCategories: ["До 45 кг", "До 50 кг", "До 55 кг", "До 60 кг", "До 65 кг", "До 70 кг", "Св. 70 кг"],
    gender: "М",
    experienceLevel: "beginner"
  },
  // Девушки 14-15 лет
  {
    name: "Девушки 14-15 лет",
    type: "kumite",
    ageMin: 14,
    ageMax: 15,
    weightCategories: ["До 40 кг", "До 45 кг", "До 50 кг", "До 55 кг", "До 60 кг", "Св. 60 кг"],
    gender: "Ж",
    experienceLevel: "beginner"
  },
  // Сеньоры 16-17 лет
  {
    name: "Сеньоры 16-17 лет",
    type: "kumite", 
    ageMin: 16,
    ageMax: 17,
    weightCategories: ["До 50 кг", "До 55 кг", "До 60 кг", "До 65 кг", "До 70 кг", "Св. 70 кг"],
    gender: "М",
    experienceLevel: "beginner"
  },
  // Сеньорки 16-17 лет
  {
    name: "Сеньорки 16-17 лет",
    type: "kumite",
    ageMin: 16,
    ageMax: 17,
    weightCategories: ["До 45 кг", "До 50 кг", "До 55 кг", "До 60 кг", "Св. 60 кг"],
    gender: "Ж",
    experienceLevel: "beginner"
  },
  // Мужчины 18+
  {
    name: "Мужчины 18+",
    type: "kumite",
    ageMin: 18,
    ageMax: 100,
    weightCategories: ["До 65 кг", "До 75 кг", "До 85 кг", "Св. 85 кг"],
    gender: "М",
    experienceLevel: "beginner"
  },
  // Женщины 18+
  {
    name: "Женщины 18+",
    type: "kumite",
    ageMin: 18,
    ageMax: 100,
    weightCategories: ["До 50 кг", "До 55 кг", "До 60 кг", "До 65 кг", "Св. 65 кг"],
    gender: "Ж",
    experienceLevel: "beginner"
  }
]

// Категории КУМИТЭ - Опытные (аналогичные весовые, но для опытных)
export const kumiteExperiencedCategories: TournamentCategoryData[] = [
  // Дублируем все категории для опытных участников
  ...kumiteBeginnerCategories.map(category => ({
    ...category,
    experienceLevel: "experienced" as const
  }))
]

// Категории КАТА - Начинающие
export const kataBeginnerCategories: TournamentCategoryData[] = [
  // Мальчики 6-7 лет
  {
    name: "Мальчики 6-7 лет",
    type: "kata",
    ageMin: 6,
    ageMax: 7,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "М", 
    experienceLevel: "beginner"
  },
  // Девочки 6-7 лет
  {
    name: "Девочки 6-7 лет",
    type: "kata",
    ageMin: 6,
    ageMax: 7,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "Ж",
    experienceLevel: "beginner"
  },
  // Мальчики 8-9 лет
  {
    name: "Мальчики 8-9 лет",
    type: "kata",
    ageMin: 8,
    ageMax: 9,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "М",
    experienceLevel: "beginner"
  },
  // Девочки 8-9 лет  
  {
    name: "Девочки 8-9 лет",
    type: "kata",
    ageMin: 8,
    ageMax: 9,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "Ж",
    experienceLevel: "beginner"
  },
  // Мальчики 10-11 лет
  {
    name: "Мальчики 10-11 лет",
    type: "kata",
    ageMin: 10,
    ageMax: 11,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "М",
    experienceLevel: "beginner"
  },
  // Девочки 10-11 лет
  {
    name: "Девочки 10-11 лет", 
    type: "kata",
    ageMin: 10,
    ageMax: 11,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "Ж",
    experienceLevel: "beginner"
  },
  // Юноши 12-13 лет
  {
    name: "Юноши 12-13 лет",
    type: "kata",
    ageMin: 12,
    ageMax: 13,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "М",
    experienceLevel: "beginner"
  },
  // Девушки 12-13 лет
  {
    name: "Девушки 12-13 лет",
    type: "kata",
    ageMin: 12,
    ageMax: 13,  
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "Ж",
    experienceLevel: "beginner"
  },
  // Юноши 14-15 лет
  {
    name: "Юноши 14-15 лет",
    type: "kata",
    ageMin: 14,
    ageMax: 15,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "М",
    experienceLevel: "beginner"
  },
  // Девушки 14-15 лет
  {
    name: "Девушки 14-15 лет",
    type: "kata",
    ageMin: 14,
    ageMax: 15,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "Ж",
    experienceLevel: "beginner"
  },
  // Сеньоры 16-17 лет
  {
    name: "Сеньоры 16-17 лет",
    type: "kata",
    ageMin: 16,
    ageMax: 17,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "М",
    experienceLevel: "beginner"
  },
  // Сеньорки 16-17 лет
  {
    name: "Сеньорки 16-17 лет",
    type: "kata",
    ageMin: 16,
    ageMax: 17,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "Ж",
    experienceLevel: "beginner"
  },
  // Мужчины 18+
  {
    name: "Мужчины 18+", 
    type: "kata",
    ageMin: 18,
    ageMax: 100,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "М",
    experienceLevel: "beginner"
  },
  // Женщины 18+
  {
    name: "Женщины 18+",
    type: "kata",
    ageMin: 18,
    ageMax: 100,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "Ж", 
    experienceLevel: "beginner"
  }
]

// Категории КАТА - Опытные
export const kataExperiencedCategories: TournamentCategoryData[] = [
  // Мальчики 6-7 лет
  {
    name: "Мальчики 6-7 лет",
    type: "kata",
    ageMin: 6,
    ageMax: 7,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "М",
    experienceLevel: "experienced"
  },
  // Девочки 6-7 лет
  {
    name: "Девочки 6-7 лет",
    type: "kata",
    ageMin: 6,
    ageMax: 7,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно ни", "Тайкеку соно сан"],
    gender: "Ж",
    experienceLevel: "experienced"
  },
  // Мальчики 8-9 лет
  {
    name: "Мальчики 8-9 лет",
    type: "kata",
    ageMin: 8,
    ageMax: 9,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно сан", "Пинан соно ичи"],
    gender: "М",
    experienceLevel: "experienced"
  },
  // Девочки 8-9 лет
  {
    name: "Девочки 8-9 лет",
    type: "kata", 
    ageMin: 8,
    ageMax: 9,
    kataList: ["Тайкеку соно ичи", "Тайкеку соно сан", "Пинан соно ичи"],
    gender: "Ж",
    experienceLevel: "experienced"
  },
  // Мальчики 10-11 лет
  {
    name: "Мальчики 10-11 лет",
    type: "kata",
    ageMin: 10,
    ageMax: 11,
    kataList: ["Тайкеку соно сан", "Пинан соно ичи", "Пинан соно ни"],
    gender: "М",
    experienceLevel: "experienced"
  },
  // Девочки 10-11 лет
  {
    name: "Девочки 10-11 лет",
    type: "kata",
    ageMin: 10,
    ageMax: 11,
    kataList: ["Тайкеку соно сан", "Пинан соно ичи", "Пинан соно ни"],
    gender: "Ж",
    experienceLevel: "experienced"
  },
  // Юноши 12-13 лет
  {
    name: "Юноши 12-13 лет",
    type: "kata",
    ageMin: 12,
    ageMax: 13,
    kataList: ["Пинан соно ни", "Пинан соно сан", "Пинан соно ён"],
    gender: "М",
    experienceLevel: "experienced"
  },
  // Девушки 12-13 лет
  {
    name: "Девушки 12-13 лет",
    type: "kata",
    ageMin: 12,
    ageMax: 13,
    kataList: ["Пинан соно ни", "Пинан соно сан", "Пинан соно ён"],
    gender: "Ж",
    experienceLevel: "experienced"
  },
  // Юноши 14-15 лет
  {
    name: "Юноши 14-15 лет",
    type: "kata",
    ageMin: 14,
    ageMax: 15,
    kataList: ["Пинан соно сан", "Пинан соно ён", "Пинан соно го"],
    gender: "М",
    experienceLevel: "experienced"
  },
  // Девушки 14-15 лет
  {
    name: "Девушки 14-15 лет",
    type: "kata",
    ageMin: 14,
    ageMax: 15,
    kataList: ["Пинан соно сан", "Пинан соно ён", "Пинан соно го"],
    gender: "Ж",
    experienceLevel: "experienced"
  },
  // Сеньоры 16-17 лет
  {
    name: "Сеньоры 16-17 лет",
    type: "kata",
    ageMin: 16,
    ageMax: 17,
    kataList: ["Тэкусай дай", "Тэкусай шо", "Цукуно"],
    gender: "М",
    experienceLevel: "experienced"
  },
  // Сеньорки 16-17 лет
  {
    name: "Сеньорки 16-17 лет",
    type: "kata",
    ageMin: 16,
    ageMax: 17,
    kataList: ["Тэкусай дай", "Тэкусай шо", "Цукуно"],
    gender: "Ж",
    experienceLevel: "experienced"
  },
  // Мужчины 18+
  {
    name: "Мужчины 18+",
    type: "kata",
    ageMin: 18,
    ageMax: 34,
    kataList: ["Тэкусай шо", "Сэйфин", "Канку/Гарю/Сусихо/Сейпай", "Канку/Гарю/Сусихо/Сейпай"],
    gender: "М",
    experienceLevel: "experienced"
  },
  // Женщины 18+
  {
    name: "Женщины 18+",
    type: "kata",
    ageMin: 18,
    ageMax: 34,
    kataList: ["Тэкусай шо", "Сэйфин", "Канку/Гарю/Сусихо/Сейпай", "Канку/Гарю/Сусихо/Сейпай"],
    gender: "Ж",
    experienceLevel: "experienced"
  }
]

// Ветераны 35+
export const veteranCategories: TournamentCategoryData[] = [
  // Мужчины ветераны кумитэ
  {
    name: "Мужчины ветераны 35+ (кумитэ)",
    type: "kumite",
    ageMin: 35,
    ageMax: 100,
    weightCategories: ["До 70 кг", "До 80 кг", "Св. 80 кг"],
    gender: "М",
    experienceLevel: "mixed"
  },
  // Женщины ветераны кумитэ
  {
    name: "Женщины ветераны 35+ (кумитэ)",
    type: "kumite",
    ageMin: 35,
    ageMax: 100,
    weightCategories: ["До 60 кг", "Св. 60 кг"],
    gender: "Ж",
    experienceLevel: "mixed"
  },
  // Мужчины ветераны ката
  {
    name: "Мужчины ветераны 35+ (ката)",
    type: "kata",
    ageMin: 35,
    ageMax: 100,
    kataList: ["Свободный выбор из программы"],
    gender: "М",
    experienceLevel: "mixed"
  },
  // Женщины ветераны ката
  {
    name: "Женщины ветераны 35+ (ката)",
    type: "kata",
    ageMin: 35,
    ageMax: 100,
    kataList: ["Свободный выбор из программы"],
    gender: "Ж",
    experienceLevel: "mixed"
  }
]

// Групповые ката
export const kataGroupCategories: TournamentCategoryData[] = [
  {
    name: "Групповая ката (3 человека) - младшая группа",
    type: "kata-group",
    ageMin: 6,
    ageMax: 13,
    kataList: ["Синхронное исполнение ката группой"],
    gender: "mixed",
    experienceLevel: "mixed"
  },
  {
    name: "Групповая ката (3 человека) - старшая группа",
    type: "kata-group",
    ageMin: 14,
    ageMax: 100,
    kataList: ["Синхронное исполнение ката группой"],
    gender: "mixed",
    experienceLevel: "mixed"
  }
]

// Все категории вместе
export const allTournamentCategories = [
  ...kumiteBeginnerCategories,
  ...kumiteExperiencedCategories,
  ...kataBeginnerCategories,
  ...kataExperiencedCategories,
  ...veteranCategories,
  ...kataGroupCategories
]