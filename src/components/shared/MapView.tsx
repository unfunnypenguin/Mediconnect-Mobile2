import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPinIcon,
  CrosshairIcon,
  BuildingIcon,
  ShieldPlusIcon,
  HeartPulseIcon,
  SearchIcon,
  LoaderIcon,
  ListIcon,
  MapIcon,
  AlertCircleIcon,
  XIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { HealthcareFacility, Location } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

// Embedded Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAVR8lUq_DXhx2wRLQkCuV4SVDxCB7l-Go';

const mockFacilities: HealthcareFacility[] = [
  {
    id: '1',
    name: 'University Teaching Hospital',
    type: 'hospital',
    location: {
      latitude: -15.4177,
      longitude: 28.2970,
      address: 'Nationalist Road, Lusaka'
    },
    contact: '+260 211 252269',
    openingHours: '24/7'
  },
  {
    id: '2',
    name: 'Levy Mwanawasa Hospital',
    type: 'hospital',
    location: {
      latitude: -15.3843,
      longitude: 28.3238,
      address: 'Olympia Park, Lusaka'
    },
    contact: '+260 211 253529',
    openingHours: '24/7'
  },
  {
    id: '3',
    name: 'MedExpress Pharmacy',
    type: 'pharmacy',
    location: {
      latitude: -15.3928,
      longitude: 28.3053,
      address: 'Cairo Road, Lusaka'
    },
    contact: '+260 977 123456',
    openingHours: '08:00-21:00'
  },
  {
    id: '4',
    name: 'Family Health Clinic',
    type: 'clinic',
    location: {
      latitude: -15.4092,
      longitude: 28.2862,
      address: 'Kamwala, Lusaka'
    },
    contact: '+260 966 987654',
    openingHours: '08:00-17:00'
  },
  {
    id: '5',
    name: 'Lusaka Pharmacy',
    type: 'pharmacy',
    location: {
      latitude: -15.4120,
      longitude: 28.2890,
      address: 'Cha Cha Cha Road, Lusaka'
    },
    contact: '+260 977 987654',
    openingHours: '08:00-20:00'
  },
  {
    id: '6',
    name: 'City Health Clinic',
    type: 'clinic',
    location: {
      latitude: -15.4050,
      longitude: 28.2950,
      address: 'Freedom Way, Lusaka'
    },
    contact: '+260 966 123789',
    openingHours: '09:00-18:00'
  }
];

const typeBadgeColors = {
  hospital: 'bg-blue-500',
  clinic: 'bg-green-500',
  pharmacy: 'bg-amber-500'
};

const typeIcons = {
  hospital: <BuildingIcon className="h-4 w-4" />,
  clinic: <ShieldPlusIcon className="h-4 w-4" />,
  pharmacy: <HeartPulseIcon className="h-4 w-4" />
};

const MapView = () => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<HealthcareFacility | null>(null);
  const [filteredFacilities, setFilteredFacilities] = useState<HealthcareFacility[]>(mockFacilities);
  const [filter, setFilter] = useState<'all' | 'hospital' | 'clinic' | 'pharmacy'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchRadius, setSearchRadius] = useState(5);
  const [viewType, setViewType] = useState<'list' | 'map'>('map');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);

  // Get user location
  useEffect(() => {
    const getUserLocation = () => {
      setIsLoading(true);
      setIsLocating(true);
      
      const defaultLocation = {
        latitude: -15.3875,
        longitude: 28.3228
      };
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            setIsLoading(false);
            setIsLocating(false);
            toast.success('Location detected');
          },
          (error) => {
            console.error('Error getting location:', error);
            setUserLocation(defaultLocation);
            setIsLoading(false);
            setIsLocating(false);
            toast.error('Using default location');
          }
        );
      } else {
        setUserLocation(defaultLocation);
        setIsLoading(false);
        setIsLocating(false);
      }
    };

    getUserLocation();
  }, []);

  // Initialize Google Maps
  const initializeMap = () => {
    if (!window.google || !mapContainer.current || !userLocation) return;

    const mapOptions = {
      center: { lat: userLocation.latitude, lng: userLocation.longitude },
      zoom: 12,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      zoomControl: false,
    };

    map.current = new window.google.maps.Map(mapContainer.current, mapOptions);

    // Add user location marker
    new window.google.maps.Marker({
      position: { lat: userLocation.latitude, lng: userLocation.longitude },
      map: map.current,
      title: 'Your Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(24, 24),
      }
    });

    // Add facility markers
    addFacilityMarkers();
  };

  const addFacilityMarkers = () => {
    if (!map.current || !window.google) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.setMap(null));
    markers.current = [];

    filteredFacilities.forEach((facility) => {
      const color = facility.type === 'hospital' ? '#3B82F6' : 
                   facility.type === 'clinic' ? '#10B981' : '#F59E0B';
      
      const marker = new window.google.maps.Marker({
        position: { lat: facility.location.latitude, lng: facility.location.longitude },
        map: map.current,
        title: facility.name,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 32C16 32 32 20 32 12C32 5.372 24.628 0 16 0S0 5.372 0 12C0 20 16 32 16 32Z" fill="${color}"/>
              <circle cx="16" cy="12" r="6" fill="white"/>
              <path d="M${facility.type === 'hospital' ? '12 8h8v2h-3v3h-2v-3h-3z' : 
                        facility.type === 'clinic' ? '13 7h6v2h-2v6h-2v-6h-2z' : 
                        '11 8h10v8h-10z'}" fill="${color}"/>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(32, 32),
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${facility.name}</h3>
            <p style="margin: 0 0 4px 0; color: #666;">${facility.type.charAt(0).toUpperCase() + facility.type.slice(1)}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px;">${facility.location.address}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px;">${facility.openingHours}</p>
            <p style="margin: 0; font-size: 12px;">${facility.contact}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map.current, marker);
        setSelectedFacility(facility);
      });

      markers.current.push(marker);
    });
  };

  // Load Google Maps script
  const loadGoogleMaps = () => {
    if (!window.google && !document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';
      document.head.appendChild(script);
      window.initMap = initializeMap;
    } else if (window.google && userLocation) {
      initializeMap();
    }
  };

  useEffect(() => {
    if (userLocation) {
      loadGoogleMaps();
    }
  }, [userLocation]);

  useEffect(() => {
    filterAndSearchFacilities();
    if (map.current) {
      addFacilityMarkers(); // Re-add markers when filters change
    }
  }, [filter, searchTerm, searchRadius]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance; // Distance in km
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const filterAndSearchFacilities = () => {
    let tempFacilities = mockFacilities;

    if (filter !== 'all') {
      tempFacilities = tempFacilities.filter(facility => facility.type === filter);
    }

    if (searchTerm) {
      tempFacilities = tempFacilities.filter(
        (facility) =>
          facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          facility.location.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (userLocation && searchRadius > 0) {
      tempFacilities = tempFacilities.filter(facility => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          facility.location.latitude,
          facility.location.longitude
        );
        return distance <= searchRadius;
      });
    }

    setFilteredFacilities(tempFacilities);
  };

  const handleFilterChange = (newFilter: 'all' | 'hospital' | 'clinic' | 'pharmacy') => {
    setFilter(newFilter);
  };

  const updateLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setIsLocating(false);
          toast.success('Location updated');
          if (map.current) {
            map.current.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocating(false);
          toast.error('Failed to update location');
        }
      );
    } else {
      setIsLocating(false);
      toast.error('Geolocation not supported');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <LoaderIcon className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-center">Loading map and your location...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden p-0 sm:p-4">
      {/* Mobile-first Layout */}
      <div className="flex flex-col sm:hidden flex-1">
        {/* Search and Filter Controls for Mobile */}
        <div className="p-4 bg-white border-b sticky top-0 z-10 space-y-3">
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search facilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-2 py-1.5 h-9 rounded-full bg-gray-100 border-none focus:bg-white focus:ring-1 focus:ring-primary"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                onClick={() => setSearchTerm('')}
              >
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
          <div className="flex justify-between items-center">
            <Tabs value={filter} onValueChange={handleFilterChange} className="flex-1">
              <TabsList className="grid grid-cols-4 w-full h-9 rounded-full bg-gray-100 p-0.5">
                <TabsTrigger value="all" className="rounded-full text-xs h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All</TabsTrigger>
                <TabsTrigger value="hospital" className="rounded-full text-xs h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Hospitals</TabsTrigger>
                <TabsTrigger value="clinic" className="rounded-full text-xs h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Clinics</TabsTrigger>
                <TabsTrigger value="pharmacy" className="rounded-full text-xs h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Pharmacies</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={updateLocation} 
              disabled={isLocating}
              className="ml-2 flex-shrink-0"
            >
              {isLocating ? (
                <LoaderIcon className="h-5 w-5 animate-spin" />
              ) : (
                <CrosshairIcon className="h-5 w-5" />
              )}
              <span className="sr-only">Recenter map</span>
            </Button>
          </div>
          <div className="flex justify-center items-center space-x-2">
            <span className="text-sm text-muted-foreground">Radius: {searchRadius} km</span>
            <input
              type="range"
              min="1"
              max="50"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
          </div>
        </div>

        {/* Map and List View Toggle */}
        <div className="flex justify-center p-2 bg-white border-b">
          <Tabs value={viewType} onValueChange={(value) => setViewType(value as 'list' | 'map')} className="w-full max-w-sm">
            <TabsList className="grid w-full grid-cols-2 h-10 rounded-md bg-gray-100 p-0.5">
              <TabsTrigger value="map" className="rounded-md text-sm h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-2"><MapIcon className="h-4 w-4" /> Map</TabsTrigger>
              <TabsTrigger value="list" className="rounded-md text-sm h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-2"><ListIcon className="h-4 w-4" /> List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area (Map or List) */}
        <div className="flex-1 relative overflow-hidden">
          {viewType === 'map' && (
            <div id="map" ref={mapContainer} className="w-full h-full" />
          )}
          {viewType === 'list' && (
            <ScrollArea className="h-full w-full p-4">
              {filteredFacilities.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <AlertCircleIcon className="h-8 w-8 mx-auto mb-2" />
                  <p>No facilities found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredFacilities.map((facility) => (
                    <Card 
                      key={facility.id} 
                      className="flex flex-col sm:flex-row items-start sm:items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedFacility(facility)}
                    >
                      <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${typeBadgeColors[facility.type]}`}>
                          {typeIcons[facility.type]}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base leading-tight mb-0.5">{facility.name}</h3>
                        <p className="text-sm text-muted-foreground leading-snug">{facility.location.address}</p>
                        <p className="text-xs text-muted-foreground mt-1">{facility.openingHours} • {facility.contact}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Selected Facility Details - Mobile Bottom Sheet */}
      {selectedFacility && ( /* Only render if a facility is selected */
        <div className="sm:hidden">
          <Drawer open={!!selectedFacility} onOpenChange={(open) => !open && setSelectedFacility(null)}>
            <DrawerContent>
              <DrawerHeader className="pb-2">
                <DrawerTitle className="text-xl font-bold">{selectedFacility.name}</DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground">
                  {selectedFacility.location.address}
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 grid gap-2">
                <p className="text-sm"><strong>Type:</strong> <Badge>{selectedFacility.type}</Badge></p>
                <p className="text-sm"><strong>Opening Hours:</strong> {selectedFacility.openingHours}</p>
                <p className="text-sm"><strong>Contact:</strong> {selectedFacility.contact}</p>
                <Button className="mt-2">Get Directions</Button>
              </div>
              <DrawerClose asChild>
                <Button variant="outline" className="mt-4">Close</Button>
              </DrawerClose>
            </DrawerContent>
          </Drawer>
        </div>
      )}
    </div>
  );
};

export default MapView;
