
// Mock clinic details used across the application
export const clinicDetails = {
  name: '',
  logo: '',
  email: '',
  phone: '',
  address: '',
  paymentType: '',
  amount: 0,
};

// Mock payment details
export const generatePaymentDetails = () => ({
  amount: clinicDetails.amount,
  clinic: clinicDetails.name,
  paymentType: clinicDetails.paymentType,
  date: new Date().toLocaleDateString(),
  reference: 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
});
