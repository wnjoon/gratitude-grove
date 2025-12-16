import { TreePine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { profile, signOut } = useAuth()

  console.log('Current profile:', profile)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TreePine className="w-6 h-6 text-green-600" />
            <span className="text-xl font-bold text-gray-800">Gratitude Grove</span>
          </div>

          <nav className="flex items-center gap-4">
            {profile ? (
              <>
                <span className="text-gray-600">
                  안녕하세요, <span className="font-medium">{profile?.nickname}</span>님
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <TreePine className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">감사의 정원</h1>
          <p className="text-gray-500 mb-8">
            하루 세 가지 감사한 일을 기록하고, 함께 나누세요.
          </p>
          {!profile && (
            <Link
              to="/signup"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              시작하기
            </Link>
          )}
        </div>

        {/* Placeholder for Masonry Feed */}
        <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-200 rounded-lg">
          메인 피드 영역 (Phase 3에서 구현)
        </div>
      </main>
    </div>
  )
}
