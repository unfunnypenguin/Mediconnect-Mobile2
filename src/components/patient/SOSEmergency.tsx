import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Phone, Clock, Truck, AlertTriangle, History } from 'lucide-react';

interface AmbulanceService {
  id: string;
  name: string;
  service_type: string;
  phone_number: string;
  province: string;
  district: string | null;
  estimated_response_time: string | null;
}

interface AmbulanceRequest {
  id: string;
  ambulance_service_id: string;
  location_province: string;
  location_district: string | null;
  location_details: string | null;
  status: string;
  requested_at: string;
  updated_at: string;
  notes: string | null;
  ambulance_services: {
    name: string;
    service_type: string;
  };
}

const provinces = [
  'Central', 'Copperbelt', 'Eastern', 'Luapula', 'Lusaka', 
  'Muchinga', 'Northern', 'North-Western', 'Southern', 'Western'
];

// Zambian emergency ambulance numbers
const emergencyNumbers = [
  { number: '991', description: 'Primary Emergency Services' },
  { number: '992', description: 'Emergency Medical Services' },
  { number: '995', description: 'Emergency Response' },
  { number: '902', description: 'Emergency Services' },
  { number: '905', description: 'Alternative Emergency Line' }
];

const SOSEmergency: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [ambulanceServices, setAmbulanceServices] = useState<AmbulanceService[]>([]);
  const [ambulanceRequests, setAmbulanceRequests] = useState<AmbulanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string>('Lusaka');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  useEffect(() => {
    fetchAmbulanceServices();
    fetchAmbulanceRequests();
  }, [selectedProvince]);

  const fetchAmbulanceServices = async () => {
    try {
      const { data, error } = await supabase
        .from('ambulance_services')
        .select('*')
        .eq('province', selectedProvince)
        .eq('is_active', true)
        .order('service_type', { ascending: true });

      if (error) throw error;
      setAmbulanceServices(data || []);
    } catch (error) {
      console.error('Error fetching ambulance services:', error);
      toast({
        title: "Error",
        description: "Failed to load ambulance services.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAmbulanceRequests = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('ambulance_requests')
        .select(`
          *,
          ambulance_services (name, service_type)
        `)
        .eq('patient_id', currentUser.id)
        .order('requested_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAmbulanceRequests(data || []);
    } catch (error) {
      console.error('Error fetching ambulance requests:', error);
    }
  };

  const handleCallEmergency = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'Emergency': return 'bg-red-100 text-red-800';
      case 'Private': return 'bg-blue-100 text-blue-800';
      case 'Non-Emergency': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* SOS Emergency Header */}
      <Card className="bg-red-50 border-red-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            SOS Emergency Services
          </CardTitle>
          <p className="text-red-600">Quick access to ambulance services in Zambia</p>
        </CardHeader>
      </Card>

      {/* Emergency Numbers */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg text-red-700 flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Ambulance Numbers - Zambia
          </CardTitle>
          <p className="text-sm text-gray-600">Call these numbers immediately in case of emergency</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emergencyNumbers.map((emergency) => (
              <div key={emergency.number} className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-700 mb-1">{emergency.number}</div>
                  <div className="text-sm text-gray-600 mb-3">{emergency.description}</div>
                  <Button 
                    onClick={() => handleCallEmergency(emergency.number)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Location</CardTitle>
          <p className="text-sm text-gray-600">Help emergency services locate you faster</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="province">Province</Label>
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="district">District (Optional)</Label>
              <Input
                id="district"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                placeholder="Enter district"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Ambulance Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Local Ambulance Services - {selectedProvince}
          </CardTitle>
          <p className="text-sm text-gray-600">Additional local ambulance services in your area</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : ambulanceServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No local ambulance services available in {selectedProvince}. Use the emergency numbers above.
            </div>
          ) : (
            <div className="space-y-4">
              {ambulanceServices.map((service) => (
                <div key={service.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getServiceTypeColor(service.service_type)}>
                          {service.service_type}
                        </Badge>
                        {service.district && (
                          <span className="text-sm text-gray-500">{service.district}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-600">{service.phone_number}</span>
                    </div>
                    {service.estimated_response_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">{service.estimated_response_time}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleCallEmergency(service.phone_number)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Request Ambulance
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request History */}
      {ambulanceRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ambulanceRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{request.ambulance_services.name}</h4>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(request.requested_at)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Location:</strong> {request.location_details}</p>
                    <p><strong>Province:</strong> {request.location_province}</p>
                    {request.location_district && (
                      <p><strong>District:</strong> {request.location_district}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SOSEmergency;
