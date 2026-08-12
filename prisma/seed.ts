import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@pier7.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "changeme123";

  const existing = await db.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} já existe.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.admin.create({ data: { email, passwordHash, name: "Admin" } });
  console.log(`Admin criado: ${email} / senha: ${password} (troque depois do primeiro login)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
