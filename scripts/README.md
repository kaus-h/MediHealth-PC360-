# Database Seeding Scripts

## Seed from Kaggle Healthcare Dataset

This script populates the database with realistic healthcare data from a Kaggle dataset.

### Setup Instructions

1. **Download the Dataset**
   - Visit: https://www.kaggle.com/datasets/prasad22/healthcare-dataset
   - Download the `healthcare.csv` file
   - Place it in the `scripts` folder

2. **Run the Script**
   - The script will automatically use your Supabase environment variables
   - It will create:
     - Patient profiles and records
     - Clinician profiles and records
     - Visit records
     - A default healthcare agency

3. **What Gets Created**
   - 50 patient records with realistic data
   - Multiple clinician records based on doctors in the dataset
   - Visit records linking patients and clinicians
   - All with proper relationships and foreign keys

### Dataset Fields Mapped

| Kaggle Field | Database Table | Notes |
|--------------|----------------|-------|
| Name | profiles.first_name, last_name | Split into first/last |
| Age | profiles.date_of_birth | Calculated from age |
| Gender | - | Can be added to profiles if needed |
| Blood Type | - | Can be added to patients if needed |
| Medical Condition | patients.primary_diagnosis | Main diagnosis |
| Date of Admission | patients.admission_date | Admission date |
| Discharge Date | patients.discharge_date | Discharge date |
| Doctor | clinicians | Creates clinician profiles |
| Insurance Provider | patients.insurance_provider | Insurance info |

### Notes

- The script limits to 50 records for demo purposes (modify line 195 to change)
- UUIDs are generated consistently from data to avoid duplicates
- Some visits are marked as completed, others as scheduled
 Updated default agency name to MediHealth 
- A default agency "MediHealth Healthcare" is created
