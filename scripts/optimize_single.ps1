Add-Type -AssemblyName System.Drawing
function Process-Image {
    param ([string]$Path, [int]$MaxWidth)
    $img = [System.Drawing.Image]::FromFile($Path)
    $ratio = $MaxWidth / $img.Width
    if ($ratio -gt 1) { $ratio = 1 }
    $newWidth = [int]($img.Width * $ratio)
    $newHeight = [int]($img.Height * $ratio)
    $newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $g = [System.Drawing.Graphics]::FromImage($newImg)
    $g.InterpolationMode = 7
    $g.DrawImage($img, 0, 0, $newWidth, $newHeight)
    $img.Dispose()
    
    $tempPath = $Path + ".tmp"
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq "JPEG" }
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 75)
    $newImg.Save($tempPath, $codec, $params)
    
    $newImg.Dispose()
    $g.Dispose()
    Move-Item $tempPath $Path -Force
    "Optimized $Path"
}
Process-Image -Path "public/blog-leitura-fio-tecnica.jpg" -MaxWidth 1000
