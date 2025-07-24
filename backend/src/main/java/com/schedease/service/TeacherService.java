package com.schedease.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.schedease.model.Teacher;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class TeacherService {
    private static final String COLLECTION_NAME = "teachers";

    public List<Teacher> getAllTeachers() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Teacher> teachers = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            Teacher teacher = doc.toObject(Teacher.class);
            teacher.setId(doc.getId());
            teachers.add(teacher);
        }
        return teachers;
    }

    public Teacher addTeacher(Teacher teacher) throws ExecutionException, InterruptedException {
        if (teacher.getSubjectIds() != null && teacher.getSubjectIds().size() > 2) {
            throw new IllegalArgumentException("A teacher can only be assigned up to 2 subjects.");
        }
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<DocumentReference> future = db.collection(COLLECTION_NAME).add(teacher);
        DocumentReference docRef = future.get();
        teacher.setId(docRef.getId());
        return teacher;
    }

    public void deleteTeacher(String id) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(id).delete().get();
    }

    public void updateTeacher(String id, Teacher teacher) throws ExecutionException, InterruptedException {
        if (teacher.getSubjectIds() != null && teacher.getSubjectIds().size() > 2) {
            throw new IllegalArgumentException("A teacher can only be assigned up to 2 subjects.");
        }
        Firestore db = FirestoreClient.getFirestore();
        teacher.setId(id);
        db.collection(COLLECTION_NAME).document(id).set(teacher).get();
    }
} 