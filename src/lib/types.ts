// User and role types
export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dateCreated: Date;
  photoURL?: string;
  profileImage?: string;
  bio?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  selected_avatar_id?: string | null;
}

export interface Patient extends User {
  role: 'patient';
  medicalHistory?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  dateOfBirth?: string;
  gender?: string;
  hivStatus?: boolean;
}

export interface Availability {
  dayOfWeek: number; // 0-6, where 0 is Sunday
  startTime: string;
  endTime: string;
}

export interface HealthcareInstitution {
  id: string;
  name: string;
  address: string;
  type: 'hospital' | 'clinic' | 'pharmacy';
  province?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Doctor extends User {
  role: 'doctor';
  specialty: string;
  qualifications?: string[];
  institution?: HealthcareInstitution;
  availability?: Availability[];
  rating?: number;
  licenseNumber?: string;
  bio?: string;
  // Add relevant properties for verification
  nrc_number: string;
  videoVerificationRequired?: boolean;
  verification_status?: 'pending' | 'approved' | 'rejected';
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  verification_notes?: string;
  // Add missing properties for document uploads
  licenseDocument?: string;
  idDocument?: string;
}

// Updated Appointment interface with optional display properties
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  // Optional properties for display purposes
  doctorName?: string;
  doctorSpecialty?: string;
  institutionName?: string;
}

// Location related types
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface HealthcareFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy';
  location: Location;
  contact?: string;
  openingHours?: string;
}

// Zambian provinces and healthcare institutions for registration form
export const zambianProvinces = [
  'Lusaka',
  'Copperbelt',
  'Central',
  'Eastern',
  'Southern',
  'Western',
  'North-Western',
  'Northern',
  'Luapula',
  'Muchinga'
];

export const zambianHealthcareInstitutions = [
  {
    id: '1',
    name: 'University Teaching Hospital (UTH)',
    type: 'hospital' as const,
    address: 'Nationalist Road, Lusaka',
    province: 'Lusaka'
  },
  {
    id: '2',
    name: 'Levy Mwanawasa University Teaching Hospital',
    type: 'hospital' as const,
    address: 'Great East Road, Lusaka',
    province: 'Lusaka'
  },
  {
    id: '3',
    name: 'Ndola Central Hospital',
    type: 'hospital' as const,
    address: 'Broadway Avenue, Ndola',
    province: 'Copperbelt'
  },
  {
    id: '4',
    name: 'Kitwe Central Hospital',
    type: 'hospital' as const,
    address: 'Buntungwa Road, Kitwe',
    province: 'Copperbelt'
  },
  {
    id: '5',
    name: 'Cancer Diseases Hospital',
    type: 'hospital' as const,
    address: 'Nationalist Road, Lusaka',
    province: 'Lusaka'
  },
  {
    id: '6',
    name: 'Kabwe General Hospital',
    type: 'hospital' as const,
    address: 'Bwacha, Kabwe',
    province: 'Central'
  },
  {
    id: '7',
    name: 'Arthur Davison Children\'s Hospital',
    type: 'hospital' as const,
    address: 'Broadway Avenue, Ndola',
    province: 'Copperbelt'
  },
  {
    id: '8',
    name: 'Livingstone Central Hospital',
    type: 'hospital' as const,
    address: 'Akapelwa Street, Livingstone',
    province: 'Southern'
  },
  {
    id: '9',
    name: 'MedExpress Clinic',
    type: 'clinic' as const,
    address: 'Cairo Road, Lusaka',
    province: 'Lusaka'
  },
  {
    id: '10',
    name: 'Fairview Hospital',
    type: 'clinic' as const,
    address: 'Kabulonga Road, Lusaka',
    province: 'Lusaka'
  }
];
