import React, { useMemo, useState, useLayoutEffect, useRef } from 'react';

type SlotStatus = 'available' | 'unavailable' | 'past';

type Slot = {
  index: number;
  status: SlotStatus;
};

type Room = {
  id: string;
  name: string;
  description: string;
  capacity: number;
  equipments: string[];
  slots: Slot[];
};

const studyRoomConfigs = [
  {
    id: 'A',
    name: 'A Room',
    description: '기본형 스터디룸',
    capacity: 6,
    equipments: ['화이트보드', '55" 모니터'],
    reservedSlots: [18, 19, 20, 21, 32, 33],
  },
  {
    id: 'B',
    name: 'B Room',
    description: '소그룹 토의형',
    capacity: 8,
    equipments: ['180° 회의 테이블', '빔 프로젝터'],
    reservedSlots: [12, 13, 14, 28, 29, 40, 41],
  },
  {
    id: 'C',
    name: 'C Room',
    description: '집중형 1인실',
    capacity: 1,
    equipments: ['노이즈 캔슬링 패널', 'USB 허브'],
    reservedSlots: [8, 9, 10, 11, 24, 25, 26],
  },
  {
    id: 'D',
    name: 'D Room',
    description: '팀 프로젝트룸',
    capacity: 10,
    equipments: ['상호작용형 스크린', '화상 회의 시스템'],
    reservedSlots: [0, 1, 2, 3, 34, 35, 36, 37],
  },
  {
    id: 'E',
    name: 'E Room',
    description: '브레인스토밍룸',
    capacity: 6,
    equipments: ['아이디어 보드', '스탠딩 테이블'],
    reservedSlots: [16, 17, 30, 31, 42, 43, 44],
  },
  {
    id: 'F',
    name: 'F Room',
    description: '세미나 룸',
    capacity: 12,
    equipments: ['마이크 세트', '무선 프레젠터'],
    reservedSlots: [20, 21, 22, 23, 46, 47],
  },
];

const dcellRoomConfigs = [
  {
    id: 'DX',
    name: 'DCELL X',
    description: '디자인씽킹 특화 공간',
    capacity: 20,
    equipments: ['4K 대형 스크린', '트래킹 카메라', '디자인 툴킷'],
    reservedSlots: [14, 15, 16, 17, 18, 19, 32, 33, 34],
  },
  {
    id: 'DY',
    name: 'DCELL Y',
    description: '아이디어 피칭 스테이지',
    capacity: 40,
    equipments: ['360° 음향 시스템', '무대 조명', '라이브 스트리밍'],
    reservedSlots: [10, 11, 12, 26, 27, 28, 29, 30],
  },
];

const createSlots = (reservedSlots: number[]): Slot[] =>
  Array.from({ length: 48 }, (_, index) => ({
    index,
    status: reservedSlots.includes(index) ? 'unavailable' : 'available',
  }));

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
  
  if (date.toDateString() === today.toDateString()) {
    return '오늘';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return '내일';
  } else {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }
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
}> = ({ 
  room, 
  currentSlotIndex,
  onModalOpen,
  onModalClose
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
        alert('선택하신 시간 범위에 예약 불가능한 슬롯이 포함되어 있습니다. 다시 선택해주세요.');
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
      <h3 className="room-card__title">{room.name}</h3>
      <div className="room-card__chip">{room.id}</div>
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

  const studyPanelRef = useRef<HTMLDivElement>(null);
  const dcellPanelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const activePanel = activeTab === 'study' ? studyPanelRef.current : dcellPanelRef.current;
    if (activePanel) {
      setTabContentHeight(activePanel.offsetHeight);
    }
  }, [activeTab]);

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

  const studyRooms = useMemo<Room[]>(
    () =>
      studyRoomConfigs.map((room) => ({
        ...room,
        slots: createSlots(room.reservedSlots),
      })),
    []
  );

  const dcellRooms = useMemo<Room[]>(
    () =>
      dcellRoomConfigs.map((room) => ({
        ...room,
        slots: createSlots(room.reservedSlots),
      })),
    []
  );

  const legend = [
    { label: '예약 가능', className: 'slot-available' },
    { label: '예약 불가', className: 'slot-unavailable' },
    { label: '지난 시간', className: 'slot-past' },
    { label: '현재 시간', className: 'slot-current' },
  ];

  return (
    <div className="page-container space-page bg-surface">
      <nav className="space-nav shadow-lg">
        <div className="container py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="space-logo">H</div>
            <div>
              <h5 className="text-white mb-0 fw-bold">한양대학교 사범대학</h5>
              <small className="text-white-50">스터디룸 · DCELL 공간 예약 시스템</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="text-white text-end">
              <div className="fw-semibold">홍길동</div>
              <small className="text-white-50">사범대학 학생</small>
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
            <div>
              <h2 className="space-hero__title">이용 가능한 공간을 한눈에 확인하세요</h2>
              <p className="space-hero__caption">
                모든 공간은 30분 단위로 예약할 수 있으며, 실시간으로 갱신되는 이용 가능 여부를 제공합니다.
              </p>
            </div>
            <div className="space-hero__controls">
              <div className="date-selector">
                <label htmlFor="date-picker" className="date-selector__label">
                  📅 날짜 선택
                </label>
                <input
                  id="date-picker"
                  type="date"
                  value={formatDate(selectedDate)}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  min={formatDate(new Date())}
                  className="date-selector__input"
                />
                <span className="date-selector__display">
                  {formatDateDisplay(selectedDate)}
                </span>
              </div>
              <div className="space-hero__legend">
                {legend.map((item) => (
                  <div key={item.label} className="legend-item">
                    <span className={`legend-dot ${item.className}`} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

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
                  <div className="room-list">
                    {studyRooms.map((room) => (
                      <RoomCard 
                        key={room.id} 
                        room={room} 
                        currentSlotIndex={currentSlotIndex}
                        onModalOpen={handleModalOpen}
                        onModalClose={handleModalClose}
                      />
                    ))}
                  </div>
                </div>
                <div className="tab-panel" ref={dcellPanelRef}>
                  <div className="room-list">
                    {dcellRooms.map((room) => (
                      <RoomCard 
                        key={room.id} 
                        room={room} 
                        currentSlotIndex={currentSlotIndex}
                        onModalOpen={handleModalOpen}
                        onModalClose={handleModalClose}
                      />
                    ))}
                  </div>
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
                <button className="btn-reserve" onClick={() => console.log('예약!')}>
                  예약하기
                </button>
                <button className="btn-reset" onClick={handleModalClose}>
                  다시 선택
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MainPage;

