package com.schedease.controller;

import com.schedease.model.Subject;
import com.schedease.service.SubjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {
    @Autowired
    private SubjectService subjectService;

    @GetMapping
    public ResponseEntity<List<Subject>> getSubjects(@RequestParam(required = false) String courseId) throws ExecutionException, InterruptedException {
        if (courseId != null && !courseId.isEmpty()) {
            return ResponseEntity.ok(subjectService.getSubjectsByCourseId(courseId));
        } else {
            return ResponseEntity.ok(subjectService.getAllSubjects());
        }
    }

    @PostMapping
    public ResponseEntity<Subject> addSubject(@RequestBody Subject subject) throws ExecutionException, InterruptedException {
        Subject saved = subjectService.addSubject(subject);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubject(@PathVariable String id) throws ExecutionException, InterruptedException {
        subjectService.deleteSubject(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateSubject(@PathVariable String id, @RequestBody Subject subject) throws ExecutionException, InterruptedException {
        subjectService.updateSubject(id, subject);
        return ResponseEntity.ok().build();
    }
} 