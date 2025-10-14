package kr.ac.hanyang.backend.service;

import kr.ac.hanyang.backend.dto.RoomsDTO;
import kr.ac.hanyang.backend.mapper.RoomsMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
public class RoomsService {

    private final RoomsMapper roomsMapper;

    public List<RoomsDTO> getRooms(){
        return roomsMapper.getRooms();
    }
}
