package com.schedease.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.schedease.model.Section;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class SectionService {
    private static final String COLLECTION_NAME = "sections";

    public List<Section> getAllSections() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Section> sections = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            Section section = doc.toObject(Section.class);
            section.setId(doc.getId());
            sections.add(section);
        }
        return sections;
    }

    public Section addSection(Section section) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<DocumentReference> future = db.collection(COLLECTION_NAME).add(section);
        DocumentReference docRef = future.get();
        section.setId(docRef.getId());
        return section;
    }

    public void deleteSection(String id) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(id).delete().get();
    }

    public void updateSection(String id, Section section) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        section.setId(id);
        db.collection(COLLECTION_NAME).document(id).set(section).get();
    }
} 