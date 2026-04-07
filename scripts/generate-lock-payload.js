#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");

const args = process.argv.slice(2);
const getArg = (flag) => {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] || null;
};

const password = getArg("--password");
const htmlFile = getArg("--html-file");
const htmlInline = getArg("--html");

if (!password || (!htmlFile && !htmlInline)) {
  console.log("Usage:");
  console.log("  node scripts/generate-lock-payload.js --password \"<password>\" --html-file \"./path/to/file.html\"");
  console.log("  node scripts/generate-lock-payload.js --password \"<password>\" --html \"<div>...</div>\"");
  process.exit(1);
}

const html = htmlInline ? htmlInline : fs.readFileSync(htmlFile, "utf8");
const encoder = new TextEncoder();
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);

(async () => {
  const keyMaterial = await crypto.webcrypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await crypto.webcrypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const encrypted = Buffer.from(
    await crypto.webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(html))
  );
  const tag = encrypted.subarray(encrypted.length - 16);
  const cipher = encrypted.subarray(0, encrypted.length - 16);
  const b64 = (buf) => Buffer.from(buf).toString("base64");

  const payload = {
    salt: b64(salt),
    iv: b64(iv),
    ciphertext: b64(cipher),
    tag: b64(tag),
  };

  console.log(JSON.stringify(payload));
})();
