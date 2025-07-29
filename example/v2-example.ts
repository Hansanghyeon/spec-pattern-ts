import { Spec, define } from '../src/specification-v2'
import { expect, test, describe } from 'bun:test'

// 도메인 타입 정의
interface User {
  id: string
  status: 'logged_in' | 'logged_out' | 'suspended'
  role: 'admin' | 'user' | 'guest'
  lastLoginAt: Date
}

interface Publisher {
  id: string
  name: string
  status: 'approved' | 'pending' | 'rejected'
  tier: 'basic' | 'premium' | 'enterprise'
  revenue: number
}

interface Permission {
  resource: string
  actions: string[]
  expiresAt: Date | null
}

describe('spec-pattern-ts v2.0', () => {
  // 테스트 데이터
  const activeUser: User = {
    id: 'user123',
    status: 'logged_in',
    role: 'user',
    lastLoginAt: new Date()
  }

  const premiumPublisher: Publisher = {
    id: 'pub123',
    name: 'Premium Publisher Inc.',
    status: 'approved',
    tier: 'premium',
    revenue: 50000
  }

  const writePermission: Permission = {
    resource: 'article',
    actions: ['read', 'write', 'publish'],
    expiresAt: null
  }

  test('기본 사용법 - 단일 스펙', () => {
    // 스펙 정의 시 키 지정
    const loggedIn = Spec('user', (u: User) => u.status === 'logged_in')
    
    // 객체로 감싸서 전달
    expect(loggedIn.isSatisfiedBy({ user: activeUser })).toBe(true)
    expect(loggedIn.isSatisfiedBy({ 
      user: { ...activeUser, status: 'logged_out' } 
    })).toBe(false)
  })

  test('다중 타입 조합', () => {
    // 각각 다른 타입의 스펙들
    const userLoggedIn = Spec('user', (u: User) => u.status === 'logged_in')
    const publisherApproved = Spec('publisher', (p: Publisher) => p.status === 'approved')
    const canWrite = Spec('permission', (p: Permission) => p.actions.includes('write'))

    // 자연스러운 체이닝
    const canPublishArticle = userLoggedIn
      .and(publisherApproved)
      .and(canWrite)

    const validContext = {
      user: activeUser,
      publisher: premiumPublisher,
      permission: writePermission
    }

    expect(canPublishArticle.isSatisfiedBy(validContext)).toBe(true)

    // 하나라도 조건을 만족하지 않으면 실패
    const invalidContext = {
      ...validContext,
      publisher: { ...premiumPublisher, status: 'pending' as const }
    }
    expect(canPublishArticle.isSatisfiedBy(invalidContext)).toBe(false)
  })

  test('같은 키 자동 AND 처리', () => {
    // 같은 'publisher' 키를 가진 스펙들
    const approved = Spec('publisher', (p: Publisher) => p.status === 'approved')
    const premium = Spec('publisher', (p: Publisher) => p.tier === 'premium')
    const highRevenue = Spec('publisher', (p: Publisher) => p.revenue > 30000)

    // 자동으로 AND 조건으로 결합
    const premiumApprovedPublisher = approved.and(premium).and(highRevenue)

    expect(premiumApprovedPublisher.isSatisfiedBy({ 
      publisher: premiumPublisher 
    })).toBe(true)

    // 하나라도 만족하지 않으면 실패
    const basicPublisher = { ...premiumPublisher, tier: 'basic' as const }
    expect(premiumApprovedPublisher.isSatisfiedBy({ 
      publisher: basicPublisher 
    })).toBe(false)
  })

  test('define() 헬퍼 사용', () => {
    // 로직을 먼저 정의
    const isAdmin = define<User>(u => u.role === 'admin')
    const isPremium = define<Publisher>(p => p.tier === 'premium')
    const hasFullAccess = define<Permission>(p => 
      p.actions.includes('read') && 
      p.actions.includes('write') && 
      p.actions.includes('delete')
    )

    // 나중에 키 할당
    const adminUser = isAdmin.as('user')
    const premiumPub = isPremium.as('publisher')
    const fullAccess = hasFullAccess.as('permission')

    // 조합
    const adminPremiumAccess = adminUser.and(premiumPub).and(fullAccess)

    const adminContext = {
      user: { ...activeUser, role: 'admin' as const },
      publisher: premiumPublisher,
      permission: {
        ...writePermission,
        actions: ['read', 'write', 'delete']
      }
    }

    expect(adminPremiumAccess.isSatisfiedBy(adminContext)).toBe(true)
  })

  test('OR 조건 사용', () => {
    const admin = Spec('user', (u: User) => u.role === 'admin')
    const premiumPublisher = Spec('publisher', (p: Publisher) => p.tier === 'premium')
    const enterprisePublisher = Spec('publisher', (p: Publisher) => p.tier === 'enterprise')

    // admin이거나 premium/enterprise 퍼블리셔
    const hasSpecialAccess = admin.or(premiumPublisher).or(enterprisePublisher)

    // 관리자인 경우
    expect(hasSpecialAccess.isSatisfiedBy({
      user: { ...activeUser, role: 'admin' as const }
    })).toBe(true)

    // premium 퍼블리셔인 경우
    expect(hasSpecialAccess.isSatisfiedBy({
      publisher: { ...premiumPublisher, tier: 'premium' as const }
    })).toBe(true)

    // 둘 다 아닌 경우
    expect(hasSpecialAccess.isSatisfiedBy({
      user: activeUser,
      publisher: { ...premiumPublisher, tier: 'basic' as const }
    })).toBe(false)
  })

  test('NOT 조건 사용', () => {
    const notGuest = Spec('user', (u: User) => u.role === 'guest').not()
    const notExpired = Spec('permission', (p: Permission) => 
      p.expiresAt === null || p.expiresAt > new Date()
    )

    const validUser = notGuest.and(notExpired)

    expect(validUser.isSatisfiedBy({
      user: activeUser, // role: 'user'
      permission: writePermission // expiresAt: null
    })).toBe(true)

    expect(validUser.isSatisfiedBy({
      user: { ...activeUser, role: 'guest' as const },
      permission: writePermission
    })).toBe(false)
  })

  test('복잡한 비즈니스 로직', () => {
    // 스펙 정의
    const userSpecs = {
      loggedIn: Spec('user', (u: User) => u.status === 'logged_in'),
      admin: Spec('user', (u: User) => u.role === 'admin'),
      recentlyActive: Spec('user', (u: User) => {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
        return u.lastLoginAt > hourAgo
      })
    }

    const publisherSpecs = {
      approved: Spec('publisher', (p: Publisher) => p.status === 'approved'),
      premium: Spec('publisher', (p: Publisher) => p.tier === 'premium'),
      enterprise: Spec('publisher', (p: Publisher) => p.tier === 'enterprise'),
      highRevenue: Spec('publisher', (p: Publisher) => p.revenue > 10000)
    }

    const permissionSpecs = {
      canPublish: Spec('permission', (p: Permission) => p.actions.includes('publish')),
      notExpired: Spec('permission', (p: Permission) => 
        p.expiresAt === null || p.expiresAt > new Date()
      )
    }

    // 복잡한 권한 체크: 
    // (관리자) OR (로그인 + 최근활동 + 승인된 premium/enterprise 퍼블리셔 + 퍼블리시 권한)
    const canPublishContent = userSpecs.admin
      .or(
        userSpecs.loggedIn
          .and(userSpecs.recentlyActive)
          .and(publisherSpecs.approved)
          .and(publisherSpecs.premium.or(publisherSpecs.enterprise))
          .and(permissionSpecs.canPublish)
          .and(permissionSpecs.notExpired)
      )

    // 관리자는 항상 가능
    const adminContext = {
      user: { ...activeUser, role: 'admin' as const }
    }
    expect(canPublishContent.isSatisfiedBy(adminContext)).toBe(true)

    // 모든 조건을 만족하는 일반 사용자
    const validUserContext = {
      user: { ...activeUser, lastLoginAt: new Date() },
      publisher: premiumPublisher,
      permission: { ...writePermission, actions: ['read', 'write', 'publish'] }
    }
    expect(canPublishContent.isSatisfiedBy(validUserContext)).toBe(true)

    // 조건 중 하나라도 만족하지 않는 경우
    const invalidUserContext = {
      ...validUserContext,
      publisher: { ...premiumPublisher, tier: 'basic' as const } // premium/enterprise 아님
    }
    expect(canPublishContent.isSatisfiedBy(invalidUserContext)).toBe(false)
  })
})