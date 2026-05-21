export interface Nutrition {
  kcal: number;
  protein: number; // in grams (g)
  carbs: number;   // in grams (g)
  fat: number;     // in grams (g)
  proteinRate?: number; // target attainment rate (%)
}

export interface MealData {
  id: string;
  schoolName: string;
  date: Date;
  dateKey: string; // YYYYMMDD
  dayOfWeek: string; // 월, 화, 수, 목, 금, 토, 일
  mealType: '중식' | '석식';
  title: string;
  dishes: string[];
  totalCalories: number;
  nutrition: Nutrition;
  allergens: string;
}

export interface UserProfile {
  name: string;
  grade: number;
  classRoom: number;
  number: number;
  allergies: string[];
  mealAlertEnabled: boolean;
}
