Add-Type -AssemblyName System.Drawing

$imgDir = Join-Path $PSScriptRoot "..\public\flower-image"
$files = Get-ChildItem -Path $imgDir -Filter *.jpg

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)

$totalOld = 0
$totalNew = 0

foreach ($file in $files) {
    $srcPath = $file.FullName
    $bytes = [System.IO.File]::ReadAllBytes($srcPath)
    $ms = New-Object System.IO.MemoryStream(,$bytes)
    $srcImg = [System.Drawing.Bitmap]::FromStream($ms)

    $maxWidth = 800
    if ($srcImg.Width -gt $maxWidth) {
        $targetWidth = $maxWidth
        $targetHeight = [int]($srcImg.Height * ($maxWidth / $srcImg.Width))
    } else {
        $targetWidth = $srcImg.Width
        $targetHeight = $srcImg.Height
    }

    $destImg = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($destImg)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.DrawImage($srcImg, 0, 0, $targetWidth, $targetHeight)

    $outMs = New-Object System.IO.MemoryStream
    $destImg.Save($outMs, $codec, $encoderParams)

    $oldLen = $file.Length
    $newLen = $outMs.Length

    $srcImg.Dispose()
    $graphics.Dispose()
    $destImg.Dispose()
    $ms.Dispose()

    # Chỉ ghi đè nếu dung lượng mới nhỏ hơn
    if ($newLen -lt $oldLen) {
        [System.IO.File]::WriteAllBytes($srcPath, $outMs.ToArray())
        $totalOld += $oldLen
        $totalNew += $newLen
        Write-Host "Optimized $($file.Name): $([math]::Round($oldLen/1024, 1)) KB -> $([math]::Round($newLen/1024, 1)) KB"
    } else {
        $totalOld += $oldLen
        $totalNew += $oldLen
        Write-Host "Kept $($file.Name): already optimal"
    }
    $outMs.Dispose()
}

$oldMB = [math]::Round($totalOld / (1024 * 1024), 2)
$newMB = [math]::Round($totalNew / (1024 * 1024), 2)
$savedPct = [math]::Round((1 - $totalNew / $totalOld) * 100, 1)

Write-Host "Total: $oldMB MB -> $newMB MB (Giảm $savedPct%)" -ForegroundColor Green
