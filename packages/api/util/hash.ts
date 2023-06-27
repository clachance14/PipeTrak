import { randomBytes, scrypt } from "crypto";

export async function hash(password: string) {
  return new Promise<string>((resolve, reject) => {
    // generate random 16 bytes long salt
    const salt = randomBytes(16).toString("hex");

    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ":" + derivedKey.toString("hex"));
    });
  });
}
