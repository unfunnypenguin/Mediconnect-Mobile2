import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ComplaintForm from '@/components/patient/ComplaintForm';
import ComplaintsList from '@/components/patient/ComplaintsList';
import { AlertTriangle, Plus, List } from 'lucide-react';

const PatientComplaints = () => {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex">
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <h1 className="text-2xl font-bold mb-1">Complaints & Reports</h1>
              <p className="text-sm text-muted-foreground">
                Submit complaints about healthcare professionals or view your existing reports.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                <TabsTrigger value="list" className="flex flex-col h-auto py-2 gap-1 data-[state=active]:bg-background">
                  <List className="h-5 w-5" />
                  <span className="text-xs">My Complaints</span>
                </TabsTrigger>
                <TabsTrigger value="new" className="flex flex-col h-auto py-2 gap-1 data-[state=active]:bg-background">
                  <Plus className="h-5 w-5" />
                  <span className="text-xs">New Complaint</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="list" className="mt-4">
                <ComplaintsList />
              </TabsContent>
              
              <TabsContent value="new" className="mt-4">
                <ComplaintForm 
                  onSuccess={() => setActiveTab('list')}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientComplaints;
