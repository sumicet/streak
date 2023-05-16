import { useFirebase } from '../firebase';

export function Header() {
    const { isConnected, signIn, signOut } = useFirebase();
    const handleClick = () => {
        try {
            if (isConnected) {
                signOut?.();
            } else {
                signIn?.();
            }
        } catch (error: any) {
            console.log('Error', error); // Show a toast
        }
    };

    return (
        <header className="absolute inset-x-0 top-0 z-50">
            <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                <div className="flex lg:flex-1">
                    <a href="#" className="-m-1.5 p-1.5">
                        <span className="sr-only">Your Company</span>
                        <img className="h-8 w-auto" src="https://dappback.com/logo-v2.png" alt="" />
                    </a>
                </div>

                <div className="flex lg:justify-end">
                    <button
                        onClick={handleClick}
                        className="text-sm font-semibold leading-6 text-gray-900"
                    >
                        {isConnected ? (
                            <>
                                Log out <span aria-hidden="true">&rarr;</span>
                            </>
                        ) : (
                            <>
                                Log in <span aria-hidden="true">&rarr;</span>
                            </>
                        )}
                    </button>
                </div>
            </nav>
        </header>
    );
}
