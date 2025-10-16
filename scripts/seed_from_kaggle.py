"""
Seed the database with realistic healthcare data from Kaggle dataset
Dataset: Healthcare Dataset by Prasad Patil
URL: https://www.kaggle.com/datasets/prasad22/healthcare-dataset

Instructions:
1. Download the healthcare.csv file from the Kaggle link above
2. Place it in the scripts folder as 'healthcare.csv'
3. Run this script to populate the database
"""

import os
import csv
import json
from datetime import datetime, timedelta
import random
import hashlib

# Database connection using environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing required environment variables")
    print("Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

import requests

# Supabase REST API headers
headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def generate_uuid_from_string(text):
    """Generate a consistent UUID from a string"""
    hash_object = hashlib.md5(text.encode())
    hex_dig = hash_object.hexdigest()
    return f"{hex_dig[:8]}-{hex_dig[8:12]}-{hex_dig[12:16]}-{hex_dig[16:20]}-{hex_dig[20:]}"

def create_profile(first_name, last_name, email, phone, dob, role):
    """Create a profile in the profiles table"""
    profile_id = generate_uuid_from_string(f"{email}-{role}")
    
    profile_data = {
        'id': profile_id,
        'first_name': first_name,
        'last_name': last_name,
        'email': email,
        'phone': phone,
        'date_of_birth': dob,
        'role': role,
        'address': f"{random.randint(100, 9999)} Main St",
        'city': random.choice(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']),
        'state': random.choice(['NY', 'CA', 'IL', 'TX', 'AZ']),
        'zip_code': f"{random.randint(10000, 99999)}"
    }
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/profiles",
        headers=headers,
        json=profile_data
    )
    
    if response.status_code in [200, 201]:
        print(f"✓ Created profile: {first_name} {last_name} ({role})")
        return profile_id
    else:
        print(f"✗ Failed to create profile: {response.status_code} - {response.text}")
        return None

def create_patient(profile_id, medical_record_number, admission_date, discharge_date, diagnosis, insurance_provider):
    """Create a patient record"""
    patient_id = generate_uuid_from_string(f"patient-{profile_id}")
    
    patient_data = {
        'id': patient_id,
        'profile_id': profile_id,
        'medical_record_number': medical_record_number,
        'admission_date': admission_date,
        'discharge_date': discharge_date,
        'primary_diagnosis': diagnosis,
        'insurance_provider': insurance_provider,
        'insurance_policy_number': f"POL-{random.randint(100000, 999999)}",
        'status': 'active' if not discharge_date else 'discharged',
        'emergency_contact_name': f"Emergency Contact {random.randint(1, 100)}",
        'emergency_contact_phone': f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
        'emergency_contact_relationship': random.choice(['Spouse', 'Parent', 'Sibling', 'Child', 'Friend'])
    }
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/patients",
        headers=headers,
        json=patient_data
    )
    
    if response.status_code in [200, 201]:
        print(f"  ✓ Created patient record: {medical_record_number}")
        return patient_id
    else:
        print(f"  ✗ Failed to create patient: {response.status_code} - {response.text}")
        return None

def create_clinician(profile_id, specialization, license_number):
    """Create a clinician record"""
    clinician_id = generate_uuid_from_string(f"clinician-{profile_id}")
    
    # Create a default agency first if it doesn't exist
    agency_id = generate_uuid_from_string("default-agency")
    agency_data = {
        'id': agency_id,
        'name': 'MediHealth Healthcare',
        'license_number': 'AGY-001',
        'email': 'contact@medihealth.com',
        'phone': '+1-555-000-0000',
        'address': '123 Healthcare Blvd',
        'city': 'New York',
        'state': 'NY',
        'zip_code': '10001',
        'is_active': True
    }
    
    # Try to create agency (will fail if exists, which is fine)
    requests.post(
        f"{SUPABASE_URL}/rest/v1/agencies",
        headers=headers,
        json=agency_data
    )
    
    clinician_data = {
        'id': clinician_id,
        'profile_id': profile_id,
        'agency_id': agency_id,
        'specialization': specialization,
        'license_number': license_number,
        'license_type': random.choice(['MD', 'RN', 'NP', 'PA']),
        'is_active': True
    }
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/clinicians",
        headers=headers,
        json=clinician_data
    )
    
    if response.status_code in [200, 201]:
        print(f"  ✓ Created clinician: {specialization}")
        return clinician_id
    else:
        print(f"  ✗ Failed to create clinician: {response.status_code} - {response.text}")
        return None

def create_visit(patient_id, clinician_id, visit_date, visit_type):
    """Create a visit record"""
    visit_id = generate_uuid_from_string(f"visit-{patient_id}-{clinician_id}-{visit_date}")
    
    scheduled_start = datetime.fromisoformat(visit_date)
    scheduled_end = scheduled_start + timedelta(hours=1)
    
    # Some visits are completed, some are upcoming
    is_completed = random.random() > 0.3
    
    visit_data = {
        'id': visit_id,
        'patient_id': patient_id,
        'clinician_id': clinician_id,
        'visit_type': visit_type,
        'scheduled_start': scheduled_start.isoformat(),
        'scheduled_end': scheduled_end.isoformat(),
        'status': 'completed' if is_completed else 'scheduled',
        'visit_notes': f"Routine {visit_type} visit"
    }
    
    if is_completed:
        visit_data['actual_start'] = scheduled_start.isoformat()
        visit_data['actual_end'] = scheduled_end.isoformat()
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/visits",
        headers=headers,
        json=visit_data
    )
    
    if response.status_code in [200, 201]:
        return visit_id
    else:
        print(f"  ✗ Failed to create visit: {response.status_code}")
        return None

def seed_from_csv(csv_file_path):
    """Main function to seed database from Kaggle CSV"""
    
    if not os.path.exists(csv_file_path):
        print(f"Error: CSV file not found at {csv_file_path}")
        print("\nPlease download the healthcare.csv file from:")
        print("https://www.kaggle.com/datasets/prasad22/healthcare-dataset")
        print("And place it in the scripts folder")
        return
    
    print("Starting database seeding from Kaggle dataset...")
    print("=" * 60)
    
    clinicians_created = {}
    patients_created = 0
    visits_created = 0
    
    with open(csv_file_path, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        
        for idx, row in enumerate(csv_reader):
            # Limit to first 50 records for demo purposes
            if idx >= 50:
                break
            
            print(f"\nProcessing record {idx + 1}...")
            
            # Extract patient data
            patient_name = row.get('Name', f'Patient {idx}')
            name_parts = patient_name.split(' ', 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else 'Doe'
            
            age = int(row.get('Age', 50))
            dob = (datetime.now() - timedelta(days=age*365)).strftime('%Y-%m-%d')
            
            gender = row.get('Gender', 'Other')
            blood_type = row.get('Blood Type', 'O+')
            medical_condition = row.get('Medical Condition', 'General')
            admission_date = row.get('Date of Admission', datetime.now().strftime('%Y-%m-%d'))
            discharge_date = row.get('Discharge Date', '')
            insurance_provider = row.get('Insurance Provider', 'Self-Pay')
            
            # Create patient profile
            patient_email = f"{first_name.lower()}.{last_name.lower()}{idx}@patient.com"
            patient_phone = f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
            
            patient_profile_id = create_profile(
                first_name, last_name, patient_email, patient_phone, dob, 'patient'
            )
            
            if patient_profile_id:
                # Create patient record
                mrn = f"MRN-{str(idx).zfill(6)}"
                patient_id = create_patient(
                    patient_profile_id, mrn, admission_date, 
                    discharge_date if discharge_date else None,
                    medical_condition, insurance_provider
                )
                
                if patient_id:
                    patients_created += 1
                    
                    # Create or get clinician
                    doctor_name = row.get('Doctor', 'Dr. Smith')
                    
                    if doctor_name not in clinicians_created:
                        doc_parts = doctor_name.replace('Dr. ', '').split(' ', 1)
                        doc_first = doc_parts[0]
                        doc_last = doc_parts[1] if len(doc_parts) > 1 else 'Smith'
                        
                        doc_email = f"{doc_first.lower()}.{doc_last.lower()}@clinic.com"
                        doc_phone = f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
                        doc_dob = (datetime.now() - timedelta(days=40*365)).strftime('%Y-%m-%d')
                        
                        doc_profile_id = create_profile(
                            doc_first, doc_last, doc_email, doc_phone, doc_dob, 'clinician'
                        )
                        
                        if doc_profile_id:
                            specialization = medical_condition if medical_condition else 'General Practice'
                            license_num = f"LIC-{random.randint(10000, 99999)}"
                            clinician_id = create_clinician(doc_profile_id, specialization, license_num)
                            
                            if clinician_id:
                                clinicians_created[doctor_name] = clinician_id
                    
                    # Create visits
                    if doctor_name in clinicians_created:
                        visit_type = random.choice(['Initial Assessment', 'Follow-up', 'Routine Checkup', 'Consultation'])
                        visit_id = create_visit(
                            patient_id, 
                            clinicians_created[doctor_name],
                            admission_date,
                            visit_type
                        )
                        
                        if visit_id:
                            visits_created += 1
    
    print("\n" + "=" * 60)
    print("Database seeding completed!")
    print(f"✓ Patients created: {patients_created}")
    print(f"✓ Clinicians created: {len(clinicians_created)}")
    print(f"✓ Visits created: {visits_created}")
    print("=" * 60)

if __name__ == "__main__":
    csv_file = "scripts/healthcare.csv"
    seed_from_csv(csv_file)
