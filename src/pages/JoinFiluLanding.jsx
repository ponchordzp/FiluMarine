import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Anchor, Ship, CheckCircle, Wrench, DollarSign, Activity, LineChart, ShieldCheck, Users, Calendar, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function JoinFiluLanding() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', boat_type: '', boat_model: '', boat_size: '',
    boat_status: '', boat_year: '', boat_name: '', location: '', message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await Promise.all([
        base44.entities.JoinFiluApplication.create({ ...formData, review_status: 'pending' }),
        base44.integrations.Core.SendEmail({
          to: 'arodriguezpenam@gmail.com',
          subject: `New Boat Owner Application - ${formData.name}`,
          body: `New boat owner wants to join FILU Marine!\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nBoat Type: ${formData.boat_type}\nBoat Model: ${formData.boat_model}\nBoat Size: ${formData.boat_size} feet\nBoat Condition: ${formData.boat_status}\nYear Manufactured: ${formData.boat_year}\nBoat Name: ${formData.boat_name}\nLocation: ${formData.location}\nMessage:\n${formData.message}`.trim()
        })
      ]);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', boat_type: '', boat_model: '', boat_size: '', boat_status: '', boat_year: '', boat_name: '', location: '', message: '' });
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061428] selection:bg-cyan-500/30">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full filter blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full filter blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute inset-0 bg-[url('https://media.base44.com/images/public/6987f0afff96227dd3af0e68/388bdd58c_FILUMarine3.png')] opacity-5 mix-blend-overlay"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center p-3 mb-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
              <Anchor className="h-8 w-8 text-cyan-400" />
            </div>
            <h1 className="text-5xl md:text-7xl font-light text-white mb-6 tracking-tight">
              Elevate Your <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Maritime Business</span>
            </h1>
            <p className="text-white/70 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-light mb-10">
              A unified ecosystem for boat owners and operators. Maximize rental revenue and gain complete visibility into your fleet's health and operations.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => document.getElementById('application-form').scrollIntoView({ behavior: 'smooth' })} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-8 py-6 text-lg rounded-full font-semibold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                Apply to Join
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Two Pillars Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            
            {/* Rental Management Pillar */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative bg-gradient-to-b from-[#0a1f3d] to-[#0d2a50] rounded-[2.5rem] p-8 md:p-12 border border-white/5 hover:border-cyan-500/30 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full filter blur-[60px] group-hover:bg-cyan-500/10 transition-colors"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-8 border border-cyan-400/20">
                  <DollarSign className="h-8 w-8 text-cyan-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Premium Rental Management</h3>
                <p className="text-white/70 text-lg mb-10 leading-relaxed">
                  Transform your vessel into a profitable asset. We connect you with a curated network of high-end clients while handling the logistical heavy lifting.
                </p>

                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem value="item-1" className="border border-white/10 rounded-xl px-4 bg-white/5 data-[state=open]:bg-white/10 transition-colors">
                    <AccordionTrigger className="text-white hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <Users className="w-5 h-5 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-lg">Curated Client Network</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-white/70 text-base pb-4 leading-relaxed pl-8">
                      Tap into our established network of premium clientele seeking exceptional maritime experiences. We vet our customers to ensure your vessel is treated with respect.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2" className="border border-white/10 rounded-xl px-4 bg-white/5 data-[state=open]:bg-white/10 transition-colors">
                    <AccordionTrigger className="text-white hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-lg">Secure Booking & Payments</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-white/70 text-base pb-4 leading-relaxed pl-8">
                      Enjoy absolute peace of mind with encrypted, secure payment processing. Our system handles deposits, balances, and enforces clear cancellation policies automatically.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3" className="border border-white/10 rounded-xl px-4 bg-white/5 data-[state=open]:bg-white/10 transition-colors">
                    <AccordionTrigger className="text-white hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <Calendar className="w-5 h-5 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-lg">Automated Scheduling</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-white/70 text-base pb-4 leading-relaxed pl-8">
                      Say goodbye to double bookings. Our intelligent calendar system syncs your availability in real-time, allowing customers to book instantly when you're free.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4" className="border border-white/10 rounded-xl px-4 bg-white/5 data-[state=open]:bg-white/10 transition-colors">
                    <AccordionTrigger className="text-white hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <Settings className="w-5 h-5 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-lg">Total Operational Control</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-white/70 text-base pb-4 leading-relaxed pl-8">
                      You set the rules. Maintain complete authority over your pricing, available add-ons, and scheduling blocks, while our platform handles the administrative execution.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </motion.div>

            {/* Maintenance Software Pillar */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group relative bg-gradient-to-b from-[#0a1f3d] to-[#0d2a50] rounded-[2.5rem] p-8 md:p-12 border border-white/5 hover:border-blue-500/30 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full filter blur-[60px] group-hover:bg-blue-500/10 transition-colors"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mb-8 border border-blue-400/20">
                  <Activity className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Intelligent Fleet Software</h3>
                <p className="text-white/70 text-lg mb-10 leading-relaxed">
                  A powerful digital toolkit designed for owners and crew. Log your data, track engine health, and let our platform generate actionable insights to prevent costly downtime.
                </p>

                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem value="item-1" className="border border-white/10 rounded-xl px-4 bg-white/5 data-[state=open]:bg-white/10 transition-colors">
                    <AccordionTrigger className="text-white hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <Wrench className="w-5 h-5 text-blue-400 shrink-0" />
                        <span className="font-semibold text-lg">Proactive Maintenance Tracking</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-white/70 text-base pb-4 leading-relaxed pl-8">
                      Log your engine hours and service intervals directly into the platform. Our system calculates usage and alerts you well in advance of required minor and major maintenance.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2" className="border border-white/10 rounded-xl px-4 bg-white/5 data-[state=open]:bg-white/10 transition-colors">
                    <AccordionTrigger className="text-white hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <Ship className="w-5 h-5 text-blue-400 shrink-0" />
                        <span className="font-semibold text-lg">Digital Service & Daily Logs</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-white/70 text-base pb-4 leading-relaxed pl-8">
                      Empower your crew to submit daily operational logs, fuel usage, and post-trip reports. Keep a pristine, easily accessible digital history of all mechanical work and vessel checks.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3" className="border border-white/10 rounded-xl px-4 bg-white/5 data-[state=open]:bg-white/10 transition-colors">
                    <AccordionTrigger className="text-white hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <LineChart className="w-5 h-5 text-blue-400 shrink-0" />
                        <span className="font-semibold text-lg">Expense & Financial Analytics</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-white/70 text-base pb-4 leading-relaxed pl-8">
                      Input your costs and let the platform visualize your operational health. Understand your true profit margins by tracking fuel, crew wages, docking fees, and repair costs in one unified dashboard.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4" className="border border-white/10 rounded-xl px-4 bg-white/5 data-[state=open]:bg-white/10 transition-colors">
                    <AccordionTrigger className="text-white hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <Anchor className="w-5 h-5 text-blue-400 shrink-0" />
                        <span className="font-semibold text-lg">Inventory & Supplies Management</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-white/70 text-base pb-4 leading-relaxed pl-8">
                      Keep a precise log of your onboard provisions, spare parts, and cleaning supplies. Track consumption rates so you know exactly when to restock before your next departure.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-20 relative z-10" id="application-form">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-light text-white mb-4">Start Your <span className="font-bold">Application</span></h2>
            <p className="text-white/60 text-lg">Tell us about your vessel and discover how FILU can elevate your maritime operations.</p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-12 border border-white/10 shadow-2xl text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-3xl font-semibold text-white mb-4">Application Received</h3>
              <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
                Thank you for your interest in joining FILU Marine. Our partnership team will review your details and reach out shortly.
              </p>
              <Button
                onClick={() => setSubmitted(false)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full px-8 py-6 text-lg transition-all"
              >
                Submit Another Vessel
              </Button>
            </motion.div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 sm:p-12 border border-white/10 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/90 text-sm uppercase tracking-wider font-semibold">Full Name *</Label>
                    <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus-visible:ring-cyan-500" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/90 text-sm uppercase tracking-wider font-semibold">Email Address *</Label>
                    <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus-visible:ring-cyan-500" placeholder="john@example.com" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white/90 text-sm uppercase tracking-wider font-semibold">Phone / WhatsApp *</Label>
                    <Input id="phone" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus-visible:ring-cyan-500" placeholder="+52 55 1234 5678" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boat_type" className="text-white/90 text-sm uppercase tracking-wider font-semibold">Boat Type *</Label>
                    <Input id="boat_type" required value={formData.boat_type} onChange={(e) => setFormData({ ...formData, boat_type: e.target.value })} className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus-visible:ring-cyan-500" placeholder="e.g. Center Console, Motor Yacht" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="boat_name" className="text-white/90 text-sm uppercase tracking-wider font-semibold">Boat Name *</Label>
                    <Input id="boat_name" required value={formData.boat_name} onChange={(e) => setFormData({ ...formData, boat_name: e.target.value })} className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus-visible:ring-cyan-500" placeholder="Vessel Name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boat_model" className="text-white/90 text-sm uppercase tracking-wider font-semibold">Make & Model *</Label>
                    <Input id="boat_model" required value={formData.boat_model} onChange={(e) => setFormData({ ...formData, boat_model: e.target.value })} className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus-visible:ring-cyan-500" placeholder="e.g. Sea Ray 55" />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="boat_size" className="text-white/90 text-sm uppercase tracking-wider font-semibold">Size (feet) *</Label>
                    <Select value={formData.boat_size} onValueChange={(value) => setFormData({ ...formData, boat_size: value })} required>
                      <SelectTrigger className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus:ring-cyan-500">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20-25">20-25 ft</SelectItem>
                        <SelectItem value="26-30">26-30 ft</SelectItem>
                        <SelectItem value="31-35">31-35 ft</SelectItem>
                        <SelectItem value="36-40">36-40 ft</SelectItem>
                        <SelectItem value="41-50">41-50 ft</SelectItem>
                        <SelectItem value="51-60">51-60 ft</SelectItem>
                        <SelectItem value="60+">60+ ft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boat_status" className="text-white/90 text-sm uppercase tracking-wider font-semibold">Condition *</Label>
                    <Select value={formData.boat_status} onValueChange={(value) => setFormData({ ...formData, boat_status: value })} required>
                      <SelectTrigger className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus:ring-cyan-500">
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
                  <div className="space-y-2">
                    <Label htmlFor="boat_year" className="text-white/90 text-sm uppercase tracking-wider font-semibold">Year *</Label>
                    <Select value={formData.boat_year} onValueChange={(value) => setFormData({ ...formData, boat_year: value })} required>
                      <SelectTrigger className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus:ring-cyan-500">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {Array.from({ length: 35 }, (_, i) => 2026 - i).map((year) =>
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white/90 text-sm uppercase tracking-wider font-semibold">Current Marina / Location *</Label>
                  <Input id="location" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="bg-black/20 border-white/10 text-white h-12 rounded-xl focus-visible:ring-cyan-500" placeholder="e.g. Marina Ixtapa" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white/90 text-sm uppercase tracking-wider font-semibold">Tell us about your operational needs *</Label>
                  <Textarea id="message" required value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="bg-black/20 border-white/10 text-white rounded-xl focus-visible:ring-cyan-500 min-h-[140px] resize-none" placeholder="Are you looking primarily for rental management, maintenance software, or both? Let us know any specific requirements..." />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 py-7 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:hover:scale-100 mt-4">
                  {isSubmitting ? (
                    <span className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Ship className="h-5 w-5" />
                      Submit Partnership Application
                    </span>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Footer/Back */}
      <div className="text-center pb-12 relative z-10">
        <Button asChild variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10 rounded-full px-6">
          <Link to="/">← Back to Main Site</Link>
        </Button>
      </div>
    </div>
  );
}