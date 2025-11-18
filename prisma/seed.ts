import { db } from '@/lib/db'

async function main() {
  // Add sample projects
  const projects = [
    {
      name: "Luxury Villa Complex",
      description: "A stunning collection of modern villas featuring panoramic ocean views, private pools, and state-of-the-art amenities.",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=450&h=350&fit=crop"
    },
    {
      name: "Downtown Apartments",
      description: "Contemporary urban living spaces in the heart of the city, designed for professionals who value convenience and style.",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=450&h=350&fit=crop"
    },
    {
      name: "Beachfront Condos",
      description: "Exclusive beachfront condominiums offering breathtaking sunset views and direct beach access.",
      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2f6f3?w=450&h=350&fit=crop"
    }
  ]

  for (const project of projects) {
    await db.project.create({ data: project })
  }

  // Add sample clients
  const clients = [
    {
      name: "Sarah Johnson",
      description: "Working with this team was the best decision I made. They found my dream home in just two weeks!",
      designation: "CEO",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face"
    },
    {
      name: "Michael Chen",
      description: "Professional, efficient, and trustworthy. They helped me sell my property above market value.",
      designation: "Web Developer",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
    },
    {
      name: "Emily Rodriguez",
      description: "Their marketing strategy is unmatched. My property was viewed by hundreds of potential buyers.",
      designation: "Designer",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face"
    }
  ]

  for (const client of clients) {
    await db.client.create({ data: client })
  }

  console.log('Sample data seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })