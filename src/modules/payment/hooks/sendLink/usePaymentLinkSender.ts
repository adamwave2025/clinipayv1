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
      const patient = await PatientService.createOrRetrievePatient(
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
        paymentData,
        patient.id,
        user.id,
        clinicData.id
      );

      if (!paymentRequest) {
        toast.error('Failed to create payment request.');
        return;
      }

      // 3. Create Payment Link
      const paymentLinkData: Partial<PaymentLink> = {
        clinicId: clinicData.id,
        patientId: patient.id,
        amount: data.amount,
        title: `Payment request for ${data.patientName}`,
        description: data.message,
        paymentRequestId: paymentRequest.id,
        userId: user.id,
        active: true,
        paymentPlan: false,
      };

      const paymentLink = await PaymentLinkService.createLink(paymentLinkData);

      if (!paymentLink) {
        toast.error('Failed to create payment link.');
        return;
      }

      // 4. Send Payment Notification
      const notificationMethod: NotificationMethod = {
        email: data.emailNotification,
        sms: data.smsNotification,
      };

      const notificationPayload = {
        patient: {
          name: data.patientName,
          email: data.patientEmail,
          phone: data.patientPhone,
        },
        payment: {
          reference: paymentRequest.id,
          amount: data.amount,
          message: data.message,
        },
        clinic: {
          id: clinicData.id,
          name: clinicData.name || '',
          email: clinicData.email,
          phone: clinicData.phone,
          address: clinicData.address,
        },
      };

      const notificationResult = await PaymentNotificationService.sendPaymentNotification(
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
