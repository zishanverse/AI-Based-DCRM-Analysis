
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log("Connecting via Prisma (JS)...")
    try {
        const stations = await prisma.station.findMany()
        console.log(`Prisma Found ${stations.length} stations:`)
        stations.forEach(s => console.log(` - ${s.name} (${s.id})`))

        if (stations.length === 0) {
            console.log("WARNING: Table is empty as seen by Prisma!")
        }
    } catch (e) {
        console.error("Prisma Connection Error:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
