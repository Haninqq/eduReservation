package kr.ac.hanyang.backend.controller;

import kr.ac.hanyang.backend.dto.RoomsDTO;
import kr.ac.hanyang.backend.service.RoomsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Log4j2
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
public class RoomsController {
    
    private final RoomsService roomsService;

    @GetMapping
    public ResponseEntity<List<RoomsDTO>> getRooms(){
        List<RoomsDTO> rooms = roomsService.getRooms();
        return ResponseEntity.ok(rooms);
    }




}
