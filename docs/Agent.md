# Agent: Todo 서비스 (Java 21 + Spring Boot 3.3.3 + Next.js + Firebase Auth)

> 생성일: 2025-10-21 07:10:50
> 본 문서는 Codex가 **이 파일만 읽고** 작업할 수 있도록 작성된 실행형 지시서입니다. (Single Source of Truth)

---

## 0. Goal & Outcomes

- 로그인 사용자 전용 **To-Do 리스트**(생성/조회/수정/삭제/상태필터) 제공
- 2주 내 MVP
- KPI: 로그인 성공율 ≥ 99.5%, API p95 < 200ms, e2e 20개 그린

**Non-Goals**

- 오프라인 동기화, 공유 권한 모델, 네이티브 앱

---

## 1. Architecture & Tech Choices (업데이트됨)

- **UI**: Next.js 14(App Router) + TypeScript, React Query, Firebase Auth(Email/Password, Google)
- **API**: **Java 21 (LTS), Spring Boot 3.3.3**, 헥사고널 아키텍처(ports/adapters)
- **Build**: **Gradle 8.10+**
- **DB**: PostgreSQL 14 (로컬: Docker), Spring Data JPA + Flyway
- **Auth**: Firebase ID Token → API에서 Firebase Admin SDK 검증 → `userId` 컨텍스트
- **Test**: **JUnit 5.10, Spring Boot Test, Testcontainers(Postgres)**, Playwright(e2e)
- **CI**: GitHub Actions (Java 21 + Gradle 8.x + Node 20)
- **Container**: **Dockerfile(api/web) + docker-compose.yml 예시 포함**

> Jakarta 변경 주의: `javax.*` → `jakarta.*`

---

## 2. Repository Layout (Monorepo)

```
/
├─ api/                           # Spring Boot
│  ├─ build.gradle[.kts]
│  ├─ src/main/java/...
│  ├─ src/test/java/...
│  └─ src/main/resources/db/migration  # Flyway V1__*.sql
├─ web/                           # Next.js (TS)
│  ├─ package.json
│  ├─ app/
│  ├─ lib/
│  └─ e2e/
├─ infra/
│  ├─ docker-compose.yml          # ★ 업데이트: Testcontainers 병행 사용
│  ├─ api.Dockerfile              # ★ 추가
│  └─ web.Dockerfile              # ★ 추가
├─ docs/
│  └─ Agent.md
└─ Makefile
```

---

## 3. API Spec (요약)

- Base `/api`, Bearer Firebase ID Token
- 401/403/422/500 규약 고정
- 엔드포인트: POST/GET/PATCH/DELETE `/api/todos` (status=all|active|done)

---

## 4. Domain & Validation

- `Todo(id, userId, title(1~100), dueDate?, done=false, createdAt, updatedAt)`
- userId 스코프 격리, DTO/엔티티 분리, UTC 저장

---

## 5. Acceptance Criteria

- [AC-001] 로그인 사용자 To-Do CRUD 가능
- [AC-002] 타 사용자 데이터 접근 시 403
- [AC-003] 제목 공백 시 422
- [AC-004] 상태 필터 동작
- [AC-005] e2e: 로그인→추가→체크→필터→삭제

---

## 6. Task Blocks (Codex 실행 순서)

### TASK:INIT-REPO

- **Goal**: 최신 스택 기반 스캐폴딩 + 컨테이너 구성
- **Outputs**
  - Gradle 설정(**Java 21, Boot 3.3.3, Gradle 8.10+)**
  - `infra/api.Dockerfile`, `infra/web.Dockerfile`, `infra/docker-compose.yml`
  - Testcontainers 셋업(테스트 의존)
  - Makefile, .editorconfig, .gitignore, README
- **Tests**
  - `make up`(선택) 또는 Testcontainers로 통합 테스트 통과
  - `/api/actuator/health = UP`, `/web` 홈 노출

### TASK:API-TODO

- **Goal**: Todo CRUD + Firebase 인증 필터 + JPA/Flyway
- **Outputs**
  - 엔티티/리포지토리/서비스/컨트롤러, 전역 예외 핸들러
  - Firebase Admin SDK (`FIREBASE_CREDENTIALS_PATH`)
  - **Testcontainers 기반 통합 테스트**
- **Tests**
  - 단위 10+, 통합 8+, 401/403/422/200 포함

### TASK:UI-TODO

- **Goal**: 로그인 후 Todo UI, 상태 필터, 낙관적 업데이트
- **Outputs**
  - `/app/(auth)/login`, `/app/todos`, hooks(`lib/api.ts`, `lib/auth.ts`)
  - Playwright e2e 10+
- **Tests**: e2e 녹색

### TASK:CI

- **Goal**: Java 21/Gradle 8.x/Node 20 캐시, 테스트/리포트
- **Outputs**: `.github/workflows` 템플릿(이미 제공)

---

## 7. DX & Runbook (업데이트)

### 필수 도구

- `docker`/`docker compose`, `node 20+`, `pnpm` 또는 `npm`, **`java 21`**, **`gradle 8.10+`**

### 환경 변수

- **web (.env)**
  - `NEXT_PUBLIC_FIREBASE_API_KEY=...`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID=...`
- **api (.env)**
  - `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/todo`
  - `SPRING_DATASOURCE_USERNAME=todo`
  - `SPRING_DATASOURCE_PASSWORD=todo`
  - `FIREBASE_CREDENTIALS_PATH=infra/firebase/service-account.json`

### Make 예시

```
make up         # docker compose up -d
make down       # compose down -v
make api        # ./gradlew bootRun
make web        # npm run dev
make test-api   # ./gradlew test
make test-web   # npm run test && npm run e2e --if-present
```

---

## 8. Containerization 예시 (★ 추가)

### 8.1 api.Dockerfile

```dockerfile
# infra/api.Dockerfile
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY api/ /app/
RUN ./gradlew clean bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /opt/app
COPY --from=build /app/build/libs/*.jar app.jar
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
EXPOSE 8080
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]
```

### 8.2 web.Dockerfile

```dockerfile
# infra/web.Dockerfile
FROM node:20-bullseye AS deps
WORKDIR /app
COPY web/package*.json ./
RUN npm ci

FROM node:20-bullseye AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ .
RUN npm run build

FROM node:20-bullseye
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .
EXPOSE 3000
CMD ["npm","start"]
```

### 8.3 docker-compose.yml

```yaml
# infra/docker-compose.yml
version: "3.9"
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: todo
      POSTGRES_USER: todo
      POSTGRES_PASSWORD: todo
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL","pg_isready -U todo"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ..
      dockerfile: infra/api.Dockerfile
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/todo
      SPRING_DATASOURCE_USERNAME: todo
      SPRING_DATASOURCE_PASSWORD: todo
      FIREBASE_CREDENTIALS_PATH: /run/secrets/service-account.json
    depends_on: [db]
    ports: ["8080:8080"]
    secrets:
      - service-account.json

  web:
    build:
      context: ..
      dockerfile: infra/web.Dockerfile
    environment:
      NEXT_PUBLIC_API_BASE: http://localhost:8080
    depends_on: [api]
    ports: ["3000:3000"]

secrets:
  service-account.json:
    file: ./firebase/service-account.json
```

> 로컬 개발은 Testcontainers만으로도 충분. 컨테이너 실행은 선택입니다.

---

## 9. Testcontainers 예시 (★ 추가)

### 9.1 Gradle 의존성 (api/build.gradle.kts 예시)

```kotlin
plugins {
  id("org.springframework.boot") version "3.3.3"
  id("io.spring.dependency-management") version "1.1.6"
}

java { toolchain { languageVersion.set(JavaLanguageVersion.of(21)) } }

dependencies {
  implementation("org.springframework.boot:spring-boot-starter-web")
  implementation("org.springframework.boot:spring-boot-starter-data-jpa")
  implementation("org.flywaydb:flyway-core")
  runtimeOnly("org.postgresql:postgresql")

  testImplementation("org.springframework.boot:spring-boot-starter-test")
  testImplementation("org.testcontainers:junit-jupiter")
  testImplementation("org.testcontainers:postgresql")
}
```

### 9.2 통합 테스트 샘플

```java
// src/test/java/.../TodoRepositoryIT.java
package com.example.todo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class TodoRepositoryIT {

  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:14")
      .withDatabaseName("todo")
      .withUsername("todo")
      .withPassword("todo");

  @DynamicPropertySource
  static void registerProps(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }

  @Test
  void contextLoads() {
    // given/when/then: 실제 CRUD 통합 테스트 작성
  }
}
```

### 9.3 application.yml (테스트 프로필 분리 예시)

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        jdbc.time_zone: UTC
  flyway:
    enabled: true
```

---

## 10. Commit/PR 규칙 (유지)

- Conventional Commits
- PR 체크리스트: 빌드/테스트/보안/문서 반영

---

## 11. Fallback & Escalation

- 모호할 경우 `docs/decisions/ADR-*.md`에 가정 기록 후 진행
- 외부 의존 장애 시 mock으로 우회, PR에 근거 기재
