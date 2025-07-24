package com.schedease.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Classroom {
    private String id;
    private String name;
    private String building;
    private String floor;
    private String roomNumber;
    private Integer capacity;
    private String type; // lecture or laboratory
} 