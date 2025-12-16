import { TreeDeciduous } from 'lucide-react'

interface DiaryBubbleProps {
  id: string
  nickname: string
  content: string[]
  createdAt: string
  likeCount: number
  isLiked?: boolean
  isLoggedIn: boolean
  onClick: () => void
  onLikeClick: (e: React.MouseEvent) => void
  animationDelay?: number
}

export default function DiaryBubble({
  nickname,
  content,
  createdAt,
  likeCount,
  isLiked = false,
  isLoggedIn,
  onClick,
  onLikeClick,
  animationDelay = 0,
}: DiaryBubbleProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Seoul',
    })
  }

  // 20자 이상이면 말줄임
  const truncateText = (text: string) => {
    if (text.length > 20) {
      return text.slice(0, 20) + '...'
    }
    return text
  }

  return (
    <div
      className="relative bg-white border border-gray-200 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={onClick}
    >
      {/* 헤더: 별명, 날짜 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">{nickname}</span>
        <span className="text-xs text-gray-400">{formatDate(createdAt)}</span>
      </div>

      {/* 본문: 감사 내용 */}
      <ul className="space-y-1.5 mb-3">
        {content.map((item, index) => (
          <li key={index} className="text-gray-600 text-sm">
            • {truncateText(item)}
          </li>
        ))}
      </ul>

      {/* 좋아요 버튼 */}
      <div className="flex items-center justify-end">
        <button
          onClick={onLikeClick}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
            isLiked
              ? 'text-green-600 bg-green-50'
              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
          } ${!isLoggedIn ? 'cursor-default' : ''}`}
        >
          <TreeDeciduous className={`w-4 h-4 ${isLiked ? 'fill-green-600' : ''}`} />
          <span>{likeCount}</span>
        </button>
      </div>

      {/* 말풍선 꼬리 (우측 하단) */}
      <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45" />
    </div>
  )
}
