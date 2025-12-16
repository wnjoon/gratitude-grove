import { useState, useEffect } from 'react'
import { TreePine, Menu, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import DiaryBubble from '@/components/DiaryBubble'
import DiaryModal from '@/components/DiaryModal'

interface DiaryWithProfile {
  id: string
  user_id: string
  content: string[]
  created_at: string
  like_count: number
  profiles: {
    nickname: string
  }
}

interface LikeRecord {
  diary_id: string
}

export default function Home() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const [diaries, setDiaries] = useState<DiaryWithProfile[]>([])
  const [likedDiaries, setLikedDiaries] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedDiary, setSelectedDiary] = useState<DiaryWithProfile | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchDiaries()
    if (profile) {
      fetchLikedDiaries()
    }
  }, [profile])

  const fetchDiaries = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('diaries')
      .select(`
        id,
        user_id,
        content,
        created_at,
        like_count,
        profiles (
          nickname
        )
      `)
      .order('created_at', { ascending: false })
      .limit(21)

    if (error) {
      console.error('Error fetching diaries:', error)
    } else {
      setDiaries(data as unknown as DiaryWithProfile[])
    }
    setLoading(false)
  }

  const fetchLikedDiaries = async () => {
    if (!profile) return

    const { data } = await supabase
      .from('likes')
      .select('diary_id')
      .eq('user_id', profile.id)

    if (data) {
      const likedSet = new Set((data as LikeRecord[]).map(d => d.diary_id))
      setLikedDiaries(likedSet)
    }
  }

  const handleLikeClick = async (e: React.MouseEvent, diaryId: string) => {
    e.stopPropagation()

    if (!profile) {
      navigate('/login')
      return
    }

    const isLiked = likedDiaries.has(diaryId)

    if (isLiked) {
      // 좋아요 취소
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', profile.id)
        .eq('diary_id', diaryId)

      if (!error) {
        setLikedDiaries(prev => {
          const newSet = new Set(prev)
          newSet.delete(diaryId)
          return newSet
        })
        setDiaries(prev =>
          prev.map(d =>
            d.id === diaryId ? { ...d, like_count: d.like_count - 1 } : d
          )
        )
        if (selectedDiary?.id === diaryId) {
          setSelectedDiary(prev => prev ? { ...prev, like_count: prev.like_count - 1 } : null)
        }
      }
    } else {
      // 좋아요 추가
      const { error } = await supabase
        .from('likes')
        .insert({ user_id: profile.id, diary_id: diaryId })

      if (!error) {
        setLikedDiaries(prev => new Set(prev).add(diaryId))
        setDiaries(prev =>
          prev.map(d =>
            d.id === diaryId ? { ...d, like_count: d.like_count + 1 } : d
          )
        )
        if (selectedDiary?.id === diaryId) {
          setSelectedDiary(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : null)
        }
      }
    }
  }

  const handleModalLikeClick = () => {
    if (selectedDiary) {
      handleLikeClick({ stopPropagation: () => {} } as React.MouseEvent, selectedDiary.id)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <TreePine className="w-6 h-6 text-green-600" />
            <span className="text-xl font-bold text-gray-800">매일 감사 심기</span>
          </Link>

          {/* 데스크탑 메뉴 */}
          <nav className="hidden md:flex items-center gap-4">
            {profile ? (
              <>
                <span className="text-gray-600">
                  안녕하세요, <span className="font-medium">{profile.nickname}</span>님
                </span>
                <Link
                  to="/my-diary"
                  className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  나의 일기
                </Link>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  회원가입
                </Link>
              </>
            )}
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
              {profile ? (
                <>
                  <p className="text-gray-600 text-sm pb-2 border-b border-gray-100">
                    안녕하세요, <span className="font-medium">{profile.nickname}</span>님
                  </p>
                  <Link
                    to="/my-diary"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 소개 섹션 */}
        <div className="text-center py-10 mb-8">
          <TreePine className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <p className="text-3xl md:text-4xl text-gray-600 font-medium">
            하루 세 가지 감사한 일을 기록하고, 함께 나누세요.
          </p>
        </div>

        {/* 메인 피드 - Masonry Layout */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : diaries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">아직 공유된 감사가 없어요</p>
            {profile ? (
              <Link
                to="/my-diary"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                첫 번째 감사 남기기
              </Link>
            ) : (
              <Link
                to="/signup"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                시작하기
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Masonry Grid */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
              {diaries.map((diary, index) => (
                <div key={diary.id} className="break-inside-avoid mb-4">
                  <DiaryBubble
                    id={diary.id}
                    nickname={diary.profiles.nickname}
                    content={diary.content}
                    createdAt={diary.created_at}
                    likeCount={diary.like_count}
                    isLiked={likedDiaries.has(diary.id)}
                    isLoggedIn={!!profile}
                    onClick={() => setSelectedDiary(diary)}
                    onLikeClick={(e) => handleLikeClick(e, diary.id)}
                    animationDelay={index * 50}
                  />
                </div>
              ))}
            </div>

            {/* 비로그인 사용자 안내 */}
            {!profile && (
              <div className="text-center py-10 mt-8 border-t border-gray-100">
                <p className="text-gray-500 mb-4">
                  회원으로 가입하시고 함께 감사를 공유하세요.
                </p>
                <Link
                  to="/signup"
                  className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  회원가입
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      {/* 상세 보기 모달 */}
      {selectedDiary && (
        <DiaryModal
          isOpen={!!selectedDiary}
          onClose={() => setSelectedDiary(null)}
          nickname={selectedDiary.profiles.nickname}
          content={selectedDiary.content}
          createdAt={selectedDiary.created_at}
          likeCount={selectedDiary.like_count}
          isLiked={likedDiaries.has(selectedDiary.id)}
          isLoggedIn={!!profile}
          onLikeClick={handleModalLikeClick}
        />
      )}
    </div>
  )
}
