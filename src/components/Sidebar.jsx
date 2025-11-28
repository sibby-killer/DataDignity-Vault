/**
 * Sidebar Navigation Component
 */

import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderOpen,
    Share2,
    Shield,
    Activity,
    Settings,
    Lock,
    HelpCircle,
} from 'lucide-react';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/my-files', icon: FolderOpen, label: 'My Files' },
    { to: '/shared', icon: Share2, label: 'Shared With Me' },
    { to: '/breach-monitor', icon: Shield, label: 'Breach Monitor' },
    { to: '/activity', icon: Activity, label: 'Activity Log' },
    { to: '/help', icon: HelpCircle, label: 'Help' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-neutral-200 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Lock className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-semibold text-neutral-900">SecureVault</h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-primary text-white'
                                : 'text-neutral-700 hover:bg-neutral-100'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200">
                <p className="text-xs text-neutral-500 text-center">
                    Secured with end-to-end encryption
                </p>
            </div>
        </aside>
    );
}
