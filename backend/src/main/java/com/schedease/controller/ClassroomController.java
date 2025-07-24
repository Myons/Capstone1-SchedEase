package com.schedease.controller;

import com.schedease.model.Classroom;
import com.schedease.service.ClassroomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/classrooms")
public class ClassroomController {
    @Autowired
    private ClassroomService classroomService;

    @GetMapping
    public ResponseEntity<List<Classroom>> getAllClassrooms() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(classroomService.getAllClassrooms());
    }

    @PostMapping
    public ResponseEntity<Classroom> addClassroom(@RequestBody Classroom classroom) throws ExecutionException, InterruptedException {
        Classroom saved = classroomService.addClassroom(classroom);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClassroom(@PathVariable String id) throws ExecutionException, InterruptedException {
        classroomService.deleteClassroom(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateClassroom(@PathVariable String id, @RequestBody Classroom classroom) throws ExecutionException, InterruptedException {
        classroomService.updateClassroom(id, classroom);
        return ResponseEntity.ok().build();
    }
} 