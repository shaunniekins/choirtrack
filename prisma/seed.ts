import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL;
  const plainPassword = process.env.SEED_USER_PASSWORD;

  if (!email || !plainPassword) {
    console.error(
      "Error: SEED_USER_EMAIL and SEED_USER_PASSWORD must be set in .env"
    );
    process.exit(1);
  }

  console.log(`Seeding database with user: ${email}`);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User ${email} already exists. Skipping.`);
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(plainPassword, 10); // 10 is the salt rounds

  // Create the user
  const user = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
      name: "Admin", // Optional: Set a default name
      // emailVerified: new Date(), // Optional: Mark email as verified if needed
    },
  });

  console.log(`Created user ${user.email} with id: ${user.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
