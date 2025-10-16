-- 변경사항을 되돌리기 위한 롤백 스크립트
-- 주의: 실행 전 백업 권장!

-- 인덱스 제거
DROP INDEX idx_provider ON users;
DROP INDEX idx_email ON users;

-- 추가된 컬럼 제거
ALTER TABLE users DROP COLUMN updated_at;
ALTER TABLE users DROP COLUMN provider_id;
ALTER TABLE users DROP COLUMN provider;
ALTER TABLE users DROP COLUMN email;

-- 한양대 컬럼 복구 (필요한 경우)
ALTER TABLE users ADD COLUMN hyu_id VARCHAR(50) NOT NULL AFTER id;
ALTER TABLE users ADD COLUMN department VARCHAR(100) NULL DEFAULT NULL AFTER name;
ALTER TABLE users ADD COLUMN status CHAR(4) NOT NULL AFTER role;
ALTER TABLE users ADD COLUMN student_type VARCHAR(50) NOT NULL AFTER status;
ALTER TABLE users ADD UNIQUE INDEX `hyu_id` (`hyu_id`);

