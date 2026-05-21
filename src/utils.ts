import { MealData, UserProfile, Nutrition } from './types';

/**
 * Returns the current date in Korea Standard Time (KST, Asia/Seoul).
 * Safely calculates UTC time shifted to KST so local getters represent the correct time in Korea.
 */
export function getTodayKST(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const KST_OFFSET = 9 * 60 * 60 * 1000; // GMT+9
  return new Date(utc + KST_OFFSET);
}

/**
 * Formats a Date object as "M월 D일 요요일" (e.g., "5월 15일 금요일").
 */
export function formatKoreanDate(date: Date): string {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = days[date.getDay()];
  return `${month}월 ${day}일 ${dayName}`;
}

/**
 * Formats a Date object as "YYYYMMDD" format (e.g., "20260515").
 */
export function formatDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * Returns an array of Date objects for Monday through Friday of the week containing the given date.
 */
export function getWeekDates(date: Date): Date[] {
  const currentDay = date.getDay(); // 0 is Sunday, 1 is Monday ...
  // Determine distance to Monday
  const dayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(date);
  monday.setDate(date.getDate() + dayOffset);

  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/**
 * Calculates which M month and N week of the month the given date belongs to.
 */
export function getWeekOfMonth(date: Date): { month: number; week: number } {
  const tempDate = new Date(date);
  const month = tempDate.getMonth() + 1;
  const day = tempDate.getDate();

  // Find the weekday of the first day of this month
  const firstDayOfMonth = new Date(tempDate.getFullYear(), tempDate.getMonth(), 1);
  const dayOfWeekOfFirst = firstDayOfMonth.getDay(); // 0: Sun, 1: Mon ...
  const offset = dayOfWeekOfFirst === 0 ? 6 : dayOfWeekOfFirst - 1;

  const week = Math.ceil((day + offset) / 7);
  return { month, week };
}

/**
 * Returns today's date if it is a weekday (Mon-Fri).
 * Returns next Monday's date if it is a weekend (Sat-Sun).
 */
export function getDefaultSelectedDate(today: Date): Date {
  const day = today.getDay();
  if (day >= 1 && day <= 5) {
    return today;
  }
  const result = new Date(today);
  if (day === 6) { // Saturday
    result.setDate(today.getDate() + 2); // Next Monday
  } else if (day === 0) { // Sunday
    result.setDate(today.getDate() + 1); // Next Monday
  }
  return result;
}

/**
 * Returns the short Korean weekday character ("월", "화", etc.).
 */
export function getKoreanDayOfWeek(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
}

/**
 * Dynamic meal menus for Monday through Friday.
 * Each index corresponds to a weekday (0: Monday, 1: Tuesday, etc.)
 */
const MEAL_TEMPLATES = [
  // Monday
  {
    lunch: {
      title: '치즈돈까스 정식',
      dishes: ['수제치즈돈까스', '친환경현미밥', '팽이버섯계란국', '참치옥수수샐러드', '깍두기'],
      totalCalories: 845,
      nutrition: { kcal: 845, protein: 32, carbs: 110, fat: 25, proteinRate: 85 },
      allergens: '대두, 밀, 우유, 돼지고기, 난류',
    },
    dinner: {
      title: '참치마요덮밥',
      dishes: ['참치마요덮밥', '꼬치어묵우동', '야채고로케', '단무지무침', '배추김치'],
      totalCalories: 720,
      nutrition: { kcal: 720, protein: 22, carbs: 90, fat: 20, proteinRate: 60 },
      allergens: '난류, 우유, 대두, 밀, 새우',
    }
  },
  // Tuesday
  {
    lunch: {
      title: '한방소갈비찜과 나물비빔밥',
      dishes: ['친환경현미밥', '맑은소고기무국', '매콤제육강정', '봄나물무침', '배추김치'],
      totalCalories: 850,
      nutrition: { kcal: 850, protein: 35, carbs: 105, fat: 28, proteinRate: 90 },
      allergens: '대두, 밀, 돼지고기, 쇠고기',
    },
    dinner: {
      title: '쇠고기 야채 볶음밥',
      dishes: ['소고기볶음밥', '맑은팽이국', '소떡소떡꼬치', '단무지', '요구르트'],
      totalCalories: 690,
      nutrition: { kcal: 690, protein: 18, carbs: 95, fat: 15, proteinRate: 50 },
      allergens: '대두, 밀, 토마토, 쇠고기',
    }
  },
  // Wednesday
  {
    lunch: {
      title: '수제함박스테이크와 마카로니',
      dishes: ['혼합잡곡밥', '가쓰오맑은국', '수제함박스테이크', '오븐감자구이', '배추김치'],
      totalCalories: 820,
      nutrition: { kcal: 820, protein: 30, carbs: 115, fat: 22, proteinRate: 80 },
      allergens: '난류, 대두, 밀, 쇠고기, 토마토',
    },
    dinner: {
      title: '매콤떡볶이와 모둠튀김',
      dishes: ['매콤떡볶이', '김말이튀김', '야채군만두', '단무지채무침', '파인애플 쿨피스'],
      totalCalories: 680,
      nutrition: { kcal: 680, protein: 14, carbs: 120, fat: 12, proteinRate: 40 },
      allergens: '대두, 밀, 우유',
    }
  },
  // Thursday
  {
    lunch: {
      title: '매콤돈육강정 정식',
      dishes: ['친환경현미밥', '쇠고기미역국', '매콤돈육강정', '숙주미나리무침', '배추김치'],
      totalCalories: 845,
      nutrition: { kcal: 845, protein: 32, carbs: 110, fat: 25, proteinRate: 85 },
      allergens: '대두, 밀, 쇠고기, 돼지고기',
    },
    dinner: {
      title: '참치마요덮밥과 요플레',
      dishes: ['참치마요덮밥', '유부장국', '매콤떡볶이', '깍두기', '요구르트'],
      totalCalories: 720,
      nutrition: { kcal: 720, protein: 22, carbs: 90, fat: 20, proteinRate: 60 },
      allergens: '난류, 우유, 대두, 밀',
    }
  },
  // Friday
  {
    lunch: {
      title: '얼큰순댓국과 호박전',
      dishes: ['보리밥', '얼큰순댓국', '순살반반치킨', '호박전', '석박지'],
      totalCalories: 890,
      nutrition: { kcal: 890, protein: 36, carbs: 122, fat: 24, proteinRate: 95 },
      allergens: '대두, 밀, 돼지고기, 닭고기',
    },
    dinner: {
      title: '수제불고기버거 세트',
      dishes: ['갈릭불고기버거', '양념허니감자튀김', '옥수수콘샐러드', '콜라/사이다'],
      totalCalories: 780,
      nutrition: { kcal: 780, protein: 24, carbs: 102, fat: 26, proteinRate: 70 },
      allergens: '난류, 우유, 대두, 밀, 쇠고기',
    }
  }
];

/**
 * Generates 5 days worth of meals (Lunch & Dinner) for the given week dates.
 */
export function generateMealsForWeek(weekDates: Date[]): MealData[] {
  const result: MealData[] = [];

  weekDates.forEach((date, index) => {
    // Standard template index for Mon-Fri is 0-4
    const templateIndex = Math.min(Math.max(index, 0), 4);
    const template = MEAL_TEMPLATES[templateIndex];
    const key = formatDateKey(date);
    const dayName = getKoreanDayOfWeek(date);

    // Add Lunch (중식)
    result.push({
      id: `${key}-L`,
      schoolName: '씨마스고등학교',
      date: date,
      dateKey: key,
      dayOfWeek: dayName,
      mealType: '중식',
      title: template.lunch.title,
      dishes: template.lunch.dishes,
      totalCalories: template.lunch.totalCalories,
      nutrition: template.lunch.nutrition,
      allergens: template.lunch.allergens,
    });

    // Add Dinner (석식)
    result.push({
      id: `${key}-D`,
      schoolName: '씨마스고등학교',
      date: date,
      dateKey: key,
      dayOfWeek: dayName,
      mealType: '석식',
      title: template.dinner.title,
      dishes: template.dinner.dishes,
      totalCalories: template.dinner.totalCalories,
      nutrition: template.dinner.nutrition,
      allergens: template.dinner.allergens,
    });
  });

  return result;
}

const DISH_NUTRITION_MAP: Record<string, Nutrition> = {
  '수제치즈돈까스': { kcal: 380, protein: 18, carbs: 20, fat: 16 },
  '친환경현미밥': { kcal: 300, protein: 6, carbs: 65, fat: 1.5 },
  '팽이버섯계란국': { kcal: 65, protein: 4, carbs: 5, fat: 3 },
  '참치옥수수샐러드': { kcal: 110, protein: 4, carbs: 10, fat: 4.5 },
  '깍두기': { kcal: 20, protein: 0.5, carbs: 4.5, fat: 0 },
  '배추김치': { kcal: 20, protein: 0.5, carbs: 4.5, fat: 0 },
  '단무지': { kcal: 15, protein: 0.2, carbs: 3, fat: 0 },
  '참치마요덮밥': { kcal: 450, protein: 14, carbs: 60, fat: 12 },
  '꼬치어묵우동': { kcal: 310, protein: 12, carbs: 45, fat: 6 },
  '야채고로케': { kcal: 130, protein: 2, carbs: 18, fat: 5 },
  '단무지무침': { kcal: 15, protein: 0.2, carbs: 3, fat: 0 },
  '한방소갈비찜': { kcal: 350, protein: 22, carbs: 12, fat: 18 },
  '맑은소고기무국': { kcal: 90, protein: 8, carbs: 4, fat: 4 },
  '매콤제육강정': { kcal: 260, protein: 14, carbs: 18, fat: 12 },
  '소고기볶음밥': { kcal: 420, protein: 12, carbs: 65, fat: 10 },
  '소떡소떡꼬치': { kcal: 210, protein: 4, carbs: 35, fat: 5 },
  '요구르트': { kcal: 45, protein: 0.5, carbs: 10, fat: 0.1 },
  '혼합잡곡밥': { kcal: 310, protein: 6.5, carbs: 64, fat: 1.6 },
  '가쓰오맑은국': { kcal: 40, protein: 1.5, carbs: 6, fat: 1 },
  '수제함박스테이크': { kcal: 280, protein: 16, carbs: 12, fat: 15 },
  '오븐감자구이': { kcal: 120, protein: 2.2, carbs: 24, fat: 1.8 },
  '매콤떡볶이': { kcal: 350, protein: 6, carbs: 75, fat: 2 },
  '김말이튀김': { kcal: 140, protein: 2, carbs: 22, fat: 4 },
  '야채군만두': { kcal: 150, protein: 3, carbs: 18, fat: 6 },
  '쇠고기미역국': { kcal: 85, protein: 6, carbs: 5, fat: 3.5 },
  '보리밥': { kcal: 280, protein: 6, carbs: 60, fat: 1.2 },
  '얼큰순댓국': { kcal: 410, protein: 20, carbs: 35, fat: 16 },
  '순살반반치킨': { kcal: 320, protein: 16, carbs: 15, fat: 14 },
  '호박전': { kcal: 75, protein: 2, carbs: 8, fat: 3 },
  '갈릭불고기버거': { kcal: 450, protein: 20, carbs: 42, fat: 18 },
  '양념허니감자튀김': { kcal: 180, protein: 2.5, carbs: 28, fat: 6 },
  '옥수수콘샐러드': { kcal: 90, protein: 1.5, carbs: 12, fat: 4 },
  '콜라/사이다': { kcal: 100, protein: 0, carbs: 25, fat: 0 },
  '식단': { kcal: 0, protein: 0, carbs: 0, fat: 0 }
};

export function getDishNutrition(dishName: string): Nutrition {
  const matched = DISH_NUTRITION_MAP[dishName.trim()];
  if (matched) return matched;

  if (dishName.includes('밥')) {
    return { kcal: 300, protein: 6, carbs: 65, fat: 1.5 };
  } else if (dishName.includes('국') || dishName.includes('찌개') || dishName.includes('탕') || dishName.includes('우동')) {
    return { kcal: 120, protein: 6, carbs: 15, fat: 3 };
  } else if (dishName.includes('구이') || dishName.includes('볶음') || dishName.includes('돈까스') || dishName.includes('스테이크') || dishName.includes('강정') || dishName.includes('치킨') || dishName.includes('찜') || dishName.includes('전')) {
    return { kcal: 280, protein: 15, carbs: 15, fat: 12 };
  } else if (dishName.includes('샐러드') || dishName.includes('무침') || dishName.includes('나물') || dishName.includes('김치') || dishName.includes('깍두기') || dishName.includes('단무지')) {
    return { kcal: 45, protein: 1.5, carbs: 8, fat: 1 };
  } else {
    return { kcal: 100, protein: 4, carbs: 15, fat: 2 };
  }
}

