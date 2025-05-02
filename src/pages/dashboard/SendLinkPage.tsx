import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Mail, Phone, CheckCircle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { usePaymentLinks } from '@/hooks/usePaymentLinks';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ClinicFormatter } from '@/services/payment-link/ClinicFormatter';
import { StandardNotificationPayload, NotificationMethod } from '@/types/notification';
import { processNotificationsNow } from '@/utils/notification-cron-setup';
import { Json } from '@/integrations/supabase/types';
import { addToNotificationQueue } from '@/utils/notification-queue';
import PatientCombobox from '@/components/dashboard/patients/PatientCombobox';
import { Patient } from '@/hooks/usePatients';

const SendLinkPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { paymentLinks, isLoading: isLoadingLinks } = usePaymentLinks();
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    selectedLink: '',
    customAmount: '',
    message: '',
  });

  // Update form when a patient is selected
  useEffect(() => {
    if (selectedPatient) {
      setFormData(prev => ({
        ...prev,
        patientName: selectedPatient.name,
        patientEmail: selectedPatient.email || '',
        patientPhone: selectedPatient.phone || ''
      }));
    }
  }, [selectedPatient]);

  useEffect(() => {
    const checkNotificationSystem = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .in('key', ['patient_notification_webhook', 'clinic_notification_webhook']);
        
        if (error) {
          console.error('Error checking notification settings:', error);
          return;
        }
        
        if (!data || data.length < 2) {
          console.warn('Notification webhook URLs not fully configured in system_settings');
        } else {
          console.log('Notification system appears to be configured:', data);
        }
      } catch (err) {
        console.error('Exception checking notification system:', err);
      }
    };
    
    checkNotificationSystem();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, selectedLink: value }));
  };

  const handlePatientSelect = (patient: Patient | null) => {
    setSelectedPatient(patient);
    
    if (!patient) {
      // Keep the existing name if we're creating a new patient
      setFormData(prev => ({
        ...prev,
        patientEmail: '',
        patientPhone: '',
      }));
    }
  };

  const handleCreateNew = () => {
    setSelectedPatient(null);
    // We keep the existing patient name from the search
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientName || !formData.patientEmail) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!formData.selectedLink && !formData.customAmount) {
      toast.error('Please either select a payment link or enter a custom amount');
      return;
    }
    
    if (formData.customAmount && (isNaN(Number(formData.customAmount)) || Number(formData.customAmount) <= 0)) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.patientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (formData.patientPhone) {
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(formData.patientPhone)) {
        toast.error('Please enter a valid phone number');
        return;
      }
    }
    
    setShowConfirmation(true);
  };

  const sendPaymentLink = async () => {
    setIsLoading(true);
    console.log('Starting payment link creation process...');
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user?.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }
      
      if (!userData.clinic_id) {
        console.error('No clinic_id found for user:', user?.id);
        throw new Error('No clinic associated with this user');
      }
      
      console.log('Found clinic_id:', userData.clinic_id);

      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', userData.clinic_id)
        .single();

      if (clinicError) {
        console.error('Error fetching clinic data:', clinicError);
        throw clinicError;
      }
      
      console.log('Retrieved clinic data successfully');

      let amount = 0;
      let paymentLinkId = null;
      let paymentTitle = '';

      if (formData.selectedLink) {
        const selectedPaymentLink = paymentLinks.find(link => link.id === formData.selectedLink);
        if (selectedPaymentLink) {
          amount = selectedPaymentLink.amount;
          paymentLinkId = selectedPaymentLink.id;
          paymentTitle = selectedPaymentLink.title;
          console.log('Using payment link:', { id: paymentLinkId, title: paymentTitle, amount });
        } else {
          console.error('Selected payment link not found in available links');
        }
      } else if (formData.customAmount) {
        amount = Number(formData.customAmount);
        console.log('Using custom amount:', amount);
      }

      console.log('Creating payment request with:', {
        clinicId: userData.clinic_id,
        paymentLinkId,
        amount,
        patientName: formData.patientName
      });

      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          clinic_id: userData.clinic_id,
          payment_link_id: paymentLinkId,
          custom_amount: formData.selectedLink ? null : amount,
          patient_name: formData.patientName,
          patient_email: formData.patientEmail,
          patient_phone: formData.patientPhone ? formData.patientPhone.replace(/\D/g, '') : null,
          status: 'sent',
          message: formData.message || null
        })
        .select();

      if (error) {
        console.error('Error creating payment request:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('No data returned from payment request creation');
        throw new Error('Failed to create payment request');
      }

      const paymentRequest = data[0];
      console.log('Payment request created successfully:', paymentRequest);
      
      const notificationMethod: NotificationMethod = {
        email: !!formData.patientEmail,
        sms: !!formData.patientPhone
      };

      const formattedAddress = ClinicFormatter.formatAddress(clinicData);
      
      if (notificationMethod.email || notificationMethod.sms) {
        console.log('Creating notification for payment request');
        
        const notificationPayload: StandardNotificationPayload = {
          notification_type: "payment_request",
          notification_method: notificationMethod,
          patient: {
            name: formData.patientName,
            email: formData.patientEmail,
            phone: formData.patientPhone
          },
          payment: {
            reference: paymentRequest.id,
            amount: amount,
            refund_amount: null,
            payment_link: `https://clinipay.co.uk/payment/${paymentRequest.id}`,
            message: formData.message || (paymentTitle ? `Payment for ${paymentTitle}` : "Payment request")
          },
          clinic: {
            name: clinicData.clinic_name || "Your healthcare provider",
            email: clinicData.email,
            phone: clinicData.phone,
            address: formattedAddress
          }
        };

        console.log('Notification payload prepared:', JSON.stringify(notificationPayload, null, 2));

        try {
          const { success, error } = await addToNotificationQueue(
            'payment_request',
            notificationPayload,
            'patient',
            userData.clinic_id,
            paymentRequest.id
          );

          if (!success) {
            console.error("Failed to queue notification:", error);
            toast.warning("Payment link was sent, but notification delivery might be delayed");
          } else {
            console.log("Payment request notification queued successfully");
            
            try {
              console.log("Processing notifications immediately...");
              const processResult = await processNotificationsNow();
              console.log("Process notifications result:", processResult);
            } catch (cronErr) {
              console.error("Exception triggering notification processing:", cronErr);
            }
          }
        } catch (notifyErr) {
          console.error("Critical error during notification queueing:", notifyErr);
        }
      } else {
        console.warn('No notification methods available for this patient');
      }
      
      toast.success('Payment link sent successfully');
      
      setFormData({
        patientName: '',
        patientEmail: '',
        patientPhone: '',
        selectedLink: '',
        customAmount: '',
        message: '',
      });
    } catch (error: any) {
      console.error('Error sending payment link:', error);
      toast.error('Failed to send payment link: ' + error.message);
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  const selectedPaymentLink = formData.selectedLink 
    ? paymentLinks.find(link => link.id === formData.selectedLink) 
    : null;
  
  const paymentAmount = selectedPaymentLink 
    ? `£${selectedPaymentLink.amount.toFixed(2)}` 
    : (formData.customAmount ? `£${Number(formData.customAmount).toFixed(2)}` : '');

  return (
    <DashboardLayout userType="clinic">
      <PageHeader 
        title="Send Payment Link" 
        description="Email a payment link directly to your patient"
      />
      
      <Card className="card-shadow max-w-2xl mx-auto">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name*</Label>
              <PatientCombobox 
                onSelect={handlePatientSelect}
                value={formData.patientName}
                onCreate={handleCreateNew}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientEmail">Patient Email*</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="patientEmail"
                    name="patientEmail"
                    type="email"
                    placeholder="patient@example.com"
                    value={formData.patientEmail}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className="w-full input-focus pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="patientPhone">Patient Phone (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="patientPhone"
                    name="patientPhone"
                    type="tel"
                    placeholder="+44 7700 900000"
                    value={formData.patientPhone}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full input-focus pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selectedLink">Select Payment Link (Optional)</Label>
                <Select
                  value={formData.selectedLink}
                  onValueChange={handleSelectChange}
                  disabled={isLoading || isLoadingLinks}
                >
                  <SelectTrigger id="selectedLink" className="input-focus">
                    <SelectValue placeholder={isLoadingLinks ? "Loading..." : "Choose a payment link"} />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentLinks.map(link => (
                      <SelectItem key={link.id} value={link.id}>
                        {link.title} - £{link.amount.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Select an existing payment link or enter a custom amount</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customAmount">Custom Amount (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                  <Input
                    id="customAmount"
                    name="customAmount"
                    type="text"
                    placeholder="0.00"
                    value={formData.customAmount}
                    onChange={handleChange}
                    disabled={isLoading || !!formData.selectedLink}
                    className="w-full input-focus pl-8"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enter a custom amount if not using an existing payment link
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Add a personal message to your patient..."
                value={formData.message}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full input-focus min-h-[120px]"
              />
              <p className="text-sm text-gray-500">
                This message will be included in the email along with the payment link.
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full btn-gradient"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Send Payment Link
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
              Confirm Payment Link Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Recipient:</p>
              <p className="text-sm">{formData.patientName}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Send to:</p>
              <p className="text-sm">
                Email: {formData.patientEmail}
                {formData.patientPhone && <span> | Phone: {formData.patientPhone}</span>}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Payment Details:</p>
              <p className="text-sm">
                {selectedPaymentLink ? (
                  <>Payment for: {selectedPaymentLink.title} ({paymentAmount})</>
                ) : (
                  <>Custom payment amount: {paymentAmount}</>
                )}
              </p>
            </div>
            
            {formData.message && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Custom Message:</p>
                <p className="text-sm">{formData.message}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={sendPaymentLink}
              disabled={isLoading}
              className="btn-gradient"
            >
              {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Send Payment Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SendLinkPage;
