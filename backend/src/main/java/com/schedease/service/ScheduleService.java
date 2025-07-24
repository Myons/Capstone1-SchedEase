package com.schedease.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.schedease.model.Schedule;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
public class ScheduleService {
    private static final String COLLECTION_NAME = "schedules";

    public List<Schedule> getAllSchedules() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Schedule> schedules = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            Schedule schedule = doc.toObject(Schedule.class);
            schedule.setId(doc.getId());
            schedules.add(schedule);
        }
        return schedules;
    }

    public Map<String, Object> checkConflicts(Schedule newSchedule) throws ExecutionException, InterruptedException {
        List<Schedule> schedules = getAllSchedules();
        Map<String, Object> conflictResult = new HashMap<>();
        
        List<Schedule> roomConflicts = schedules.stream().filter(s ->
            s.getDay().equals(newSchedule.getDay()) &&
            s.getRoomId().equals(newSchedule.getRoomId()) &&
            s.getTimeBlockId().equals(newSchedule.getTimeBlockId())
        ).collect(Collectors.toList());

        List<Schedule> teacherConflicts = schedules.stream().filter(s ->
            s.getDay().equals(newSchedule.getDay()) &&
            s.getTeacherId().equals(newSchedule.getTeacherId()) &&
            s.getTimeBlockId().equals(newSchedule.getTimeBlockId())
        ).collect(Collectors.toList());

        List<Schedule> sectionConflicts = schedules.stream().filter(s ->
            s.getDay().equals(newSchedule.getDay()) &&
            s.getSectionId().equals(newSchedule.getSectionId()) &&
            s.getTimeBlockId().equals(newSchedule.getTimeBlockId())
        ).collect(Collectors.toList());

        if (!roomConflicts.isEmpty() || !teacherConflicts.isEmpty() || !sectionConflicts.isEmpty()) {
            conflictResult.put("hasConflict", true);
            conflictResult.put("roomConflicts", roomConflicts);
            conflictResult.put("teacherConflicts", teacherConflicts);
            conflictResult.put("sectionConflicts", sectionConflicts);
        } else {
            conflictResult.put("hasConflict", false);
        }
        
        return conflictResult;
    }

    public Schedule addSchedule(Schedule schedule) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<DocumentReference> future = db.collection(COLLECTION_NAME).add(schedule);
        DocumentReference docRef = future.get();
        schedule.setId(docRef.getId());
        return schedule;
    }

    public void deleteSchedule(String id) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(id).delete().get();
    }
}