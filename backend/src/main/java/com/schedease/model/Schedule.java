package com.schedease.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Schedule {
    private String id;
    private String teacherId;
    private String teacherName;
    private String courseId;
    private String sectionId;
    private String subjectId;
    private String roomId;
    private String room; // Additional field from Firestore
    private String classType; // lecture or laboratory
    private String day; // e.g., Monday
    private String timeBlockId; // e.g., 1, 2, 3, ...
    private String timeBlockLabel; // e.g., 7:30 - 9:00
    private String startTime;
    private String endTime;
} 