
import React, { useState, useEffect } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface PatientComboboxProps {
  onSelect: (patient: Patient | null) => void;
  value?: string;
  onCreate: () => void;
}

const PatientCombobox = ({ onSelect, value = '', onCreate }: PatientComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { patients, isLoadingPatients } = usePatients();
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients.slice(0, 10));
    } else {
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10);
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  const handleSelect = (patientId: string) => {
    const selectedPatient = patients.find(p => p.id === patientId);
    onSelect(selectedPatient || null);
    setOpen(false);
  };

  const handleCreateNew = () => {
    onCreate();
    onSelect(null);
    setOpen(false);
  };

  // Check if the current search term exactly matches a patient name
  const exactMatch = patients.some(p => 
    p.name.toLowerCase() === searchTerm.toLowerCase() &&
    searchTerm !== ''
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between input-focus",
            value ? "" : "text-muted-foreground"
          )}
        >
          {value || "Search for a patient..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search patients..." 
            value={searchTerm} 
            onValueChange={setSearchTerm} 
            className="h-9"
          />
          {isLoadingPatients && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2">Loading patients...</span>
            </div>
          )}
          {!isLoadingPatients && (
            <CommandList>
              {filteredPatients.length === 0 && searchTerm !== '' && (
                <CommandEmpty>
                  No patient found with that name
                </CommandEmpty>
              )}
              <CommandGroup heading="Patients">
                {filteredPatients.map((patient) => (
                  <CommandItem
                    key={patient.id}
                    value={patient.id}
                    onSelect={handleSelect}
                    className="flex items-center"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === patient.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col text-sm">
                      <span>{patient.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {patient.email || patient.phone || ''}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              {!exactMatch && searchTerm.trim() !== '' && (
                <CommandItem
                  onSelect={handleCreateNew}
                  className="border-t cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create new patient "{searchTerm}"</span>
                </CommandItem>
              )}
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default PatientCombobox;
