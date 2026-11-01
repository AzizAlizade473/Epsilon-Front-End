# Build-only fallback for missing production branding. No animation or new logo design.
Add-Type -AssemblyName System.Drawing
$epsilonAssets = Join-Path $PSScriptRoot '..\assets\brand'
$epsilonGlyph = [char]0x03B5
foreach ($epsilonVariant in @('app-icon', 'app-icon-flat', 'app-icon-monochrome')) {
  $epsilonBitmap = New-Object System.Drawing.Bitmap 1024, 1024
  $epsilonGraphics = [System.Drawing.Graphics]::FromImage($epsilonBitmap)
  $epsilonGraphics.Clear($(if ($epsilonVariant -eq 'app-icon-flat') { [System.Drawing.Color]::White } else { [System.Drawing.Color]::Transparent }))
  $epsilonGraphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $epsilonFont = New-Object System.Drawing.Font 'Arial', 600, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
  $epsilonFormat = New-Object System.Drawing.StringFormat
  $epsilonFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $epsilonFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
  $epsilonColor = if ($epsilonVariant -eq 'app-icon-monochrome') { [System.Drawing.Color]::Black } else { [System.Drawing.ColorTranslator]::FromHtml('#2563EB') }
  $epsilonBrush = New-Object System.Drawing.SolidBrush $epsilonColor
  $epsilonBounds = New-Object System.Drawing.RectangleF 0, 0, 1024, 1024
  $epsilonGraphics.DrawString([string]$epsilonGlyph, $epsilonFont, $epsilonBrush, $epsilonBounds, $epsilonFormat)
  $epsilonBitmap.Save((Join-Path $epsilonAssets "$epsilonVariant.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $epsilonBrush.Dispose(); $epsilonFont.Dispose(); $epsilonFormat.Dispose(); $epsilonGraphics.Dispose(); $epsilonBitmap.Dispose()
}
