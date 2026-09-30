import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const rootDir = process.cwd();
const logoSvgPath = path.join(rootDir, "assets", "logo.svg");

async function renderIcon({ size, logoFraction, background, outputPath }) {
  const logoSize = Math.round(size * logoFraction);
  const offset = Math.round((size - logoSize) / 2);

  const resizedLogo = await sharp(logoSvgPath)
    .resize(logoSize, logoSize)
    .toBuffer();

  const base = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background || { r: 255, g: 255, b: 255, alpha: 0 }
    }
  });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await base
    .composite([
      {
        input: resizedLogo,
        top: offset,
        left: offset
      }
    ])
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${outputPath} (${size}x${size})`);
}

async function run() {
  // Ensure dirs
  await fs.mkdir(path.join(rootDir, "public", "icons"), { recursive: true });
  await fs.mkdir(path.join(rootDir, "assets"), { recursive: true });

  // 1. public/icons/icon-192.png (white, logo 70%)
  await renderIcon({
    size: 192,
    logoFraction: 0.70,
    background: "#FFFFFF",
    outputPath: path.join(rootDir, "public", "icons", "icon-192.png")
  });

  // 2. public/icons/icon-512.png (white, logo 70%)
  await renderIcon({
    size: 512,
    logoFraction: 0.70,
    background: "#FFFFFF",
    outputPath: path.join(rootDir, "public", "icons", "icon-512.png")
  });

  // 3. public/icons/icon-maskable-512.png (white, logo 60% safe zone)
  await renderIcon({
    size: 512,
    logoFraction: 0.60,
    background: "#FFFFFF",
    outputPath: path.join(rootDir, "public", "icons", "icon-maskable-512.png")
  });

  // 4. public/icons/apple-touch-icon.png (180x180, white, logo 70%)
  await renderIcon({
    size: 180,
    logoFraction: 0.70,
    background: "#FFFFFF",
    outputPath: path.join(rootDir, "public", "icons", "apple-touch-icon.png")
  });

  // 5. assets/icon-only.png (1024x1024 white, logo 70%)
  await renderIcon({
    size: 1024,
    logoFraction: 0.70,
    background: "#FFFFFF",
    outputPath: path.join(rootDir, "assets", "icon-only.png")
  });

  // 6. assets/icon-foreground.png (1024x1024 transparent, logo 60%)
  await renderIcon({
    size: 1024,
    logoFraction: 0.60,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    outputPath: path.join(rootDir, "assets", "icon-foreground.png")
  });

  // 7. assets/icon-background.png (1024x1024 solid #FFFFFF)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: "#FFFFFF"
    }
  })
    .png()
    .toFile(path.join(rootDir, "assets", "icon-background.png"));
  console.log(`Generated: assets/icon-background.png (1024x1024)`);

  // 8. assets/splash.png (2732x2732 white, logo 25%)
  await renderIcon({
    size: 2732,
    logoFraction: 0.25,
    background: "#FFFFFF",
    outputPath: path.join(rootDir, "assets", "splash.png")
  });

  // 9. assets/splash-dark.png (2732x2732 #121212, logo 25%)
  await renderIcon({
    size: 2732,
    logoFraction: 0.25,
    background: "#121212",
    outputPath: path.join(rootDir, "assets", "splash-dark.png")
  });

  console.log("All icons and splash screens successfully generated!");
}

run().catch((err) => {
  console.error("Icon generation error:", err);
  process.exit(1);
});
