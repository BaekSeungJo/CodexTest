# Agent: Todo 서비스 (Spring Boot API + Next.js UI + Firebase Auth)

> 생성일: 2025-10-21 05:23:12

본 문서는 **Codex 에이전트가 이 문서만 읽고 작업**하도록 설계된 실행형 지시서(Agent.md)입니다.
모든 변경은 본 문서를 우선 수정한 뒤 Codex에 재실행을 요청하세요. (Single Source of Truth)

---

## 0. Goal & Outcomes

- 로그인한 사용자에게 **To-Do 리스트** 기능 제공 (생성/조회/수정/삭제/상태필터).
- 2주 내 MVP 완성.
- KPI
  - 로그인 성공율 ≥ 99.5%
  - API p95 응답시간 < 200ms (로컬/개발 기준)
  - e2e 테스트 20개 이상 **그린**

**Non-Goals**
- 오프라인 동기화, 다중 프로젝트/보드, 공유/권한 모델은 범위 외.
- 모바일 앱(네이티브)은 범위 외.

---

## 1. Architecture & Tech Choices

- **UI**: Next.js 14(App Router) + TypeScript, React Query, Firebase Auth(Email/Password, Google)
- **API**: Java 17, Spring Boot 2.4.5 (또는 2.5.x 호환), 헥사고널 아키텍처(ports/adapters)
- **DB**: PostgreSQL (로컬: Docker), JPA/Hibernate + Flyway
- **Auth**: 클라이언트에서 Firebase ID Token 발급 → API에서 Firebase Admin SDK로 검증 → 내부 `userId` 컨텍스트 주입
- **Test**: JUnit/MockMvc(Unit/Integration), Playwright(웹 e2e)
- **CI**: GitHub Actions 예시 (빌드/테스트/도커 이미지)

**설계 원칙**
- 경계 명확화: `domain`(순수) / `application`(use case) / `adapter`(in/out)
- DTO/엔티티 구분, 검증은 `application` 레이어에서 수행
- 에러 규약 통일(문서 하단 명세 참조)

---

## 2. Repository Strategy & Layout (Monorepo)

```
/
├─ api/                           # Spring Boot (Hexagonal)
│  ├─ build.gradle
│  ├─ src/main/java/...
│  ├─ src/test/java/...
│  └─ src/main/resources/db/migration  # Flyway V1__*.sql
├─ web/                           # Next.js (TS)
│  ├─ package.json
│  ├─ app/                        # App Router
│  ├─ lib/                        # api client, hooks
│  └─ e2e/                        # Playwright
├─ infra/
│  ├─ docker-compose.yml          # postgres, adminer
│  └─ firebase/                   # service-account.json (비공개, 샘플만)
├─ docs/
│  └─ Agent.md                    # 이 파일
└─ Makefile
```

**브랜치 전략**
- 기본: trunk-based (main) + 기능 브랜치
- PR 머지 전 CI 필수 통과

---

## 3. API Spec

### 3.1 공통
- Base URL: `/api`
- 인증: 헤더 `Authorization: Bearer <Firebase_ID_Token>`
- 인증 실패(검증 실패/만료): `401 Unauthorized`
- 권한 불충분(다른 사용자 데이터 접근): `403 Forbidden`
- 유효성 위반: `422 Unprocessable Entity` (본문에 에러 코드/필드/메시지)
- 서버 오류: `500 Internal Server Error`

### 3.2 ToDo
- **Entity 필드**
  - `id: UUID`
  - `userId: string`
  - `title: string (1~100)`
  - `dueDate: ISO8601 (nullable)`
  - `done: boolean (default=false)`
  - `createdAt, updatedAt: Instant`

- **Endpoints**
  - `POST /api/todos`
    - body: `{ "title": "string", "dueDate": "ISO", "done": false }`
    - 201 생성, Location 헤더
  - `GET /api/todos?status=all|active|done&cursor=&size=`
    - 기본 정렬: `createdAt desc`
  - `PATCH /api/todos/{id}`
    - body: 부분 업데이트 `{ "title"?, "dueDate"?, "done"? }`
  - `DELETE /api/todos/{id}`
    - 204

**에러 페이로드 예시**
```json
{
  "timestamp": "2025-10-21T06:00:00Z",
  "path": "/api/todos",
  "error": {
    "code": "VALIDATION_FAILED",
    "details": [{"field":"title","message":"must not be blank"}]
  }
}
```

---

## 4. Domain & Validation Rules (API)

- `title`: 공백 불가, 1~100자
- `dueDate`: 과거/미래 모두 허용(리마인더 범위 외)
- `userId` 단위 데이터 격리 (쿼리/리포지토리에서 항상 스코핑)
- 영속 모델과 API DTO 분리
- 시간은 UTC 보관, 클라이언트 표시 로컬화

---

## 5. User Stories & Acceptance Criteria

- **[AC-001]** 로그인 사용자는 To-Do를 생성/조회/수정/삭제할 수 있다.
- **[AC-002]** 사용자는 자신의 To-Do만 볼 수 있다. (다른 사용자 데이터 접근 시 403)
- **[AC-003]** 제목이 비면 422가 반환된다.
- **[AC-004]** 상태 필터: all/active(done=false)/done(done=true) 동작.
- **[AC-005]** e2e 시나리오: 로그인→추가→체크→필터→삭제가 정상 종료한다.

---

## 6. Task Blocks (Codex 실행 단위)

> Codex는 아래 작업을 **위에서 아래 순서대로** 실행합니다. 각 작업은 산출물과 테스트 기준을 반드시 충족해야 합니다.

### TASK:INIT-REPO
- **Goal**: 모노레포 스캐폴딩, 로컬 기동 성공
- **Outputs**
  - `/api` Spring Boot 초기 프로젝트 (Hexagonal: `domain/`, `application/`, `adapter/in/web`, `adapter/out/persistence`, `config/`)
  - `/web` Next.js 14 초기 프로젝트 + Firebase Auth(로그인/로그아웃 UI)
  - `/infra/docker-compose.yml` (postgres:14, adminer:latest)
  - `Makefile` (단축 명령), `.editorconfig`, `.gitignore`, `README.md`
  - `/api/src/main/resources/application.yml` (기본 설정), Flyway baseline
  - `/web/.env.example`, `/api/.env.example`
- **Tests**
  - `make up` → postgres 가동
  - `make api` → `/api/actuator/health` 가 `UP`
  - `make web` → 홈 접속 및 로그인 화면 노출

### TASK:API-TODO
- **Goal**: Todo CRUD REST, Firebase 인증 검증 필터, JPA + Flyway
- **Outputs**
  - 엔티티/리포지토리/서비스/컨트롤러, 전역 예외 핸들러
  - Firebase Admin SDK 연동(`FIREBASE_CREDENTIALS_PATH`)
  - 단위/통합 테스트 (MockMvc)
- **Tests**
  - 단위 10개+, 통합 8개+
  - 401/403/422/200 케이스 포함

### TASK:UI-TODO
- **Goal**: 로그인 후 To-Do UI, 상태 필터, 낙관적 업데이트
- **Outputs**
  - `/app/(auth)/login` 페이지
  - `/app/todos` 페이지 (목록/추가/체크/삭제/필터)
  - API 연동 hooks(`lib/api.ts`, `lib/auth.ts`), React Query 캐시
  - Playwright e2e 테스트 10개+
- **Tests**
  - `npm run e2e` 녹색, 핵심 플로우 통과

### TASK:CI
- **Goal**: PR 시 빌드/테스트, main 머지 시 컨테이너 빌드
- **Outputs**
  - `.github/workflows/ci.yml` (api/web 병렬 빌드, 캐시)
  - 품질 게이트(테스트 실패 시 머지 금지)

---

## 7. DX & Runbook

### 필수 도구
- `docker`/`docker compose`, `node 20+`, `pnpm` 또는 `npm`, `java 17`, `gradle 7+`

### 환경 변수
- **web (.env)**
  - `NEXT_PUBLIC_FIREBASE_API_KEY=`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID=`
- **api (.env)**
  - `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/todo`
  - `SPRING_DATASOURCE_USERNAME=todo`
  - `SPRING_DATASOURCE_PASSWORD=todo`
  - `FIREBASE_CREDENTIALS_PATH=infra/firebase/service-account.json`

### Make 명령 예시
```
make up         # postgres/adminer up
make down       # compose down -v
make api        # api 실행 (./gradlew bootRun)
make web        # web 실행 (npm run dev)
make test-api   # api 테스트
make test-web   # web 테스트(e2e 포함 시 별도 커맨드)
```

### 로컬 시나리오
1) `cp web/.env.example web/.env` & 실제 Firebase 콘솔 값 기입  
2) `cp api/.env.example api/.env` & service-account.json 경로 확인  
3) `make up && make api && make web`  
4) 브라우저에서 로그인 → `/app/todos` 기능 점검

---

## 8. Commit/PR 규칙

- **Conventional Commits**
  - `feat(api): add create-todo endpoint`
  - `fix(web): sanitize title input`
  - `test(api): add 422 cases for title`
- **PR 템플릿 체크리스트**
  - [ ] 빌드/테스트 통과
  - [ ] 보안/시크릿 미노출
  - [ ] 문서(README/Agent) 반영
  - [ ] 수동 테스트 스크린샷(필요 시)

---

## 9. Testing Strategy

- **API**: JUnit5, MockMvc, Testcontainers(선택)
- **Web**: Vitest(유닛), Playwright(e2e)
- 커버리지 목표: unit ≥ 70%, 핵심 유스케이스 e2e 100%
- CI에서 병렬화 및 캐시 적용

---

## 10. Error Handling & Logging

- 전역 예외 처리기: `@ControllerAdvice`
- 에러 포맷 고정(위 명세)
- 요청/응답 주요 ID, userId, 경로, 상태 코드 로깅(PII 마스킹)

---

## 11. Security

- Firebase Admin SDK 비공개 키는 레포에 커밋하지 않음
- `.env`/시크릿 매니저 사용, 샘플만 커밋
- CORS: 웹 오리진 화이트리스트

---

## 12. Fallback & Escalation (Codex용)

- 사양 모호/충돌 시:
  1) **가정(Assumption)**을 기록: `docs/decisions/ADR-YYYYMMDD.md`
  2) 해당 가정에 따라 작업을 진행
  3) PR에 가정과 영향 범위를 요약
- 외부 서비스 장애(Firebase 등)로 로컬 테스트 불가 시 mock/stub 사용 후 주석으로 명시

---

## 13. Roadmap (차기 버전 후보)

- 소셜 로그인 추가 범위 확대
- 정렬/검색, 다중 리스트/보드
- 알림/리마인더
- 배포용 IaC(k8s), Observability(로그/메트릭/트레이싱)
