Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$workspace = (Get-Location).Path
$sourcePath = (Get-ChildItem (Join-Path $workspace 'doc') -Filter '*.pptx' | Where-Object { $_.Name -notlike 'caa*' } | Select-Object -First 1 -ExpandProperty FullName)
$templatePath = Join-Path $workspace 'doc\caa.pptx'
$outputPath = Join-Path $workspace 'doc\caa_final.pptx'

function Read-ZipEntry([IO.Compression.ZipArchive]$zip, [string]$name) {
  $entry = $zip.GetEntry($name)
  $stream = $entry.Open()
  try {
    $reader = New-Object IO.StreamReader($stream, [Text.Encoding]::UTF8)
    try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
  } finally { $stream.Dispose() }
}

function Scale-Geometry([string]$xml) {
  $xml = [regex]::Replace($xml, '(<a:(?:off|chOff) x=")([0-9]+)(")', {
    param($m) $v = [Math]::Round(([double]$m.Groups[2].Value) * 0.75); return $m.Groups[1].Value + [int]$v + $m.Groups[3].Value
  })
  $xml = [regex]::Replace($xml, '(<a:(?:ext|chExt) cx=")([0-9]+)(")', {
    param($m) $v = [Math]::Round(([double]$m.Groups[2].Value) * 0.75); return $m.Groups[1].Value + [int]$v + $m.Groups[3].Value
  })
  return $xml
}

$sourceStream = [IO.File]::Open($sourcePath, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
$sourceZip = New-Object IO.Compression.ZipArchive($sourceStream, [IO.Compression.ZipArchiveMode]::Read)
$templateStream = [IO.File]::Open($templatePath, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
$templateZip = New-Object IO.Compression.ZipArchive($templateStream, [IO.Compression.ZipArchiveMode]::Read)
$outStream = [IO.File]::Create($outputPath)
$outZip = New-Object IO.Compression.ZipArchive($outStream, [IO.Compression.ZipArchiveMode]::Create)

try {
  $templateMaster = Read-ZipEntry $templateZip 'ppt/slideMasters/slideMaster1.xml'
  $background = [regex]::Match($templateMaster, '<p:bg>[\s\S]*?</p:bg>').Value.Replace('rId13', 'rId99')
  foreach ($entry in $sourceZip.Entries) {
    $newEntry = $outZip.CreateEntry($entry.FullName, [IO.Compression.CompressionLevel]::Optimal)
    $dst = $newEntry.Open()
    try {
      if ($entry.FullName -eq 'ppt/presentation.xml') {
        $text = Read-ZipEntry $sourceZip $entry.FullName
        $text = [regex]::Replace($text, '<p:sldSz[^>]*></p:sldSz>', '<p:sldSz cx="9144000" cy="6858000" type="screen4x3"></p:sldSz>', 1)
        $bytes = [Text.Encoding]::UTF8.GetBytes($text); $dst.Write($bytes, 0, $bytes.Length)
      } elseif ($entry.FullName -match '^ppt/slides/slide\d+\.xml$') {
        $text = Read-ZipEntry $sourceZip $entry.FullName
        $text = [regex]::Replace($text, '<p:pic>[\s\S]*?<a:off x="9271000" y="6419850"[\s\S]*?</p:pic>', '', 1)
        $text = Scale-Geometry $text
        if ($text -match '<p:bg>[\s\S]*?</p:bg>') { $text = [regex]::Replace($text, '<p:bg>[\s\S]*?</p:bg>', $background, 1) }
        else { $text = $text.Replace('<p:cSld', '<p:bg>' + $background + '</p:bg><p:cSld') }
        $bytes = [Text.Encoding]::UTF8.GetBytes($text); $dst.Write($bytes, 0, $bytes.Length)
      } elseif ($entry.FullName -match '^ppt/slides/_rels/slide\d+\.xml\.rels$') {
        $text = Read-ZipEntry $sourceZip $entry.FullName
        $rel = '<Relationship Id="rId99" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image9.png"/>'
        $text = $text.Replace('</Relationships>', "$rel</Relationships>")
        $bytes = [Text.Encoding]::UTF8.GetBytes($text); $dst.Write($bytes, 0, $bytes.Length)
      } else {
        $src = $entry.Open(); try { $src.CopyTo($dst) } finally { $src.Dispose() }
      }
    } finally { $dst.Dispose() }
  }
  $image = $templateZip.GetEntry('ppt/media/image1.png')
  $newImage = $outZip.CreateEntry('ppt/media/image9.png', [IO.Compression.CompressionLevel]::Optimal)
  $srcImage = $image.Open(); $dstImage = $newImage.Open()
  try { $srcImage.CopyTo($dstImage) } finally { $srcImage.Dispose(); $dstImage.Dispose() }
} finally {
  $outZip.Dispose(); $outStream.Dispose(); $templateZip.Dispose(); $templateStream.Dispose(); $sourceZip.Dispose(); $sourceStream.Dispose()
}
Write-Output $outputPath
