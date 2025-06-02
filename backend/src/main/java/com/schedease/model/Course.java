package com.schedease.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Course {
    private String id;
    private String name;
    private String description;
    private String teacherId;
    private String subjectId;
    private Integer maxStudents;
    private String schedule;
    private String roomId;
} 