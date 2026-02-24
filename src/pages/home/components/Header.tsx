import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { normalizeRole } from '../../../hooks/useAuth'

export default function Header() {
  const { user, userProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleLogout = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
    navigate('/')
  }

  const getRoleText = (role: string | null) => {
    if (!role) return '未設定'
    const r = role.toLowerCase()
    if (r === 'client' || r === 'customer') return '依頼者'
    if (r === 'worker' || r === 'employee') return '従業員'
    if (r === 'admin') return '管理者'
    return role
  }

  const normalizedRole = userProfile ? normalizeRole(userProfile.role) : null

  const goDashboard = () => {
    if (normalizedRole === 'customer') navigate('/dashboard/customer')
    else if (normalizedRole === 'employee') navigate('/dashboard/employee')
    else if (normalizedRole === 'admin') navigate('/dashboard/admin')
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          <div
            className="flex items-center font-bold text-purple-600 text-lg cursor-pointer"
            onClick={() => navigate('/')}
          >
            Brawl Support
          </div>

          <nav className="hidden md:flex space-x-6">
            <button
              onClick={() => navigate('/services')}
              className="text-gray-700 hover:text-purple-600 font-medium"
            >
              サービス
            </button>
            <button
              onClick={() => navigate('/games')}
              className="text-gray-700 hover:text-purple-600 font-medium"
            >
              プロダクツ
            </button>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {normalizedRole && (
                  <button
                    onClick={goDashboard}
                    className="text-gray-700 hover:text-purple-600 transition-colors duration-200 text-sm font-medium"
                  >
                    ダッシュボード
                  </button>
                )}

                {userProfile && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-700 text-sm">{user.email}</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {getRoleText(userProfile.role)}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isSigningOut}
                  className="px-4 py-2 text-gray-700 hover:text-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isSigningOut ? 'ログアウト中…' : 'ログアウト'}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-700 hover:text-purple-600 text-sm"
                >
                  ログイン
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  新規登録
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}
