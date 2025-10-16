const API_BASE_URL = 'http://localhost:8080/api';

export interface PublicSettings {
  OPENING_HOUR: string;
  CLOSING_HOUR: string;
  DAILY_LIMIT_HOURS: string;
  MAX_SLOTS_PER_RESERVATION: string;
}

/**
 * 공개 설정 조회 (로그인 불필요)
 */
export const getPublicSettings = async (): Promise<PublicSettings> => {
  const response = await fetch(`${API_BASE_URL}/settings/public`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('설정 조회 실패');
  }
  
  return response.json();
};

