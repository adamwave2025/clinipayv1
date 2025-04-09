
// Mock clinic details used across the application
export const clinicDetails = {
  name: 'Greenfield Medical Clinic',
  logo: '',
  email: 'contact@greenfieldclinic.com',
  phone: '+44 20 7123 4567',
  address: '123 Harley Street, London, W1G 7JU',
  paymentType: 'Consultation Deposit',
  amount: 75.00,
};

// Mock payment details
export const generatePaymentDetails = () => ({
  amount: clinicDetails.amount,
  clinic: clinicDetails.name,
  paymentType: clinicDetails.paymentType,
  date: new Date().toLocaleDateString(),
  reference: 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
});
