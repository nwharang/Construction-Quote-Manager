import { compare, hash } from "bcryptjs";

export async function saltAndHashPassword(password: string) {
  const hashedPassword = await hash(password, 12);
  return hashedPassword;
}

export async function isPasswordValid(
  hashedPassword: string,
  password: string,
) {
  const isValid = await compare(password, hashedPassword);
  return isValid;
}
