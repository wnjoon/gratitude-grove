import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ContributionGraphProps {
  userId: string
}

export default function ContributionGraph({ userId }: ContributionGraphProps) {
  const [contributions, setContributions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContributions()
  }, [userId])

  const fetchContributions = async () => {
    setLoading(true)

    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const { data } = await supabase
      .from('diaries')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', oneYearAgo.toISOString())

    const contributionSet = new Set<string>()

    if (data) {
      data.forEach((diary) => {
        const date = new Date(diary.created_at)
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        contributionSet.add(dateKey)
      })
    }

    setContributions(contributionSet)
    setLoading(false)
  }

  const getDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const hasContribution = (date: Date): boolean => {
    return contributions.has(getDateKey(date))
  }

  // 최근 6개월 데이터 생성 (가로로 길게)
  const generateCalendarData = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 6개월 전부터 시작
    const startDate = new Date(today)
    startDate.setMonth(startDate.getMonth() - 5)
    startDate.setDate(1) // 해당 월의 1일부터

    const months: { month: number; year: number; days: (Date | null)[][] }[] = []

    const currentDate = new Date(startDate)

    while (currentDate <= today || currentDate.getMonth() === today.getMonth()) {
      const month = currentDate.getMonth()
      const year = currentDate.getFullYear()

      // 해당 월의 첫 날
      const firstDayOfMonth = new Date(year, month, 1)
      const startDayOfWeek = firstDayOfMonth.getDay() // 0 = 일요일

      // 해당 월의 마지막 날
      const lastDayOfMonth = new Date(year, month + 1, 0)
      const daysInMonth = lastDayOfMonth.getDate()

      // 7행 x N열 그리드 생성 (요일별로 행 구성)
      const weeks: (Date | null)[][] = []

      // 첫 주 계산
      let dayCounter = 1
      const totalWeeks = Math.ceil((startDayOfWeek + daysInMonth) / 7)

      for (let week = 0; week < totalWeeks; week++) {
        const weekDays: (Date | null)[] = []
        for (let day = 0; day < 7; day++) {
          if (week === 0 && day < startDayOfWeek) {
            weekDays.push(null)
          } else if (dayCounter > daysInMonth) {
            weekDays.push(null)
          } else {
            const date = new Date(year, month, dayCounter)
            if (date <= today) {
              weekDays.push(date)
            } else {
              weekDays.push(null)
            }
            dayCounter++
          }
        }
        weeks.push(weekDays)
      }

      months.push({ month, year, days: weeks })

      // 다음 달로
      currentDate.setMonth(currentDate.getMonth() + 1)
      if (currentDate > today && currentDate.getMonth() !== today.getMonth()) {
        break
      }
    }

    return months
  }

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const dayLabels = ['', '월', '', '수', '', '금', ''] // 일, 월, 화, 수, 목, 금, 토

  const formatDateForTooltip = (date: Date): string => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  const calendarData = generateCalendarData()

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex">
        {/* 요일 레이블 (왼쪽 고정) */}
        <div className="flex-shrink-0 mr-2">
          <div className="h-6"></div> {/* 월 레이블 높이만큼 빈 공간 */}
          <div className="flex flex-col gap-[3px]">
            {dayLabels.map((label, index) => (
              <div
                key={index}
                className="w-6 h-[14px] text-xs text-gray-500 flex items-center justify-end pr-1"
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* 월별 잔디 그리드 */}
        <div className="inline-flex gap-4">
          {calendarData.map(({ month, year, days }) => (
            <div key={`${year}-${month}`} className="flex-shrink-0">
              {/* 월 레이블 */}
              <div className="text-sm font-medium text-gray-600 mb-2 h-4">
                {monthNames[month]}
              </div>

              {/* 잔디 그리드 */}
              <div className="flex gap-[3px]">
                {days.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((date, dayIndex) => {
                      if (!date) {
                        return (
                          <div
                            key={dayIndex}
                            className="w-[14px] h-[14px]"
                          />
                        )
                      }

                      const hasEntry = hasContribution(date)
                      const isToday = getDateKey(date) === getDateKey(new Date())

                      return (
                        <div
                          key={dayIndex}
                          className={`w-[14px] h-[14px] rounded-sm cursor-default transition-colors ${
                            hasEntry
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-gray-200 hover:bg-gray-300'
                          } ${isToday ? 'ring-2 ring-green-600 ring-offset-1' : ''}`}
                          title={`${formatDateForTooltip(date)}: ${hasEntry ? '작성함' : '미작성'}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-[14px] h-[14px] rounded-sm bg-gray-200"></div>
          <span>미작성</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[14px] h-[14px] rounded-sm bg-green-500"></div>
          <span>작성</span>
        </div>
      </div>
    </div>
  )
}
