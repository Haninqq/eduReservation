import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function CheckinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setMessage('잘못된 QR 코드입니다.');
      setSuccess(false);
      setLoading(false);
      return;
    }

    handleCheckin();
  }, [roomId]);

  const handleCheckin = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/checkin?roomId=${roomId}`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setSuccess(true);
      } else {
        setMessage(data.message);
        setSuccess(false);
      }
    } catch (error) {
      console.error('체크인 실패:', error);
      setMessage('체크인 처리 중 오류가 발생했습니다.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container bg-gradient bg-pattern">
      <div className="content-wrapper">
        <div className="card-modern p-5 fade-in-up" style={{ maxWidth: '500px', width: '100%' }}>
          {/* 로고 영역 */}
          <div className="text-center mb-4">
            <div className="float-animation">
              <div 
                className="mx-auto mb-4 d-flex align-items-center justify-content-center"
                style={{
                  width: '80px',
                  height: '80px',
                  background: success ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : 'var(--hanyang-gradient)',
                  borderRadius: '20px',
                  fontSize: '2rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                {loading ? '⏳' : success ? '✓' : '✕'}
              </div>
            </div>
            <h1 className="h3 fw-bold text-dark mb-2">체크인</h1>
            <p className="text-muted mb-0">방 번호: {roomId}</p>
          </div>

          {/* 메시지 영역 */}
          <div className={`alert ${success ? 'alert-success' : 'alert-danger'} text-center`} role="alert">
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                체크인 처리 중...
              </>
            ) : (
              <>{message}</>
            )}
          </div>

          {!loading && (
            <div className="text-center mt-4">
              <button 
                className="btn btn-primary rounded-pill px-4"
                onClick={() => navigate('/main')}
              >
                메인으로 이동
              </button>
            </div>
          )}

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

export default CheckinPage;

