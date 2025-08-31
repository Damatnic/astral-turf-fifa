import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BanknoteIcon, RepeatIcon, UsersIcon, NewspaperIcon, ChartLineIcon, MicroscopeIcon, GraduationCap, Briefcase, Building, Globe, ShieldCheck, HeartPulseIcon, MessageSquareIcon, TargetIcon, TableIcon, TrophyIcon, GridIcon, AwardIcon, SparklesIcon } from '../icons';

const MenuItem: React.FC<{ to: string, children: React.ReactNode, onClick: () => void }> = ({ to, children, onClick }) => (
    <Link to={to} onClick={onClick} className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-[var(--bg-tertiary)]">
        {children}
    </Link>
);

export const FranchiseMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const closeMenu = () => setIsOpen(false);

    return (
        <div className="relative" ref={menuRef}>
            <button data-testid="header-franchise-button" onClick={() => setIsOpen(!isOpen)} className="px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md">
                Franchise
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-lg z-20">
                    <MenuItem to="/dashboard" onClick={closeMenu}><GridIcon className="w-4 h-4 mr-2" />Dashboard</MenuItem>
                    <MenuItem to="/inbox" onClick={closeMenu}><NewspaperIcon className="w-4 h-4 mr-2" />Inbox</MenuItem>
                    <MenuItem to="/press-conference" onClick={closeMenu}><MessageSquareIcon className="w-4 h-4 mr-2" />Media Handling</MenuItem>
                    <div className="border-t border-[var(--border-primary)] my-1" />
                    <MenuItem to="/league-table" onClick={closeMenu}><TableIcon className="w-4 h-4 mr-2" />League Table</MenuItem>
                    <MenuItem to="/board-objectives" onClick={closeMenu}><TargetIcon className="w-4 h-4 mr-2" />Board Objectives</MenuItem>
                    <MenuItem to="/job-security" onClick={closeMenu}><ShieldCheck className="w-4 h-4 mr-2" />Job Security</MenuItem>
                    <div className="border-t border-[var(--border-primary)] my-1" />
                    <MenuItem to="/finances" onClick={closeMenu}><BanknoteIcon className="w-4 h-4 mr-2" />Finances</MenuItem>
                    <MenuItem to="/transfers" onClick={closeMenu}><RepeatIcon className="w-4 h-4 mr-2" />Transfer & Loans</MenuItem>
                    <div className="border-t border-[var(--border-primary)] my-1" />
                    <MenuItem to="/staff" onClick={closeMenu}><Briefcase className="w-4 h-4 mr-2" />Staff</MenuItem>
                    <MenuItem to="/training" onClick={closeMenu}><UsersIcon className="w-4 h-4 mr-2" />Training</MenuItem>
                    <MenuItem to="/mentoring" onClick={closeMenu}><UsersIcon className="w-4 h-4 mr-2" />Mentoring</MenuItem>
                    <MenuItem to="/youth-academy" onClick={closeMenu}><GraduationCap className="w-4 h-4 mr-2" />Youth Academy</MenuItem>
                    <MenuItem to="/skill-challenges" onClick={closeMenu}><AwardIcon className="w-4 h-4 mr-2" />Skill Challenges</MenuItem>
                    <MenuItem to="/player-ranking" onClick={closeMenu}><SparklesIcon className="w-4 h-4 mr-2" />My Player Ranking</MenuItem>
                    <MenuItem to="/challenge-hub" onClick={closeMenu}><AwardIcon className="w-4 h-4 mr-2" />Challenge Hub</MenuItem>
                    <MenuItem to="/challenge-manager" onClick={closeMenu}><Briefcase className="w-4 h-4 mr-2" />Challenge Manager</MenuItem>
                    <MenuItem to="/medical-center" onClick={closeMenu}><HeartPulseIcon className="w-4 h-4 mr-2" />Medical Center</MenuItem>
                    <div className="border-t border-[var(--border-primary)] my-1" />
                    <MenuItem to="/club-history" onClick={closeMenu}><TrophyIcon className="w-4 h-4 mr-2" />Club History</MenuItem>
                    <MenuItem to="/analytics" onClick={closeMenu}><ChartLineIcon className="w-4 h-4 mr-2" />Analytics</MenuItem>
                </div>
            )}
        </div>
    );
};
