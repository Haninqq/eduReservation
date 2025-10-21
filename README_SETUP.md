# 한양대학교 사범대학 예약 시스템 설치 가이드

## 📋 목차
1. [환경 설정](#환경-설정)
2. [데이터베이스 설정](#데이터베이스-설정)
3. [Google OAuth2 설정](#google-oauth2-설정)
4. [백엔드 실행](#백엔드-실행)
5. [프론트엔드 실행](#프론트엔드-실행)

---

## 🔧 환경 설정

### 필수 프로그램
- **Java**: JDK 17 이상
- **Node.js**: v16 이상
- **MariaDB/MySQL**: 10.x 이상
- **Git**

---

## 🗄️ 데이터베이스 설정

### 1. 데이터베이스 생성
```sql
CREATE DATABASE edureserv CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### 2. 테이블 생성
`backend/src/main/resources/sql/` 폴더의 SQL 스크립트 실행:
```sql
-- 1. users 테이블 생성
source backend/src/main/resources/sql/create_users_table.sql;

-- 2. 기존 users 테이블이 있다면 마이그레이션
source backend/src/main/resources/sql/alter_users_table.sql;
source backend/src/main/resources/sql/alter_users_add_department.sql;

-- 3. SLOT_MINUTES 설정 제거
source backend/src/main/resources/sql/remove_slot_minutes_setting.sql;
```

---

## 🔐 Google OAuth2 설정

### 1. Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. "APIs & Services" → "Credentials" 이동
4. "Create Credentials" → "OAuth 2.0 Client ID" 선택
5. Application type: **Web application**
6. Authorized redirect URIs 추가:
   ```
   http://localhost:8080/login/oauth2/code/google
   ```
7. Client ID와 Client Secret 복사

### 2. application.properties 설정
```bash
cd backend/src/main/resources/
cp application.properties.example application.properties
```

`application.properties` 파일 수정:
```properties
# Database Configuration
spring.datasource.url=jdbc:mariadb://localhost:3306/edureserv
spring.datasource.username=root
spring.datasource.password=YOUR_DB_PASSWORD

# OAuth2 Google Configuration
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
```

> ⚠️ **주의**: `application.properties`는 `.gitignore`에 포함되어 있으므로 Git에 커밋되지 않습니다.

---

## 🚀 백엔드 실행

### Windows
```bash
cd backend
.\gradlew.bat bootRun
```

### Mac/Linux
```bash
cd backend
./gradlew bootRun
```

백엔드 서버: `http://localhost:8080`

---

## 🎨 프론트엔드 실행

```bash
cd frontend
npm install
npm start
```

프론트엔드: `http://localhost:3000`

---

## 👥 계정 권한 설정

### 관리자 계정 생성
로그인 후 데이터베이스에서 직접 권한 부여:

```sql
-- 일반 관리자 (role = 1)
UPDATE users SET role = 1 WHERE email = 'admin@hanyang.ac.kr';

-- 슈퍼 관리자 (role = 2)
UPDATE users SET role = 2 WHERE email = 'superadmin@hanyang.ac.kr';
```

### 권한별 기능
- **일반 사용자 (role = 0)**: 예약 생성/취소
- **일반 관리자 (role = 1)**: 설정 관리, 예약 현황 조회
- **슈퍼 관리자 (role = 2)**: 모든 관리자 기능 + 사용자 권한 관리

---

## 🔑 주요 설정

### 시스템 설정 (관리자 페이지에서 수정 가능)
- **OPENING_HOUR**: 운영 시작 시간 (기본: 9시)
- **CLOSING_HOUR**: 운영 종료 시간 (기본: 21시)
- **DAILY_LIMIT_HOURS**: 하루 최대 예약 시간 (기본: 3시간)

### 세션 설정
- 세션 타임아웃: 24시간
- 브라우저 닫아도 로그인 상태 유지

---

## 📝 문제 해결

### 포트 충돌
```bash
# Windows
netstat -ano | findstr :8080
taskkill /F /PID [PID]

# Mac/Linux
lsof -ti:8080 | xargs kill -9
```

### 빌드 오류
```bash
cd backend
.\gradlew.bat clean build
```

---

## 📧 문의
문제가 발생하면 GitHub Issues에 등록해주세요.

Copyright © 2025 한양대학교 사범대학. All rights reserved.

