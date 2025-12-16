import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TreePine, Mail, Lock, User, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function SignUp() {
  const navigate = useNavigate()
  const { signUp, checkNicknameAvailable } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingNickname, setCheckingNickname] = useState(false)

  const validateNickname = (value: string) => {
    if (value.length > 6) {
      return '별명은 최대 6자까지 가능합니다.'
    }
    if (!/^[가-힣a-zA-Z0-9]*$/.test(value)) {
      return '별명은 한글, 영문, 숫자만 사용 가능합니다.'
    }
    return ''
  }

  const handleNicknameChange = async (value: string) => {
    setNickname(value)
    const validationError = validateNickname(value)

    if (validationError) {
      setNicknameError(validationError)
      return
    }

    if (value.length === 0) {
      setNicknameError('')
      return
    }

    setCheckingNickname(true)
    const isAvailable = await checkNicknameAvailable(value)
    setCheckingNickname(false)

    if (!isAvailable) {
      setNicknameError('이미 사용 중인 별명입니다.')
    } else {
      setNicknameError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password || !nickname) {
      setError('모든 항목을 입력해주세요.')
      return
    }

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    const validationError = validateNickname(nickname)
    if (validationError) {
      setError(validationError)
      return
    }

    if (nicknameError) {
      setError(nicknameError)
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, nickname)
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center gap-2 mb-2">
            <TreePine className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-800">매일 감사 심기</h1>
          </Link>
          <p className="text-gray-500">안녕하세요, 새로 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="8자 이상 입력해주세요"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              별명
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  nicknameError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="최대 6자 (한글/영문/숫자)"
                maxLength={6}
              />
              {checkingNickname && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
              )}
            </div>
            {nicknameError && (
              <p className="mt-1 text-sm text-red-500">{nicknameError}</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || checkingNickname || !!nicknameError}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                가입 중...
              </>
            ) : (
              '회원가입'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-green-600 hover:underline font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
