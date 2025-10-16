-- users 테이블에 department 컬럼이 없다면 추가
-- 이미 있다면 이 스크립트는 에러가 발생하므로 주석 처리하고 넘어가세요

-- department 컬럼 추가 (이름 옆에)
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100) NULL DEFAULT NULL AFTER name;

-- 기존 데이터에 department 값이 없다면 'Unknown'으로 설정
UPDATE users SET department = 'Unknown' WHERE department IS NULL OR department = '';

-- hyu_id 컬럼이 아직 있다면 제거 (선택사항)
-- ALTER TABLE users DROP COLUMN IF EXISTS hyu_id;

