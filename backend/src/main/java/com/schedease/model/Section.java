package com.schedease.model;

public class Section {
    private String id;
    private String name;
    private String gradeLevel;
    private String adviserId;
    private String courseId;

    public Section() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGradeLevel() { return gradeLevel; }
    public void setGradeLevel(String gradeLevel) { this.gradeLevel = gradeLevel; }

    public String getAdviserId() { return adviserId; }
    public void setAdviserId(String adviserId) { this.adviserId = adviserId; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }
} 