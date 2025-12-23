
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const dbUrl = process.env.DATABASE_URL
console.log("DATABASE_URL found:", dbUrl ? dbUrl.split('@')[1] : "UNDEFINED")

const prisma = new PrismaClient()

async function main() {
    console.log("Connecting via Prisma...")
    try {
        const stations = await prisma.station.findMany()
        console.log(`Prisma Found ${stations.length} stations.`)
        stations.forEach(s => console.log(` - ${s.name}`))
    } catch (e) {
        console.error("Prisma Connection Error:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
