import { X, TreeDeciduous } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DiaryModalProps {
  isOpen: boolean
  onClose: () => void
  nickname: string
  content: string[]
  createdAt: string
  likeCount: number
  isLiked: boolean
  isLoggedIn: boolean
  onLikeClick: () => void
}

export default function DiaryModal({
  isOpen,
  onClose,
  nickname,
  content,
  createdAt,
  likeCount,
  isLiked,
  isLoggedIn,
  onLikeClick,
}: DiaryModalProps) {
  const [isClosing, setIsClosing] = useState(false)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Seoul',
    })
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 200)
  }

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isClosing ? 'animate-fade-out' : 'animate-fade-in'
      }`}
      onClick={handleClose}
    >
      {/* 배경 오버레이 - 블러 효과 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* 모달 컨텐츠 - 말풍선 스타일 */}
      <div
        className={`relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl ${
          isClosing ? 'animate-scale-down' : 'animate-scale-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 헤더 */}
        <div className="mb-4 pr-8">
          <h3 className="text-lg font-bold text-gray-800">{nickname}님의 감사</h3>
          <p className="text-sm text-gray-500">{formatDate(createdAt)}</p>
        </div>

        {/* 본문 */}
        <ul className="space-y-3 mb-6">
          {content.map((item, index) => (
            <li key={index} className="text-gray-700">
              • {item}
            </li>
          ))}
        </ul>

        {/* 좋아요 버튼 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={onLikeClick}
            disabled={!isLoggedIn}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
              isLiked
                ? 'text-green-600 bg-green-50'
                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
            } ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <TreeDeciduous className={`w-5 h-5 ${isLiked ? 'fill-green-600' : ''}`} />
            <span>{likeCount}명이 공감했어요</span>
          </button>

          {!isLoggedIn && (
            <span className="text-xs text-gray-400">로그인 후 공감할 수 있어요</span>
          )}
        </div>

        {/* 말풍선 꼬리 */}
        <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white shadow-lg transform rotate-45" />
      </div>
    </div>
  )
}
