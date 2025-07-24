// ...existing code...
package com.schedease.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.schedease.model.Subject;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class SubjectService {
    public List<Subject> getSubjectsByCourseId(String courseId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).whereEqualTo("courseId", courseId).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Subject> subjects = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            Subject subject = doc.toObject(Subject.class);
            subject.setId(doc.getId());
            subjects.add(subject);
        }
        return subjects;
    }
    private static final String COLLECTION_NAME = "subjects";

    public List<Subject> getAllSubjects() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Subject> subjects = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            Subject subject = doc.toObject(Subject.class);
            subject.setId(doc.getId());
            subjects.add(subject);
        }
        return subjects;
    }

    public Subject addSubject(Subject subject) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<DocumentReference> future = db.collection(COLLECTION_NAME).add(subject);
        DocumentReference docRef = future.get();
        subject.setId(docRef.getId());
        return subject;
    }

    public void deleteSubject(String id) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(id).delete().get();
    }

    public void updateSubject(String id, Subject subject) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        subject.setId(id);
        db.collection(COLLECTION_NAME).document(id).set(subject).get();
    }
} 