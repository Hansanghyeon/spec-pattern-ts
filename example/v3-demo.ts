import { Spec, CompositeSpec, define, allOf, anyOf, not } from '../src/specification-v3'

// 타입 정의
interface Activity {
  type: 'login' | 'logout' | 'purchase'
  timestamp: Date
}

interface Publisher {
  status: 'approved' | 'pending' | 'rejected'
  revenue: number
}

interface Permission {
  role: 'admin' | 'user' | 'guest'
  actions: string[]
}

// 기본 스펙 정의
const 로그인됨 = Spec('activity', (a: Activity) => a.type === 'login')
const 승인됨 = Spec('publisher', (p: Publisher) => p.status === 'approved')
const 고수익 = Spec('publisher', (p: Publisher) => p.revenue > 10000)
const 관리자 = Spec('permission', (p: Permission) => p.role === 'admin')

// ✅ v3의 핵심: 모든 조합이 자유롭게 가능!
const 복잡한조합 = 로그인됨.and(승인됨.or(고수익)).and(관리자.not())

// 사용 예
const data1 = {
  activity: { type: 'login' as const, timestamp: new Date() },
  publisher: { status: 'approved' as const, revenue: 5000 },
  permission: { role: 'user' as const, actions: ['read'] }
}

console.log('로그인 + (승인 또는 고수익) + 관리자아님:', 복잡한조합.isSatisfiedBy(data1))

// 중첩된 OR/AND 조합
const 특별권한 = 관리자.or(로그인됨.and(승인됨).and(고수익))

const adminData = {
  permission: { role: 'admin' as const, actions: ['all'] }
}

const premiumUserData = {
  activity: { type: 'login' as const, timestamp: new Date() },
  publisher: { status: 'approved' as const, revenue: 20000 }
}

console.log('관리자:', 특별권한.isSatisfiedBy(adminData)) // true
console.log('프리미엄 사용자:', 특별권한.isSatisfiedBy(premiumUserData)) // true

// CompositeSpec으로 복잡한 조건 정의
interface UserSession {
  activity: Activity
  publisher: Publisher
  permission: Permission
}

const 활성세션 = CompositeSpec<UserSession>(session => {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
  return session.activity.timestamp > hourAgo &&
         session.permission.actions.length > 0
})

// CompositeSpec과 단일 스펙 조합
const 유효한세션 = 활성세션.and(로그인됨).and(승인됨.or(관리자))

// define 헬퍼 사용
const 최근활동 = define<Activity>(a => {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
  return a.timestamp > fiveMinAgo
}).as('activity')

const 쓰기권한 = define<Permission>(p => 
  p.actions.includes('write')
).as('permission')

// 모든 스펙이 자유롭게 조합 가능
const 편집권한 = 최근활동.and(쓰기권한).and(승인됨.or(관리자))

// 편의 함수 사용
const 모든조건 = allOf(로그인됨, 승인됨, 고수익) // 모두 만족
const 하나이상 = anyOf(관리자, 고수익, 승인됨) // 하나 이상 만족
const 게스트아님 = not(Spec('permission', (p: Permission) => p.role === 'guest'))

// 실제 비즈니스 로직 예제
const 콘텐츠발행가능 = allOf(
  로그인됨,
  최근활동,
  anyOf(
    관리자,
    allOf(승인됨, 고수익, 쓰기권한)
  )
)

const fullData: UserSession = {
  activity: { type: 'login', timestamp: new Date() },
  publisher: { status: 'approved', revenue: 15000 },
  permission: { role: 'user', actions: ['read', 'write'] }
}

console.log('콘텐츠 발행 가능:', 콘텐츠발행가능.isSatisfiedBy(fullData))

// 타입 안전성 데모
// TypeScript가 필요한 모든 프로퍼티를 추적
const 복합검증 = 로그인됨.and(승인됨).and(관리자)
// 필요한 타입: { activity: Activity } & { publisher: Publisher } & { permission: Permission }

// ✅ 올바른 사용
복합검증.isSatisfiedBy({
  activity: { type: 'login', timestamp: new Date() },
  publisher: { status: 'approved', revenue: 1000 },
  permission: { role: 'admin', actions: [] }
})

// ❌ 타입 에러 - permission 누락
// 복합검증.isSatisfiedBy({
//   activity: { type: 'login', timestamp: new Date() },
//   publisher: { status: 'approved', revenue: 1000 }
// })