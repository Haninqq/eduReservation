-- 체크인 필요 여부 컬럼 추가
-- 예약 시점이 체크인 마감 이후라면 FALSE로 설정

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS checkin_required BOOLEAN DEFAULT TRUE 
COMMENT '체크인 필요 여부 (마감 이후 예약 시 FALSE)';

-- 기존 데이터는 모두 체크인 필요로 설정
UPDATE reservations 
SET checkin_required = TRUE 
WHERE checkin_required IS NULL;

-- 확인
SELECT * FROM reservations LIMIT 5;

