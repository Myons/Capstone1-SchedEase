# System Design: SchedEase

This document outlines the system design for the SchedEase application.

## Data Models

The application uses the following data models:

### Classroom
- **id**: String (Primary Key)
- **name**: String
- **building**: String
- **floor**: String
- **roomNumber**: String
- **capacity**: Integer
- **type**: String (lecture or laboratory)

### Course
- **id**: String (Primary Key)
- **name**: String
- **description**: String
- **teacherId**: String (Foreign Key to Teacher)
- **subjectId**: String (Foreign Key to Subject)
- **maxStudents**: Integer
- **schedule**: String
- **roomId**: String (Foreign Key to Classroom)

### Faculty
- **id**: String (Primary Key)
- **name**: String
- **schoolId**: String
- **status**: String
- **role**: String
- **passwordChanged**: Boolean
- **createdAt**: Timestamp
- **facultyId**: String
- **currentLoad**: String
- **firstLogin**: Boolean
- **isTeacher**: Boolean
- **email**: String
- **uid**: String
- **passwordLastChanged**: Timestamp

### Schedule
- **id**: String (Primary Key)
- **teacherId**: String (Foreign Key to Teacher)
- **teacherName**: String
- **courseId**: String (Foreign Key to Course)
- **sectionId**: String (Foreign Key to Section)
- **subjectId**: String (Foreign Key to Subject)
- **roomId**: String (Foreign Key to Classroom)
- **room**: String
- **classType**: String (lecture or laboratory)
- **day**: String
- **timeBlockId**: String
- **timeBlockLabel**: String
- **startTime**: String
- **endTime**: String

### Section
- **id**: String (Primary Key)
- **name**: String
- **gradeLevel**: String
- **adviserId**: String (Foreign Key to Teacher)
- **courseId**: String (Foreign Key to Course)

### Subject
- **id**: String (Primary Key)
- **name**: String
- **code**: String
- **description**: String

### Teacher
- **id**: String (Primary Key)
- **name**: String
- **facultyId**: String (Foreign Key to Faculty)
- **subjectIds**: List of Strings (Foreign Keys to Subject)
- **status**: String
- **uid**: String
- **teacherId**: String
- **role**: String
- **sectionId**: String (Foreign Key to Section)
- **courseId**: String (Foreign Key to Course)
- **currentLoad**: String
- **assignedCourses**: List of Strings (Foreign Keys to Course)
- **email**: String
- **subjectId**: String (Foreign Key to Subject)
## Application Architecture

```mermaid
graph TD
    subgraph Frontend
        A[React App]
    end

    subgraph Backend
        B[Spring Boot App]
    end

    subgraph Database
        C[Firestore]
    end

    subgraph Authentication
        D[Firebase Auth]
    end

    A --&gt; B
    B --&gt; C
    A --&gt; D
    B --&gt; D
```
## Application Functionality and Purpose

SchedEase is a comprehensive web application designed to streamline the process of creating and managing school schedules. The application provides a centralized platform for administrators to manage key academic resources and for teachers to view their schedules.

### Core Features:

*   **Dashboard and Analytics:** A central dashboard provides a high-level overview of the school's scheduling status. It includes analytics on classroom utilization, faculty workload, and the distribution of classes throughout the week.
*   **Schedule Management:** The application allows for the creation, viewing, and deletion of class schedules. It includes conflict detection to prevent scheduling clashes for rooms, teachers, and sections.
*   **Resource Management:** Administrators can manage all the essential components of a school's academic structure, including:
    *   **Classrooms:** Manage lecture halls and laboratories.
    *   **Courses:** Define courses and their properties.
    *   **Faculty:** Manage teacher and administrator accounts, including roles and credentials.
    *   **Sections:** Create and manage class sections for each course.
    *   **Subjects:** Define the subjects taught at the school.
    *   **Teachers:** Manage teacher profiles and their assignments.
*   **Role-Based Access Control:** The application has a concept of user roles (e.g., "admin," "teacher"), which is used to control access to certain features, such as adding or deleting data.
*   **Authentication:** User authentication is handled by Firebase Authentication, with a password change requirement on the first login for enhanced security.

### Purpose:

The primary purpose of SchedEase is to simplify and automate the complex task of school scheduling. By providing a user-friendly interface and powerful management tools, the application aims to:

*   Reduce the time and effort required to create and maintain schedules.
*   Minimize scheduling conflicts and errors.
*   Provide clear and accessible schedule information to faculty.
*   Offer insights into resource allocation and utilization to help administrators make informed decisions.