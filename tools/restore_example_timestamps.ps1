$ErrorActionPreference = "Stop"

$exampleDir = Join-Path (Split-Path -Parent $PSScriptRoot) "example"

Get-ChildItem $exampleDir -Filter "*.jpg" | ForEach-Object {
  if ($_.BaseName -match "^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$") {
    $takenAt = Get-Date -Year $matches[1] -Month $matches[2] -Day $matches[3] -Hour $matches[4] -Minute $matches[5] -Second $matches[6]
    $_.CreationTime = $takenAt
    $_.LastWriteTime = $takenAt
  }
}

$times = @{
  "axq_0197_lmn.pdf" = "2026-04-27 10:35:00"
  "bravo_77xq.pdf" = "2026-04-27 14:10:00"
  "kz_4002_delta.pdf" = "2026-04-28 10:15:00"
  "mld_88_tmp.pdf" = "2026-04-28 14:15:00"
  "north_2048_q.pdf" = "2026-04-29 08:25:00"
  "ecm_zz91.pdf" = "2026-04-29 14:15:00"
  "mobile_x7a.pdf" = "2026-04-30 10:15:00"
  "net_foo_31.pdf" = "2026-04-30 14:15:00"
  "sys_09_alpha.pdf" = "2026-05-01 10:15:00"
  "proj_2_finalish.pdf" = "2026-05-01 14:15:00"
  "rec_ax19_q.wav" = "2026-04-27 10:40:00"
  "rec_db77_l.wav" = "2026-04-27 14:35:00"
  "rec_st40_p.wav" = "2026-04-28 10:20:00"
  "rec_ml88_t.wav" = "2026-04-28 14:20:00"
  "rec_ie20_n.wav" = "2026-04-29 08:40:00"
  "rec_ec91_z.wav" = "2026-04-29 14:20:00"
  "rec_mb7a_x.wav" = "2026-04-30 10:20:00"
  "rec_net31_f.wav" = "2026-04-30 14:20:00"
  "rec_lnx09_a.wav" = "2026-05-01 10:20:00"
  "rec_prj2_f.wav" = "2026-05-01 14:20:00"
}

foreach ($name in $times.Keys) {
  $path = Join-Path $exampleDir $name
  if (Test-Path $path) {
    $time = Get-Date $times[$name]
    (Get-Item $path).CreationTime = $time
    (Get-Item $path).LastWriteTime = $time
  }
}

Write-Host "Example timestamps restored."
