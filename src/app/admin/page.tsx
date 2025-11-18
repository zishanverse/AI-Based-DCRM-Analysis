'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'

export default function AdminPanel() {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [contacts, setContacts] = useState([])
  const [subscribers, setSubscribers] = useState([])
  const { toast } = useToast()

  const [projectForm, setProjectForm] = useState({ name: '', description: '', image: '' })
  const [clientForm, setClientForm] = useState({ name: '', description: '', designation: '', image: '' })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsRes, clientsRes, contactsRes, subscribersRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/clients'),
        fetch('/api/contact'),
        fetch('/api/newsletter')
      ])

      const [projectsData, clientsData, contactsData, subscribersData] = await Promise.all([
        projectsRes.json(),
        clientsRes.json(),
        contactsRes.json(),
        subscribersRes.json()
      ])

      setProjects(projectsData)
      setClients(clientsData)
      setContacts(contactsData)
      setSubscribers(subscribersData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const handleImageUpload = async (file) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        return data.url
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      toast({ title: "Upload Error", description: "Failed to upload image", variant: "destructive" })
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleProjectSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      })

      if (response.ok) {
        toast({ title: "Success", description: "Project added successfully" })
        setProjectForm({ name: '', description: '', image: '' })
        fetchData()
      } else {
        toast({ title: "Error", description: "Failed to add project", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    }
  }

  const handleClientSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm)
      })

      if (response.ok) {
        toast({ title: "Success", description: "Client added successfully" })
        setClientForm({ name: '', description: '', designation: '', image: '' })
        fetchData()
      } else {
        toast({ title: "Error", description: "Failed to add client", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    }
  }

  const handleProjectImageChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const imageUrl = await handleImageUpload(file)
      if (imageUrl) {
        setProjectForm({ ...projectForm, image: imageUrl })
      }
    }
  }

  const handleClientImageChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const imageUrl = await handleImageUpload(file)
      if (imageUrl) {
        setClientForm({ ...clientForm, image: imageUrl })
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Admin Panel</h1>
        
        <Tabs defaultValue="projects" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          </TabsList>

          {/* Projects Management */}
          <TabsContent value="projects">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProjectSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="projectName">Project Name</Label>
                      <Input
                        id="projectName"
                        value={projectForm.name}
                        onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectDescription">Description</Label>
                      <Textarea
                        id="projectDescription"
                        value={projectForm.description}
                        onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectImage">Project Image</Label>
                      <Input
                        id="projectImage"
                        type="file"
                        accept="image/*"
                        onChange={handleProjectImageChange}
                        disabled={uploading}
                      />
                      {projectForm.image && (
                        <div className="mt-2">
                          <img src={projectForm.image} alt="Preview" className="h-20 w-20 object-cover rounded" />
                        </div>
                      )}
                    </div>
                    <Button type="submit" disabled={uploading} className="w-full">
                      {uploading ? 'Uploading...' : 'Add Project'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {projects.map((project) => (
                      <div key={project.id} className="border rounded p-4">
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-slate-600">{project.description}</p>
                        {project.image && (
                          <img src={project.image} alt={project.name} className="h-16 w-16 object-cover rounded mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clients Management */}
          <TabsContent value="clients">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleClientSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="clientName">Client Name</Label>
                      <Input
                        id="clientName"
                        value={clientForm.name}
                        onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientDescription">Description</Label>
                      <Textarea
                        id="clientDescription"
                        value={clientForm.description}
                        onChange={(e) => setClientForm({...clientForm, description: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientDesignation">Designation</Label>
                      <Input
                        id="clientDesignation"
                        value={clientForm.designation}
                        onChange={(e) => setClientForm({...clientForm, designation: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientImage">Client Image</Label>
                      <Input
                        id="clientImage"
                        type="file"
                        accept="image/*"
                        onChange={handleClientImageChange}
                        disabled={uploading}
                      />
                      {clientForm.image && (
                        <div className="mt-2">
                          <img src={clientForm.image} alt="Preview" className="h-20 w-20 object-cover rounded-full" />
                        </div>
                      )}
                    </div>
                    <Button type="submit" disabled={uploading} className="w-full">
                      {uploading ? 'Uploading...' : 'Add Client'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {clients.map((client) => (
                      <div key={client.id} className="border rounded p-4">
                        <h3 className="font-semibold">{client.name}</h3>
                        <p className="text-sm text-slate-600">{client.description}</p>
                        <p className="text-sm text-slate-500">{client.designation}</p>
                        {client.image && (
                          <img src={client.image} alt={client.name} className="h-16 w-16 object-cover rounded-full mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contact Form Details */}
          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Contact Form Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Full Name</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Mobile</th>
                        <th className="text-left p-2">City</th>
                        <th className="text-left p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((contact) => (
                        <tr key={contact.id} className="border-b">
                          <td className="p-2">{contact.fullName}</td>
                          <td className="p-2">{contact.email}</td>
                          <td className="p-2">{contact.mobile}</td>
                          <td className="p-2">{contact.city}</td>
                          <td className="p-2">{new Date(contact.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Newsletter Subscribers */}
          <TabsContent value="subscribers">
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Subscribers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Subscribed Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((subscriber) => (
                        <tr key={subscriber.id} className="border-b">
                          <td className="p-2">{subscriber.email}</td>
                          <td className="p-2">{new Date(subscriber.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
      </div>
    </div>
  )
}