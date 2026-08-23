import USSDPhoneUI from '../components/USSDPhoneUI';

// ─── Chromeless standalone view ───────────────────────────────────────────────
// Route: /mobile
// No sidebar, no header, no padding — just the phone centered on a black screen.
// Share this URL with end-users for live demos on physical smartphones.

export default function StandaloneMobile() {
  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <USSDPhoneUI />
    </div>
  );
}
