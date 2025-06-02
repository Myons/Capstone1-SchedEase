package com.schedease.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.cloud.FirestoreClient;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/faculty")
@CrossOrigin(origins = "*") // Configure appropriately for production
public class FacultyController {

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFaculty(@PathVariable String id, @RequestHeader("Authorization") String token) {
        try {
            // Verify the token and get user claims
            // This is a placeholder - implement proper token verification
            if (token == null || token.isEmpty()) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            // Get Firestore instance
            Firestore db = FirestoreClient.getFirestore();

            // Get faculty document to retrieve UID
            var facultyDoc = db.collection("faculty").document(id).get().get();
            if (!facultyDoc.exists()) {
                return ResponseEntity.notFound().build();
            }

            String uid = facultyDoc.getString("uid");

            // Delete from Firebase Auth
            if (uid != null) {
                try {
                    FirebaseAuth.getInstance().deleteUser(uid);
                } catch (FirebaseAuthException e) {
                    // Log the error but continue with Firestore deletion
                    System.err.println("Error deleting auth user: " + e.getMessage());
                }
            }

            // Delete associated teacher records
            QuerySnapshot teacherDocs = db.collection("teachers")
                .whereEqualTo("facultyId", id)
                .get()
                .get();

            // Perform deletions in a batch
            var batch = db.batch();
            
            // Add faculty document deletion to batch
            batch.delete(db.collection("faculty").document(id));
            
            // Add teacher documents deletion to batch
            teacherDocs.getDocuments().forEach(doc -> 
                batch.delete(doc.getReference())
            );

            // Commit the batch
            batch.commit().get();

            return ResponseEntity.ok().body("Faculty member deleted successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error deleting faculty member: " + e.getMessage());
        }
    }

    @DeleteMapping("/teacher/{id}")
    public ResponseEntity<?> deleteTeacher(@PathVariable String id, @RequestHeader("Authorization") String token) {
        try {
            // Verify the token and get user claims
            if (token == null || token.isEmpty()) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            // Get Firestore instance
            Firestore db = FirestoreClient.getFirestore();

            // Get teacher document to verify it exists
            var teacherDoc = db.collection("teachers").document(id).get().get();
            if (!teacherDoc.exists()) {
                return ResponseEntity.notFound().build();
            }

            // Delete the teacher record
            teacherDoc.getReference().delete().get();

            return ResponseEntity.ok().body("Teacher record deleted successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error deleting teacher record: " + e.getMessage());
        }
    }
} 