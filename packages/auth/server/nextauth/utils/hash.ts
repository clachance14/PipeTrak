import { scrypt } from "crypto";

export async function verify(password: string, hash: string) {
  return new Promise<boolean>((resolve, reject) => {
    const [salt, key] = hash.split(":");
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key == derivedKey.toString("hex"));
    });
  });
}
