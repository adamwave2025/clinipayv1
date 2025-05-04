
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/utils/formatters';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

interface PatientNote {
  id: string;
  content: string;
  created_at: string;
  created_by_user_id: string | null;
  created_by_user_email?: string;
}

interface PatientNotesProps {
  patientId: string;
  clinicId: string;
}

const PatientNotes: React.FC<PatientNotesProps> = ({ patientId, clinicId }) => {
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchNotes();
  }, [patientId, clinicId]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      // First, let's fetch the patient notes without the join
      const { data: notesData, error: notesError } = await supabase
        .from('patient_notes')
        .select(`
          id,
          content,
          created_at,
          created_by_user_id
        `)
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      
      // Now, for each note with a user ID, we'll fetch the user email separately
      const notesWithUserEmails = await Promise.all(
        (notesData || []).map(async (note) => {
          if (!note.created_by_user_id) {
            return {
              ...note,
              created_by_user_email: 'Unknown user'
            };
          }
          
          // Fetch the user email
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('id', note.created_by_user_id)
            .single();
            
          return {
            ...note,
            created_by_user_email: userError ? 'Unknown user' : (userData?.email || 'Unknown user')
          };
        })
      );
      
      setNotes(notesWithUserEmails);
    } catch (error: any) {
      console.error('Error fetching patient notes:', error);
      toast.error('Failed to load patient notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('patient_notes')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          content: newNote.trim(),
          created_by_user_id: user?.id,
        });

      if (error) throw error;
      
      setNewNote('');
      setIsAddingNote(false);
      toast.success('Note added successfully');
      fetchNotes();
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Patient Notes</h3>
        {!isAddingNote && (
          <Button 
            onClick={() => setIsAddingNote(true)} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        )}
      </div>

      {isAddingNote && (
        <div className="space-y-3 bg-gray-50 p-3 rounded-md">
          <Textarea
            placeholder="Enter your note here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
            disabled={isSubmitting}
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddingNote(false);
                setNewNote('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNote}
              size="sm"
              disabled={isSubmitting || !newNote.trim()}
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Save Note
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          No notes found for this patient
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="border rounded-md p-3">
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>
                  {note.created_at && formatDate(note.created_at)}
                </span>
                <span>
                  {note.created_by_user_email}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientNotes;
