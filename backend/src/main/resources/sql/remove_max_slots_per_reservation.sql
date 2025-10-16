-- MAX_SLOTS_PER_RESERVATION 설정 제거
-- 이유: DAILY_LIMIT_HOURS만으로 충분하므로 불필요한 제약 제거

DELETE FROM settings WHERE key_name = 'MAX_SLOTS_PER_RESERVATION';

-- 확인
SELECT * FROM settings;

