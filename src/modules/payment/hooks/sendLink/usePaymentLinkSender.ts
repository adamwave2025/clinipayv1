
import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { PatientService, PaymentRequestService, ClinicService, PaymentNotificationService, PaymentLinkService } from './services';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicData } from '@/hooks/useClinicData';
import { PaymentLink } from '@/types/payment';
import { NotificationMethod } from '../../types/notification';

// Define the schema for form validation
const schema = yup.object({
  patientName: yup.string().required('Patient Name is required'),
  patientEmail: yup.string().email('Invalid email format'),
  patientPhone: yup.string().matches(/^[0-9]+$/, 'Must be only digits').min(8, 'Must be at least 8 digits'),
  amount: yup.number().required('Amount is required').positive('Amount must be positive'),
  message: yup.string().required('Message is required'),
  emailNotification: yup.boolean(),
  smsNotification: yup.boolean(),
}).required();

// Define the form input type
interface FormInput {
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  amount: number;
  message: string;
  emailNotification: boolean;
  smsNotification: boolean;
}

export function usePaymentLinkSender() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { clinicData } = useClinicData();
  const navigate = useNavigate();

  // Initialize react-hook-form
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormInput>({
    resolver: yupResolver(schema),
    defaultValues: {
      emailNotification: true,
      smsNotification: false,
    },
  });

  const onSubmit = async (data: FormInput) => {
    setIsSubmitting(true);
    try {
      if (!user || !clinicData) {
        toast.error('User or clinic data not available.');
        return;
      }

      // 1. Create or Retrieve Patient
      const patient = await PatientService.findOrCreatePatient(
        data.patientName,
        data.patientEmail,
        data.patientPhone,
        clinicData.id
      );

      if (!patient) {
        toast.error('Failed to create or retrieve patient.');
        return;
      }

      // 2. Create Payment Request
      const paymentData = {
        amount: data.amount,
        message: data.message,
      };

      const paymentRequest = await PaymentRequestService.createPaymentRequest(
        clinicData.id,
        patient,
        data.patientName,
        data.patientEmail,
        data.patientPhone,
        null,
        data.amount, 
        data.message
      );

      if (!paymentRequest) {
        toast.error('Failed to create payment request.');
        return;
      }

      // 3. Create Payment Link
      const paymentLinkData: Partial<PaymentLink> = {
        clinic_id: clinicData.id,
        patient_id: patient,
        amount: data.amount,
        title: `Payment request for ${data.patientName}`,
        description: data.message,
        payment_request_id: paymentRequest.id,
        user_id: user.id,
        is_active: true,
        payment_plan: false,
      };

      const paymentLink = await PaymentLinkService.fetchPaymentLinkDetails(paymentRequest.id);

      if (!paymentLink) {
        toast.error('Failed to create payment link.');
        return;
      }

      // 4. Send Payment Notification
      const notificationMethod: NotificationMethod = {
        email: data.emailNotification,
        sms: data.smsNotification,
      };

      const clinicAddress = ClinicService.formatClinicAddress ? 
        ClinicService.formatClinicAddress(clinicData) : 
        '';

      const notificationPayload = PaymentNotificationService.createNotificationPayload(
        clinicData.id,
        clinicData.clinic_name || '',
        clinicData.email,
        clinicData.phone,
        clinicAddress,
        data.patientName,
        data.patientEmail,
        data.patientPhone,
        paymentRequest.id,
        data.amount,
        data.message,
        notificationMethod
      );

      const notificationResult = await PaymentNotificationService.sendNotification(
        notificationPayload,
        clinicData.id,
        paymentRequest.id
      );

      if (!notificationResult.success) {
        console.error('Notification sending failed:', notificationResult.error);
        toast.error('Payment link created, but there was an issue sending notifications');
      } else {
        toast.success('Payment link sent successfully!');
      }

      // Reset the form and navigate
      reset();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(`Failed to send payment link: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
  };
}
