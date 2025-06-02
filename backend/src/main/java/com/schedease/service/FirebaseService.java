package com.schedease.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class FirebaseService {
    
    private Firestore getFirestore() {
        return FirestoreClient.getFirestore();
    }
    
    public <T> T getDocument(String collection, String documentId, Class<T> valueType) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getFirestore().collection(collection).document(documentId);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        return document.exists() ? document.toObject(valueType) : null;
    }
    
    public <T> List<T> getCollection(String collection, Class<T> valueType) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = getFirestore().collection(collection).get();
        QuerySnapshot documents = future.get();
        return documents.toObjects(valueType);
    }
    
    public String createDocument(String collection, Map<String, Object> data) throws ExecutionException, InterruptedException {
        ApiFuture<DocumentReference> future = getFirestore().collection(collection).add(data);
        DocumentReference docRef = future.get();
        return docRef.getId();
    }
    
    public void updateDocument(String collection, String documentId, Map<String, Object> data) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getFirestore().collection(collection).document(documentId);
        ApiFuture<WriteResult> future = docRef.update(data);
        future.get();
    }
    
    public void deleteDocument(String collection, String documentId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = getFirestore().collection(collection).document(documentId);
        ApiFuture<WriteResult> future = docRef.delete();
        future.get();
    }
} 