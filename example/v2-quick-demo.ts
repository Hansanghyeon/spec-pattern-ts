/**
 * spec-pattern-ts v2.0 간단한 데모
 * 
 * v1에서는 불가능했던 서로 다른 타입의 스펙 조합이
 * v2에서는 자연스럽게 가능합니다.
 */

import { Spec } from '../src/specification'

// 타입 정의
interface Activity {
  type: 'login' | 'logout' | 'purchase'
  timestamp: Date
}

interface Publisher {
  status: 'approved' | 'pending' | 'rejected'
  revenue: number
}

// v2: 스펙 정의부터 키 지정
const 로그인됨 = Spec('activity', (a: Activity) => a.type === 'login')
const 승인됨 = Spec('publisher', (p: Publisher) => p.status === 'approved')
const 고수익 = Spec('publisher', (p: Publisher) => p.revenue > 10000)

// 🎉 v2의 핵심: 서로 다른 타입을 자연스럽게 조합!
const 로그인_승인_고수익 = 로그인됨.and(승인됨).and(고수익)

// 사용 예
const data = {
  activity: { type: 'login' as const, timestamp: new Date() },
  publisher: { status: 'approved' as const, revenue: 20000 }
}

if (로그인_승인_고수익.isSatisfiedBy(data)) {
  console.log('✅ 로그인한 고수익 승인 퍼블리셔입니다!')
}

// 같은 키는 자동으로 AND 처리
console.log('승인됨.and(고수익)는 publisher가 승인되고 AND 고수익이어야 함')

// OR 조합도 가능
const 승인_또는_고수익 = 승인됨.or(고수익)
// 복합 스펙은 다시 단일 스펙과 조합할 수 없음 (현재 구조의 한계)
console.log('승인됨 OR 고수익인 경우')

// 타입 안전성
// TypeScript가 필요한 모든 키를 추적합니다
// data2는 { activity: Activity, publisher: Publisher } 타입이어야 함
// const data2 = { activity: {...} } // ❌ 컴파일 에러: publisher 누락