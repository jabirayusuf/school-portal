import bcrypt from 'bcryptjs'
import prisma from './prisma'

async function main(): Promise<void> {
  const adminUsername = 'admin'
  const adminPassword = 'admin123'
  const existing = await prisma.user.findUnique({ where: { username: adminUsername } })

  const hash = await bcrypt.hash(adminPassword, 10)

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hash,
        role: 'ADMIN',
        mustChangePassword: false,
      },
    })
    console.log('Admin user updated successfully:')
  } else {
    await prisma.user.create({
      data: {
        username: adminUsername,
        password: hash,
        role: 'ADMIN',
        mustChangePassword: false,
      },
    })
    console.log('Default admin created:')
  }

  console.log(`  username: ${adminUsername}`)
  console.log(`  password: ${adminPassword}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
