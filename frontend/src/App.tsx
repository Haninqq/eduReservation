import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import AdminPage from './pages/AdminPage';
import CheckinPage from './pages/CheckinPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* 기본 경로는 로그인으로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 로그인 페이지 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 메인 페이지 (예약 시스템) */}
        <Route path="/main" element={<MainPage />} />
        
        {/* 관리자 페이지 */}
        <Route path="/admin" element={<AdminPage />} />
        
        {/* 체크인 페이지 */}
        <Route path="/checkin" element={<CheckinPage />} />
      </Routes>
    </Router>
  );
}

export default App;
