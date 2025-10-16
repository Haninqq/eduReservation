import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout, UserInfo } from '../services/authService';
import {
  getAllSettings,
  updateSettings,
  getCurrentReservations,
  getAllReservations,
  cancelReservationByAdmin,
  getAllUsers,
  updateUserRole,
  Setting,
  Reservation,
  User
} from '../services/adminService';

function AdminPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'reservations' | 'users'>('settings');
  
  // 설정 관련 상태
  const [settings, setSettings] = useState<Setting[]>([]);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  
  // 예약 관련 상태
  const [currentReservations, setCurrentReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  
  // 사용자 관련 상태
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 인증 체크
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate('/login');
      } else if (user.role < 1) {
        // 관리자 권한 없음
        alert('관리자 권한이 필요합니다.');
        navigate('/main');
      } else {
        setCurrentUser(user);
      }
      setAuthLoading(false);
    };
    checkAuth();
  }, [navigate]);

  // 설정 로드
  useEffect(() => {
    if (currentUser && activeTab === 'settings') {
      loadSettings();
    }
  }, [currentUser, activeTab]);

  // 예약 로드
  useEffect(() => {
    if (currentUser && activeTab === 'reservations') {
      loadReservations();
    }
  }, [currentUser, activeTab]);

  // 사용자 로드
  useEffect(() => {
    if (currentUser && currentUser.role === 2 && activeTab === 'users') {
      loadUsers();
    }
  }, [currentUser, activeTab]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getAllSettings();
      setSettings(data);
      const edited: Record<string, string> = {};
      data.forEach(s => { edited[s.keyName] = s.value; });
      setEditedSettings(edited);
    } catch (error) {
      console.error('설정 로드 실패:', error);
      showMessage('error', '설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    setLoading(true);
    try {
      const [current, all] = await Promise.all([
        getCurrentReservations(),
        getAllReservations()
      ]);
      setCurrentReservations(current);
      setAllReservations(all);
    } catch (error) {
      console.error('예약 로드 실패:', error);
      showMessage('error', '예약 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('사용자 로드 실패:', error);
      showMessage('error', '사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    // Validation
    const openingHour = parseInt(editedSettings['OPENING_HOUR'] || '0');
    const closingHour = parseInt(editedSettings['CLOSING_HOUR'] || '24');
    
    if (openingHour >= closingHour) {
      showMessage('error', '운영 종료 시간은 운영 시작 시간보다 늦어야 합니다.');
      return;
    }
    
    const dailyLimitHours = parseInt(editedSettings['DAILY_LIMIT_HOURS'] || '3');
    if (dailyLimitHours < 1 || dailyLimitHours > 12) {
      showMessage('error', '일일 예약 제한 시간은 1~12시간 사이여야 합니다.');
      return;
    }
    
    setLoading(true);
    try {
      await updateSettings(editedSettings);
      showMessage('success', '설정이 성공적으로 업데이트되었습니다. 캐시를 새로고침합니다...');
      
      // 설정 캐시 새로고침
      await fetch('http://localhost:8080/api/admin/settings/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      
      loadSettings();
      showMessage('success', '설정이 성공적으로 업데이트되고 반영되었습니다.');
    } catch (error: any) {
      console.error('설정 업데이트 실패:', error);
      showMessage('error', error.response?.data?.error || '설정 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    if (!window.confirm('정말 이 예약을 취소하시겠습니까?')) return;
    
    setLoading(true);
    try {
      await cancelReservationByAdmin(reservationId);
      showMessage('success', '예약이 취소되었습니다.');
      loadReservations();
    } catch (error: any) {
      console.error('예약 취소 실패:', error);
      showMessage('error', error.response?.data?.error || '예약 취소에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeUserRole = async (userId: number, newRole: number) => {
    if (!window.confirm(`이 사용자의 권한을 ${getRoleName(newRole)}(으)로 변경하시겠습니까?`)) return;
    
    setLoading(true);
    try {
      await updateUserRole(userId, newRole);
      showMessage('success', '사용자 권한이 변경되었습니다.');
      loadUsers();
    } catch (error: any) {
      console.error('권한 변경 실패:', error);
      showMessage('error', error.response?.data?.error || '권한 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLogout = async () => {
    await logout();
  };

  const getRoleName = (role: number) => {
    switch (role) {
      case 0: return '일반 사용자';
      case 1: return '관리자';
      case 2: return '슈퍼 관리자';
      default: return '알 수 없음';
    }
  };

  const formatSlotTime = (slot: number) => {
    const hour = Math.floor(slot / 2);
    const minute = slot % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  };

  if (authLoading) {
    return (
      <div className="page-container space-page bg-surface">
        <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-spinner"></div>
          <p>권한 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-page bg-surface">
      <nav className="space-nav shadow-lg">
        <div className="container py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="space-logo">H</div>
            <div>
              <h5 className="text-black mb-0 fw-bold">한양대학교 사범대학 - 관리자 페이지</h5>
              <small className="text-black-50 space-nav__subtitle">시스템 관리 및 설정</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="text-black text-end">
              <div className="fw-semibold">{currentUser?.name} ({getRoleName(currentUser?.role || 0)})</div>
              <small className="text-black-50">
                {currentUser?.department && `${currentUser.department} · `}
                {currentUser?.email}
              </small>
            </div>
            <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => navigate('/main')}>
              예약 시스템
            </button>
            <button className="btn btn-light btn-sm rounded-pill px-3" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      <main className="space-main py-5">
        <div className="container">
          {message && (
            <div className={`alert alert-${message.type === 'error' ? 'danger' : message.type === 'success' ? 'success' : 'info'} alert-dismissible fade show`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
            </div>
          )}

          <div className="card-modern tab-wrapper">
            <div className="tab-header">
              <div className="tab-buttons">
                <button
                  className={`tab-button ${activeTab === 'settings' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  ⚙️ 설정 관리
                </button>
                <button
                  className={`tab-button ${activeTab === 'reservations' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('reservations')}
                >
                  📊 예약 현황
                </button>
                {currentUser?.role === 2 && (
                  <button
                    className={`tab-button ${activeTab === 'users' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('users')}
                  >
                    👥 사용자 관리
                  </button>
                )}
              </div>
            </div>

            <div className="tab-content p-4">
              {loading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}

              {/* 설정 관리 탭 */}
              {!loading && activeTab === 'settings' && (
                <div>
                  <h4 className="mb-4">⚙️ 시스템 설정</h4>
                  <div className="row g-3">
                    {settings.map(setting => {
                      const keyName = setting.keyName;
                      
                      // OPENING_HOUR, CLOSING_HOUR: 시간 드롭다운 (00~24)
                      if (keyName === 'OPENING_HOUR' || keyName === 'CLOSING_HOUR') {
                        return (
                          <div key={setting.id} className="col-md-6">
                            <div className="card">
                              <div className="card-body">
                                <label className="form-label fw-bold">{keyName}</label>
                                <select
                                  className="form-select"
                                  value={editedSettings[keyName] || ''}
                                  onChange={(e) => setEditedSettings({...editedSettings, [keyName]: e.target.value})}
                                >
                                  {Array.from({ length: 25 }, (_, i) => (
                                    <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                                  ))}
                                </select>
                                <small className="text-muted">{setting.description}</small>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      
                      // DAILY_LIMIT_HOURS: 숫자 입력 (1~12시간)
                      if (keyName === 'DAILY_LIMIT_HOURS') {
                        return (
                          <div key={setting.id} className="col-md-6">
                            <div className="card">
                              <div className="card-body">
                                <label className="form-label fw-bold">{keyName}</label>
                                <select
                                  className="form-select"
                                  value={editedSettings[keyName] || ''}
                                  onChange={(e) => setEditedSettings({...editedSettings, [keyName]: e.target.value})}
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                                    <option key={hour} value={hour}>{hour}시간</option>
                                  ))}
                                </select>
                                <small className="text-muted">{setting.description}</small>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // MAX_SLOTS_PER_RESERVATION: 슬롯 선택
                      if (keyName === 'MAX_SLOTS_PER_RESERVATION') {
                        return (
                          <div key={setting.id} className="col-md-6">
                            <div className="card">
                              <div className="card-body">
                                <label className="form-label fw-bold">{keyName}</label>
                                <select
                                  className="form-select"
                                  value={editedSettings[keyName] || ''}
                                  onChange={(e) => setEditedSettings({...editedSettings, [keyName]: e.target.value})}
                                >
                                  {Array.from({ length: 24 }, (_, i) => i + 1).map(slot => (
                                    <option key={slot} value={slot}>{slot} 슬롯 ({slot * 0.5}시간)</option>
                                  ))}
                                </select>
                                <small className="text-muted">{setting.description}</small>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // 기타: 일반 텍스트 입력
                      return (
                        <div key={setting.id} className="col-md-6">
                          <div className="card">
                            <div className="card-body">
                              <label className="form-label fw-bold">{keyName}</label>
                              <input
                                type="text"
                                className="form-control"
                                value={editedSettings[keyName] || ''}
                                onChange={(e) => setEditedSettings({...editedSettings, [keyName]: e.target.value})}
                              />
                              <small className="text-muted">{setting.description}</small>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4">
                    <button className="btn btn-primary" onClick={handleUpdateSettings} disabled={loading}>
                      💾 설정 저장
                    </button>
                  </div>
                </div>
              )}

              {/* 예약 현황 탭 */}
              {!loading && activeTab === 'reservations' && (
                <div>
                  <h4 className="mb-4">📊 예약 현황</h4>
                  
                  <h5 className="mt-4 mb-3">🔴 현재 사용 중인 방</h5>
                  {currentReservations.length === 0 ? (
                    <p className="text-muted">현재 사용 중인 방이 없습니다.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>예약 ID</th>
                            <th>방 ID</th>
                            <th>사용자 ID</th>
                            <th>날짜</th>
                            <th>시간</th>
                            <th>상태</th>
                            <th>작업</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentReservations.map(res => (
                            <tr key={res.id}>
                              <td>{res.id}</td>
                              <td>Room {res.roomId}</td>
                              <td>{res.userId}</td>
                              <td>{res.date}</td>
                              <td>{formatSlotTime(res.startSlot)} - {formatSlotTime(res.endSlot + 1)}</td>
                              <td><span className="badge bg-success">{res.status}</span></td>
                              <td>
                                <button className="btn btn-sm btn-danger" onClick={() => handleCancelReservation(res.id)}>
                                  취소
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <h5 className="mt-5 mb-3">📋 모든 예약 목록</h5>
                  <div className="table-responsive">
                    <table className="table table-hover table-sm">
                      <thead>
                        <tr>
                          <th>예약 ID</th>
                          <th>방 ID</th>
                          <th>사용자 ID</th>
                          <th>날짜</th>
                          <th>시간</th>
                          <th>상태</th>
                          <th>작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allReservations.slice(0, 20).map(res => (
                          <tr key={res.id}>
                            <td>{res.id}</td>
                            <td>Room {res.roomId}</td>
                            <td>{res.userId}</td>
                            <td>{res.date}</td>
                            <td>{formatSlotTime(res.startSlot)} - {formatSlotTime(res.endSlot + 1)}</td>
                            <td><span className={`badge bg-${res.status === 'RESERVED' ? 'success' : 'secondary'}`}>{res.status}</span></td>
                            <td>
                              {res.status === 'RESERVED' && (
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancelReservation(res.id)}>
                                  취소
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 사용자 관리 탭 (슈퍼관리자만) */}
              {!loading && activeTab === 'users' && currentUser?.role === 2 && (
                <div>
                  <h4 className="mb-4">👥 사용자 관리</h4>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>이름</th>
                          <th>이메일</th>
                          <th>현재 권한</th>
                          <th>가입일</th>
                          <th>권한 변경</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>
                              {user.name}
                              {user.department && <br />}
                              {user.department && <small className="text-muted">{user.department}</small>}
                            </td>
                            <td>{user.email}</td>
                            <td>
                              <span className={`badge bg-${user.role === 2 ? 'danger' : user.role === 1 ? 'warning' : 'secondary'}`}>
                                {getRoleName(user.role)}
                              </span>
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={user.role}
                                onChange={(e) => handleChangeUserRole(user.id, parseInt(e.target.value))}
                                disabled={user.id === currentUser?.id}
                              >
                                <option value={0}>일반 사용자</option>
                                <option value={1}>관리자</option>
                                <option value={2}>슈퍼 관리자</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="space-footer">
        <div className="container text-center">
          <small className="text-muted">© 2025 한양대학교 사범대학. 관리자 시스템</small>
        </div>
      </footer>
    </div>
  );
}

export default AdminPage;

