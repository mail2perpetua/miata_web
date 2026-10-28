import { Copy, Link2, Share2 } from 'lucide-react';
import { Button, Card, useToast } from '@/components';

/** Agent referral link with copy and share (agent reference image: "My Referral Link"). */
export function ReferralLinkCard({ code, link }) {
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Referral link copied');
    } catch {
      toast.error('Could not copy automatically — select the link and copy it.');
    }
  };

  const share = async () => {
    const text = `Join MIATA's medical imaging & ultrasound programs with my referral link: ${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'MIATA referral', text, url: link });
        return;
      } catch {
        /* user cancelled — fall through to WhatsApp */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card title="My Referral Link" subtitle={`Share this link with your students · Code ${code}`}>
      <div className="row" style={{ alignItems: 'stretch' }}>
        <div className="code-box" style={{ flex: 1 }}>
          <Link2 aria-hidden="true" />
          <span title={link}>{link}</span>
        </div>
        <Button icon={Copy} onClick={copy}>
          Copy
        </Button>
      </div>
      <div className="invite-box">
        <span className="timeline-icon tone-green">
          <Share2 aria-hidden="true" />
        </span>
        <div>
          <strong>Invite New Students</strong>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
            Students who register through your link appear in your referral list automatically.
          </p>
        </div>
      </div>
      <Button variant="navy" block icon={Share2} onClick={share}>
        Share Referral Link
      </Button>
    </Card>
  );
}
