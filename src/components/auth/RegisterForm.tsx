import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { UserRole, zambianProvinces, zambianHealthcareInstitutions } from '@/lib/types';
import { UserPlus, Stethoscope } from 'lucide-react';

const RegisterForm = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient' as UserRole,
    // Patient specific fields
    dateOfBirth: '',
    gender: '',
    hivStatus: null as boolean | null,
    // Doctor specific fields
    specialty: '',
    selectedProvince: '',
    selectedInstitution: '',
    licenseNumber: '',
    nrc_number: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'nrc_number') {
      // Apply NRC format: XXXXXX/XX/X
      let formattedValue = value.replace(/[^0-9]/g, ''); // Remove non-digits
      if (formattedValue.length > 6) {
        formattedValue = formattedValue.slice(0, 6) + '/' + formattedValue.slice(6);
      }
      if (formattedValue.length > 9) {
        formattedValue = formattedValue.slice(0, 9) + '/' + formattedValue.slice(9);
      }
      if (formattedValue.length > 11) {
        formattedValue = formattedValue.slice(0, 11); // Max length for XXXXXX/XX/X is 11
      }
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      if (formData.role === 'doctor') {
        const nrcRegex = /^\d{6}\/\d{2}\/\d$/; // Regex for XXXXXX/XX/X
        if (formData.nrc_number && !nrcRegex.test(formData.nrc_number)) {
          toast.error('NRC Number must be in the format XXXXXX/XX/X (e.g., 123456/78/9)');
          return;
        }
      }

      // Prepare user data based on role
      let userData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        role: formData.role,
      };

      if (formData.role === 'doctor') {
        // Find the selected institution
        const selectedInstitution = zambianHealthcareInstitutions.find(
          inst => inst.name === formData.selectedInstitution
        );

        userData = {
          ...userData,
          specialty: formData.specialty,
          licenseNumber: formData.licenseNumber,
          nrcNumber: formData.nrc_number,
          province: selectedInstitution?.province || formData.selectedProvince,
          institution_name: selectedInstitution?.name || formData.selectedInstitution,
          institution_id: selectedInstitution?.id || null,
        };
      } else if (formData.role === 'patient') {
        userData = {
          ...userData,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          hivStatus: formData.hivStatus,
        };
      }

      console.log('Submitting registration with userData:', userData);

      await register(userData, formData.password);
      
      if (formData.role === 'doctor') {
        toast.success('Registration successful!', {
          description: 'Your application has been submitted for verification. You will be notified once approved.',
        });
        
        // Show additional message about pending approval
        setTimeout(() => {
          toast.info('Account Pending Approval', {
            description: 'Your account is pending admin approval. You will gain access once approved.',
            duration: 5000,
          });
        }, 1000);
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.success('Registration successful!', {
          description: 'Welcome to MediConnect! You can now log in to your account.',
        });
        
        // For patients, redirect to login immediately
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('Registration failed', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInstitutions = zambianHealthcareInstitutions.filter(
    inst => !formData.selectedProvince || inst.province === formData.selectedProvince
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 sm:p-6 md:p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex flex-col items-center justify-center gap-2 text-2xl font-display font-semibold">
            <UserPlus className="h-7 w-7" />
            Create Your Account
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">I am a:</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => handleSelectChange('role', value)}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="patient" id="patient" />
                  <Label htmlFor="patient" className="flex items-center gap-2 cursor-pointer text-base">
                    <UserPlus className="h-4 w-4" />
                    Patient
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="doctor" id="doctor" />
                  <Label htmlFor="doctor" className="flex items-center gap-2 cursor-pointer text-base">
                    <Stethoscope className="h-4 w-4" />
                    Healthcare Professional
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="text-base"
                />
              </div>
            </div>

            {/* Email and Password */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="text-base"
                />
              </div>
            </div>

            {/* Patient Specific Fields */}
            {formData.role === 'patient' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleSelectChange('gender', value)}
                    required
                  >
                    <SelectTrigger className="w-full text-base">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hivStatus"
                    checked={formData.hivStatus === true}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hivStatus: checked === true }))}
                  />
                  <label
                    htmlFor="hivStatus"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I am HIV positive
                  </label>
                </div>
              </div>
            )}

            {/* Doctor Specific Fields */}
            {formData.role === 'doctor' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input
                    id="specialty"
                    name="specialty"
                    type="text"
                    placeholder="e.g., Cardiology, Pediatrics"
                    value={formData.specialty}
                    onChange={handleInputChange}
                    required
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    placeholder="Enter your medical license number"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    required
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nrc_number">NRC Number</Label>
                  <Input
                    id="nrc_number"
                    name="nrc_number"
                    type="text"
                    placeholder="e.g., 123456/78/9"
                    value={formData.nrc_number}
                    onChange={handleInputChange}
                    required
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selectedProvince">Province</Label>
                  <Select
                    value={formData.selectedProvince}
                    onValueChange={(value) => handleSelectChange('selectedProvince', value)}
                    required
                  >
                    <SelectTrigger className="w-full text-base">
                      <SelectValue placeholder="Select your province" />
                    </SelectTrigger>
                    <SelectContent>
                      {zambianProvinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selectedInstitution">Healthcare Institution</Label>
                  <Select
                    value={formData.selectedInstitution}
                    onValueChange={(value) => handleSelectChange('selectedInstitution', value)}
                    required
                    disabled={!formData.selectedProvince}
                  >
                    <SelectTrigger className="w-full text-base">
                      <SelectValue placeholder="Select your institution" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredInstitutions.length > 0 ? (
                        filteredInstitutions.map((institution) => (
                          <SelectItem key={institution.id} value={institution.name}>
                            {institution.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Select a province first
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Registering...</span>
              ) : (
                <>Register <UserPlus className="ml-2 h-4 w-4" /></>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <a
                href="/login"
                className="text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
              >
                Sign In
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterForm;
