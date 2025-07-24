package com.schedease.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.cloud.FirestoreClient;
import com.schedease.model.Faculty;
import com.schedease.model.Teacher;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class FacultyService {
    private static final String FACULTY_COLLECTION = "faculty";
    private static final String TEACHER_COLLECTION = "teachers";

    public List<Faculty> getAllFaculty() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(FACULTY_COLLECTION).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Faculty> facultyList = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            Faculty faculty = doc.toObject(Faculty.class);
            faculty.setId(doc.getId());
            facultyList.add(faculty);
        }
        return facultyList;
    }

    public Faculty addFaculty(Faculty faculty) throws ExecutionException, InterruptedException, FirebaseAuthException {
        Firestore db = FirestoreClient.getFirestore();
        
        // Create user in Firebase Auth
        UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                .setEmail(faculty.getSchoolId() + "@school.edu")
                .setEmailVerified(false)
                .setPassword(faculty.getTempPassword())
                .setDisplayName(faculty.getName())
                .setDisabled(false);
        
        UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);
        faculty.setUid(userRecord.getUid());
        faculty.setFacultyId("FAC-" + UUID.randomUUID().toString());
        faculty.setFirstLogin(true);
        faculty.setPasswordChanged(false);

        // Save faculty to Firestore
        db.collection(FACULTY_COLLECTION).document(userRecord.getUid()).set(faculty).get();
        
        if ("teacher".equals(faculty.getRole())) {
            Teacher teacher = new Teacher();
            teacher.setFacultyId(userRecord.getUid());
            teacher.setName(faculty.getName());
            teacher.setSubjectId(faculty.getSubjectId());
            teacher.setCourseId(faculty.getCourseId());
            teacher.setSectionId(faculty.getSectionId());
            teacher.setStatus(faculty.getStatus());
            teacher.setUid(userRecord.getUid());
            teacher.setRole("teacher");
            
            db.collection(TEACHER_COLLECTION).add(teacher).get();
        }
        
        return faculty;
    }

    public void deleteFaculty(String id) throws ExecutionException, InterruptedException, FirebaseAuthException {
        Firestore db = FirestoreClient.getFirestore();
        
        // Delete from teachers collection first
        ApiFuture<QuerySnapshot> future = db.collection(TEACHER_COLLECTION).whereEqualTo("facultyId", id).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            document.getReference().delete();
        }

        // Delete from faculty collection
        db.collection(FACULTY_COLLECTION).document(id).delete().get();
        
        // Delete from Firebase Auth
        FirebaseAuth.getInstance().deleteUser(id);
    }

    public void updateFaculty(String id, Faculty faculty) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        faculty.setId(id);
        db.collection(FACULTY_COLLECTION).document(id).set(faculty, SetOptions.merge()).get();
    }

    public Faculty getFacultyById(String id) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentSnapshot doc = db.collection(FACULTY_COLLECTION).document(id).get().get();
        if (doc.exists()) {
            Faculty faculty = doc.toObject(Faculty.class);
            faculty.setId(doc.getId());
            return faculty;
        }
        return null;
    }

    public void setPasswordChanged(String id, boolean changed) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(FACULTY_COLLECTION).document(id).update("passwordChanged", changed).get();
    }

    public List<Map<String, Object>> getAllFacultyWithTeachingInfo() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        
        // Fetch all faculty
        List<QueryDocumentSnapshot> facultyDocs = db.collection(FACULTY_COLLECTION).get().get().getDocuments();
        Map<String, Faculty> facultyByUid = new HashMap<>();
        for (QueryDocumentSnapshot doc : facultyDocs) {
            Faculty faculty = doc.toObject(Faculty.class);
            faculty.setId(doc.getId());
            facultyByUid.put(doc.getId(), faculty);
        }

        // Fetch all teachers
        List<QueryDocumentSnapshot> teacherDocs = db.collection(TEACHER_COLLECTION).get().get().getDocuments();
        Map<String, Map<String, Object>> teachersByFacultyUid = new HashMap<>();
        for (QueryDocumentSnapshot doc : teacherDocs) {
            Map<String, Object> teacherData = doc.getData();
            String facultyUid = (String) teacherData.get("uid");
            teachersByFacultyUid.put(facultyUid, teacherData);
        }

        List<Map<String, Object>> combined = new ArrayList<>();
        for (Map.Entry<String, Faculty> entry : facultyByUid.entrySet()) {
            String uid = entry.getKey();
            Faculty faculty = entry.getValue();
            
            Map<String, Object> combinedData = new HashMap<>();
            combinedData.put("facultyProfile", faculty);
            
            if (teachersByFacultyUid.containsKey(uid)) {
                combinedData.putAll(teachersByFacultyUid.get(uid));
            }
            
            combined.add(combinedData);
        }
        
        return combined;
    }
}