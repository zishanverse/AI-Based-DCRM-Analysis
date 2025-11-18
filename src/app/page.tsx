'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Navigation from '@/components/Navigation'

export default function Home() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    city: ''
  })
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const { toast } = useToast()

  const heroRef = useRef(null)
  const sectionRefs = useRef([])

  useEffect(() => {
    // GSAP Animations
    gsap.fromTo(heroRef.current, 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
    )

    // Simple scroll animations without ScrollTrigger
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(entry.target,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
            )
          }
        })
      },
      { threshold: 0.1 }
    )

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // Fetch projects and clients
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error('Failed to fetch projects:', err))

    fetch('/api/clients')
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(err => console.error('Failed to fetch clients:', err))
  }, [])

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        toast({ title: "Success!", description: "Your message has been sent." })
        setFormData({ fullName: '', email: '', mobile: '', city: '' })
      } else {
        toast({ title: "Error", description: "Failed to send message.", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    }
  }

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      })
      
      if (response.ok) {
        toast({ title: "Subscribed!", description: "Thank you for subscribing." })
        setNewsletterEmail('')
      } else {
        toast({ title: "Error", description: "Failed to subscribe.", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      {/* Hero Section with Consultation Form */}
      <section ref={heroRef} className="relative bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl font-bold text-slate-900 mb-6">
                Consultation, Design, & Marketing
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                Transform your real estate vision into reality with our comprehensive services
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="p-8 shadow-xl">
                <h2 className="text-2xl font-semibold mb-6">Get Consultation</h2>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800">
                    Submit
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Not Your Average Realtor */}
      <section ref={el => sectionRefs.current[0] = el} className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-slate-900 mb-6"
          >
            Not Your Average Realtor
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-slate-600 max-w-3xl mx-auto"
          >
            We go beyond traditional real estate services, offering innovative solutions that blend design expertise with strategic marketing to maximize your property's potential.
          </motion.p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section ref={el => sectionRefs.current[1] = el} className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-center text-slate-900 mb-16"
          >
            Why Choose Us?
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Potential ROI",
                description: "Maximize your investment returns with our data-driven approach and market insights that ensure optimal property valuation and timing."
              },
              {
                title: "Design",
                description: "Transform spaces with our expert design team that creates stunning, functional environments that captivate potential buyers."
              },
              {
                title: "Marketing",
                description: "Leverage cutting-edge marketing strategies and digital platforms to showcase your property to the right audience effectively."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-8 h-full hover:shadow-lg transition-shadow">
                  <h3 className="text-2xl font-semibold text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us */}
      <section ref={el => sectionRefs.current[2] = el} className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-8">About Us</h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              With years of experience in the real estate industry, we've built a reputation for excellence, 
              innovation, and client satisfaction. Our team of dedicated professionals combines deep market knowledge 
              with creative solutions to deliver exceptional results for every client.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Projects */}
      <section ref={el => sectionRefs.current[3] = el} className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-center text-slate-900 mb-16"
          >
            Our Projects
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={project.image} 
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{project.name}</h3>
                    <p className="text-slate-600 mb-4">{project.description}</p>
                    <Button variant="outline" className="w-full">
                      Read More
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Happy Clients */}
      <section ref={el => sectionRefs.current[4] = el} className="py-20">
        <div className="container mx-auto px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-center text-slate-900 mb-16"
          >
            Happy Clients
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
                    <img 
                      src={client.image} 
                      alt={client.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-slate-600 mb-4 italic">"{client.description}"</p>
                  <h3 className="text-lg font-semibold text-slate-900">{client.name}</h3>
                  <p className="text-slate-500">{client.designation}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section ref={el => sectionRefs.current[5] = el} className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-6"
          >
            Stay Updated
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl mb-8 max-w-2xl mx-auto"
          >
            Subscribe to our newsletter for the latest property listings, market insights, and exclusive offers.
          </motion.p>
          <motion.form 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleNewsletterSubmit}
            className="max-w-md mx-auto flex gap-4"
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              className="bg-white text-slate-900"
            />
            <Button type="submit" variant="secondary">
              Subscribe
            </Button>
          </motion.form>
        </div>
      </section>
    </div>
  )
}