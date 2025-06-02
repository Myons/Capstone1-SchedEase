package com.schedease.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.schedease.model.Course;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class CourseService {
    private static final String COLLECTION_NAME = "courses";

    private Firestore getFirestore() {
        return FirestoreClient.getFirestore();
    }

    public List<Course> getAllCourses() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = getFirestore().collection(COLLECTION_NAME).get();
        List<Course> courses = new ArrayList<>();
        
        for (QueryDocumentSnapshot document : future.get().getDocuments()) {
            courses.add(document.toObject(Course.class));
        }
        
        return courses;
    }

    public Course getCourse(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getFirestore().collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        
        return document.exists() ? document.toObject(Course.class) : null;
    }

    public String createCourse(Course course) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getFirestore().collection(COLLECTION_NAME).document();
        course.setId(docRef.getId());
        ApiFuture<WriteResult> future = docRef.set(course);
        future.get();
        return course.getId();
    }

    public void updateCourse(String id, Course course) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getFirestore().collection(COLLECTION_NAME).document(id);
        course.setId(id);
        ApiFuture<WriteResult> future = docRef.set(course);
        future.get();
    }

    public void deleteCourse(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getFirestore().collection(COLLECTION_NAME).document(id);
        ApiFuture<WriteResult> future = docRef.delete();
        future.get();
    }
} 