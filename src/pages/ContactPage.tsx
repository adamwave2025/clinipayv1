import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import Logo from '@/components/common/Logo';

const ContactPage = () => {
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

      {/* Contact Content */}
      <section className="py-12 md:py-20 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Let's <span className="gradient-text">talk</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Got questions? Good, we’ve got answers.
Get in touch and let’s talk all things CliniPay!</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="mx-auto w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
                <Mail className="text-white h-5 w-5" />
              </div>
              <h3 className="font-bold mb-2">Drop an email 📨</h3>
              <p className="text-gray-600 mb-4">For general inquiries and support</p>
              <a href="mailto:support@clinipay.com" className="gradient-text font-medium">
                support@clinipay.com
              </a>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="mx-auto w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
                <Phone className="text-white h-5 w-5" />
              </div>
              <h3 className="font-bold mb-2">Give us a call 🤙</h3>
              <p className="text-gray-600 mb-4">Available Monday-Friday, 9am-5pm</p>
              <a href="tel:+44123456789" className="gradient-text font-medium">
                +44 123 456 789
              </a>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="mx-auto w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
                <MessageSquare className="text-white h-5 w-5" />
              </div>
              <h3 className="font-bold mb-2">Live Chat 🤓</h3>
              <p className="text-gray-600 mb-4">Chat with our nice support team</p>
              <Button variant="outline" className="gradient-text">
                Start a Chat
              </Button>
            </Card>
          </div>

          <Card className="w-full shadow-md">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Your Name
                    </label>
                    <Input id="name" placeholder="John Smith" className="w-full" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <Input id="email" type="email" placeholder="john@example.com" className="w-full" />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject
                  </label>
                  <Input id="subject" placeholder="How can we help you?" className="w-full" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <Textarea id="message" placeholder="Your message here..." className="w-full min-h-[150px]" />
                </div>
                <Button type="submit" className="btn-gradient w-full md:w-auto">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-8 border-t mt-12">
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
              <Link to="/gdpr" className="text-gray-600 hover:text-gray-900">GDPR</Link>
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

export default ContactPage;
