import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getTodayKST,
  getWeekDates,
  generateMealsForWeek,
  formatKoreanDate,
  formatDateKey,
  getWeekOfMonth,
  getKoreanDayOfWeek,
  getDefaultSelectedDate,
  getDishNutrition
} from './utils';
import { MealData, UserProfile } from './types';

export default function App() {
  // --- 1. Date and Meal Constants Initialization ---
  const today = useMemo(() => getTodayKST(), []);
  const todayOfWeekNumeric = today.getDay(); // 0 is Sun, 6 is Sat
  const isWeekend = todayOfWeekNumeric === 0 || todayOfWeekNumeric === 6;

  // The fallback weekday date to display for weekend users (Nearest Monday)
  const defaultWeekdayDate = useMemo(() => getDefaultSelectedDate(today), [today]);

  // General weekly dates (Mon to Fri) dynamically generated based on standard week
  const weekDates = useMemo(() => getWeekDates(defaultWeekdayDate), [defaultWeekdayDate]);
  
  // Weekly meals generated dynamically (10 meals: Lunch & Dinner for 5 weekdays)
  const weekMeals = useMemo(() => generateMealsForWeek(weekDates), [weekDates]);

  // --- 2. Application States ---
  const [currentTab, setCurrentTab] = useState<'home' | 'diet' | 'calc' | 'profile'>('home');
  const [selectedDietDate, setSelectedDietDate] = useState<Date>(defaultWeekdayDate);
  const [calcMealType, setCalcMealType] = useState<'중식' | '석식'>('중식');
  const [selectedCalcCategory, setSelectedCalcCategory] = useState<string>('전체');

  // Interactive profile state
  const [profile, setProfile] = useState<UserProfile>({
    name: '김학생',
    grade: 2,
    classRoom: 3,
    number: 15,
    allergies: ['우유', '땅콩'],
    mealAlertEnabled: true,
  });

  // Dynamic calculation select items
  const [calcSelectedDishes, setCalcSelectedDishes] = useState<string[]>([]);
  const [allergiesEditOpen, setAllergiesEditOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  
  // Floating notice toasts
  const [toast, setToast] = useState<string | null>(null);

  // Profile temporary edit holders
  const [tempName, setTempName] = useState(profile.name);
  const [tempGrade, setTempGrade] = useState(profile.grade);
  const [tempClass, setTempClass] = useState(profile.classRoom);
  const [tempNum, setTempNum] = useState(profile.number);

  // Trigger brief alert toast
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // --- 3. Home State Computed Properties ---
  const displayLunch = useMemo(() => {
    // If weekend, display next Monday's Lunch
    const targetKey = formatDateKey(isWeekend ? defaultWeekdayDate : today);
    return weekMeals.find(m => m.dateKey === targetKey && m.mealType === '중식');
  }, [weekMeals, isWeekend, defaultWeekdayDate, today]);

  const displayDinner = useMemo(() => {
    // If weekend, display next Monday's Dinner
    const targetKey = formatDateKey(isWeekend ? defaultWeekdayDate : today);
    return weekMeals.find(m => m.dateKey === targetKey && m.mealType === '석식');
  }, [weekMeals, isWeekend, defaultWeekdayDate, today]);

  // --- 4. Nutrition Calculations Based on Selections ---
  // Default dishes when meal type or selected day changes
  const currentCalcMeal = useMemo(() => {
    // Match standard weekday menu
    const targetKey = formatDateKey(defaultWeekdayDate);
    return weekMeals.find(m => m.dateKey === targetKey && m.mealType === calcMealType);
  }, [weekMeals, defaultWeekdayDate, calcMealType]);

  // Initialize selected dishes on load or selection shift
  useEffect(() => {
    if (currentCalcMeal) {
      setCalcSelectedDishes(currentCalcMeal.dishes);
    }
  }, [currentCalcMeal]);

  // Calculate dynamic sums of selected dishes
  const calcTotals = useMemo(() => {
    let kcal = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    calcSelectedDishes.forEach(dish => {
      const nu = getDishNutrition(dish);
      kcal += nu.kcal;
      protein += nu.protein;
      carbs += nu.carbs;
      fat += nu.fat;
    });

    return { kcal, protein, carbs, fat };
  }, [calcSelectedDishes]);

  // Check if any item contains allergen warnings for user's profile allergies
  const checkAllergyWarning = (dishes: string[]) => {
    return dishes.some(dish => {
      const nu = getDishNutrition(dish);
      // Simple match check against users selected allergies set
      return profile.allergies.some(allerg => {
        // e.g. "우유" matched inside ingredient info or lookup description
        return dish.includes(allerg);
      });
    });
  };

  const getWeekString = (dt: Date) => {
    const info = getWeekOfMonth(dt);
    return `${info.month}월 ${info.week}주차`;
  };

  return (
    <div className="flex justify-center min-h-screen bg-[#f1eee6] antialiased text-on-surface">
      <div id="app-container" className="relative w-full max-w-[420px] min-h-screen bg-background shadow-[0_0_40px_rgba(0,0,0,0.06)] pt-14 pb-20 overflow-x-hidden flex flex-col">
        
        {/* --- COMMON APP HEADER --- */}
        <header className="fixed top-0 w-full max-w-[420px] h-14 bg-background border-b border-surface-container-high flex items-center justify-between px-margin-mobile z-40 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary font-bold text-[24px]">restaurant</span>
            <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">씨마스고등학교 급식</span>
          </div>
          <button 
            onClick={() => setCurrentTab('profile')} 
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors duration-200"
            aria-label="Settings Link"
          >
            <span className="material-symbols-outlined text-[24px]">settings</span>
          </button>
        </header>

        {/* --- MAIN PAGE CONTENT --- */}
        <main className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* 1. HOME TAB */}
            {currentTab === 'home' && (
              <motion.div
                key="home-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.23 }}
                className="px-margin-mobile pt-stack-md pb-stack-lg flex flex-col gap-stack-lg"
              >
                {/* Dynamic Notice Panel for Weekend users */}
                {isWeekend && (
                  <div className="bg-secondary-container/20 rounded-DEFAULT p-4 border border-secondary-container/40 flex gap-3 text-on-secondary-container items-start scale-up-anim">
                    <span className="material-symbols-outlined text-secondary pt-0.5">info</span>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-body-md font-bold text-primary">오늘은 즐거운 주말입니다!</p>
                      <p className="font-label-md text-on-surface-variant leading-relaxed">
                        주말에는 급식이 제공되지 않으므로, 가장 가까운 다음 급식일인 <span className="font-bold text-primary">{formatKoreanDate(defaultWeekdayDate)}</span> 식단을 표시합니다.
                      </p>
                    </div>
                  </div>
                )}

                {/* Hero Card (Today / Next Meal) */}
                <section className="relative bg-surface-container-lowest rounded-lg shadow-[0px_4px_20px_rgba(79,111,0,0.06)] overflow-hidden">
                  <div className="h-48 w-full bg-surface-container-high relative">
                    <img 
                      alt="Cheese Tonkatsu" 
                      className="w-full h-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDPgaEQjkXzobBZ_n2jwWxK7kWBPCRpECVCxSoAW6JJYB8fvyfHT3bhPRjPsG9boTg3JUDoIFDOKIkn-9SWXqFxJesbUR0NDfzMIA4TbMPBVgM9PZKhy2k36N1YbIl7qXZdkMmsjlg7TDK9-03iG1X3mVJ4t-9UDxdhEXWIIPGYZc0KH4N-EKM4UsweBXHc4H0Ai2sk2GV3mqPwzgUVGBphQNPJo_5CN--M3OWEBSuQn5qLI5zG5U0jaT7M_cvVLPtTV67AOKc5H8Y"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Dynamic Status Badge */}
                    <div className="absolute top-4 left-4 bg-primary/95 text-on-primary font-headline-sm text-[12px] px-3.5 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-[#d2ea7a] rounded-full animate-pulse"></span>
                      <span>{isWeekend ? '다음 급식일' : '오늘의 추천 급식'}</span>
                    </div>

                    <button 
                      onClick={() => triggerToast('즐겨찾기 식단에 추가되었습니다! ⭐')}
                      className="absolute top-4 right-4 w-10 h-10 bg-surface-container-lowest/80 backdrop-blur-md rounded-full flex items-center justify-center text-primary hover:bg-surface-container-lowest hover:scale-105 active:scale-95 transition-all shadow-md"
                    >
                      <span className="material-symbols-outlined text-[20px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </button>
                  </div>

                  <div className="p-5 flex flex-col gap-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        {/* Dynamic displays based on today/next meal date */}
                        <p className="font-label-sm text-label-sm text-outline tracking-wider uppercase">
                          {isWeekend ? formatKoreanDate(defaultWeekdayDate) : formatKoreanDate(today)}
                        </p>
                        <h2 className="font-headline-md text-headline-md text-primary mt-1">
                          {displayLunch?.title || '영양 만점 식단'}
                        </h2>
                      </div>
                      <div className="bg-secondary-container text-on-secondary-container font-bold font-label-md text-label-md px-3.5 py-1.5 rounded-lg shrink-0">
                        {displayLunch?.totalCalories || 845} kcal
                      </div>
                    </div>
                  </div>
                </section>

                {/* Today's Meal Section */}
                <section className="flex flex-col gap-stack-md">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">오늘의 식단</h3>
                    <button 
                      onClick={() => setCurrentTab('diet')}
                      className="text-primary text-[13px] font-bold hover:underline py-1 flex items-center gap-0.5"
                    >
                      전체 식단표 보기
                      <span className="material-symbols-outlined text-[16px] font-bold">chevron_right</span>
                    </button>
                  </div>

                  {/* LUNCH CARD */}
                  {displayLunch && (
                    <div className="bg-surface-container-lowest rounded-lg p-5 shadow-[0px_4px_20px_rgba(79,111,0,0.05)] border-l-4 border-primary">
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-surface-container-highest">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary font-bold">wb_sunny</span>
                          <span className="font-headline-sm text-headline-sm text-primary">중식</span>
                        </div>
                        <span className="bg-[#DDE8B2] text-primary font-bold font-label-md text-label-md px-3 py-1.5 rounded-full">
                          {displayLunch.totalCalories} kcal
                        </span>
                      </div>
                      <ul className="font-body-md text-body-md text-on-surface flex flex-col gap-2.5 mb-4 pl-1">
                        {displayLunch.dishes.map((dish, i) => {
                          const isAllergen = profile.allergies.some(allerg => dish.includes(allerg));
                          return (
                            <li key={i} className="flex items-center justify-between text-[15px]">
                              <span className="flex items-center gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim shrink-0"></span>
                                <span className={i === 0 ? 'font-bold text-on-surface' : 'text-on-surface-variant'}>
                                  {dish}
                                </span>
                              </span>
                              {isAllergen && (
                                <span className="bg-error-container text-error text-[10px] font-bold px-2 py-0.5 rounded border border-error/10">
                                  알레르기 경보!
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>

                      <div className="bg-[#EEF0EA] rounded-md p-3 flex items-start gap-2">
                        <span className="material-symbols-outlined text-outline text-[18px] pt-0.5">info</span>
                        <p className="font-label-md text-label-md text-outline leading-tight">
                          알레르기 정보: {displayLunch.allergens}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* DINNER CARD */}
                  {displayDinner && (
                    <div className="bg-surface-container-lowest rounded-lg p-5 shadow-[0px_4px_20px_rgba(79,111,0,0.05)] border-l-4 border-tertiary">
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-surface-container-highest">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-tertiary font-bold">bedtime</span>
                          <span className="font-headline-sm text-headline-sm text-tertiary">석식</span>
                        </div>
                        <span className="bg-[#FFE7DD]/80 text-[#5a4a43] font-bold font-label-md text-label-md px-3 py-1.5 rounded-full">
                          {displayDinner.totalCalories} kcal
                        </span>
                      </div>
                      <ul className="font-body-md text-body-md text-on-surface flex flex-col gap-2.5 mb-4 pl-1">
                        {displayDinner.dishes.map((dish, i) => {
                          const isAllergen = profile.allergies.some(allerg => dish.includes(allerg));
                          return (
                            <li key={i} className="flex items-center justify-between text-[15px]">
                              <span className="flex items-center gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim shrink-0"></span>
                                <span className={i === 0 ? 'font-bold text-on-surface' : 'text-on-surface-variant'}>
                                  {dish}
                                </span>
                              </span>
                              {isAllergen && (
                                <span className="bg-error-container text-error text-[10px] font-bold px-2 py-0.5 rounded border border-error/10">
                                  알레르기 경보!
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>

                      <div className="bg-[#EEF0EA] rounded-md p-3 flex items-start gap-2">
                        <span className="material-symbols-outlined text-outline text-[18px] pt-0.5">info</span>
                        <p className="font-label-md text-label-md text-outline leading-tight">
                          알레르기 정보: {displayDinner.allergens}
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {/* 2. DIET BOARD TAB */}
            {currentTab === 'diet' && (
              <motion.div
                key="diet-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.23 }}
                className="px-margin-mobile pt-stack-md pb-stack-lg flex flex-col gap-stack-lg"
              >
                {/* Header Section */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <span className="font-label-md text-label-md text-primary tracking-wide uppercase">주간 식단표</span>
                  {/* DYNAMIC WEEK CALCULATION */}
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">
                    {getWeekString(selectedDietDate)}
                  </h2>
                </div>

                {/* Horizontal Weekdate Picker */}
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                  {weekDates.map((dateItem, idx) => {
                    const isSelected = formatDateKey(dateItem) === formatDateKey(selectedDietDate);
                    const isSystemToday = formatDateKey(dateItem) === formatDateKey(today);
                    const dayChar = getKoreanDayOfWeek(dateItem);
                    const dayNum = dateItem.getDate();

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDietDate(dateItem)}
                        className={`flex flex-col items-center justify-center shrink-0 min-w-[62px] h-[76px] rounded-DEFAULT transition-all active:scale-95 duration-200 ${
                          isSelected
                            ? 'bg-primary text-on-primary shadow-lg scale-102 font-bold'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        <span className={`font-label-md text-[12px] ${isSelected ? 'text-[#c9f07c]' : 'text-outline'}`}>
                          {dayChar}
                        </span>
                        <span className="font-headline-sm text-headline-sm mt-1">
                          {dayNum}
                        </span>
                        {isSystemToday && (
                          <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-on-primary' : 'bg-primary'}`}></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Meals corresponding to the selected date */}
                <div className="flex flex-col gap-stack-md">
                  {['중식', '석식'].map(type => {
                    const meal = weekMeals.find(
                      m => formatDateKey(m.date) === formatDateKey(selectedDietDate) && m.mealType === type
                    );

                    if (!meal) return null;

                    const isAllergyTriggered = checkAllergyWarning(meal.dishes);

                    return (
                      <article 
                        key={type}
                        className={`bg-surface-container-lowest rounded-lg p-5 shadow-[0px_4px_16px_rgba(79,111,0,0.04)] border ${
                          isAllergyTriggered ? 'border-error-container/60 bg-[#fffcfb]' : 'border-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined font-bold ${type === '중식' ? 'text-primary' : 'text-tertiary'}`}>
                              {type === '중식' ? 'wb_sunny' : 'bedtime'}
                            </span>
                            <h3 className={`font-headline-sm text-headline-sm ${type === '중식' ? 'text-primary' : 'text-[#73625a]'}`}>
                              {type}
                            </h3>
                          </div>
                          <span className="bg-[#DDE8B2] text-primary font-bold font-label-md text-[11px] px-2.5 py-1 rounded-full">
                            {meal.totalCalories} kcal
                          </span>
                        </div>

                        <ul className="font-body-md text-body-md text-on-surface flex flex-col gap-2 mb-4">
                          {meal.dishes.map((dish, i) => {
                            const isAllergen = profile.allergies.some(a => dish.includes(a));
                            return (
                              <li key={i} className="flex items-center justify-between text-[14px]">
                                <span className={i === 0 ? 'font-bold' : 'text-on-surface-variant'}>{dish}</span>
                                {isAllergen && (
                                  <span className="text-[10px] bg-error-container text-error px-1.5 py-0.5 rounded font-bold">
                                    경보
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>

                        {/* Slide progress bars for protein target attainment rate */}
                        <div className="mt-3 pt-3 border-t border-surface-container-high flex flex-col gap-1.5">
                          <div className="flex justify-between font-label-sm text-[11px] text-outline">
                            <span>단백질 달성률</span>
                            <span>{meal.nutrition.proteinRate || 75}%</span>
                          </div>
                          <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                type === '중식' ? 'bg-primary' : 'bg-tertiary'
                              }`}
                              style={{ width: `${meal.nutrition.proteinRate || 75}%` }}
                            ></div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 3. NUTRITION CALCULATOR TAB */}
            {currentTab === 'calc' && (
              <motion.div
                key="calc-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.23 }}
                className="px-margin-mobile pt-stack-md pb-stack-lg flex flex-col gap-stack-lg"
              >
                {/* Header Summary Dynamic Indicator */}
                <section className="bg-surface-container-lowest rounded-lg p-5 shadow-[0px_4px_20px_rgba(79,111,0,0.06)] flex flex-col gap-stack-md relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-fixed-dim/20 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-label-sm text-[10px] text-outline tracking-wider uppercase">
                        {formatKoreanDate(defaultWeekdayDate)} ({calcMealType})
                      </span>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface">오늘의 선택 영양</h2>
                    </div>
                    <div className="flex items-baseline gap-0.5 text-primary">
                      <span className="font-headline-lg text-headline-lg font-bold">{calcTotals.kcal}</span>
                      <span className="font-label-md text-label-md">kcal</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3.5 mt-2">
                    {/* Protein Rate */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                        <span>단백질</span>
                        <span className="font-medium">{calcTotals.protein}g</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container shadow-inner rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-300 ease-out" 
                          style={{ width: `${Math.min((calcTotals.protein / 60) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Carbs Rate */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                        <span>탄수화물</span>
                        <span className="font-medium">{calcTotals.carbs}g</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container shadow-inner rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-secondary-container rounded-full transition-all duration-300 ease-out" 
                          style={{ width: `${Math.min((calcTotals.carbs / 250) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Fat Rate */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-label-md text-label-md text-on-surface-variant">
                        <span>지방</span>
                        <span className="font-medium">{calcTotals.fat}g</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container shadow-inner rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-outline-variant rounded-full transition-all duration-300 ease-out" 
                          style={{ width: `${Math.min((calcTotals.fat / 65) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Sub-toggle selector for Lunch/Dinner selection inside calculator */}
                <div className="bg-surface-container-low p-1 rounded-DEFAULT flex gap-1">
                  <button
                    onClick={() => {
                      setCalcMealType('중식');
                      setSelectedCalcCategory('전체');
                    }}
                    className={`flex-1 py-2 text-center rounded-lg text-label-md transition-all font-bold ${
                      calcMealType === '중식' ? 'bg-background text-primary shadow-sm' : 'text-outline'
                    }`}
                  >
                    중식 (점심)
                  </button>
                  <button
                    onClick={() => {
                      setCalcMealType('석식');
                      setSelectedCalcCategory('전체');
                    }}
                    className={`flex-1 py-2 text-center rounded-lg text-label-md transition-all font-bold ${
                      calcMealType === '석식' ? 'bg-background text-primary shadow-sm' : 'text-outline'
                    }`}
                  >
                    석식 (저녁)
                  </button>
                </div>

                {/* Horizontal Category Filters */}
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth pb-1 pl-1">
                  {['전체', '밥류', '국/찌개', '반찬', '디저트'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCalcCategory(cat)}
                      className={`shrink-0 px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${
                        selectedCalcCategory === cat 
                          ? 'bg-primary text-on-primary' 
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Checked items list */}
                <div className="flex flex-col gap-3">
                  {currentCalcMeal?.dishes
                    .filter(dish => {
                      if (selectedCalcCategory === '전체') return true;
                      if (selectedCalcCategory === '밥류') return dish.includes('밥');
                      if (selectedCalcCategory === '국/찌개') return dish.includes('국') || dish.includes('찌개') || dish.includes('탕') || dish.includes('우동');
                      if (selectedCalcCategory === '반찬') {
                        return !dish.includes('밥') && !dish.includes('국') && !dish.includes('찌개') && !dish.includes('탕') && !dish.includes('우동') && !dish.includes('깍두기') && !dish.includes('김치') && !dish.includes('단무지') && !dish.includes('요구르트') && !dish.includes('쿨피스');
                      }
                      if (selectedCalcCategory === '디저트') {
                        return dish.includes('깍두기') || dish.includes('김치') || dish.includes('단무지') || dish.includes('요구르트') || dish.includes('쿨피스') || dish.includes('음료') || dish.includes('샐러드');
                      }
                      return true;
                    })
                    .map(dish => {
                      const isChecked = calcSelectedDishes.includes(dish);
                      const nu = getDishNutrition(dish);
                      const hasAllergy = profile.allergies.some(a => dish.includes(a));

                      return (
                        <label
                          key={dish}
                          className={`group relative bg-surface-container-lowest rounded-DEFAULT p-4 shadow-[0px_2px_10px_rgba(79,111,0,0.02)] border-2 cursor-pointer active:scale-[0.98] transition-all duration-200 flex items-center justify-between ${
                            isChecked ? 'border-primary' : 'border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setCalcSelectedDishes(prev => prev.filter(d => d !== dish));
                              } else {
                                setCalcSelectedDishes(prev => [...prev, dish]);
                              }
                            }}
                            className="peer sr-only"
                          />
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                              isChecked 
                                ? 'border-primary bg-primary text-on-primary' 
                                : 'border-outline-variant text-transparent bg-background'
                            }`}>
                              <span className="material-symbols-outlined text-[16px] font-bold leading-none">check</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className={`font-body-lg text-[15px] transition-colors ${
                                isChecked ? 'text-primary' : 'text-on-surface'
                              }`}>
                                {dish}
                              </span>
                              {hasAllergy && (
                                <span className="text-[10px] text-error font-bold flex items-center gap-1">
                                  ⚠️ {profile.allergies.filter(a => dish.includes(a)).join(', ')} 포함
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`px-3 py-1.5 rounded-lg font-label-md text-label-md ${
                            isChecked 
                              ? 'bg-secondary-container text-on-secondary-container font-bold' 
                              : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            {nu.kcal} kcal
                          </div>
                        </label>
                      );
                    })}
                </div>

                {/* Trigger save action */}
                <div className="mt-4 pt-2">
                  <button
                    onClick={() => triggerToast('🍱 선택 영양 데이터가 김학생 님의 식단 일지에 안전하게 고정 저장되었습니다!')}
                    className="w-full h-14 bg-primary text-on-primary rounded-full font-headline-sm text-headline-sm hover:opacity-90 active:scale-98 transition-transform duration-200 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined font-bold">save</span>
                    계산 결과 저장하기
                  </button>
                </div>
              </motion.div>
            )}

            {/* 4. PROFILE TAB */}
            {currentTab === 'profile' && (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.23 }}
                className="px-margin-mobile pt-stack-md pb-stack-lg flex flex-col gap-stack-lg"
              >
                {/* Profile Detail Selector Header */}
                <section className="bg-surface-container-lowest rounded-lg p-5 shadow-[0px_4px_20px_rgba(79,111,0,0.06)] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary-fixed-dim relative">
                      <img
                        alt="Student profile"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6eBjzu6Q9fbkIHKNs3DyAq6Yidb2euacrWza0dxf7MDHel6iwz_MJgQYlk6VvfsT3ZnEy5Dcm67BBRlndEufrtGKrSvDAFp8Yd5NXZQQ3je3upOXS8d6ULZqN-PXvJmU23Hi6dCpvZGlVnp9FJ1MVm__DGa_9c2DYHSd-Pcti5dgbmu_kxanljqaE5HLSn3FCIcFOj0owI7Vu3qsCAkkzcYgaZDsm3NjkpbFeArRt9bJKaKMFb05LTjZInWfG3yRT8Bz5t-7FnXan"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-headline-md text-headline-md text-primary">{profile.name}</h2>
                      <span className="font-body-md text-body-md text-outline">
                        {profile.grade}학년 {profile.classRoom}반 {profile.number}번
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setTempName(profile.name);
                      setTempGrade(profile.grade);
                      setTempClass(profile.classRoom);
                      setTempNum(profile.number);
                      setProfileEditOpen(true);
                    }}
                    className="w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors flex items-center justify-center text-primary"
                  >
                    <span className="material-symbols-outlined text-[20px] font-bold">edit</span>
                  </button>
                </section>

                {/* Allergy warning profiles settings */}
                <section className="flex flex-col gap-stack-sm">
                  <h3 className="font-headline-sm text-headline-sm text-outline pl-1.5">알림 및 맞춤 설정</h3>
                  
                  <div className="bg-surface-container-lowest rounded-lg p-5 shadow-[0px_4px_20px_rgba(79,111,0,0.06)] flex flex-col gap-4">
                    {/* Allergy warning config edit link */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-error font-bold">warning</span>
                          <span className="font-body-md text-body-md font-bold text-on-surface">알레르기 경고 설정</span>
                        </div>
                        <button 
                          onClick={() => setAllergiesEditOpen(true)}
                          className="text-primary font-bold text-label-md underline hover:text-secondary"
                        >
                          수정
                        </button>
                      </div>

                      <p className="font-label-md text-label-md text-on-surface-variant leading-relaxed">
                        설정된 알레르기 유발 물질이 식단에 포함될 경우 경고 표시를 하며, 영양계산 탭에서도 돋보이게 강조합니다.
                      </p>

                      <div className="flex flex-wrap gap-2 mt-1">
                        {profile.allergies.map(allerg => (
                          <span 
                            key={allerg} 
                            className="px-3.5 py-1 rounded-full bg-error-container/40 text-error font-bold text-label-md border border-error-container/60"
                          >
                            {allerg}
                          </span>
                        ))}
                        {profile.allergies.length === 0 && (
                          <span className="px-3 py-1 rounded-full bg-surface-container-high text-outline text-label-md">
                            설정된 물질 없음
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-[1px] w-full bg-outline-variant/30"></div>

                    {/* Daily alert notification switcher toggle button */}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-body-md text-body-md font-bold text-on-surface">일일 식단 알림</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          매일 아침 7시 30분에 오늘의 식단을 카카오나 문자로 알려줍니다.
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const nextVal = !profile.mealAlertEnabled;
                          setProfile(prev => ({ ...prev, mealAlertEnabled: nextVal }));
                          triggerToast(nextVal ? '매일 아침 식단 알림이 활성화되었습니다! 🔔' : '식단 알림이 해제되었습니다. 🔕');
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                          profile.mealAlertEnabled ? 'bg-primary' : 'bg-surface-container-highest'
                        }`}
                      >
                        <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          profile.mealAlertEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}></span>
                      </button>
                    </div>
                  </div>
                </section>

                {/* Additional informative section links */}
                <section className="flex flex-col gap-stack-sm">
                  <h3 className="font-headline-sm text-headline-sm text-outline pl-1.5">정보 및 지원</h3>
                  <div className="bg-surface-container-lowest rounded-lg shadow-[0px_4px_20px_rgba(79,111,0,0.06)] overflow-hidden flex flex-col">
                    <button 
                      onClick={() => triggerToast('고객지원 센터 상담이 예약되었습니다. 💬')}
                      className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-outline">support_agent</span>
                        <span className="font-body-md text-body-sm text-on-surface">고객센터 / 문의하기</span>
                      </div>
                      <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
                    </button>
                    
                    <div className="h-[1px] w-[90%] mx-auto bg-outline-variant/20"></div>

                    <button 
                      onClick={() => triggerToast('개인정보처리방침 안내 파일을 다운로드 하였습니다.')}
                      className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-outline">description</span>
                        <span className="font-body-md text-body-sm text-on-surface">이용약관 및 개인정보처리방침</span>
                      </div>
                      <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
                    </button>

                    <div className="h-[1px] w-[90%] mx-auto bg-outline-variant/20"></div>

                    <button 
                      onClick={() => triggerToast('로그아웃이 완료되었습니다. 씨마스고등학교 급식 앱을 이용해 주셔서 감사합니다.')}
                      className="w-full flex items-center p-4 hover:bg-error-container/20 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-error">logout</span>
                        <span className="font-body-md text-body-sm text-error font-bold">로그아웃</span>
                      </div>
                    </button>
                  </div>
                </section>

                <footer className="mt-5 mb-2 text-center text-[11px] text-outline">
                  <p>© 2026 씨마스고등학교 급식. All rights reserved.</p>
                </footer>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* --- COMMON BOTTOM NAV BAR --- */}
        <nav className="fixed bottom-0 w-full max-w-[420px] h-16 bg-white/80 backdrop-blur-md border-t border-surface-container-high flex justify-around items-center z-40 shadow-[0_-3px_15px_rgba(79,111,0,0.04)] px-2 pb-safe">
          
          <button 
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200 active:scale-90 ${
              currentTab === 'home' ? 'text-primary font-bold' : 'text-outline hover:bg-surface-container-low transition-colors'
            }`}
          >
            <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: `'FILL' ${currentTab === 'home' ? 1 : 0}` }}>home</span>
            <span className="font-label-md text-[10px] leading-none">홈</span>
          </button>

          <button 
            onClick={() => setCurrentTab('diet')}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200 active:scale-90 ${
              currentTab === 'diet' ? 'text-primary font-bold' : 'text-outline hover:bg-surface-container-low transition-colors'
            }`}
          >
            <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: `'FILL' ${currentTab === 'diet' ? 1 : 0}` }}>calendar_month</span>
            <span className="font-label-md text-[10px] leading-none">식단표</span>
          </button>

          <button 
            onClick={() => setCurrentTab('calc')}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200 active:scale-90 ${
              currentTab === 'calc' ? 'text-primary font-bold' : 'text-outline hover:bg-surface-container-low transition-colors'
            }`}
          >
            <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: `'FILL' ${currentTab === 'calc' ? 1 : 0}` }}>calculate</span>
            <span className="font-label-md text-[10px] leading-none">영양계산</span>
          </button>

          <button 
            onClick={() => setCurrentTab('profile')}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200 active:scale-90 ${
              currentTab === 'profile' ? 'text-primary font-bold' : 'text-outline hover:bg-surface-container-low transition-colors'
            }`}
          >
            <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: `'FILL' ${currentTab === 'profile' ? 1 : 0}` }}>person</span>
            <span className="font-label-md text-[10px] leading-none">프로필</span>
          </button>

        </nav>

        {/* --- DYNAMIC INTERACTIVE FLOATING TOAST --- */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.93 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-inverse-surface/95 text-inverse-on-surface text-[12px] px-5 py-3 rounded-full shadow-xl flex items-center gap-2.5 z-50 text-center font-bold tracking-wide border border-outline/20 w-[300px] justify-center backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-[18px] text-primary-fixed-dim">check_circle</span>
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- ALLERGY EDIT DIALOG MODAL --- */}
        <AnimatePresence>
          {allergiesEditOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs scale-up-anim">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background rounded-lg p-5 w-full max-w-[340px] shadow-2xl flex flex-col gap-4 border border-outline-variant"
              >
                <div className="flex justify-between items-center pb-2 border-b border-surface-container-high">
                  <span className="font-headline-sm text-headline-sm text-primary">알레르기 경보편집</span>
                  <button 
                    onClick={() => setAllergiesEditOpen(false)}
                    className="text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-1">
                  {['우유', '땅콩', '대두', '밀', '새우', '게', '토마토', '돼지고기', '쇠고기', '닭고기'].map(itemName => {
                    const isSelected = profile.allergies.includes(itemName);
                    return (
                      <button
                        key={itemName}
                        onClick={() => {
                          if (isSelected) {
                            setProfile(prev => ({
                              ...prev,
                              allergies: prev.allergies.filter(a => a !== itemName)
                            }));
                          } else {
                            setProfile(prev => ({
                              ...prev,
                              allergies: [...prev.allergies, itemName]
                            }));
                          }
                        }}
                        className={`py-2 text-center rounded-lg font-label-md text-label-md transition-all border flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-error-container/40 text-error border-error-container font-bold'
                            : 'bg-surface-container-low border-transparent text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 bg-error rounded-full"></span>}
                        {itemName}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    setAllergiesEditOpen(false);
                    triggerToast('알레르기 필터 정보가 실시간으로 동기화 갱신되었습니다! 🥕');
                  }}
                  className="w-full h-11 bg-primary text-on-primary rounded-xl font-bold text-label-md mt-2 shadow-sm"
                >
                  변경사항 완료
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- STUDENT DISCLOSURE EDIT DIALOG MODAL --- */}
        <AnimatePresence>
          {profileEditOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs scale-up-anim">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background rounded-lg p-5 w-full max-w-[340px] shadow-2xl flex flex-col gap-4 border border-outline-variant"
              >
                <div className="flex justify-between items-center pb-2 border-b border-surface-container-high">
                  <span className="font-headline-sm text-headline-sm text-primary">프로필 상세 수정</span>
                  <button 
                    onClick={() => setProfileEditOpen(false)}
                    className="text-outline hover:text-on-surface animate-pulse"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3 mt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-outline">학생 이름</label>
                    <input 
                      type="text" 
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full h-10 border border-outline-variant rounded-md px-3 bg-surface-container-low outline-none text-[14px]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-outline">학년</label>
                      <input 
                        type="number" 
                        value={tempGrade}
                        onChange={(e) => setTempGrade(parseInt(e.target.value) || 0)}
                        className="w-full h-10 border border-outline-variant rounded-md px-3 bg-surface-container-low text-center outline-none text-[14px]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-outline">반</label>
                      <input 
                        type="number" 
                        value={tempClass}
                        onChange={(e) => setTempClass(parseInt(e.target.value) || 0)}
                        className="w-full h-10 border border-outline-variant rounded-md px-3 bg-surface-container-low text-center outline-none text-[14px]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-outline">번호</label>
                      <input 
                        type="number" 
                        value={tempNum}
                        onChange={(e) => setTempNum(parseInt(e.target.value) || 0)}
                        className="w-full h-10 border border-outline-variant rounded-md px-3 bg-surface-container-low text-center outline-none text-[14px]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setProfile(prev => ({
                      ...prev,
                      name: tempName,
                      grade: tempGrade,
                      classRoom: tempClass,
                      number: tempNum
                    }));
                    setProfileEditOpen(false);
                    triggerToast('김학생 님의 프로필이 최신 정보로 갱신되었습니다! 👤');
                  }}
                  className="w-full h-11 bg-primary text-on-primary rounded-xl font-bold text-label-md mt-2 shadow-sm"
                >
                  수정저장 완료
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
