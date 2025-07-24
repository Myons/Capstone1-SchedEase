  package com.schedease.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.schedease.model.Faculty;
import com.schedease.service.FacultyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/faculty")
public class FacultyController {
    @Autowired
    private FacultyService facultyService;

    @GetMapping
    public List<Faculty> getAllFaculty() throws ExecutionException, InterruptedException {
        return facultyService.getAllFaculty();
    }

    @GetMapping("/with-teaching-info")
    public ResponseEntity<List<Map<String, Object>>> getAllFacultyWithTeachingInfo() throws ExecutionException, InterruptedException {
        List<Map<String, Object>> combined = facultyService.getAllFacultyWithTeachingInfo();
        return ResponseEntity.ok(combined);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Faculty> getFacultyById(@PathVariable String id) throws ExecutionException, InterruptedException {
            Faculty faculty = facultyService.getFacultyById(id);
        if (faculty != null) {
            return ResponseEntity.ok(faculty);
        } else {
                return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> addFaculty(@RequestBody Faculty faculty) {
        try {
            Faculty newFaculty = facultyService.addFaculty(faculty);
            return ResponseEntity.ok(newFaculty);
        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateFaculty(@PathVariable String id, @RequestBody Faculty faculty) throws ExecutionException, InterruptedException {
            facultyService.updateFaculty(id, faculty);
            return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFaculty(@PathVariable String id) {
        try {
            facultyService.deleteFaculty(id);
            return ResponseEntity.noContent().build();
        } catch (ExecutionException | InterruptedException | FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable String id) throws Exception {
        facultyService.setPasswordChanged(id, true);
        return ResponseEntity.ok().build();
    }
} 