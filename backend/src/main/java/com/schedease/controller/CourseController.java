package com.schedease.controller;

import com.schedease.model.Course;
import com.schedease.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourse(@PathVariable String id) throws ExecutionException, InterruptedException {
        Course course = courseService.getCourse(id);
        return course != null ? ResponseEntity.ok(course) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<String> createCourse(@RequestBody Course course) throws ExecutionException, InterruptedException {
        String id = courseService.createCourse(course);
        return ResponseEntity.ok(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateCourse(@PathVariable String id, @RequestBody Course course) throws ExecutionException, InterruptedException {
        courseService.updateCourse(id, course);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable String id) throws ExecutionException, InterruptedException {
        courseService.deleteCourse(id);
        return ResponseEntity.ok().build();
    }
} 