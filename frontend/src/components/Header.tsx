import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAA } from './AAProvider';
import { useReadContract } from 'wagmi';
import { PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI } from '../contracts';
import { useMarkets } from '../hooks/useMarkets';
import CreateMarketModal from './CreateMarketModal';

const Header = () => {
  const { login, logout, authenticated, user } = usePrivy();
  const { smartAccountAddress } = useAA();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { refetch } = useMarkets();

  const { data: owner } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'owner',
  });

  const isOwner = authenticated && user?.wallet?.address && owner && user.wallet.address.toLowerCase() === (owner as string).toLowerCase();

  return (
    <header className="header glass">
      <div className="header-content">
        <div className="logo-group">
          <div className="logo-icon"></div>
          <span className="logo-text">PhantomBet</span>
        </div>

        <nav className="nav-links">
          <a href="#markets" className="nav-link active">Markets</a>
          <a href="#" className="nav-link">Activity</a>
          <a href="#" className="nav-link">Governance</a>
        </nav>

        <div className="actions">
          {/* Session controls removed */}

          {isOwner && (
            <button
              className="btn-create"
              onClick={() => setIsModalOpen(true)}
            >
              Create Market
            </button>
          )}

          {authenticated ? (
            <div className="user-info">
              <div className="aa-badge glass-pill">
                <span className="dot"></span>
                {smartAccountAddress ? `${smartAccountAddress.slice(0, 6)}...${smartAccountAddress.slice(-4)}` : 'Connecting...'}
              </div>
              <button className="btn-logout" onClick={logout}>Disconnect</button>
            </div>
          ) : (
            <button className="btn-login" onClick={login}>Connect Wallet</button>
          )}
        </div>
      </div>

      <CreateMarketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onActionComplete={refetch}
      />

      <style>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          z-index: 1000;
          border-bottom: 1px solid var(--card-border);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }

        .logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: var(--gradient-neon);
          border-radius: 8px;
          position: relative;
        }

        .logo-icon::after {
          content: '';
          position: absolute;
          inset: 0;
          background: inherit;
          filter: blur(8px);
          opacity: 0.5;
        }

        .logo-text {
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .nav-links {
          display: flex;
          gap: 32px;
        }

        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          transition: color 0.2s;
        }

        .nav-link:hover, .nav-link.active {
          color: var(--text-primary);
        }

        .nav-link.active {
          position: relative;
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent-cyan);
          box-shadow: 0 0 10px var(--accent-cyan);
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-create {
          background: rgba(0, 245, 255, 0.1);
          border: 1px solid var(--accent-cyan);
          color: var(--accent-cyan);
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-create:hover {
          background: var(--accent-cyan);
          color: black;
          box-shadow: 0 0 15px rgba(0, 245, 255, 0.4);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .aa-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--accent-cyan);
          border-color: rgba(0, 245, 255, 0.2);
        }

        .dot {
          width: 8px;
          height: 8px;
          background: var(--accent-cyan);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--accent-cyan);
        }

        .btn-login {
          background: var(--gradient-neon);
          color: black;
          border: none;
          padding: 10px 20px;
          border-radius: var(--radius-md);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-logout {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--card-border);
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-logout:hover {
          color: white;
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
        }

        .session-controls {
          margin-right: 8px;
        }

        .btn-session {
          background: rgba(168, 85, 247, 0.1);
          border: 1px solid #a855f7;
          color: #a855f7;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.85rem;
        }

        .btn-session:hover {
          background: #a855f7;
          color: white;
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
        }

        .session-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #a855f7;
          border-color: rgba(168, 85, 247, 0.2);
          background: rgba(168, 85, 247, 0.05);
        }

        .dot.pulse {
          background: #a855f7;
          box-shadow: 0 0 8px #a855f7;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }

        .mini-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(168, 85, 247, 0.2);
          border-top-color: #a855f7;
          border-radius: 50%;
          display: inline-block;
          margin-right: 8px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .flex-center {
          display: flex;
          align-items: center;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          
          .logo-text {
            display: none;
          }

          .header-content {
            padding: 0 16px;
          }

          .aa-badge, .session-controls {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;


