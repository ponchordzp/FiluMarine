import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Anchor, Mail, Phone, Ship, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function JoinFilu() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    boat_type: '',
    boat_name: '',
    location: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await base44.integrations.Core.SendEmail({
        to: 'arodriguezpenam@gmail.com',
        subject: `New Boat Owner Application - ${formData.name}`,
        body: `
New boat owner wants to join FILU Marine!

Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Boat Type: ${formData.boat_type}
Boat Name: ${formData.boat_name}
Location: ${formData.location}

Message:
${formData.message}
        `.trim(),
      });

      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        boat_type: '',
        boat_name: '',
        location: '',
        message: '',
      });
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="py-16 md:py-24 bg-[#0c2340]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-sm rounded-3xl p-12"
          >
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">Application Received!</h3>
            <p className="text-white/80 mb-6">
              Thank you for your interest in joining FILU Marine. We'll review your application and get back to you soon.
            </p>
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20"
            >
              Submit Another Application
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-[#0c2340]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Anchor className="h-8 w-8 text-[#1e88e5]" />
            <h2 className="text-3xl md:text-4xl font-light text-white">
              Have a Boat? <span className="font-semibold">Join FILU!</span>
            </h2>
          </div>
          <p className="text-white/80 max-w-2xl mx-auto">
            Partner with us and expand your reach. Join our network of premium boat operators.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-white mb-2 block">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-white mb-2 block">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="phone" className="text-white mb-2 block">Phone / WhatsApp *</Label>
                <Input
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  placeholder="+52 55 1234 5678"
                />
              </div>
              <div>
                <Label htmlFor="boat_type" className="text-white mb-2 block">Boat Type *</Label>
                <Input
                  id="boat_type"
                  required
                  value={formData.boat_type}
                  onChange={(e) => setFormData({...formData, boat_type: e.target.value})}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  placeholder="e.g., Center Console, Yacht, etc."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="boat_name" className="text-white mb-2 block">Boat Name</Label>
                <Input
                  id="boat_name"
                  value={formData.boat_name}
                  onChange={(e) => setFormData({...formData, boat_name: e.target.value})}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="location" className="text-white mb-2 block">Current Location *</Label>
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  placeholder="e.g., Marina Ixtapa"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message" className="text-white mb-2 block">Tell us about your boat and experience</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 min-h-[120px]"
                placeholder="Share details about your vessel, experience, and why you'd like to join FILU Marine..."
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1e88e5] hover:bg-[#1976d2] text-white py-6 rounded-xl font-medium text-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Ship className="h-5 w-5" />
                  Submit Application
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}