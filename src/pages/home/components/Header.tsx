import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { normalizeRole } from '../../../hooks/useAuth'
import NotificationBell from '../../../components/NotificationBell'

/* ── Role-based menu definitions ── */
interface MenuItem {
  icon: string
  label: string
  path: string
}

const customerMenu: MenuItem[] = [
  { icon: 'ri-file-list-3-line', label: '注文履歴', path: '/dashboard/customer' },
  { icon: 'ri-user-settings-line', label: 'アカウント', path: '/account' },
  { icon: 'ri-notification-3-line', label: 'お知らせ', path: '/notifications' },
]

const employeeMenu: MenuItem[] = [
  { icon: 'ri-dashboard-line', label: 'ダッシュボード', path: '/dashboard/employee' },
  { icon: 'ri-user-settings-line', label: 'アカウント', path: '/account' },
  { icon: 'ri-notification-3-line', label: 'お知らせ', path: '/notifications' },
]

const adminMenu: MenuItem[] = [
  { icon: 'ri-dashboard-line', label: 'ダッシュボード', path: '/dashboard/admin' },
]

function getMenuForRole(role: string | null): MenuItem[] {
  if (role === 'customer') return customerMenu
  if (role === 'employee') return employeeMenu
  if (role === 'admin') return adminMenu
  return []
}

function getRoleLabel(role: string | null): string {
  if (role === 'customer') return '依頼者'
  if (role === 'employee') return '代行者'
  if (role === 'admin') return '管理者'
  return ''
}

export default function Header() {
  const { user, userProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY
      setScrolled(currentY > 10)

      // Hide/show on mobile (< 768px)
      if (window.innerWidth < 768) {
        if (currentY > lastScrollY.current && currentY > 64) {
          setHeaderVisible(false)
          setMenuOpen(false)
        } else {
          setHeaderVisible(true)
        }
      } else {
        setHeaderVisible(true)
      }
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Close menu on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleLogout = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
    setMenuOpen(false)
    navigate('/')
  }

  const normalizedRole = userProfile ? normalizeRole(userProfile.role) : null
  const menuItems = getMenuForRole(normalizedRole)
  const roleLabel = getRoleLabel(normalizedRole)

  const handleMenuNav = (path: string) => {
    setMenuOpen(false)
    navigate(path)
  }

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate('/')
      setTimeout(() => {
        const target = document.getElementById(id)
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }

  const navColor = 'text-[#6B7280] hover:text-[#1A1A2E]'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] ${
        scrolled ? 'shadow-sm' : ''
      } ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      {/* Dropdown keyframes */}
      <style>{`
        @keyframes userMenu-slideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes userMenu-itemIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .userMenu-panel {
          animation: userMenu-slideIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .userMenu-item {
          opacity: 0;
          animation: userMenu-itemIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .userMenu-item-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .userMenu-item-btn:hover {
          background: #F3F0FF;
        }
        .userMenu-item-btn:hover .userMenu-icon {
          color: #5B3AE8;
        }
        .userMenu-item-btn:hover .userMenu-label {
          color: #1A1A2E;
        }
        .userMenu-logout:hover {
          background: #FEF2F2;
        }
        .userMenu-logout:hover .userMenu-icon {
          color: #EF4444;
        }
        .userMenu-logout:hover .userMenu-label {
          color: #DC2626;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[64px]">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6 sm:gap-8">
            {/* Logo */}
            <div
              className="flex items-center cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <img
                src="/logo.png"
                alt="げむ助"
                className="h-14 w-auto"
              />
            </div>

            {/* Nav links */}
            <nav className="flex items-center gap-5 sm:gap-6">
              <button
                onClick={() => navigate('/games')}
                className={`text-[12px] font-bold tracking-wider uppercase transition-colors duration-300 cursor-pointer ${navColor}`}
                style={{ fontFamily: '"Rajdhani", sans-serif' }}
              >
                ゲーム
              </button>
              {/* Desktop only: smooth scroll links */}
              <button
                onClick={() => scrollTo('how-it-works')}
                className={`hidden md:block text-[12px] font-bold tracking-wider uppercase transition-colors duration-300 cursor-pointer ${navColor}`}
                style={{ fontFamily: '"Rajdhani", sans-serif' }}
              >
                使い方
              </button>
              <button
                onClick={() => scrollTo('faq')}
                className={`hidden md:block text-[12px] font-bold tracking-wider uppercase transition-colors duration-300 cursor-pointer ${navColor}`}
                style={{ fontFamily: '"Rajdhani", sans-serif' }}
              >
                FAQ
              </button>
            </nav>
          </div>

          {/* Right: Auth / User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <NotificationBell />
                {/* User avatar + dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                      menuOpen
                        ? 'bg-[#5B3AE8] text-white shadow-[0_0_16px_rgba(91,58,232,0.4)]'
                        : 'bg-[#F5F5F5] text-[#666] hover:bg-[#EBEBEB] hover:text-[#111]'
                    }`}
                  >
                    <i className="ri-user-3-fill text-sm"></i>
                  </button>

                  {/* ── Dropdown Panel ── */}
                  {menuOpen && (
                    <div
                      className="userMenu-panel absolute right-0 top-full mt-3 w-56 rounded-xl bg-white border border-[#E8E4F3] z-50"
                      style={{
                        boxShadow: '0 12px 36px rgba(91,58,232,0.08), 0 4px 12px rgba(0,0,0,0.06)',
                      }}
                    >
                      <div className="py-2">
                        {/* User info header */}
                        <div className="px-4 pt-1.5 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#F3F0FF] flex items-center justify-center shrink-0">
                              <i className="ri-user-3-fill text-[#5B3AE8] text-sm"></i>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-[11px] font-bold text-[#1A1A2E] truncate"
                                style={{ fontFamily: '"Rajdhani", sans-serif' }}
                              >
                                {user.email}
                              </p>
                              {roleLabel && (
                                <span
                                  className="inline-block mt-0.5 text-[9px] font-bold tracking-[0.15em] uppercase text-[#5B3AE8]"
                                  style={{ fontFamily: '"Orbitron", sans-serif' }}
                                >
                                  {roleLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Separator */}
                        <div className="mx-3 h-[1px] bg-[#E8E4F3]" />

                        {/* Menu items */}
                        <div className="py-1.5 px-2">
                          {menuItems.map((item, i) => (
                            <button
                              key={item.path + item.label}
                              onClick={() => handleMenuNav(item.path)}
                              className="userMenu-item userMenu-item-btn w-full flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer"
                              style={{ animationDelay: `${0.05 + i * 0.04}s` }}
                            >
                              <div className="w-7 h-7 rounded-lg bg-[#F3F0FF] flex items-center justify-center shrink-0 transition-colors duration-200">
                                <i className={`${item.icon} userMenu-icon text-[13px] text-[#8B7AFF] transition-colors duration-200`}></i>
                              </div>
                              <span
                                className="userMenu-label text-[12px] font-bold text-[#6B7280] transition-colors duration-200"
                                style={{ fontFamily: '"Rajdhani", sans-serif' }}
                              >
                                {item.label}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Separator */}
                        <div className="mx-3 h-[1px] bg-[#E8E4F3]" />

                        {/* Logout */}
                        <div className="py-1.5 px-2">
                          <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isSigningOut}
                            className="userMenu-item userMenu-item-btn userMenu-logout w-full flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer disabled:opacity-50"
                            style={{ animationDelay: `${0.05 + menuItems.length * 0.04 + 0.04}s` }}
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#FEF2F2] flex items-center justify-center shrink-0 transition-colors duration-200">
                              <i className="ri-logout-box-r-line userMenu-icon text-[13px] text-[#9CA3AF] transition-colors duration-200"></i>
                            </div>
                            <span
                              className="userMenu-label text-[12px] font-bold text-[#6B7280] transition-colors duration-200"
                              style={{ fontFamily: '"Rajdhani", sans-serif' }}
                            >
                              {isSigningOut ? 'ログアウト中...' : 'ログアウト'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className={`text-[12px] font-bold transition-colors duration-300 cursor-pointer ${navColor}`}
                >
                  ログイン
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-5 py-2 text-[11px] font-bold tracking-[0.08em] uppercase bg-[#5B3AE8] hover:bg-[#4F2FD8] text-white rounded transition-colors duration-200 cursor-pointer"
                  style={{ fontFamily: '"Orbitron", sans-serif' }}
                >
                  無料登録
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
