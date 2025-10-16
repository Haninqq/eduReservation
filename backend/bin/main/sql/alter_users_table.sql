-- 기존 users 테이블을 Google OAuth2용으로 변경
-- 주의: 한양대 OAuth 관련 컬럼 제거 및 Google OAuth2 컬럼 추가

-- 1. email 컬럼 추가 (NULL 허용으로 먼저 추가)
ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL AFTER id;

-- 2. 기존 데이터에 임시 이메일 부여 (id 기반으로 고유하게)
UPDATE users SET email = CONCAT('temp_', id, '@temp.hanyang.ac.kr') WHERE email IS NULL;

-- 3. email을 NOT NULL로 변경
ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NOT NULL;

-- 4. email을 UNIQUE로 설정
ALTER TABLE users ADD UNIQUE INDEX idx_email (email);

-- 5. provider 컬럼 추가 (OAuth2 제공자: 'google')
ALTER TABLE users ADD COLUMN provider VARCHAR(50) NOT NULL DEFAULT 'google' AFTER name;

-- 6. provider_id 컬럼 추가 (Google 사용자 ID)
ALTER TABLE users ADD COLUMN provider_id VARCHAR(255) NOT NULL DEFAULT '' AFTER provider;

-- 7. provider 인덱스 추가
ALTER TABLE users ADD INDEX idx_provider (provider, provider_id);

-- 8. updated_at 컬럼 추가
ALTER TABLE users ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- 9. 한양대 OAuth 관련 컬럼 제거
ALTER TABLE users DROP COLUMN hyu_id;
ALTER TABLE users DROP COLUMN department;
ALTER TABLE users DROP COLUMN status;
ALTER TABLE users DROP COLUMN student_type;

-- 10. role 컬럼 유지 (관리자 권한 관리에 사용)
-- role: 0 = user, 1 = admin, 2 = SuperAdmin

-- ✅ 완료! 이제 기존 사용자는 임시 이메일을 가지며, 
-- Google OAuth2로 처음 로그인하면 실제 @hanyang.ac.kr 이메일로 새 사용자가 생성됩니다.

