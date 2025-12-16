import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TreePine, Plus, X, Save, Loader2, ChevronLeft, ChevronRight, Pencil, Trash2, Menu, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import ContributionGraph from '@/components/ContributionGraph'

interface Diary {
  id: string
  user_id: string
  content: string[]
  created_at: string
  like_count: number
}

export default function MyDiary() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const [diaries, setDiaries] = useState<Diary[]>([])
  const [todayDiary, setTodayDiary] = useState<Diary | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [yearlyCount, setYearlyCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 일기 작성/수정 모드
  const [isEditing, setIsEditing] = useState(false)
  const [editingDiary, setEditingDiary] = useState<Diary | null>(null)
  const [inputs, setInputs] = useState<string[]>(['', '', ''])

  // 페이지네이션
  const [page, setPage] = useState(1)
  const perPage = 9

  // 삭제 확인 모달
  const [deleteTarget, setDeleteTarget] = useState<Diary | null>(null)

  // 모바일 메뉴
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 날짜 필터
  const [filterYear, setFilterYear] = useState<number | null>(null)
  const [filterMonth, setFilterMonth] = useState<number | null>(null)
  const [filterDay, setFilterDay] = useState<number | null>(null)
  const [filteredCount, setFilteredCount] = useState(0)

  useEffect(() => {
    if (!profile) {
      navigate('/login')
      return
    }
    fetchData()
  }, [profile, page, filterYear, filterMonth, filterDay])

  const fetchData = async () => {
    if (!profile) return
    setLoading(true)

    // 오늘의 일기 확인
    const { data: todayData } = await supabase.rpc('get_today_diary', {
      p_user_id: profile.id,
    })

    if (todayData && todayData.length > 0) {
      setTodayDiary(todayData[0])
    } else {
      setTodayDiary(null)
    }

    // 전체 일기 수
    const { count } = await supabase
      .from('diaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)

    setTotalCount(count || 0)

    // 날짜 필터가 적용된 경우
    const hasFilter = filterYear !== null || filterMonth !== null || filterDay !== null

    if (hasFilter) {
      // 날짜 범위 계산
      let startDate: Date
      let endDate: Date
      const now = new Date()

      if (filterYear !== null && filterMonth !== null && filterDay !== null) {
        // 특정 일
        startDate = new Date(filterYear, filterMonth - 1, filterDay, 0, 0, 0)
        endDate = new Date(filterYear, filterMonth - 1, filterDay, 23, 59, 59)
      } else if (filterYear !== null && filterMonth !== null) {
        // 특정 월
        startDate = new Date(filterYear, filterMonth - 1, 1, 0, 0, 0)
        endDate = new Date(filterYear, filterMonth, 0, 23, 59, 59) // 해당 월의 마지막 날
      } else if (filterYear !== null) {
        // 특정 년도
        startDate = new Date(filterYear, 0, 1, 0, 0, 0)
        endDate = new Date(filterYear, 11, 31, 23, 59, 59)
      } else {
        // 년도 없이 월/일만 선택된 경우 - 현재 년도 기준
        const year = now.getFullYear()
        if (filterMonth !== null && filterDay !== null) {
          startDate = new Date(year, filterMonth - 1, filterDay, 0, 0, 0)
          endDate = new Date(year, filterMonth - 1, filterDay, 23, 59, 59)
        } else if (filterMonth !== null) {
          startDate = new Date(year, filterMonth - 1, 1, 0, 0, 0)
          endDate = new Date(year, filterMonth, 0, 23, 59, 59)
        } else {
          // 이 경우는 발생하지 않음
          startDate = new Date(0)
          endDate = now
        }
      }

      // 필터링된 일기 수
      const { count: filteredCountResult } = await supabase
        .from('diaries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      setFilteredCount(filteredCountResult || 0)

      // 필터링된 일기 목록
      const { data: diariesData } = await supabase
        .from('diaries')
        .select('*')
        .eq('user_id', profile.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1)

      setDiaries(diariesData || [])
    } else {
      // 필터 없이 전체 목록
      setFilteredCount(count || 0)

      const { data: diariesData } = await supabase
        .from('diaries')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1)

      setDiaries(diariesData || [])
    }

    setLoading(false)
  }

  const clearFilters = () => {
    setFilterYear(null)
    setFilterMonth(null)
    setFilterDay(null)
    setPage(1)
  }

  // 년도 옵션 생성 (2025년부터 현재 연도까지)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const startYear = 2025
    const years = []
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year)
    }
    return years
  }

  // 월 옵션 생성
  const getMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1)
  }

  // 일 옵션 생성 (선택된 년/월에 따라)
  const getDayOptions = () => {
    if (filterYear === null || filterMonth === null) {
      return Array.from({ length: 31 }, (_, i) => i + 1)
    }
    const daysInMonth = new Date(filterYear, filterMonth, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 100) return
    const newInputs = [...inputs]
    newInputs[index] = value
    setInputs(newInputs)
  }

  const addInput = () => {
    if (inputs.length < 3) {
      setInputs([...inputs, ''])
    }
  }

  const removeInput = (index: number) => {
    if (inputs.length > 1) {
      const newInputs = inputs.filter((_, i) => i !== index)
      setInputs(newInputs)
    }
  }

  const startEditing = (diary?: Diary) => {
    if (diary) {
      // 수정 모드
      setEditingDiary(diary)
      setInputs([...diary.content, ...Array(3 - diary.content.length).fill('')].slice(0, 3))
    } else {
      // 새 작성 모드
      setEditingDiary(null)
      setInputs(['', '', ''])
    }
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditingDiary(null)
    setInputs(['', '', ''])
  }

  const saveDiary = async () => {
    const filteredContent = inputs.filter(input => input.trim() !== '')
    if (filteredContent.length === 0) return

    setSaving(true)

    if (editingDiary) {
      // 수정
      const { error } = await supabase
        .from('diaries')
        .update({ content: filteredContent })
        .eq('id', editingDiary.id)

      if (!error) {
        await fetchData()
        cancelEditing()
      }
    } else {
      // 새 작성
      const { error } = await supabase
        .from('diaries')
        .insert({
          user_id: profile!.id,
          content: filteredContent,
        })

      if (!error) {
        await fetchData()
        cancelEditing()
      }
    }

    setSaving(false)
  }

  const deleteDiary = async () => {
    if (!deleteTarget) return

    const { error } = await supabase
      .from('diaries')
      .delete()
      .eq('id', deleteTarget.id)

    if (!error) {
      await fetchData()
    }
    setDeleteTarget(null)
  }

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    return (
      date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }) ===
      today.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Seoul',
    })
  }

  const hasFilter = filterYear !== null || filterMonth !== null || filterDay !== null
  const totalPages = Math.ceil((hasFilter ? filteredCount : totalCount) / perPage)

  if (!profile) return null

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <TreePine className="w-6 h-6 text-green-600" />
            <span className="text-xl font-bold text-gray-800">감사의 정원</span>
          </Link>

          {/* 데스크탑 메뉴 */}
          <nav className="hidden md:flex items-center gap-4">
            <span className="text-gray-600">
              안녕하세요, <span className="font-medium">{profile.nickname}</span>님
            </span>
            <Link
              to="/my-diary"
              className="px-4 py-2 text-green-600 bg-green-50 rounded-lg"
            >
              나의 일기
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              로그아웃
            </button>
          </nav>

          {/* 모바일 햄버거 버튼 */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <p className="text-gray-600 text-sm pb-2 border-b border-gray-100">
                안녕하세요, <span className="font-medium">{profile.nickname}</span>님
              </p>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                홈
              </Link>
              <Link
                to="/my-diary"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-green-600 bg-green-50 rounded-lg"
              >
                나의 일기
              </Link>
              <button
                onClick={() => {
                  signOut()
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 통계 섹션 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">나의 감사 기록</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600 mb-4">
              최근 1년간 <span className="text-2xl font-bold text-green-600">{yearlyCount}</span>개의 감사를 기록했어요
            </p>
            <ContributionGraph
              key={totalCount}
              userId={profile.id}
              onYearlyCountChange={setYearlyCount}
            />
          </div>
        </section>

        {/* 오늘의 일기 작성/수정 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">오늘의 감사</h2>
            {!isEditing && !todayDiary && (
              <button
                onClick={() => startEditing()}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                작성하기
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                {inputs.map((input, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        placeholder={`감사한 일 ${index + 1}`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        maxLength={100}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {input.length}/100
                      </span>
                    </div>
                    {inputs.length > 1 && (
                      <button
                        onClick={() => removeInput(index)}
                        className="p-3 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {inputs.length < 3 && (
                <button
                  onClick={addInput}
                  className="mt-4 flex items-center gap-2 text-green-600 hover:text-green-700"
                >
                  <Plus className="w-4 h-4" />
                  항목 추가
                </button>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={saveDiary}
                  disabled={saving || inputs.every(i => i.trim() === '')}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  저장
                </button>
                <button
                  onClick={cancelEditing}
                  className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : todayDiary ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-green-600 mb-2">오늘 작성 완료</p>
                  <ul className="space-y-2">
                    {todayDiary.content.map((item, index) => (
                      <li key={index} className="text-gray-700">• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(todayDiary)}
                    className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                    title="수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(todayDiary)}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">아직 오늘의 감사를 기록하지 않았어요</p>
            </div>
          )}
        </section>

        {/* 일기 목록 */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800">지난 기록</h2>

            {/* 날짜 필터 */}
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={filterYear ?? ''}
                onChange={(e) => {
                  setFilterYear(e.target.value ? Number(e.target.value) : null)
                  setPage(1)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">전체 연도</option>
                {getYearOptions().map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <select
                value={filterMonth ?? ''}
                onChange={(e) => {
                  setFilterMonth(e.target.value ? Number(e.target.value) : null)
                  setFilterDay(null) // 월 변경 시 일 초기화
                  setPage(1)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">전체 월</option>
                {getMonthOptions().map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
              <select
                value={filterDay ?? ''}
                onChange={(e) => {
                  setFilterDay(e.target.value ? Number(e.target.value) : null)
                  setPage(1)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">전체 일</option>
                {getDayOptions().map(day => (
                  <option key={day} value={day}>{day}일</option>
                ))}
              </select>
              {(filterYear !== null || filterMonth !== null || filterDay !== null) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 필터 결과 안내 */}
          {(filterYear !== null || filterMonth !== null || filterDay !== null) && (
            <p className="text-sm text-gray-500 mb-4">
              {filterYear && `${filterYear}년`}
              {filterMonth && ` ${filterMonth}월`}
              {filterDay && ` ${filterDay}일`}
              {' '}기록: <span className="font-medium text-green-600">{filteredCount}</span>개
            </p>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
          ) : diaries.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">
                {hasFilter ? '선택한 기간에 기록된 감사가 없어요' : '아직 기록된 감사가 없어요'}
              </p>
              {hasFilter && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-green-600 hover:underline"
                >
                  필터 초기화
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {diaries.map((diary) => (
                  <div
                    key={diary.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm text-gray-500">{formatDate(diary.created_at)}</p>
                      {isToday(diary.created_at) && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditing(diary)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(diary)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {diary.content.map((item, index) => (
                        <li key={index} className="text-gray-700 text-sm">• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">일기 삭제</h3>
            <p className="text-gray-600 mb-6">정말 이 일기를 삭제하시겠어요?</p>
            <div className="flex gap-3">
              <button
                onClick={deleteDiary}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
