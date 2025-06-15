
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced symptom-to-specialty mapping
const symptomSpecialtyMap = {
  // Cardiovascular
  'chest pain': {
    specialties: ['Cardiology', 'Emergency Medicine', 'Internal Medicine'],
    possibleConditions: ['Angina', 'Heart attack', 'Acid reflux'],
    urgency: 'emergency',
    advice: 'Chest pain can be serious. If you experience severe, crushing pain or shortness of breath, seek immediate medical attention.'
  },
  'heart': {
    specialties: ['Cardiology', 'Internal Medicine'],
    possibleConditions: ['Arrhythmia', 'Heart palpitations'],
    urgency: 'urgent',
    advice: 'Heart-related symptoms should be evaluated promptly.'
  },
  
  // Respiratory
  'cough': {
    specialties: ['Pulmonology', 'General Medicine', 'Internal Medicine'],
    possibleConditions: ['Common cold', 'Bronchitis', 'Pneumonia'],
    urgency: 'routine',
    advice: 'A persistent cough should be evaluated, especially if accompanied by fever.'
  },
  'breathing': {
    specialties: ['Pulmonology', 'Emergency Medicine', 'Internal Medicine'],
    possibleConditions: ['Asthma', 'Pneumonia', 'Anxiety'],
    urgency: 'urgent',
    advice: 'Difficulty breathing requires prompt medical evaluation.'
  },
  
  // Neurological
  'headache': {
    specialties: ['Neurology', 'General Medicine', 'Internal Medicine'],
    possibleConditions: ['Tension headache', 'Migraine', 'Sinus headache'],
    urgency: 'routine',
    advice: 'Most headaches are not serious, but sudden severe headaches need immediate attention.'
  },
  
  // Mental Health
  'anxiety': {
    specialties: ['Psychiatry', 'Psychology', 'General Medicine'],
    possibleConditions: ['Generalized anxiety disorder', 'Panic disorder'],
    urgency: 'routine',
    advice: 'Anxiety is very treatable with proper support.'
  },
  
  // Orthopedic
  'back pain': {
    specialties: ['Orthopedics', 'General Medicine', 'Physical Medicine'],
    possibleConditions: ['Muscle strain', 'Herniated disc', 'Arthritis'],
    urgency: 'routine',
    advice: 'Most back pain improves with rest and proper care.'
  },
  
  // Gastrointestinal
  'stomach': {
    specialties: ['Gastroenterology', 'General Medicine', 'Internal Medicine'],
    possibleConditions: ['Gastritis', 'Ulcer', 'Indigestion'],
    urgency: 'routine',
    advice: 'Stomach issues can often be managed with dietary changes and proper care.'
  },
  
  // General symptoms
  'fever': {
    specialties: ['General Medicine', 'Internal Medicine', 'Emergency Medicine'],
    possibleConditions: ['Viral infection', 'Bacterial infection', 'Flu'],
    urgency: 'urgent',
    advice: 'High fever should be evaluated promptly.'
  },
  'fatigue': {
    specialties: ['General Medicine', 'Internal Medicine', 'Endocrinology'],
    possibleConditions: ['Anemia', 'Thyroid problems', 'Sleep disorders'],
    urgency: 'routine',
    advice: 'Persistent fatigue can have many causes and should be evaluated.'
  }
};

function analyzeSymptoms(message: string): {
  response: string;
  recommendedSpecialties: string[];
  urgency: string;
  shouldShowDoctors: boolean;
} {
  const lowerMessage = message.toLowerCase();
  
  // Check for greetings or general health inquiries
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || 
      lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon') || 
      lowerMessage.includes('good evening') || lowerMessage.trim() === '') {
    return {
      response: "Hello! I'm your AI health assistant. I'm here to help you understand your symptoms and connect you with qualified healthcare professionals. Please tell me about any symptoms or health concerns you're experiencing.",
      recommendedSpecialties: [],
      urgency: 'routine',
      shouldShowDoctors: false
    };
  }
  
  // Handle general health questions
  if (lowerMessage.includes('how are you') || lowerMessage.includes('what can you do')) {
    return {
      response: "I'm here to help you with your health concerns. I can analyze your symptoms and recommend appropriate healthcare specialists. What symptoms are you experiencing today?",
      recommendedSpecialties: [],
      urgency: 'routine',
      shouldShowDoctors: false
    };
  }
  
  // Emergency keywords
  const emergencyKeywords = ['chest pain', 'can\'t breathe', 'cannot breathe', 'seizure', 'unconscious', 
                           'severe pain', 'bleeding heavily', 'suicidal', 'heart attack', 'stroke'];
  const isEmergency = emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Find matching symptoms and their specialties
  const matchedSymptoms = [];
  const matchedSpecialties = new Set<string>();
  let highestUrgency = 'routine';
  let primaryAdvice = '';
  
  Object.entries(symptomSpecialtyMap).forEach(([symptom, data]) => {
    if (lowerMessage.includes(symptom)) {
      matchedSymptoms.push(symptom);
      data.specialties.forEach(specialty => matchedSpecialties.add(specialty));
      
      if (!primaryAdvice) {
        primaryAdvice = data.advice;
      }
      
      if (data.urgency === 'emergency' || isEmergency) {
        highestUrgency = 'emergency';
      } else if (data.urgency === 'urgent') {
        if (highestUrgency !== 'emergency') {
          highestUrgency = 'urgent';
        }
      }
    }
  });
  
  // Default to General Medicine if no specific match but symptoms described
  if (matchedSpecialties.size === 0 && matchedSymptoms.length === 0) {
    // Check if user is describing symptoms in general terms
    const symptomWords = ['pain', 'hurt', 'ache', 'sick', 'feel', 'symptoms', 'problem', 'issue'];
    const hasSymptomDescription = symptomWords.some(word => lowerMessage.includes(word));
    
    if (hasSymptomDescription) {
      matchedSpecialties.add('General Medicine');
      matchedSpecialties.add('Internal Medicine');
    }
  }
  
  const shouldShowDoctors = matchedSpecialties.size > 0;
  
  // Generate response based on urgency
  let response = '';
  
  if (isEmergency || highestUrgency === 'emergency') {
    response = `🚨 This sounds like a medical emergency. Please seek immediate medical attention or call emergency services (991, 992, 995, 902, or 905) right away.`;
  } else if (highestUrgency === 'urgent') {
    response = `I understand you're experiencing concerning symptoms. ${primaryAdvice} I recommend seeing a healthcare professional soon.`;
  } else if (shouldShowDoctors) {
    response = `Based on your symptoms, I recommend consulting with a healthcare professional. ${primaryAdvice}`;
  } else {
    response = "Could you provide more specific details about your symptoms? For example, any pain, discomfort, or specific health concerns you're experiencing?";
  }
  
  return {
    response,
    recommendedSpecialties: Array.from(matchedSpecialties),
    urgency: highestUrgency,
    shouldShowDoctors
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    console.log('Received message:', message);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Analyze symptoms
    const aiResponse = analyzeSymptoms(message);

    let recommendedDoctors = [];

    // Fetch doctors if we should show them
    if (aiResponse.shouldShowDoctors && aiResponse.recommendedSpecialties.length > 0) {
      console.log('Fetching doctors for specialties:', aiResponse.recommendedSpecialties);
      
      try {
        // Get all verified doctors - simplified query without joins
        const { data: doctors, error: doctorsError } = await supabase
          .from('doctor_profiles')
          .select('*')
          .eq('verification_status', 'approved');

        if (doctorsError) {
          console.error('Error fetching doctors:', doctorsError);
        } else {
          const doctorsList = doctors || [];
          console.log('Total available doctors:', doctorsList.length);
          
          if (doctorsList.length > 0) {
            // Filter doctors based on recommended specialties
            let filteredDoctors = doctorsList.filter(doctor => {
              const doctorSpecialty = doctor.specialty.toLowerCase();
              return aiResponse.recommendedSpecialties.some(specialty => {
                const requiredSpecialty = specialty.toLowerCase();
                
                // Direct match or general medicine matching
                if (doctorSpecialty.includes(requiredSpecialty) || 
                    requiredSpecialty.includes(doctorSpecialty) ||
                    (specialty === 'General Medicine' && ['general practice', 'family medicine', 'internal medicine', 'general medicine'].some(gp => doctorSpecialty.includes(gp)))) {
                  return true;
                }
                
                return false;
              });
            });
            
            // If no specific match, show all available doctors
            if (filteredDoctors.length === 0) {
              filteredDoctors = doctorsList.slice(0, 3); // Show up to 3 doctors
            } else {
              filteredDoctors = filteredDoctors.slice(0, 3); // Show up to 3 doctors
            }
            
            recommendedDoctors = filteredDoctors;
            console.log('Recommended doctors:', recommendedDoctors.length);
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    const result = {
      response: aiResponse.response,
      urgency: aiResponse.urgency,
      shouldShowDoctors: aiResponse.shouldShowDoctors,
      recommendedDoctors: recommendedDoctors.map(doctor => ({
        id: doctor.doctor_id,
        name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
        specialty: doctor.specialty,
        institution: doctor.institution_name,
        province: doctor.province,
        email: doctor.email,
        bio: `Experienced ${doctor.specialty} specialist in ${doctor.province} Province.`,
        photoUrl: null,
        qualifications: doctor.qualifications || [],
        experienceYears: doctor.date_created ? 
          Math.max(1, new Date().getFullYear() - new Date(doctor.date_created).getFullYear()) : 1
      }))
    };

    console.log('Sending response with', result.recommendedDoctors.length, 'doctors');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI symptom checker:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred while processing your message',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
