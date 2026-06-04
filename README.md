# ULOK (Usulan Lokasi) Assessment System

## Project Overview
This application is a comprehensive web-based system designed to manage and assess location proposals (ULOK) for PT. Midi Utama Indonesia Tbk, specifically for Alfamidi. It provides a structured workflow for submitting, reviewing, and evaluating potential store locations, utilizing the Simple Additive Weighting (SAW) method for decision support. The system caters to different user roles, ensuring a streamlined process from proposal creation to final approval.

## Features
- **User Authentication & Authorization**: Secure login system with role-based access control.
- **Dashboard Views**: Tailored dashboards for Super Admin, Admin Cabang, and Assessor roles, providing relevant statistics and activities.
- **ULOK Submission Management**: Admin Cabang can create, view, update, and delete location proposals.
- **Document Upload & Management**: Ability to upload supporting documents for each ULOK, with verification status.
- **ULOK Assessment**: Assessors review ULOKs, verify documents, update proposal statuses (In Review, Revision, Approved, Rejected), and calculate SAW scores.
- **Comment System**: Users can add comments to ULOK submissions for feedback and communication.
- **Notification System**: Real-time notifications for system events, status updates, and new comments.
- **SAW Decision Support**: Automatic calculation of ULOK scores based on predefined criteria (Document Completeness, Mobilization Duration, Rental Price).
- **Leaderboard & Reporting**: Display of top-scoring ULOKs and overall submission statistics.
- **User Management (Super Admin)**: Super Admin can create, update, and delete Admin Cabang and Assessor accounts.
- **Branch Management (Super Admin)**: Super Admin can view and manage branch information.
- **Theme Toggle**: Dark and Light mode support.

## User Roles and Permissions

### 1. Super Admin
- **Description**: Possesses full administrative control over the entire system.
- **Permissions**:
    - Manage all user accounts (Admin Cabang, Assessor).
    - View all ULOK submissions across all branches.
    - Access global system logs and notifications.
    - Monitor dashboard statistics for all branches and assessors.
    - Manage master data (e.g., checklist criteria for SAW calculation).

### 2. Admin Cabang
- **Description**: Manages ULOK submissions for their specific branch.
- **Permissions**:
    - Create, view, update, and delete ULOK submissions for their branch.
    - Upload and manage supporting documents for their ULOKs.
    - Monitor the status and SAW scores of their branch's ULOKs.
    - Engage in discussions/comments on their ULOKs.
    - View notifications relevant to their branch's submissions.

### 3. Assessor
- **Description**: Responsible for reviewing and assessing ULOK submissions from all branches.
- **Permissions**:
    - View all ULOK submissions in the system.
    - Verify uploaded documents and update their verification status.
    - Change the status of ULOK submissions (e.g., "In Review", "Revision", "Approved", "Rejected").
    - Provide comments and feedback on ULOK submissions.
    - Monitor overall ULOK status and review queues.
    - Access SAW calculation results for each ULOK.
    - View notifications relevant to their assessment tasks.

## SAW (Simple Additive Weighting) Decision Support Explanation

The SAW method is used to determine the final score of each ULOK submission, providing a quantitative basis for decision-making. The system evaluates ULOKs based on three main criteria:

1.  **C1: Kelengkapan Dokumen (Document Completeness)** (Weight: 45%)
    -   **Description**: This criterion assesses the completeness of required documents based on the `jenis_badan_hukum` (type of legal entity) of the ULOK. Documents are checked against a master checklist, and their verification status by an Assessor is crucial.
    -   **Scoring**: The score is calculated based on the percentage of verified documents relative to the total required documents for a specific `jenis_badan_hukum`.
        -   0% complete: Score 1
        -   20-39% complete: Score 2
        -   40-59% complete: Score 3
        -   60-79% complete: Score 4
        -   80-100% complete: Score 5

2.  **C2: Durasi Mobilisasi (Mobilization Duration)** (Weight: 35%)
    -   **Description**: This criterion measures the duration from the moment a ULOK enters the "In Review" status to its "Approved" status. A shorter duration indicates a more efficient and less problematic review process.
    -   **Scoring**: The score is inversely proportional to the duration.
        -   >30 days: Score 1
        -   21-30 days: Score 2
        -   13-20 days: Score 3
        -   5-12 days: Score 4
        -   <5 days: Score 5

3.  **C3: Harga Sewa (Rental Price)** (Weight: 20%)
    -   **Description**: This criterion evaluates the rental price of the proposed location. Lower rental prices are preferred, as they contribute to better financial viability.
    -   **Scoring**: The score is inversely proportional to the total rental price for 5 years.
        -   >550,000,000 IDR: Score 1
        -   451,000,000 - 550,000,000 IDR: Score 2
        -   351,000,000 - 450,000,000 IDR: Score 3
        -   250,000,000 - 350,000,000 IDR: Score 4
        -   <250,000,000 IDR: Score 5

**Final Score Calculation**:
Each criterion score (C1, C2, C3) is normalized (divided by 5, the max score) to get a ratio (R_c). The final score is then calculated using the weighted sum:

`Final Score = (0.45 * R_c1) + (0.35 * R_c2) + (0.20 * R_c3)`

Based on the `final_score`, the system provides an automated analysis and recommendation for the ULOK.

## Tech Stack
- **Framework**: Next.js 16.2.6 (React Framework)
- **Styling**: Tailwind CSS 4.3.0, PostCSS
- **Database & Authentication**: Supabase (PostgreSQL, Supabase Auth, Supabase Storage)
- **Server Actions**: Next.js Server Actions
- **Charting**: Recharts 3.8.1
- **Icons**: Lucide React 1.16.0
- **TypeScript**: 5.9.3

## Folder Structure
```
.github/
public/
├── icons/             # SVG icons for the application
└── images/            # Placeholder for images
src/
├── actions/           # Server Actions for database operations and business logic
│   ├── assessor.ts    # Assessor-specific actions (review, status updates)
│   ├── auth.ts        # Authentication actions (login, logout, profile management)
│   ├── cabang.ts      # Admin Cabang-specific actions (ULOK creation, file uploads)
│   ├── saw.ts         # SAW calculation logic
│   └── superadmin.ts  # Super Admin-specific actions (user/branch management, notifications)
├── app/               # Next.js App Router structure
│   ├── admin/         # Admin dashboards
│   │   ├── assessor/  # Assessor dashboard and related pages
│   │   ├── cabang/    # Admin Cabang dashboard and related pages
│   │   └── super-admin/ # Super Admin dashboard and related pages
│   ├── login/         # Login and password recovery pages
│   ├── globals.css    # Global CSS styles
│   ├── layout.tsx     # Root layout for the application
│   └── page.tsx       # Public homepage
├── components/        # Reusable UI components
│   ├── assessor/      # Assessor-specific UI components
│   ├── cabang/        # Admin Cabang-specific UI components
│   ├── super-admin/   # Super Admin-specific UI components
│   ├── floating-controls.tsx # UI for floating elements
│   ├── footer_global.tsx # Global footer component
│   ├── profile_global.tsx # User profile display component
│   └── theme-provider.tsx # Context provider for theme switching
├── lib/               # Utility library files
│   └── supabaseClient.ts # Supabase client initialization (client-side)
└── utils/
    └── supabase/server.ts # Supabase client initialization (server-side for Server Actions)
```

## Installation Guide

### 1. Clone the Repository
```bash
git clone https://github.com/ernandarevalino/capstone_ulok.git
cd capstone_ulok
```

### 2. Install Dependencies
This project uses `pnpm` as the package manager.
```bash
pnpm install
```

## Environment Variables
Create a `.env.local` file in the root of your project and add the following environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

-   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL. You can find this in your Supabase project settings under "API".
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public anonymous key. Also found in your Supabase project settings under "API".
-   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key. This is a powerful key and should be kept secret. It's used for server-side operations requiring elevated privileges (e.g., creating/managing users via `supabase.auth.admin`). You can find this in your Supabase project settings under "API Settings" > "Service Role Key (secret)".

## Database and Supabase Setup

This project relies heavily on Supabase for its backend, including database and authentication. Follow these steps to set up your Supabase project:

### 1. Create a Supabase Project
- Go to [Supabase](https://supabase.com/) and create a new project.

### 2. Set Up Database Schema
You will need to create the necessary tables and policies in your Supabase database. Below is a conceptual representation of the database entities detected from the application's code. You will need to translate these into actual SQL table creation scripts and Row Level Security (RLS) policies within your Supabase project.

#### Detected Entities:
-   **`profiles`**: Stores user profiles, linked to Supabase Auth `users` table.
    -   `id` (UUID, Primary Key, foreign key to `auth.users.id`)
    -   `full_name` (Text)
    -   `nik` (Text, Unique)
    -   `role` (Enum: `super_admin`, `admin_cabang`, `assessor`)
    -   `avatar_url` (Text, nullable)
    -   `branch_id` (Integer, nullable, foreign key to `branches.id`)
    -   `created_at` (Timestamp with time zone)

-   **`branches`**: Stores information about Alfamidi branches.
    -   `id` (Integer, Primary Key)
    -   `nama_cabang` (Text)
    -   `kabupaten_kota` (Text)
    -   `provinsi` (Text)

-   **`ulok_submissions`**: Stores details of each location proposal.
    -   `id` (UUID, Primary Key)
    -   `admin_id` (UUID, foreign key to `profiles.id`)
    -   `nama_lokasi` (Text)
    -   `jenis_badan_hukum` (Text: `PT`, `Yayasan`, `Koperasi`, `Perorangan`, `Kuasa`, `Waris`, `Hibah`)
    -   `nama_pemegang_hak` (Text)
    -   `status` (Enum: `Draft`, `In Review`, `Revision`, `Approved`, `Rejected`)
    -   `alamat_koordinat` (Text, nullable)
    -   `detail_alamat` (Text, nullable)
    -   `jenis_identitas` (Text, nullable)
    -   `nik_pemilik` (Text, nullable)
    -   `nama_kitas` (Text, nullable)
    -   `no_kk` (Text, nullable)
    -   `no_buku_nikah` (Text, nullable)
    -   `nama_sebelum_ganti` (Text, nullable)
    -   `nama_sesudah_ganti` (Text, nullable)
    -   `no_surat_kematian` (Text, nullable)
    -   `jenis_alas_hak` (Text, nullable)
    -   `no_sertifikat_alas_hak` (Text, nullable)
    -   `nama_sertifikat_alas_hak` (Text, nullable)
    -   `luas_sertifikat` (Float, nullable)
    -   `masa_berlaku_sertifikat` (Date, nullable)
    -   `nama_ajb_lainnya` (Text, nullable)
    -   `no_ajb_lainnya` (Text, nullable)
    -   `luas_ajb_lainnya` (Text, nullable)
    -   `no_surat_kelurahan` (Text, nullable)
    -   `tanggal_surat_kelurahan` (Date, nullable)
    -   `tanggal_proses_sertifikat` (Date, nullable)
    -   `bentuk_objek` (Text, nullable)
    -   `harga_sewa` (Integer, nullable)
    -   `dokumen_jaminan` (Boolean, nullable)
    -   `jaminan_bank_nama` (Text, nullable)
    -   `jaminan_bank_no_surat` (Text, nullable)
    -   `jaminan_bank_tanggal` (Date, nullable)
    -   `data_pribadi_tambahan` (Text, nullable)
    -   `created_at` (Timestamp with time zone)
    -   `updated_at` (Timestamp with time zone, nullable)
    -   `first_in_review_at` (Timestamp with time zone, nullable)
    -   `approved_at` (Timestamp with time zone, nullable)
    -   `c1_score` (Integer, SAW score component, nullable)
    -   `c2_score` (Integer, SAW score component, nullable)
    -   `c3_score` (Integer, SAW score component, nullable)
    -   `final_score` (Float, calculated SAW score, nullable)
    -   `saw_analysis_notes` (Text, automated analysis, nullable)
    -   `is_dikuasakan` (Boolean, nullable)

-   **`documents`**: Stores information about uploaded documents for each ULOK.
    -   `id` (UUID, Primary Key)
    -   `ulok_id` (UUID, foreign key to `ulok_submissions.id`)
    -   `document_type` (Text)
    -   `file_url` (Text)
    -   `uploaded_at` (Timestamp with time zone)
    -   `is_verified` (Boolean, default `false`)
    -   `checklist_id` (Integer, nullable, foreign key to `checklist_master.id`)

-   **`checklist_master`**: Stores the master list of required documents for each `jenis_badan_hukum`.
    -   `id` (Integer, Primary Key)
    -   `jenis_badan_hukum` (Text)
    -   `document_name` (Text)
    -   `description` (Text, nullable)
    -   `is_required` (Boolean, default `true`)

-   **`comments`**: Stores comments made on ULOK submissions.
    -   `id` (UUID, Primary Key)
    -   `ulok_id` (UUID, foreign key to `ulok_submissions.id`)
    -   `user_id` (UUID, foreign key to `profiles.id`)
    -   `message` (Text)
    -   `created_at` (Timestamp with time zone)

-   **`notifications`**: Stores system notifications.
    -   `id` (UUID, Primary Key)
    -   `user_id` (UUID, nullable, foreign key to `profiles.id`)
    -   `title` (Text)
    -   `message` (Text)
    -   `is_read` (Boolean, default `false`)
    -   `category` (Text)
    -   `created_at` (Timestamp with time zone)

### 3. Configure Supabase Authentication
-   Enable Email authentication in your Supabase project under "Authentication" > "Settings".
-   The application generates emails using NIK (e.g., `NIK@alfamidi.com`) for new users. Ensure this is compatible with your Supabase email setup or adjust the user creation logic in `actions/superadmin.ts` if needed.

### 4. Setup Storage Buckets
-   Create two storage buckets in your Supabase project under "Storage":
    -   `avatars`: For user profile pictures.
    -   `dokumen-ulok`: For ULOK supporting documents.
-   Configure appropriate Row Level Security (RLS) policies for these buckets to control access.

## Running Development Server

To run the application in development mode:

```bash
pnpm run dev
```

The application will be accessible at `http://localhost:3000`.

## Build and Production Deployment

To build the application for production:

```bash
pnpm run build
```

To start the production server:

```bash
pnpm run start
```

## Screenshots

*(This section is a placeholder. You would typically add screenshots of the application's key interfaces here.)*

## License

This project is licensed under the MIT License.

```
