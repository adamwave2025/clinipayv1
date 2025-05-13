
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import PatientsTable from './PatientsTable';
import PatientDetailsDialog from './PatientDetailsDialog';
import AddPatientDialog from './AddPatientDialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus } from 'lucide-react';
import { usePatients, Patient } from '@/hooks/usePatients';

const PatientsContent = () => {
  const { patients, isLoading, error, fetchPatients } = usePatients();
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addPatientDialogOpen, setAddPatientDialogOpen] = useState(false);
  
  // Initial data fetch
  useEffect(() => {
    fetchPatients();
  }, []);
  
  // Filter patients based on search term
  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients;
    
    const searchTerm = search.toLowerCase();
    return patients.filter(
      patient => 
        patient.name.toLowerCase().includes(searchTerm) ||
        (patient.email && patient.email.toLowerCase().includes(searchTerm)) ||
        (patient.phone && patient.phone.toLowerCase().includes(searchTerm))
    );
  }, [patients, search]);

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  };

  const handleAddPatientSuccess = () => {
    fetchPatients();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-auto flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients by name, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 input-focus w-full"
              />
            </div>
            
            <Button 
              onClick={() => setAddPatientDialogOpen(true)}
              className="btn-gradient w-full sm:w-auto"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : (
            <PatientsTable 
              patients={filteredPatients} 
              onPatientClick={handlePatientClick}
            />
          )}
        </CardContent>
      </Card>

      {selectedPatient && (
        <PatientDetailsDialog
          patient={selectedPatient}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      )}

      <AddPatientDialog
        open={addPatientDialogOpen}
        onOpenChange={setAddPatientDialogOpen}
        onSuccess={handleAddPatientSuccess}
      />
    </div>
  );
};

export default PatientsContent;
