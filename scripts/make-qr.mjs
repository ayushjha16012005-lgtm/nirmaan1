import QRCode from "qrcode";
import fs from "fs/promises";
import path from "path";
import jsQR from "jsqr";
import sharp from "sharp";

const TARGET_URL = "https://nirmaan-m.vercel.app/install/";
const qrDir = path.join(process.cwd(), "qr");

async function generateAndVerifyQR() {
  await fs.mkdir(qrDir, { recursive: true });

  const pngPath = path.join(qrDir, "nirmaan-install-qr.png");
  const svgPath = path.join(qrDir, "nirmaan-install-qr.svg");

  // 1. Generate PNG
  await QRCode.toFile(pngPath, TARGET_URL, {
    width: 1024,
    margin: 4,
    errorCorrectionLevel: "H",
    color: {
      dark: "#000000",
      light: "#FFFFFF"
    }
  });
  console.log(`Generated QR PNG: ${pngPath}`);

  // 2. Generate SVG
  const svgString = await QRCode.toString(TARGET_URL, {
    type: "svg",
    margin: 4,
    errorCorrectionLevel: "H",
    color: {
      dark: "#000000",
      light: "#FFFFFF"
    }
  });
  await fs.writeFile(svgPath, svgString, "utf8");
  console.log(`Generated QR SVG: ${svgPath}`);

  // 3. Verify decoding via jsQR
  const { data, info } = await sharp(pngPath)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);

  if (!decoded) {
    throw new Error("Failed to decode generated QR code!");
  }

  console.log(`Decoded QR text: ${decoded.data}`);
  if (decoded.data !== TARGET_URL) {
    throw new Error(`Decoded QR URL (${decoded.data}) does not match expected target (${TARGET_URL})!`);
  }

  console.log("QR verification SUCCESS: Decoded text exactly matches target URL!");
}

generateAndVerifyQR().catch((err) => {
  console.error("QR Generation error:", err);
  process.exit(1);
});
