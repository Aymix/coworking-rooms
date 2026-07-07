import Link from "next/link";

export default function Home() {
  return (
    <div className="wrap">
      <header className="top">
        <div>
          <h1>Coworking Rooms</h1>
          <div className="sub">Choose how you want to continue</div>
        </div>
      </header>

      <div className="choices">
        <Link className="choice" href="/visitor">
          <div className="choice-icon">🙋</div>
          <div className="choice-title">I&apos;m a Visitor</div>
          <div className="choice-desc">
            See live room availability and get alerts when a room opens up or
            gets booked.
          </div>
        </Link>

        <Link className="choice admin" href="/admin">
          <div className="choice-icon">🛠️</div>
          <div className="choice-title">Administration</div>
          <div className="choice-desc">
            Sign in to post events, book a room, and notify everyone.
          </div>
        </Link>
      </div>
    </div>
  );
}
