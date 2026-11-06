Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$workspace = (Get-Location).Path
$sourcePath = Join-Path $workspace 'doc\caa_final.pptx'
$outputPath = Join-Path $workspace 'doc\caa_final_fixed.pptx'

function Read-ZipEntry([IO.Compression.ZipArchive]$zip, [string]$name) {
  $entry = $zip.GetEntry($name)
  $stream = $entry.Open()
  try {
    $reader = New-Object IO.StreamReader($stream, [Text.Encoding]::UTF8)
    try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
  } finally { $stream.Dispose() }
}

$sourceStream = [IO.File]::Open($sourcePath, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
$sourceZip = New-Object IO.Compression.ZipArchive($sourceStream, [IO.Compression.ZipArchiveMode]::Read)
$outStream = [IO.File]::Create($outputPath)
$outZip = New-Object IO.Compression.ZipArchive($outStream, [IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($entry in $sourceZip.Entries) {
    $newEntry = $outZip.CreateEntry($entry.FullName, [IO.Compression.CompressionLevel]::Optimal)
    $dst = $newEntry.Open()
    try {
      if ($entry.FullName -eq 'ppt/slides/slide6.xml' -or $entry.FullName -eq 'ppt/slides/slide7.xml') {
        $text = Read-ZipEntry $sourceZip $entry.FullName
        $text = [regex]::Replace($text, '<a:tbl>[\s\S]*?</a:tbl>', {
          param($m)
          $table = $m.Value.Replace('<a:solidFill><a:srgbClr val="FBF0E0"></a:srgbClr></a:solidFill>', '<a:solidFill><a:srgbClr val="FFFFFF"></a:srgbClr></a:solidFill>')
          return $table
        }, 1)
        $bytes = [Text.Encoding]::UTF8.GetBytes($text); $dst.Write($bytes, 0, $bytes.Length)
      } else {
        $src = $entry.Open(); try { $src.CopyTo($dst) } finally { $src.Dispose() }
      }
    } finally { $dst.Dispose() }
  }
} finally {
  $outZip.Dispose(); $outStream.Dispose(); $sourceZip.Dispose(); $sourceStream.Dispose()
}
Write-Output $outputPath
