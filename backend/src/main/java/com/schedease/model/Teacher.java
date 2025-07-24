package com.schedease.model;

import java.util.List;

public class Teacher {
    private String id;
    private String name;
    private String facultyId;
    // A teacher can be assigned up to 2 subjects
    private List<String> subjectIds;
    private String status;
    private String uid;
    private String teacherId;
    private String role;
    private String sectionId;
    private String courseId;
    private String currentLoad;
    private List<String> assignedCourses;
    private String email;
    private String subjectId;

    public Teacher() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getFacultyId() { return facultyId; }
    public void setFacultyId(String facultyId) { this.facultyId = facultyId; }

    // Getter and setter for subjectIds
    public List<String> getSubjectIds() { return subjectIds; }
    public void setSubjectIds(List<String> subjectIds) { this.subjectIds = subjectIds; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }

    public String getTeacherId() { return teacherId; }
    public void setTeacherId(String teacherId) { this.teacherId = teacherId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getSectionId() { return sectionId; }
    public void setSectionId(String sectionId) { this.sectionId = sectionId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getCurrentLoad() { return currentLoad; }
    public void setCurrentLoad(String currentLoad) { this.currentLoad = currentLoad; }

    public List<String> getAssignedCourses() { return assignedCourses; }
    public void setAssignedCourses(List<String> assignedCourses) { this.assignedCourses = assignedCourses; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }
} 