import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    // 이미 로그인된 경우 메인 페이지로 리다이렉트
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/me', {
        credentials: 'include'
      });
      if (response.ok) {
        navigate('/main');
      }
    } catch (error) {
      console.log('로그인되지 않음');
    }
  };

  const handleGoogleLogin = () => {
    // Spring Security OAuth2 로그인 엔드포인트로 리다이렉트
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  return (
    <div className="page-container bg-gradient bg-pattern">
      <div className="content-wrapper">
        <div className="card-modern p-5 fade-in-up" style={{ maxWidth: '500px', width: '100%' }}>
          {/* 로고 영역 */}
          <div className="text-center mb-5">
            <div className="float-animation">
              <div 
                className="mx-auto mb-4 d-flex align-items-center justify-content-center"
                style={{
                  width: '80px',
                  height: '80px',
                  background: 'var(--hanyang-gradient)',
                  borderRadius: '20px',
                  fontSize: '2rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                H
              </div>
            </div>
            <h1 className="h3 fw-bold text-dark mb-2">한양대학교 사범대학</h1>
            <p className="text-muted mb-0">스터디룸 & DCELL 예약 시스템</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="alert alert-danger mb-4" role="alert">
              <strong>로그인 실패!</strong> 한양대학교 이메일(@hanyang.ac.kr)만 사용 가능합니다.
            </div>
          )}

          {/* Google 로그인 버튼 */}
          <div className="text-center">
            <button 
              className="btn-modern w-100 d-flex align-items-center justify-content-center gap-3"
              onClick={handleGoogleLogin}
              style={{ fontSize: '1.1rem', padding: '20px' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 로그인
            </button>
            
            <div className="mt-4">
              <small className="text-muted">
                🔒 한양대학교 이메일(@hanyang.ac.kr)만 로그인 가능합니다
              </small>
            </div>
          </div>

          {/* 하단 장식 */}
          <div className="mt-5 pt-4 border-top text-center">
            <small className="text-muted">
              Copyright © 2025 한양대학교 사범대학. All rights reserved.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
