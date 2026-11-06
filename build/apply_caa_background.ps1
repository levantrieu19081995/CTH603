Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$workspace = (Get-Location).Path
$sourcePath = (Get-ChildItem (Join-Path $workspace 'doc') -Filter '*.pptx' | Where-Object { $_.Name -ne 'caa.pptx' -and $_.Name -notlike 'caa_*' } | Select-Object -First 1 -ExpandProperty FullName)
$templatePath = Join-Path $workspace 'doc\caa.pptx'
$outputPath = Join-Path $workspace 'doc\caa_background_updated.pptx'

function Read-ZipEntry([IO.Compression.ZipArchive]$zip, [string]$name) {
  $entry = $zip.GetEntry($name)
  if ($null -eq $entry) { throw "Missing zip entry: $name" }
  $stream = $entry.Open()
  try {
    $reader = New-Object IO.StreamReader($stream, [Text.Encoding]::UTF8)
    try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
  } finally { $stream.Dispose() }
}

$sourceStream = [IO.File]::Open($sourcePath, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
$sourceZip = New-Object IO.Compression.ZipArchive($sourceStream, [IO.Compression.ZipArchiveMode]::Read)
$templateStream = [IO.File]::Open($templatePath, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
$templateZip = New-Object IO.Compression.ZipArchive($templateStream, [IO.Compression.ZipArchiveMode]::Read)
$outStream = [IO.File]::Create($outputPath)
$outZip = New-Object IO.Compression.ZipArchive($outStream, [IO.Compression.ZipArchiveMode]::Create)

try {
  $master = Read-ZipEntry $templateZip 'ppt/slideMasters/slideMaster1.xml'
  $templateBg = [regex]::Match($master, '<p:bg>[\s\S]*?</p:bg>').Value
  $templateBg = $templateBg.Replace('rId13', 'rId4')
  if ([string]::IsNullOrWhiteSpace($templateBg)) { throw 'Could not read caa master background.' }

  foreach ($entry in $sourceZip.Entries) {
    if ($entry.FullName -eq 'ppt/media/image9.png') { continue }
    $newEntry = $outZip.CreateEntry($entry.FullName, [IO.Compression.CompressionLevel]::Optimal)
    $dst = $newEntry.Open()
    try {
      if ($entry.FullName -eq 'ppt/slideMasters/slideMaster1.xml') {
        $text = Read-ZipEntry $sourceZip $entry.FullName
        $text = [regex]::Replace($text, '<p:bg>[\s\S]*?</p:bg>', $templateBg, 1)
        $bytes = [Text.Encoding]::UTF8.GetBytes($text)
        $dst.Write($bytes, 0, $bytes.Length)
      } elseif ($entry.FullName -eq 'ppt/slideMasters/_rels/slideMaster1.xml.rels') {
        $text = Read-ZipEntry $sourceZip $entry.FullName
        $rel = '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image9.png"/>'
        $text = $text.Replace('</Relationships>', "$rel</Relationships>")
        $bytes = [Text.Encoding]::UTF8.GetBytes($text)
        $dst.Write($bytes, 0, $bytes.Length)
      } elseif ($entry.FullName -match '^ppt/slides/slide\d+\.xml$') {
        $text = Read-ZipEntry $sourceZip $entry.FullName
        $text = [regex]::Replace($text, '<p:bg>[\s\S]*?</p:bg>', '', 1)
        $bytes = [Text.Encoding]::UTF8.GetBytes($text)
        $dst.Write($bytes, 0, $bytes.Length)
      } else {
        $src = $entry.Open()
        try { $src.CopyTo($dst) } finally { $src.Dispose() }
      }
    } finally { $dst.Dispose() }
  }

  $templateImage = $templateZip.GetEntry('ppt/media/image1.png')
  $newImage = $outZip.CreateEntry('ppt/media/image9.png', [IO.Compression.CompressionLevel]::Optimal)
  $srcImage = $templateImage.Open(); $dstImage = $newImage.Open()
  try { $srcImage.CopyTo($dstImage) } finally { $srcImage.Dispose(); $dstImage.Dispose() }
} finally {
  $outZip.Dispose(); $outStream.Dispose(); $templateZip.Dispose(); $templateStream.Dispose(); $sourceZip.Dispose(); $sourceStream.Dispose()
}

Write-Output $outputPath
