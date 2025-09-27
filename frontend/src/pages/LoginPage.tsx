import React from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // OAuth 인증 키가 없으므로 임시로 메인 페이지로 바로 이동
    navigate('/main');
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
            <p className="text-muted mb-0">교육 예약 시스템</p>
          </div>

          {/* 로그인 버튼 */}
          <div className="text-center">
            <button 
              className="btn-modern w-100 d-flex align-items-center justify-content-center gap-3"
              onClick={handleLogin}
              style={{ fontSize: '1.1rem', padding: '20px' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              로그인하기
            </button>
            
            <div className="mt-4">
              <small className="text-muted">
                임시 로그인 (OAuth 연동 예정)
              </small>
            </div>
          </div>

          {/* 하단 장식 */}
          <div className="mt-5 pt-4 border-top text-center">
            <small className="text-muted">
              Copyright © 2024 한양대학교 사범대학. All rights reserved.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
