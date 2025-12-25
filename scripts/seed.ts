//Preevent Nitro/Vite from initialising when running as a standalone script
process.env.NITRO_PRESET = 'node-server'
process.env.NODE_ENV = process.env.NODE_ENV || 'production'

import dotenv from 'dotenv'
dotenv.config()

process.env.NODE_ENV ??= 'production'
process.env.NITRO_PRESET ??= 'node-server'

import { sampleProducts } from '../src/data/products'

async function seed() {
  try {
    //Dynamically import database modules after enviroment variables are loaded
    const { db } = await import('../src/db/index')
    const { products } = await import('../src/db/schema')

    console.log('Seeding database...')

    //check if -- rest flag is passed
    const shouldReset =
      process.argv.includes('--reset') || process.argv.includes('-r')

    if (shouldReset) {
      console.log('Resetting database...')
      await db.delete(products)
      console.log('Database reset successfully')
    } else {
      //check if products already exist
      const existingProducts = await db.select().from(products)
      if (existingProducts.length > 0) {
        console.log('Products already exist')
        console.log(
          'Run with --reset flag to reset the database and reseed: npm run db:seed -- --reset',
        )
        process.exit(0)
      }
    }

    //Insert sample products
    console.log('Inserting sample products...')
    await db.insert(products).values(sampleProducts)
    console.log('Sample products inserted successfully')

    console.log('Seeding complete!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}
// Only run seed()( if this file is executed directly (not imported)
// This script should omly run when executed via npm run db:seed
//It is not run when imported by other modules (like Vite during dev)
const isRunningAsScript =
  process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('tsx')
if (isRunningAsScript) {
  seed()
}
