package com.schedease.model;

import lombok.*;
import com.google.cloud.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Faculty {
    private String id;
    private String name;
    private String schoolId;
    private String status;
    private String role;
    private Boolean passwordChanged;
    private Timestamp createdAt;
    private String facultyId;
    private String currentLoad;
    private Boolean firstLogin;
    private Boolean isTeacher;
    private String email;
    private String uid;
    private Timestamp passwordLastChanged;
    private String tempPassword;
    private String subjectId;
    private String courseId;
    private String sectionId;
}