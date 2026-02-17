import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Anchor, Ship, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import LuxuryPattern from '../patterns/LuxuryPattern';

export default function JoinFilu() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    boat_type: '',
    boat_model: '',
    boat_size: '',
    boat_status: '',
    boat_year: '',
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
Boat Model: ${formData.boat_model}
Boat Size: ${formData.boat_size} feet
Boat Condition: ${formData.boat_status}
Year Manufactured: ${formData.boat_year}
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
        boat_model: '',
        boat_size: '',
        boat_status: '',
        boat_year: '',
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
      <section className="py-8 md:py-12 bg-gradient-to-b from-[#0c2340] to-[#0a1929] border-t border-white/10 relative overflow-hidden">
        <LuxuryPattern opacity={0.08} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20"
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
    <section className="py-8 md:py-12 bg-gradient-to-b from-[#0c2340] to-[#0a1929] border-t border-white/10 relative overflow-hidden">
      <LuxuryPattern opacity={0.08} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
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

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 sm:p-8 border border-white/20">
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

            <div>
              <Label htmlFor="boat_model" className="text-white mb-2 block">Boat Model *</Label>
              <Input
                id="boat_model"
                required
                value={formData.boat_model}
                onChange={(e) => setFormData({...formData, boat_model: e.target.value})}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                placeholder="e.g., Sunseeker Predator 75"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="boat_size" className="text-white mb-2 block">Boat Size (feet) *</Label>
                <Select value={formData.boat_size} onValueChange={(value) => setFormData({ ...formData, boat_size: value })} required>
                  <SelectTrigger className="bg-white/10 border-white/30 text-white">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20-25">20-25 feet</SelectItem>
                    <SelectItem value="26-30">26-30 feet</SelectItem>
                    <SelectItem value="31-35">31-35 feet</SelectItem>
                    <SelectItem value="36-40">36-40 feet</SelectItem>
                    <SelectItem value="41-50">41-50 feet</SelectItem>
                    <SelectItem value="51-60">51-60 feet</SelectItem>
                    <SelectItem value="60+">60+ feet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="boat_status" className="text-white mb-2 block">Boat Condition *</Label>
                <Select value={formData.boat_status} onValueChange={(value) => setFormData({ ...formData, boat_status: value })} required>
                  <SelectTrigger className="bg-white/10 border-white/30 text-white">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="very-good">Very Good</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="needs-work">Needs Work</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="boat_year" className="text-white mb-2 block">Year Manufactured *</Label>
                <Select value={formData.boat_year} onValueChange={(value) => setFormData({ ...formData, boat_year: value })} required>
                  <SelectTrigger className="bg-white/10 border-white/30 text-white">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 35 }, (_, i) => 2026 - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="boat_name" className="text-white mb-2 block">Boat Name *</Label>
                <Input
                  id="boat_name"
                  required
                  value={formData.boat_name}
                  onChange={(e) => setFormData({...formData, boat_name: e.target.value})}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  placeholder="Your boat's name"
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
              <Label htmlFor="message" className="text-white mb-2 block">Tell us about your boat and experience *</Label>
              <Textarea
                id="message"
                required
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

          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <Button 
              size="lg"
              asChild
              className="bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-6 text-base font-medium rounded-full shadow-xl transition-all hover:scale-105"
            >
              <a href="tel:+525513782169">
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Us!
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}