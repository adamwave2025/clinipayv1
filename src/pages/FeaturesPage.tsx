
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layouts/MainLayout';
import Logo from '@/components/common/Logo';
import { 
  AreaChart, 
  Check, 
  CreditCard, 
  LinkIcon, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Calendar, 
  ChevronRight, 
  Clock,
  Mail,
  Phone,
  MapPin,
  Building,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeader, 
  TableHead, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel } from '@/components/ui/form';

const FeaturesPage = () => {
  return (
    <MainLayout>
      {/* Navigation */}
      <nav className="py-4 px-6 md:px-8 flex justify-between items-center">
        <Logo className="h-10 w-auto" />
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/sign-in">Sign In</Link>
          </Button>
          <Button className="btn-gradient rounded-full" asChild>
            <Link to="/sign-up">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Features Content */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Powerful <span className="gradient-text">features</span> for modern clinics
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage payments and reduce no-shows
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Payment links that work</h2>
              <p className="text-lg text-gray-600">
                Create professional, branded payment links that patients can pay instantly with card or Apple Pay. No accounts, no logins, no fuss.
              </p>
              
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Create one-time or reusable links</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Customize with your clinic's branding</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Send links via email or text</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Track payments in real-time</p>
                </div>
              </div>
            </div>
            
            {/* Realistic Payment Form Mockup */}
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-xl card-shadow">
                {/* Left Column - Clinic Info */}
                <div className="p-6 border-r border-gray-100">
                  <div className="mb-6">
                    <h3 className="font-semibold text-xl">Consultation Fee</h3>
                    <div className="mt-2 flex items-center">
                      <span className="text-2xl font-bold">£75.00</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-700 font-medium">Northside Medical Clinic</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-gray-700">123 Harley Street, London W1</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-700">contact@northsidemedical.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-700">+44 20 7123 4567</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <p className="text-sm">Secure Payment</p>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Payment Form */}
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Complete Your Payment</h3>
                  
                  {/* Personal Information Section */}
                  <div className="space-y-4 mb-6">
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <Input placeholder="Enter your full name" />
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <Input type="email" placeholder="Enter your email" />
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <Input type="tel" placeholder="Enter your phone number" />
                    </FormItem>
                  </div>
                  
                  {/* Payment Details Section */}
                  <div className="mb-6">
                    <FormItem>
                      <FormLabel>Card Details</FormLabel>
                      <div className="mt-1 p-3 border rounded-md bg-white">
                        <div className="h-6 flex items-center justify-between">
                          <span className="text-gray-400">Card number</span>
                          <div className="flex space-x-1">
                            <div className="w-8 h-5 bg-gray-100 rounded"></div>
                            <div className="w-8 h-5 bg-gray-100 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </FormItem>
                  </div>
                  
                  {/* Submit Button */}
                  <Button className="w-full h-12 btn-gradient text-lg">
                    Pay Now
                  </Button>
                  
                  {/* Security Text */}
                  <div className="text-center text-sm text-gray-500 flex items-center justify-center mt-4">
                    <Lock className="h-4 w-4 mr-1 text-green-600" />
                    Secure payment processed by CliniPay
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-gradient-primary w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-10">
                <CreditCard className="text-white h-6 w-6" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              {/* Analytics Dashboard UI Component */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-primary p-4">
                  <h3 className="text-white font-semibold text-lg">Dashboard Analytics</h3>
                </div>
                <div className="p-6">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm">Payments</span>
                        <CreditCard className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="font-bold text-2xl mt-2">£2,450</p>
                      <div className="flex items-center text-xs text-green-500 mt-2">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span>+12% vs last month</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm">Patients</span>
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="font-bold text-2xl mt-2">36</p>
                      <div className="flex items-center text-xs text-green-500 mt-2">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span>+8% vs last month</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-sm">Plans</span>
                        <Calendar className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="font-bold text-2xl mt-2">14</p>
                      <div className="flex items-center text-xs text-green-500 mt-2">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span>+5% vs last month</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chart Area */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Payment Trend</h4>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">Week</Button>
                        <Button variant="outline" size="sm" className="bg-gray-100">Month</Button>
                      </div>
                    </div>
                    <div className="h-48 bg-gray-50 rounded-lg relative overflow-hidden">
                      {/* Simulated Chart */}
                      <div className="absolute bottom-0 left-0 w-full h-full flex items-end px-2">
                        <div className="w-1/7 h-20 bg-blue-200 mx-1 rounded-t-sm"></div>
                        <div className="w-1/7 h-24 bg-blue-300 mx-1 rounded-t-sm"></div>
                        <div className="w-1/7 h-16 bg-blue-200 mx-1 rounded-t-sm"></div>
                        <div className="w-1/7 h-28 bg-blue-400 mx-1 rounded-t-sm"></div>
                        <div className="w-1/7 h-32 bg-blue-500 mx-1 rounded-t-sm"></div>
                        <div className="w-1/7 h-20 bg-blue-300 mx-1 rounded-t-sm"></div>
                        <div className="w-1/7 h-36 bg-blue-600 mx-1 rounded-t-sm"></div>
                      </div>
                      <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-gray-300"></div>
                      <div className="absolute bottom-2 left-0 w-full flex justify-between px-4 text-xs text-gray-500">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Payments */}
                  <div>
                    <h4 className="font-medium mb-3">Recent Payments</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">John Smith</TableCell>
                          <TableCell>£75.00</TableCell>
                          <TableCell>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Paid
                            </span>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Sarah Jones</TableCell>
                          <TableCell>£120.00</TableCell>
                          <TableCell>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Paid
                            </span>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">David Lee</TableCell>
                          <TableCell>£95.00</TableCell>
                          <TableCell>
                            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                              Pending
                            </span>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl font-bold mb-6">Track everything in one place</h2>
              <p className="text-lg text-gray-600">
                Access comprehensive reports and analytics to gain insights into your clinic's payment activity.
              </p>
              
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Monitor payment statuses</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Track payment performance</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Generate reports for accounting</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Export data in multiple formats</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Flexible payment plans</h2>
              <p className="text-lg text-gray-600">
                Create customized payment plans for patients who need to split costs over time.
              </p>
              
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Design custom installment schedules</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Automate payment reminders</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Track payments progress</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-white h-4 w-4" />
                  </div>
                  <p className="font-medium">Pause, resume or adjust plans as needed</p>
                </div>
              </div>
            </div>
            <div>
              {/* Payment Plan Interface Component */}
              <Card className="shadow-lg border-0">
                <CardHeader className="border-b bg-gray-50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Treatment Payment Plan</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Patient: Emma Wilson</p>
                  </div>
                  <div className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    Active
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Plan Details */}
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                      <p className="font-semibold text-xl">£600.00</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Paid to Date</p>
                      <p className="font-semibold text-xl">£300.00</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Installments</p>
                      <p className="font-semibold">3 payments</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Next Due</p>
                      <p className="font-semibold">15 June 2025</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Plan Progress</span>
                      <span className="text-sm font-medium">50%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div className="bg-gradient-primary h-full rounded-full w-1/2"></div>
                    </div>
                  </div>
                  
                  {/* Payment Schedule */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Payment Schedule</h4>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-green-50 border border-green-100 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">Initial Payment</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>15 Apr 2025</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">£200.00</p>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Paid
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-green-50 border border-green-100 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">Second Payment</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>15 May 2025</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">£100.00</p>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Paid
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">Third Payment</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>15 Jun 2025</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">£150.00</p>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Upcoming
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">Final Payment</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>15 Jul 2025</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">£150.00</p>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            Scheduled
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      <span>Take Payment</span>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Reschedule</span>
                    </Button>
                    <Button variant="outline" className="text-gray-500 flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>View Activity</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 px-6 md:px-8">
        <div className="max-w-6xl mx-auto bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to simplify your clinic payments?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join clinics using CliniPay to streamline their payment process and reduce no-shows.
          </p>
          <Button 
            className="btn-gradient-outline text-lg py-6 px-8 rounded-full" 
            asChild
          >
            <Link to="/sign-up">Start your free trial</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-8 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo className="h-8 w-auto mb-4 md:mb-0" />
            <div className="flex gap-6">
              <Link to="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link to="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link to="/fees" className="text-gray-600 hover:text-gray-900">Fees</Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
              <Link to="/terms" className="text-gray-600 hover:text-gray-900">Terms</Link>
              <Link to="/privacy" className="text-gray-600 hover:text-gray-900">Privacy</Link>
            </div>
          </div>
          <div className="mt-6 text-center md:text-left text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} CliniPay. All rights reserved.
          </div>
        </div>
      </footer>
    </MainLayout>
  );
};

export default FeaturesPage;
