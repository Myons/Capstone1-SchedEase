package com.schedease.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.schedease.model.Classroom;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class ClassroomService {
    private static final String COLLECTION_NAME = "classrooms";

    public List<Classroom> getAllClassrooms() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Classroom> classrooms = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            Classroom classroom = doc.toObject(Classroom.class);
            classroom.setId(doc.getId());
            classrooms.add(classroom);
        }
        return classrooms;
    }

    public Classroom addClassroom(Classroom classroom) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<DocumentReference> future = db.collection(COLLECTION_NAME).add(classroom);
        DocumentReference docRef = future.get();
        classroom.setId(docRef.getId());
        return classroom;
    }

    public void deleteClassroom(String id) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(id).delete().get();
    }

    public void updateClassroom(String id, Classroom classroom) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        classroom.setId(id);
        db.collection(COLLECTION_NAME).document(id).set(classroom).get();
    }
} 