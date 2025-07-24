package com.schedease.controller;

import com.schedease.model.Section;
import com.schedease.service.SectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/sections")
public class SectionController {
    @Autowired
    private SectionService sectionService;

    @GetMapping
    public ResponseEntity<List<Section>> getAllSections() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(sectionService.getAllSections());
    }

    @PostMapping
    public ResponseEntity<Section> addSection(@RequestBody Section section) throws ExecutionException, InterruptedException {
        Section saved = sectionService.addSection(section);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSection(@PathVariable String id) throws ExecutionException, InterruptedException {
        sectionService.deleteSection(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updateSection(@PathVariable String id, @RequestBody Section section) throws ExecutionException, InterruptedException {
        sectionService.updateSection(id, section);
        return ResponseEntity.ok().build();
    }
} 