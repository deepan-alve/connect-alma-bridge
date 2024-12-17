# Product Requirements Document (PRD)

## Project: Alumni Career & Networking Hub (ACNH)

| Document Version | Date | Author | Status |
| :--- | :--- | :--- | :--- |
| 1.0 | Oct 28, 2025 | AI Assistant (Draft) | Draft for Review |

---

## 1. Goal and Vision

### 1.1 Problem Statement
Current college students lack a formal, structured, and accessible way to leverage their institution's alumni network for career advice, mentorship, and targeted job opportunities. Alumni often want to give back but lack an efficient, low-friction platform to connect directly with students and share opportunities.

### 1.2 Product Vision
To be the **primary digital hub** for the college community, fostering meaningful professional relationships between current students and alumni to drive career success and strengthen long-term institutional engagement.

### 1.3 Success Metrics (KPIs)
| Metric | Goal | Rationale |
| :--- | :--- | :--- |
| **Active Alumni Profiles** | 40% of invited alumni log in within 6 months. | Measures initial platform adoption and reach. |
| **Student-Alumni Connections** | 10,000 connections established within the first year. | Measures core networking success and mentorship activity. |
| **Job Application Conversion** | 5% of job posts receive at least one application. | Validates the effectiveness of the career board. |
| **Skill Endorsements** | Average of 5 endorsements per active student profile after 6 months. | Measures community value exchange and profile credibility. |

---

## 2. Target Users & Personas

### 2.1 Primary Personas

| Persona | Role | Core Goal | Pain Point |
| :--- | :--- | :--- | :--- |
| **Student (Applicant)** | Current Junior/Senior | Find an internship/job and secure career advice/mentorship. | Unsure how to approach successful alumni; generic job boards are overwhelming. |
| **Alumnus (Mentor/Recruiter)** | Graduate (5+ years out) | Give back to the school; find high-quality talent for their company. | Unorganized/outdated alumni directories; no easy way to post targeted jobs. |

---

## 3. Functional Requirements (User Stories)

### 3.1 User & Profile Management (Core)
| Priority | User Story | Acceptance Criteria |
| :--- | :--- | :--- |
| **P1** | **As a new user**, I want to **sign up** and **create a detailed profile** so I can start networking. | The profile includes fields for **name**, **email**, **role**, **department**, and **graduation\_year**. |
| **P1** | **As a user**, I want to **add and manage my skills** so that others can see my expertise. | I can select skills from a predefined list and delete them. |
| **P1** | **As an Alumnus**, I want to **endorse a student's skill** so I can validate their competence. | An **endorsements\_count** is incremented for the skill, and I cannot endorse the same skill twice. |

### 3.2 Networking & Communication
| Priority | User Story | Acceptance Criteria |
| :--- | :--- | :--- |
| **P1** | **As a Student**, I want to **search and filter the directory** by **graduation\_year**, **department**, or **role** so I can find relevant alumni. | Search results display a concise user card with key profile info and a "Connect" button. |
| **P1** | **As a user**, I want to **send a connection request** with an optional note to another user. | The connection status is set to 'pending' until the receiver accepts/rejects. |
| **P1** | **As a connected user**, I want to **send a direct message** to another connected user. | Messages are stored with a **timestamp** and link back to the **sender\_id** and **receiver\_id**. |

### 3.3 Career & Applications
| Priority | User Story | Acceptance Criteria |
| :--- | :--- | :--- |
| **P1** | **As an Alumnus**, I want to **post a job opening** with a **title**, **description**, **location**, and **apply\_deadline**. | The job post is immediately visible on the main job board. |
| **P1** | **As a Student**, I want to **apply for a job** by submitting my details and a **resume\_link**. | An entry is created in the `applications` table with **status** set to 'Submitted'. |
| **P1** | **As an Alumnus (Recruiter)**, I want to **view all applications** for the jobs I posted and update the **status**. | The student receives a **notification** when their application status is updated. |
| **P2** | **As a user**, I want to **request or write a recommendation** for another user. | The recommendation includes **text** and a **date**, and is displayed only after the recommended user approves it. |

### 3.4 Community & Notifications
| Priority | User Story | Acceptance Criteria |
| :--- | :--- | :--- |
| **P2** | **As a user**, I want to **create or join a professional group** based on interest. | I am added to the `groupmembers` table with a default **role** of 'Member'. |
| **P1** | **As a user**, I want to **receive notifications** for new messages, connection requests, and application status changes. | **Notifications** are stored with **content** and a **timestamp**, and the **is\_read** flag tracks view status. |

---

## 4. Non-Functional Requirements (NFRs)

| Category | Requirement | Description |
| :--- | :--- | :--- |
| **Security** | Authentication | All passwords must be securely hashed and salted (`password` field). |
| **Security** | Access Control | Only authenticated users can view the full user profile and connection lists. Role-Based Access Control (RBAC) must distinguish between Student and Alumnus. |
| **Performance** | Page Load Time | All critical pages (Profile, Job Board, Directory) must load in under **2.5 seconds**. |
| **Scalability** | User Growth | The system must be able to support up to **10,000 concurrent users** without degradation in performance. |
| **Usability** | Mobile-First Design | The entire platform must be fully responsive and optimized for mobile devices. |
| **Reliability** | Database Backup | Full database backup must be executed daily with a 7-day retention period. |

---

## 5. Out of Scope (For V1 MVP)
* **Event Management:** Tools for creating, managing, and tracking RSVPs for alumni or student events.
* **Donation/Fundraising Module:** Functionality for processing and tracking monetary donations.
* **Video/Audio Calls:** Live communication features beyond text messaging.
* **Bulk Email/Marketing Tools:** Features for the college admin to send mass communications to filtered user groups.

---