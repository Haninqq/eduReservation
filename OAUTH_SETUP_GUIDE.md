# Google OAuth2 설정 가이드

## 📋 개요
이 프로젝트는 Google OAuth2를 사용하여 한양대학교 이메일(`@hanyang.ac.kr`)을 가진 사용자만 로그인할 수 있도록 구현되었습니다.

---

## 🚀 Google OAuth2 클라이언트 ID 생성

### 1. Google Cloud Console 접속
[Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.

### 2. 프로젝트 생성 (없는 경우)
1. 상단의 프로젝트 선택 드롭다운 클릭
2. "새 프로젝트" 클릭
3. 프로젝트 이름 입력 (예: "Hanyang Reservation System")
4. "만들기" 클릭

### 3. OAuth 동의 화면 구성
1. 좌측 메뉴에서 "API 및 서비스" > "OAuth 동의 화면" 선택
2. "외부" 선택 후 "만들기" 클릭
3. 필수 정보 입력:
   - 앱 이름: `한양대학교 사범대학 예약 시스템`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
4. "저장 후 계속" 클릭
5. 범위(Scopes) 단계: 그대로 "저장 후 계속"
6. 테스트 사용자 추가 (선택사항): 테스트할 한양대 이메일 추가

### 4. OAuth 2.0 클라이언트 ID 생성
1. 좌측 메뉴에서 "API 및 서비스" > "사용자 인증 정보" 선택
2. 상단의 "+ 사용자 인증 정보 만들기" 클릭
3. "OAuth 클라이언트 ID" 선택
4. 애플리케이션 유형: "웹 애플리케이션" 선택
5. 이름: `Hanyang Reservation Web Client`
6. 승인된 자바스크립트 원본 추가:
   ```
   http://localhost:3000
   http://localhost:8080
   ```
7. 승인된 리디렉션 URI 추가:
   ```
   http://localhost:8080/login/oauth2/code/google
   ```
8. "만들기" 클릭
9. 생성된 **클라이언트 ID**와 **클라이언트 보안 비밀번호** 복사

---

## ⚙️ 백엔드 설정

### 1. 데이터베이스 테이블 생성
MariaDB에 접속하여 다음 SQL 실행:
```sql
-- backend/src/main/resources/sql/create_users_table.sql 파일 참조
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_provider (provider, provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. application.properties 설정
`backend/src/main/resources/application.properties` 파일에서 다음 부분을 수정:

```properties
# Google OAuth2 클라이언트 ID와 비밀번호를 입력하세요
spring.security.oauth2.client.registration.google.client-id=여기에_클라이언트_ID_입력
spring.security.oauth2.client.registration.google.client-secret=여기에_클라이언트_비밀번호_입력
```

### 3. Gradle 의존성 설치 및 빌드
```bash
cd backend
./gradlew build
./gradlew bootRun
```

---

## 🎨 프론트엔드 설정

### 1. 의존성 설치
```bash
cd frontend
npm install
```

### 2. 개발 서버 실행
```bash
npm start
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

---

## 🔐 이메일 도메인 검증

### 작동 방식
- 사용자가 Google 계정으로 로그인 시도
- 백엔드에서 사용자의 이메일 도메인 확인
- `@hanyang.ac.kr`로 끝나지 않는 이메일은 로그인 거부
- 검증 로직은 `backend/src/main/java/kr/ac/hanyang/backend/service/UserService.java`의 `createOrUpdateUser` 메서드에 구현됨

### 검증 코드
```java
if (!email.endsWith("@hanyang.ac.kr")) {
    throw new IllegalArgumentException("한양대학교 이메일(@hanyang.ac.kr)만 사용 가능합니다.");
}
```

---

## 🧪 테스트 방법

### 1. 로그인 테스트
1. 백엔드 서버 실행 (`http://localhost:8080`)
2. 프론트엔드 서버 실행 (`http://localhost:3000`)
3. 브라우저에서 `http://localhost:3000` 접속
4. "Google로 로그인" 버튼 클릭
5. Google 계정 선택

### 2. 도메인 검증 테스트
- **성공 케이스**: `user@hanyang.ac.kr` → 로그인 성공
- **실패 케이스**: `user@gmail.com` → 로그인 실패 및 에러 메시지 표시

---

## 📁 주요 파일 구조

### 백엔드
```
backend/src/main/java/kr/ac/hanyang/backend/
├── config/
│   └── SecurityConfig.java              # Spring Security 설정
├── controller/
│   └── AuthController.java              # 인증 API 엔드포인트
├── service/
│   ├── UserService.java                 # 사용자 관리 (도메인 검증 포함)
│   ├── CustomOAuth2UserService.java     # OAuth2 로그인 처리
│   └── CustomOAuth2User.java            # 커스텀 OAuth2 사용자 객체
├── dto/
│   └── User.java                        # 사용자 DTO
└── mapper/
    └── UserMapper.java                  # MyBatis 매퍼
```

### 프론트엔드
```
frontend/src/
├── pages/
│   ├── LoginPage.tsx                    # 로그인 페이지
│   └── MainPage.tsx                     # 메인 페이지 (인증 필요)
├── services/
│   └── authService.ts                   # 인증 관련 API 호출
└── App.tsx                              # 라우팅 설정
```

---

## ⚠️ 주의사항

1. **프로덕션 환경**: 실제 배포 시 리디렉션 URI를 실제 도메인으로 변경해야 합니다.
2. **클라이언트 보안 비밀번호**: `application.properties` 파일을 git에 커밋하지 마세요. `.gitignore`에 추가하거나 환경변수로 관리하세요.
3. **HTTPS**: 프로덕션에서는 반드시 HTTPS를 사용해야 합니다.
4. **세션 관리**: 현재는 서버 세션을 사용하지만, 필요시 JWT로 변경 가능합니다.

---

## 🐛 문제 해결

### 로그인 후 리디렉션이 안 됨
- SecurityConfig의 `defaultSuccessUrl`과 `failureUrl` 확인
- 브라우저 쿠키가 활성화되어 있는지 확인

### "한양대학교 이메일만 사용 가능합니다" 에러
- 정상 작동입니다. `@hanyang.ac.kr` 이메일로 로그인하세요.

### CORS 에러 발생
- SecurityConfig의 CORS 설정 확인
- 프론트엔드 URL이 `http://localhost:3000`인지 확인

---

## 📞 문의
추가 질문이나 문제가 있으면 프로젝트 관리자에게 문의하세요.

