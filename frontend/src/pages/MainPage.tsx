import React, { useMemo, useState, useLayoutEffect, useRef, useEffect } from 'react';
import { Reservation } from '../types/reservation';
import { getReservationsByDate, createReservation, ReservationRequest, getMyReservations, cancelReservation } from '../services/reservationService';


type SlotStatus = 'available' | 'unavailable' | 'past';

type Slot = {
  index: number;
  status: SlotStatus;
};

type Room = {
  id: number;
  name: string;
  type: 'BASEMENT' | 'DCELL';
  slots: Slot[];
};

type RoomsDTO = {
  id: number;
  name: string;
  type: 'BASEMENT' | 'DCELL';
};


const createSlots = (reservations: Reservation[]): Slot[] => {
    const reservedSlots = new Set<number>();
    reservations.forEach(res => {
        for (let i = res.startSlot; i <= res.endSlot; i++) {
            reservedSlots.add(i);
        }
    });

    return Array.from({ length: 48 }, (_, index) => ({
        index,
        status: reservedSlots.has(index) ? 'unavailable' : 'available',
    }));
}

const formatSlotLabel = (index: number) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (date: Date) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateString = `${date.getMonth() + 1}월 ${date.getDate()}일`;

  if (date.toDateString() === today.toDateString()) {
    return `오늘 ・ ${dateString}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `내일 ・ ${dateString}`;
  } else {
    return dateString;
  }
};

const formatRoomType = (type: 'BASEMENT' | 'DCELL') => {
  if (type === 'BASEMENT') return '스터디룸';
  if (type === 'DCELL') return 'DCELL';
  return '';
};

const formatDateWithDay = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  };
  return new Intl.DateTimeFormat('ko-KR', options).format(date);
};

type TimeBlock = {
  startIndex: number;
  endIndex: number;
  status: SlotStatus;
  startTime: string;
  endTime: string;
};

const createTimeSegments = (slots: Slot[], currentSlotIndex: number): Slot[] => {
  // 현재 시간 이후의 슬롯만 반환
  return slots.filter(slot => slot.index >= currentSlotIndex);
};

const TimeSegment: React.FC<{
  slot: Slot;
  currentSlotIndex: number;
  onSlotClick?: (slot: Slot) => void;
  isSelected?: boolean;
  isInRange?: boolean;
  isStart?: boolean;
  isEnd?: boolean;
}> = ({ slot, currentSlotIndex, onSlotClick, isSelected = false, isInRange = false, isStart = false, isEnd = false }) => {
  const isCurrent = slot.index === currentSlotIndex;
  const isClickable = slot.status === 'available';
  const label = formatSlotLabel(slot.index);
  const nextLabel = formatSlotLabel(slot.index + 1);

  const handleClick = () => {
    if (isClickable && onSlotClick) {
      onSlotClick(slot);
    }
  };

  return (
    <div 
      className={`time-segment time-segment-${slot.status}${isCurrent ? ' current' : ''}${isSelected ? ' selected' : ''}${isInRange ? ' in-range' : ''}${isStart ? ' range-start' : ''}${isEnd ? ' range-end' : ''}${isClickable ? ' clickable' : ''}`}
      title={`${label} ~ ${nextLabel} (30분)${isClickable ? ' - 클릭하여 예약' : ''}`}
      onClick={handleClick}
    >
      {/* 세그먼트 내부에는 시간 텍스트 표시하지 않음 */}
    </div>
  );
};

const RoomCard: React.FC<{ 
  room: Room; 
  currentSlotIndex: number;
  onModalOpen: (room: Room, startSlot: Slot, endSlot: Slot) => void;
  onModalClose?: () => void;
  showAlert: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
}> = ({ 
  room, 
  currentSlotIndex,
  onModalOpen,
  onModalClose,
  showAlert
}) => {
  const [selectedStartSlot, setSelectedStartSlot] = useState<Slot | null>(null);
  const [selectedEndSlot, setSelectedEndSlot] = useState<Slot | null>(null);
  
  // 드래그 상태 관리
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollStartX, setScrollStartX] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleSlotClick = (slot: Slot) => {
    if (!selectedStartSlot) {
      // 시작 시간 선택
      setSelectedStartSlot(slot);
      setSelectedEndSlot(null);
    } else if (slot.index >= selectedStartSlot.index) {
      // 끝 시간 선택
      const start = selectedStartSlot.index;
      const end = slot.index;
      const slotsInRange = room.slots.slice(start, end + 1);
      const isRangeAvailable = slotsInRange.every(s => s.status === 'available');

      if (isRangeAvailable) {
        setSelectedEndSlot(slot);
        // 모달 열기
        onModalOpen(room, selectedStartSlot, slot);
      } else {
        // 유효하지 않은 범위 선택 시, 모든 선택 취소
        showAlert('예약 불가', '선택하신 시간 범위에 예약 불가능한 슬롯이 포함되어 있습니다. 다시 선택해주세요.', 'error');
        setSelectedStartSlot(null);
        setSelectedEndSlot(null);
      }
    } else {
      // 새로운 시작 시간 선택
      setSelectedStartSlot(slot);
      setSelectedEndSlot(null);
    }
  };

  const resetSelection = () => {
    setSelectedStartSlot(null);
    setSelectedEndSlot(null);
  };

  // 드래그 이벤트 핸들러들
  const handleMouseDown = (e: React.MouseEvent) => {
    if (timelineRef.current) {
      setIsDragging(true);
      setDragStartX(e.clientX);
      setScrollStartX(timelineRef.current.scrollLeft);
      e.preventDefault();
    }
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (isDragging && timelineRef.current) {
      const deltaX = e.clientX - dragStartX;
      timelineRef.current.scrollLeft = scrollStartX - deltaX;
      e.preventDefault();
    }
  };

  const handleGlobalMouseUp = () => {
    setIsDragging(false);
  };

  // 전역 마우스 이벤트 등록/해제
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStartX, scrollStartX]);

  // 모달이 닫힐 때 선택 초기화
  React.useEffect(() => {
    if (onModalClose) {
      const handleModalClose = () => {
        resetSelection();
      };
      // 모달이 닫힐 때 호출될 함수를 등록
      window.addEventListener('modalClose', handleModalClose);
      return () => {
        window.removeEventListener('modalClose', handleModalClose);
      };
    }
  }, [onModalClose]);

  return (
  <div className="room-card card-modern p-4">
    {/* 룸카드 중앙 가이드 메시지 */}
    {selectedStartSlot && !selectedEndSlot && (
      <div className="room-center-guide">
        <span>끝나는 시간을 눌러주세요</span>
      </div>
    )}

    <div className="room-card__header">
      <h3 className="room-card__title">Room {room.name}</h3>
    </div>

      <div className="room-card__timeline">
       <div className="timeline-horizontal">
         <div 
           className="timeline-segment-container"
           ref={timelineRef}
           onMouseDown={handleMouseDown}
           style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
         >
          <div className="time-segments-container">
            {/* 경계 시간 표시를 segments-bar의 형제로 이동 */}
            <div className="segment-boundary-markers">
              {createTimeSegments(room.slots, currentSlotIndex).map((slot, index) => {
                if (index % 2 !== 0) return null; // 1시간 간격으로 표시
                const hour = Math.floor(slot.index / 2);
                const minute = slot.index % 2 === 0 ? '00' : '30';
                const timeLabel = `${hour.toString().padStart(2, '0')}:${minute}`;
                const position = (index / createTimeSegments(room.slots, currentSlotIndex).length) * 100;
                
                return (
                  <div 
                    key={`boundary-${slot.index}`}
                    className="segment-boundary-marker"
                    style={{ left: `${position}%` }}
                  >
                    {timeLabel}
                  </div>
                );
              })}
              {/* 마지막 경계 표시 */}
              <div 
                className="segment-boundary-marker"
                style={{ left: '100%' }}
              >
                {(() => {
                  const lastSlot = createTimeSegments(room.slots, currentSlotIndex).slice(-1)[0];
                  if (!lastSlot) return '';
                  const hour = Math.floor((lastSlot.index + 1) / 2);
                  const minute = (lastSlot.index + 1) % 2 === 0 ? '00' : '30';
                  return `${hour.toString().padStart(2, '0')}:${minute}`;
                })()}
              </div>
            </div>

            <div className="segments-bar">
              {createTimeSegments(room.slots, currentSlotIndex).map((slot, index, array) => {
                const isStart = selectedStartSlot?.index === slot.index;
                const isEnd = selectedEndSlot?.index === slot.index;
                const isInRange = Boolean(selectedStartSlot && selectedEndSlot && 
                                        slot.index >= selectedStartSlot.index && 
                                        slot.index <= selectedEndSlot.index);
                
                return (
                  <TimeSegment
                    key={`${room.id}-slot-${slot.index}`}
                    slot={slot}
                    currentSlotIndex={currentSlotIndex}
                    onSlotClick={handleSlotClick}
                    isSelected={isStart || isEnd}
                    isInRange={isInRange}
                    isStart={isStart}
                    isEnd={isEnd}
                  />
                );
              })}
            </div>
          </div>
          

        </div>
      </div>
    </div>
  </div>
  );
};

function MainPage() {
  const [activeTab, setActiveTab] = useState<'study' | 'dcell'>('study');
  const [tabContentHeight, setTabContentHeight] = useState<number | 'auto'>('auto');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [modalData, setModalData] = useState<{
    room: Room;
    startSlot: Slot;
    endSlot: Slot;
  } | null>(null);

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

 
   const [roomsData, setRoomsData] = useState<RoomsDTO[]>([]);
   const [reservations, setReservations] = useState<Reservation[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const studyPanelRef = useRef<HTMLDivElement>(null);
  const dcellPanelRef = useRef<HTMLDivElement>(null);

  const fetchRoomsAndReservations = async () => {
    setLoading(true);
    // TODO: 실제 유저 ID로 교체해야 합니다.
    const userId = 1;
    try {
      const formattedDate = formatDate(selectedDate);
      
      const [roomsResponse, reservationsResponse, myReservationsResponse] = await Promise.all([
        fetch('http://localhost:8080/api/rooms'),
        getReservationsByDate(formattedDate),
        getMyReservations(userId)
      ]);

      const rooms = await roomsResponse.json();
      
      if (Array.isArray(rooms)) {
        setRoomsData(rooms);
      } else {
        console.error('Room data is not an array:', rooms);
        setRoomsData([]); 
      }
      setReservations(reservationsResponse || []);
      setMyReservations(myReservationsResponse || []);

    } catch (error) {
      console.error('Failed to fetch rooms or reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  // 날짜가 변경될 때마다 방과 예약 정보 다시 가져오기
  useEffect(() => {
    fetchRoomsAndReservations();
  }, [selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 현재 시간 갱신
    return () => clearInterval(timer);
  }, []);

  
  useLayoutEffect(() => {
    const activePanel = activeTab === 'study' ? studyPanelRef.current : dcellPanelRef.current;
    if (activePanel) {
      setTabContentHeight(activePanel.offsetHeight);
    }
  }, [activeTab]);

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertModal(null);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal(null);
  };
 
   const handleLogout = () => {
     console.log('로그아웃');
   };

  const handleModalOpen = (room: Room, startSlot: Slot, endSlot: Slot) => {
    setModalData({ room, startSlot, endSlot });
  };

  const handleModalClose = () => {
    setModalData(null);
    // 모든 룸 카드의 선택 상태 초기화를 위한 이벤트 발생
    window.dispatchEvent(new CustomEvent('modalClose'));
  };

  const handleConfirmReservation = async () => {
    if (!modalData) return;

    // TODO: 실제 유저 ID로 교체해야 합니다.
    const userId = 1;

    const reservationData: ReservationRequest = {
      userId: userId,
      roomId: modalData.room.id,
      date: formatDate(selectedDate),
      startSlot: modalData.startSlot.index,
      endSlot: modalData.endSlot.index,
    };

    setIsReserving(true);
    try {
      await createReservation(reservationData);
      showAlert('예약 완료', '예약이 성공적으로 완료되었습니다!', 'success');
      handleModalClose();
      // 예약 완료 후 최신 정보로 업데이트
      fetchRoomsAndReservations(); 
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        showAlert('예약 실패', error.response.data.message, 'error');
      } else {
        showAlert('오류 발생', '예약 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
      }
      console.error('Reservation failed:', error);
    } finally {
      setIsReserving(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    const cancelAction = async () => {
      setCancellingId(reservationId);
      // TODO: 실제 유저 ID로 교체해야 합니다.
      const userId = 1;
      try {
        await cancelReservation(reservationId, userId);
        showAlert('예약 취소', '예약이 성공적으로 취소되었습니다.', 'success');
        // 데이터 다시 불러오기
        fetchRoomsAndReservations();
      } catch (error: any) {
        if (error.response && error.response.data && error.response.data.message) {
          showAlert('취소 실패', error.response.data.message, 'error');
        } else {
          showAlert('오류 발생', '예약 취소 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
        }
      } finally {
        setCancellingId(null);
      }
    };

    showConfirm(
      '예약 취소 확인', 
      '정말로 이 예약을 취소하시겠습니까?', 
      cancelAction
    );
  };

  const currentSlotIndex = useMemo(() => {
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    if (isToday) {
      // 오늘인 경우 현재 시간 기준으로 계산
      const now = new Date();
      const slotIndex = now.getHours() * 2 + (now.getMinutes() >= 30 ? 1 : 0);
      return Math.max(0, Math.min(47, slotIndex));
    } else {
      // 다른 날짜인 경우 0부터 시작 (모든 시간대 예약 가능)
      return 0;
    }
  }, [selectedDate]);

  const studyRooms = useMemo<Room[]>(() => {
    if (loading || !Array.isArray(roomsData)) return [];
    
    return roomsData
      .filter(room => room.type === 'BASEMENT')
      .map(room => ({
        ...room,
        slots: createSlots(reservations.filter(r => r.roomId === room.id))
      }));
  }, [roomsData, reservations, loading]);

  const dcellRooms = useMemo<Room[]>(() => {
    if (loading || !Array.isArray(roomsData)) return [];
    
    return roomsData
      .filter(room => room.type === 'DCELL')
      .map(room => ({
        ...room,
        slots: createSlots(reservations.filter(r => r.roomId === room.id))
      }));
  }, [roomsData, reservations, loading]);

  const futureReservations = useMemo<Reservation[]>(() => {
    return myReservations.filter(res => {
      const reservationEnd = new Date(`${res.date}T${formatSlotLabel(res.endSlot + 1)}`);
      return reservationEnd > currentTime;
    });
  }, [myReservations, currentTime]);

  const legend = [
    { label: '예약 가능', className: 'slot-available' },
    { label: '예약 불가', className: 'slot-unavailable' }
  ];

  return (
    <div className="page-container space-page bg-surface">
      <nav className="space-nav shadow-lg">
        <div className="container py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="space-logo">H</div>
            <div>
              <h5 className="text-black mb-0 fw-bold">한양대학교 사범대학</h5>
              <small className="text-black-50 space-nav__subtitle">스터디룸 · DCELL 공간 예약 시스템</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="text-black text-end">
              <div className="fw-semibold">홍길동</div>
              <small className="text-black-50">사범대학 학생</small>
            </div>
            <button className="btn btn-light btn-sm rounded-pill px-3" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      <main className="space-main py-5">
        <div className="container">
          <section className="card-modern space-hero mb-4">
            <div className="space-hero__main">
              <div className="space-hero__header">
                <h2 className="space-hero__title">한양대 사범대학 스터디룸 예약 시스템</h2>
                <div className="space-hero__legend">
                  {legend.map((item) => (
                    <div key={item.label} className="legend-item">
                      <span className={`legend-dot ${item.className}`} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-hero__policy">
                <p>
                  <strong>📢 이용 안내</strong><br />
                  - 스터디룸은 재학생만 예약 가능하며, 예약한 본인이 반드시 이용해야 합니다.<br />
                  - 예약 시간 10분 초과 시 자동 취소되오니, 늦지 않게 이용을 시작해주세요.<br />
                  - 모든 공간에서 음식물 섭취는 불가하며, 깨끗하게 사용 후 정리정돈 부탁드립니다.
                </p>
              </div>
            </div>
            <div className="space-hero__controls">
              <div className="date-selector">
                <label htmlFor="date-picker" className="date-selector__label">
                  📅 날짜 선택
                </label>
                <div className="date-selector__container">
                  {(() => {
                  const maxDate = new Date();
                  maxDate.setDate(maxDate.getDate() + 6);
                  
                  return (
                    <input
                      id="date-picker"
                      type="date"
                      value={formatDate(selectedDate)}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      min={formatDate(new Date())}
                      max={formatDate(maxDate)}
                      className="date-selector__input"
                    />
                  );
                })()}
                  <span className="date-selector__display">
                    {formatDateDisplay(selectedDate)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {futureReservations.length > 0 && (
            <section className="my-reservations mb-4">
              <h3 className="section-title">📌 나의 예약 내역</h3>
              <div className="my-reservations-grid">
                {futureReservations.map(res => {
                  const room = roomsData.find(r => r.id === res.roomId);
                  
                  const reservationStart = new Date(`${res.date}T${formatSlotLabel(res.startSlot)}`);
                  const isCancelable = res.status === 'RESERVED' && reservationStart > new Date();

                  return (
                    <div key={res.id} className="reservation-card">
                      <div className="reservation-card__header">
                        <div className="reservation-card__room-info">
                          <span className="reservation-card__type-chip">
                            {room ? formatRoomType(room.type) : '공간'}
                          </span>
                          <h4 className="reservation-card__room-name">{room ? room.name : `ID: ${res.roomId}`}</h4>
                        </div>
                        {isCancelable && (
                          <button
                            className="btn-cancel-card"
                            onClick={() => handleCancelReservation(res.id)}
                            disabled={cancellingId === res.id}
                            title="예약 취소"
                          >
                            {cancellingId === res.id ? '...' : '✕'}
                          </button>
                        )}
                      </div>
                      <div className="reservation-card__body">
                        <div className="reservation-card__detail-group">
                          <div className="reservation-card__detail">
                            <span className="reservation-card__icon">📅</span>
                            <span className="reservation-card__text">{formatDateWithDay(res.date)}</span>
                          </div>
                          <div className="reservation-card__detail">
                            <span className="reservation-card__icon">⏰</span>
                            <span className="reservation-card__text">{formatSlotLabel(res.startSlot)} - {formatSlotLabel(res.endSlot + 1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="card-modern tab-wrapper">
            <div className="tab-header">
              <div className="tab-buttons">
                <button
                  className={`tab-button ${activeTab === 'study' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('study')}
                >
                  스터디룸
                </button>
                <button
                  className={`tab-button ${activeTab === 'dcell' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('dcell')}
                >
                  DCELL
                </button>
              </div>
              <div className="tab-indicator" data-active={activeTab} />
            </div>

            <div className="tab-content">
              <div
                className="tab-slider"
                style={{ transform: activeTab === 'study' ? 'translateX(0%)' : 'translateX(-50%)' }}
              >
                <div className="tab-panel" ref={studyPanelRef}>
                  {loading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>방 정보를 불러오는 중...</p>
                    </div>
                  ) : (
                    <div className="room-list">
                      {studyRooms.map((room) => (
                        <RoomCard 
                          key={room.id} 
                          room={room} 
                          currentSlotIndex={currentSlotIndex}
                          onModalOpen={handleModalOpen}
                          onModalClose={handleModalClose}
                          showAlert={showAlert}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="tab-panel" ref={dcellPanelRef}>
                  {loading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>방 정보를 불러오는 중...</p>
                    </div>
                  ) : (
                    <div className="room-list">
                      {dcellRooms.map((room) => (
                        <RoomCard 
                          key={room.id} 
                          room={room} 
                          currentSlotIndex={currentSlotIndex}
                          onModalOpen={handleModalOpen}
                          onModalClose={handleModalClose}
                          showAlert={showAlert}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="space-footer">
        <div className="container text-center">
          <small className="text-muted">© 2025 한양대학교 사범대학. 공간 예약 시스템</small>
        </div>
      </footer>

      {/* 전역 예약 모달 */}
      {modalData && (
        <>
          <div className="reservation-modal-overlay" onClick={handleModalClose} />
          <div className="reservation-modal">
            <div className="modal-header">
              <h3 className="modal-title">{modalData.room.name} 예약</h3>
              <button className="modal-close" onClick={handleModalClose}>
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="confirm-info">
                <span className="confirm-date">
                  {formatDateDisplay(selectedDate)}
                </span>
                <span className="confirm-time">
                  {formatSlotLabel(modalData.startSlot.index)} - {formatSlotLabel(modalData.endSlot.index + 1)}
                </span>
                <span className="confirm-duration">
                  총 {((modalData.endSlot.index - modalData.startSlot.index + 1) * 30)}분 이용
                </span>
              </div>
              <div className="confirm-actions">
                <button 
                  className="btn-reserve" 
                  onClick={handleConfirmReservation}
                  disabled={isReserving}
                >
                  {isReserving ? '예약 중...' : '예약하기'}
                </button>
                <button className="btn-reset" onClick={handleModalClose} disabled={isReserving}>
                  다시 선택
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* 알림 모달 */}
      {alertModal?.isOpen && (
        <>
          <div className="custom-modal-overlay" onClick={closeAlert} />
          <div className={`custom-modal alert-modal alert-${alertModal.type}`}>
            <div className="modal-header">
              <h3 className="modal-title">{alertModal.title}</h3>
              <button className="modal-close" onClick={closeAlert}>✕</button>
            </div>
            <div className="modal-content">
              <p>{alertModal.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-confirm" onClick={closeAlert}>확인</button>
            </div>
          </div>
        </>
      )}

      {/* 확인 모달 */}
      {confirmModal?.isOpen && (
        <>
          <div className="custom-modal-overlay" onClick={closeConfirm} />
          <div className="custom-modal confirm-modal">
            <div className="modal-header">
              <h3 className="modal-title">{confirmModal.title}</h3>
              <button className="modal-close" onClick={closeConfirm}>✕</button>
            </div>
            <div className="modal-content">
              <p>{confirmModal.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeConfirm}>취소</button>
              <button className="btn-confirm" onClick={() => {
                confirmModal.onConfirm();
                closeConfirm();
              }}>확인</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MainPage;

