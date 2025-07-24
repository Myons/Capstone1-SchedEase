package com.schedease.controller;

import com.schedease.model.Teacher;
import com.schedease.service.TeacherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/teachers")
public class TeacherController {
    @Autowired
    private TeacherService teacherService;

    @GetMapping
    public ResponseEntity<List<Teacher>> getAllTeachers() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(teacherService.getAllTeachers());
    }

    @PostMapping
    public ResponseEntity<Teacher> addTeacher(@RequestBody Teacher teacher) throws ExecutionException, InterruptedException {
        Teacher saved = teacherService.addTeacher(teacher);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeacher(@PathVariable String id) throws ExecutionException, InterruptedException {
        teacherService.deleteTeacher(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateTeacher(@PathVariable String id, @RequestBody Teacher teacher) throws ExecutionException, InterruptedException {
        teacherService.updateTeacher(id, teacher);
        return ResponseEntity.ok().build();
    }
} 