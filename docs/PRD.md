# PRD: 로그인 기반 Todo 서비스 (Firebase + Spring Boot + Next.js)

> 버전: 1.0  
> 작성일: 2025-10-21 05:45:20  
> 작성자: 백승조  
> 관련 문서: [Agent.md](./Agent.md)

---

## 1. 개요

### 🎯 목적

사용자가 **Firebase 계정으로 로그인**하여 개인별로 To-Do 목록을 관리할 수 있는 웹 서비스 제공.

### 🧩 문제 정의

- 기존 교보 사내 메모/태스크 툴은 외부 사용자용이 아님.
- 개인 단위의 간단한 “로그인 + 할일 관리” 웹 서비스 필요.
- 모바일 브라우저에서도 사용 가능한 간결한 UI가 요구됨.

### 💡 목표

| 목표              | 측정 기준                  |
| ----------------- | -------------------------- |
| 로그인 성공률     | ≥ 99.5%                    |
| CRUD 요청 성공률  | ≥ 99%                      |
| 주요 API 응답시간 | p95 < 200ms                |
| 사용자 만족도     | 4.5 / 5 이상 (내부 테스트) |

---

## 2. 사용자 시나리오

### Persona A — 일반 사용자

> "나는 내 구글 계정으로 로그인해서 오늘 할 일을 정리하고 싶다."

#### 주요 행동

1. Firebase 로그인 (Google/Email)
2. 새 할일 추가
3. 완료 상태 토글
4. 필터(전체/완료/미완료)
5. 할일 삭제

#### 비정상 시나리오

- 로그인 실패 시 안내 메시지
- 제목이 비어 있으면 저장 불가
- 인증 만료 시 자동 로그아웃 및 재로그인 안내

---

## 3. 주요 기능 요구사항

| ID    | 기능            | 설명                                     | 우선순위 |
| ----- | --------------- | ---------------------------------------- | -------- |
| F-001 | 로그인/로그아웃 | Firebase Auth (Google, Email)            | ⭐⭐⭐⭐     |
| F-002 | To-Do 등록      | 제목/기한 입력, 기본 false(done)         | ⭐⭐⭐⭐     |
| F-003 | To-Do 목록 조회 | 상태 필터(전체/완료/미완료), 생성일 역순 | ⭐⭐⭐      |
| F-004 | To-Do 수정      | 제목, 기한, 상태 변경                    | ⭐⭐⭐      |
| F-005 | To-Do 삭제      | 1건 삭제, soft delete는 아님             | ⭐⭐       |
| F-006 | 반응형 UI       | 모바일/데스크탑 대응                     | ⭐⭐       |
| F-007 | 자동 로그아웃   | Firebase 토큰 만료 시 자동 처리          | ⭐⭐       |

---

## 4. 비기능 요구사항 (NFR)

| 항목     | 기준                               |
| -------- | ---------------------------------- |
| 인증     | Firebase ID Token 기반 검증        |
| 성능     | API 평균 응답시간 < 100ms          |
| 보안     | HTTPS만 허용, 토큰 미노출          |
| 안정성   | DB 장애 시 복구 5분 이내           |
| 유지보수 | 신규 기능 추가 시 3일 내 배포 가능 |
| 접근성   | 기본 ARIA 지원 (WCAG AA 준수)      |

---

## 5. 데이터 모델 (개념 수준)

**Todo**

| 필드                  | 타입     | 설명           |
| --------------------- | -------- | -------------- |
| id                    | UUID     | 고유 식별자    |
| userId                | string   | Firebase UID   |
| title                 | string   | 1~100자        |
| dueDate               | datetime | 선택 사항      |
| done                  | boolean  | 완료 여부      |
| createdAt / updatedAt | datetime | 생성/수정 시각 |

---

## 6. API 흐름 (요약)

| 기능      | 요청                     | 응답              |
| --------- | ------------------------ | ----------------- |
| 로그인    | Firebase SDK 내부 처리   | ID Token          |
| 목록 조회 | `GET /api/todos`         | 200 / 리스트      |
| 생성      | `POST /api/todos`        | 201 / 생성 아이템 |
| 수정      | `PATCH /api/todos/{id}`  | 200 / 수정 결과   |
| 삭제      | `DELETE /api/todos/{id}` | 204               |

---

## 7. 성공 시나리오 (Acceptance Criteria)

- AC-001: 로그인 성공 후 `/todos` 접근 가능
- AC-002: 로그인 안 한 상태로 접근 시 401
- AC-003: To-Do 생성 → 목록 즉시 반영
- AC-004: 완료 토글 후 필터링 동작
- AC-005: e2e 테스트에서 전체 플로우 자동 통과

---

## 8. 향후 확장 (Backlog)

- 공유 리스트 (Collaborator)
- 마감일 알림 (Push)
- 태그/카테고리 기능
- 오프라인 저장 (PWA)
- 관리자 대시보드 (Firebase Console 기반)

---

## 9. 제약 및 가정

| 항목        | 내용                            |
| ----------- | ------------------------------- |
| 사용자 수   | 동시 100명 내외                 |
| 데이터 용량 | 1인 500건 이하                  |
| 네트워크    | HTTPS, 프록시 없음              |
| 브라우저    | 최신 Chrome/Edge/Safari/Firefox |
| OS          | 데스크탑/모바일 웹 브라우저     |

---

## 10. 변경 관리 (Change Policy)

- PRD 변경 시 **Agent.md도 반드시 동기화**  
- 변경 내역은 `docs/changelogs/PRD_CHANGELOG.md`에 기록  
- Codex 실행 시 항상 최신 PRD를 Context로 전달

---

## 11. Codex 실행 예시

```bash
# 초기 리포 세팅
codex run --context docs/PRD.md --agent docs/Agent.md --task INIT-REPO

# API 구현
codex run --context docs/PRD.md --agent docs/Agent.md --task API-TODO

# UI 구현
codex run --context docs/PRD.md --agent docs/Agent.md --task UI-TODO
```

> Codex는 `PRD.md`에서 요구사항을 읽고, `Agent.md`에 정의된 Task 목표와 테스트를 기준으로 코드를 생성합니다.
> 즉, PRD.md는 "왜 & 무엇"을, Agent.md는 "어떻게 & 어디에"를 담당합니다.
