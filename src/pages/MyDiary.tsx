import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TreePine, Plus, X, Save, Loader2, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
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

  useEffect(() => {
    if (!profile) {
      navigate('/login')
      return
    }
    fetchData()
  }, [profile, page])

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

    // 페이지네이션된 일기 목록
    const { data: diariesData } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)

    setDiaries(diariesData || [])
    setLoading(false)
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

  const totalPages = Math.ceil(totalCount / perPage)

  if (!profile) return null

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <TreePine className="w-6 h-6 text-green-600" />
            <span className="text-xl font-bold text-gray-800">Gratitude Grove</span>
          </Link>

          <nav className="flex items-center gap-4">
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
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 통계 섹션 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">나의 감사 기록</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600 mb-4">
              총 <span className="text-2xl font-bold text-green-600">{totalCount}</span>개의 감사를 기록했어요
            </p>
            <ContributionGraph userId={profile.id} />
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
          <h2 className="text-lg font-bold text-gray-800 mb-4">지난 기록</h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
          ) : diaries.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">아직 기록된 감사가 없어요</p>
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
