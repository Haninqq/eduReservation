const API_BASE_URL = 'http://localhost:8080/api';

export interface UserInfo {
  id: number;
  email: string;
  name: string;
  department?: string;  // 소속/학과
  role: number;  // 0: 일반, 1: 관리자, 2: 슈퍼관리자
}

/**
 * 현재 로그인한 사용자 정보 조회
 */
export const getCurrentUser = async (): Promise<UserInfo | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    return null;
  }
};

/**
 * 로그아웃
 */
export const logout = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    // 서버 로그아웃 엔드포인트로 리다이렉트
    window.location.href = 'http://localhost:8080/logout';
  } catch (error) {
    console.error('로그아웃 실패:', error);
  }
};

