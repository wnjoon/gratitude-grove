import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  email: string
  nickname: string
  created_at: string
}

interface AuthContextType {
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, nickname: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => void
  updateNickname: (nickname: string) => Promise<{ error: Error | null }>
  checkNicknameAvailable: (nickname: string, excludeUserId?: string) => Promise<boolean>
  checkEmailAvailable: (email: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'gratitude_grove_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Profile
        setProfile(parsed)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const checkNicknameAvailable = async (nickname: string, excludeUserId?: string): Promise<boolean> => {
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('nickname', nickname)

    if (excludeUserId) {
      query = query.neq('id', excludeUserId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error('Error checking nickname:', error)
      return false
    }
    return data === null
  }

  const checkEmailAvailable = async (email: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Error checking email:', error)
      return false
    }
    return data === null
  }

  const signUp = async (email: string, password: string, nickname: string) => {
    // 이메일 중복 체크
    const isEmailAvailable = await checkEmailAvailable(email)
    if (!isEmailAvailable) {
      return { error: new Error('이미 사용 중인 이메일입니다.') }
    }

    // 별명 중복 체크
    const isNicknameAvailable = await checkNicknameAvailable(nickname)
    if (!isNicknameAvailable) {
      return { error: new Error('이미 사용 중인 별명입니다.') }
    }

    // DB Function을 호출하여 회원가입 (비밀번호 해싱은 DB에서 처리)
    const { data, error } = await supabase.rpc('signup_user', {
      p_email: email,
      p_password: password,
      p_nickname: nickname,
    })

    if (error) {
      console.error('Signup error:', error)
      return { error: new Error('회원가입에 실패했습니다.') }
    }

    if (data && (Array.isArray(data) ? data.length > 0 : true)) {
      const userData = Array.isArray(data) ? data[0] : data
      const newProfile: Profile = {
        id: userData.id,
        email: userData.email,
        nickname: userData.nickname,
        created_at: userData.created_at,
      }
      setProfile(newProfile)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile))
    }

    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    // DB Function을 호출하여 로그인 (비밀번호 검증은 DB에서 처리)
    const { data, error } = await supabase.rpc('signin_user', {
      p_email: email,
      p_password: password,
    })

    if (error) {
      console.error('Signin error:', error)
      return { error: new Error('로그인에 실패했습니다.') }
    }

    if (!data || data.length === 0) {
      return { error: new Error('이메일 또는 비밀번호가 올바르지 않습니다.') }
    }

    const userData = Array.isArray(data) ? data[0] : data
    const userProfile: Profile = {
      id: userData.id,
      email: userData.email,
      nickname: userData.nickname,
      created_at: userData.created_at,
    }
    setProfile(userProfile)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile))

    return { error: null }
  }

  const signOut = () => {
    setProfile(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const updateNickname = async (nickname: string) => {
    if (!profile) {
      return { error: new Error('로그인이 필요합니다.') }
    }

    const isAvailable = await checkNicknameAvailable(nickname, profile.id)
    if (!isAvailable) {
      return { error: new Error('이미 사용 중인 별명입니다.') }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ nickname })
      .eq('id', profile.id)

    if (error) {
      return { error: new Error('별명 변경에 실패했습니다.') }
    }

    const updatedProfile = { ...profile, nickname }
    setProfile(updatedProfile)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile))

    return { error: null }
  }

  return (
    <AuthContext.Provider value={{
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateNickname,
      checkNicknameAvailable,
      checkEmailAvailable,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
