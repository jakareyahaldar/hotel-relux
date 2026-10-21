$ErrorActionPreference = 'Continue'
$base = 'http://localhost:5174'
$files = @(
  '/',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/utils/bookingActions.js',
  '/src/utils/booking.js',
  '/src/utils/pricing.js',
  '/src/utils/dates.js',
  '/src/components/BookingModal.jsx',
  '/src/components/BookingForm.jsx',
  '/src/components/BookingConfirmation.jsx',
  '/src/components/ManageBooking.jsx',
  '/src/components/Reveal.jsx',
  '/src/components/Rooms.jsx',
  '/src/components/BookingBar.jsx',
  '/src/data/rooms.js',
  '/src/data/hotel.js',
  '/src/data/content.js',
  '/src/styles/global.css'
)
$out = @()
foreach ($f in $files) {
  try {
    $r = Invoke-WebRequest -Uri ($base + $f) -UseBasicParsing -TimeoutSec 10
    $out += ($f + ' => ' + $r.StatusCode + ' (' + $r.RawContentLength + ' bytes)')
  } catch {
    $out += ($f + ' => ERROR: ' + $_.Exception.Message)
  }
}
$out | Set-Content -Path 'd:\hotel\check.log' -Encoding UTF8
