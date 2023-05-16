import { Header } from './Header';

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-white">
            <Header />
            <div className="relative isolate px-6 pt-14 lg:px-8">{children}</div>
        </div>
    );
}
