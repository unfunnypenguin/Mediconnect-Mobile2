import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ActivityIcon, StethoscopeIcon, UserIcon, MessageSquareIcon, CalendarIcon, MapPinIcon, MenuIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

const Index = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // If user is logged in, redirect to their dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(currentUser?.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard');
    }
  }, [isAuthenticated, currentUser, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/70 backdrop-blur-lg sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <ActivityIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-display font-semibold">MediConnect</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/register')}>
              Sign Up
            </Button>
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 py-6">
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/register')}>
                    Sign Up
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="py-20 lg:py-32 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          
          <div className="container max-w-5xl relative z-10">
            <div className="text-center mb-12 md:mb-20">
              <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight animate-fade-in">
                Welcome to Mediconnect
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed animate-fade-in animation-delay-100">
                Experience seamless healthcare with MediConnect's AI-powered symptom diagnosis and real-time consultations with qualified doctors.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in animation-delay-200">
                <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate('/register')}>
                  Get Started
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in animation-delay-300">
              <Card className="bg-card/70 backdrop-blur border shadow-md hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <MessageSquareIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">AI Symptom Diagnosis</h3>
                  <p className="text-muted-foreground">
                    Describe your symptoms to our AI assistant for an initial assessment and get connected with the right healthcare professional.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/70 backdrop-blur border shadow-md hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Appointment Scheduling</h3>
                  <p className="text-muted-foreground">
                    Book appointments with your preferred healthcare providers through our intuitive scheduling system.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/70 backdrop-blur border shadow-md hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <MapPinIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Find Nearby Healthcare</h3>
                  <p className="text-muted-foreground">
                    Discover hospitals, clinics, and pharmacies near you with real-time location tracking and directions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container max-w-6xl">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-display font-bold mb-4">Who We Serve</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                MediConnect brings together patients and healthcare professionals on a single platform for better healthcare outcomes.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="bg-card glass-panel rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <UserIcon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-medium mb-3">For Patients</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                      <ActivityIcon className="h-3 w-3" />
                    </div>
                    <p className="text-sm">Get AI-powered symptom analysis and healthcare recommendations</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                      <ActivityIcon className="h-3 w-3" />
                    </div>
                    <p className="text-sm">Connect with doctors for real-time chat consultations</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                      <ActivityIcon className="h-3 w-3" />
                    </div>
                    <p className="text-sm">Schedule appointments with your preferred healthcare professionals</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                      <ActivityIcon className="h-3 w-3" />
                    </div>
                    <p className="text-sm">Locate nearby healthcare facilities when you need care</p>
                  </li>
                </ul>
                <Button className="mt-6 w-full" onClick={() => navigate('/register', { state: { role: 'patient' } })}>
                  Sign Up as Patient
                </Button>
              </div>
              
              <div className="bg-card glass-panel rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <StethoscopeIcon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-medium mb-3">For Healthcare Professionals</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                      <ActivityIcon className="h-3 w-3" />
                    </div>
                    <p className="text-sm">Manage your patient relationships and consultations efficiently</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                      <ActivityIcon className="h-3 w-3" />
                    </div>
                    <p className="text-sm">Engage with patients through secure real-time messaging</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                      <ActivityIcon className="h-3 w-3" />
                    </div>
                    <p className="text-sm">Organize your appointments and schedule with our calendar tools</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                      <ActivityIcon className="h-3 w-3" />
                    </div>
                    <p className="text-sm">Access patient records and medical histories securely</p>
                  </li>
                </ul>
                <Button className="mt-6 w-full" onClick={() => navigate('/register', { state: { role: 'doctor' } })}>
                  Sign Up as Healthcare Professional
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
