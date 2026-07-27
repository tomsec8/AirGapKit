import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceImg = path.join(__dirname, 'public', 'icon', 'WhatsApp Image 2026-07-24 at 16.44.50.jpeg');
const iconDir = path.join(__dirname, 'public', 'icon');

const psScript = `
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile('${sourceImg.replace(/\\/g, '\\\\')}')
$width = $src.Width
$height = $src.Height

$transparentImg = New-Object System.Drawing.Bitmap($width, $height)
for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $pixel = $src.GetPixel($x, $y)
        if ($pixel.R -lt 30 -and $pixel.G -lt 30 -and $pixel.B -lt 30) {
            $transparentImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $transparentImg.SetPixel($x, $y, $pixel)
        }
    }
}

$sizes = @(16, 32, 48, 96, 128)
foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($s, $s)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($transparentImg, 0, 0, $s, $s)
    $outPath = "${iconDir.replace(/\\/g, '/')}/" + $s + ".png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$logoPath = "${iconDir.replace(/\\/g, '/')}/logo_transparent.png"
$transparentImg.Save($logoPath, [System.Drawing.Imaging.ImageFormat]::Png)
$transparentImg.Dispose()
$src.Dispose()
`;

const tempPs = path.join(__dirname, 'remove_bg.ps1');
fs.writeFileSync(tempPs, psScript);

try {
  execSync(`powershell -ExecutionPolicy Bypass -File "${tempPs}"`);
  console.log('Background removed! Transparent PNG icons created.');
} catch (e) {
  console.error(e);
} finally {
  if (fs.existsSync(tempPs)) fs.unlinkSync(tempPs);
}
