import { Background, Spinner } from './components';
import { config } from './config';
import { Layout } from './layout';
import { initializeApp, getApps } from 'firebase/app';
import { GiFlame } from 'react-icons/gi';
import { CgCheck } from 'react-icons/cg';
import { useFirebase } from './firebase';
import { useEffect, useState } from 'react';

if (!getApps().length) {
    initializeApp(config.firebaseConfig);
}

const week = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const lastClaimDateToDayOfWeek = (lastClaimDate: number | null) => {
    if (!lastClaimDate) return null;
    const date = new Date(lastClaimDate);
    return date.getDay() - 1;
};

function App() {
    const { id, isConnected } = useFirebase();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [data, setData] = useState<{ coins: number; lastClaimDate: number; streak: number }>({
        coins: 0,
        lastClaimDate: 1684266628188,
        streak: 0,
    });

    useEffect(() => {
        if (!isConnected) return;
        (async () => {
            const token = localStorage.getItem('streaks-token');
            if (!token) throw new Error('No token found');
            const response = await fetch(`http://localhost:3001/streakData/${id}`, {
                method: 'GET',
                headers: {
                    Authorization: token as string,
                },
            });

            console.log(response);
        })();
    }, [id, isConnected]);

    // No time to use a state manager
    const handleCheckIn = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('streaks-token');
            if (!token) throw new Error('No token found');
            const response = await fetch(`http://localhost:3001/claim/${id}`, {
                method: 'POST',
                headers: {
                    Authorization: token as string,
                },
            });
            const data = await response.json();
            console.log(data);
            if (data.status === 'success') {
                setData(data.data);
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            console.log(error.message); // toast
        }
        setIsLoading(false);
    };

    return (
        <Layout>
            <Background />
            <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
                <div className="flex flex-col items-center space-y-8">
                    <div className="bg-col flex h-40 w-40 items-center justify-center rounded-full">
                        <p className="text-center text-4xl font-semibold text-indigo-600">
                            {data.streak}
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        {week.map((day, index) => {
                            const lastClaimedDay = lastClaimDateToDayOfWeek(data.lastClaimDate);
                            const isHit =
                                lastClaimedDay !== null
                                    ? lastClaimedDay - data.streak <= index &&
                                      index <= lastClaimedDay
                                    : false;

                            return (
                                <div
                                    key={`${day}-${index}`}
                                    className="flex flex-col items-center justify-between space-y-2"
                                >
                                    <p
                                        className={`text-sm ${
                                            isHit ? 'text-orange-400' : 'text-gray-400'
                                        } font-semibold leading-6`}
                                    >
                                        {day}
                                    </p>
                                    {isHit ? (
                                        <div className="relative h-6 w-6 rounded-full bg-orange-500">
                                            <div className="absolute top-[-50%]">
                                                <GiFlame
                                                    size="1.5rem"
                                                    color="rgb(249 115 22 / var(--tw-bg-opacity))"
                                                />
                                            </div>
                                            <div className="absolute">
                                                <CgCheck size="1.5rem" color="white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-6 w-6 rounded-full bg-gray-300" />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        className="flex w-[150px] items-center justify-center rounded-md bg-black px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        onClick={handleCheckIn}
                    >
                        {isLoading ? <Spinner /> : 'Check-in'}
                    </button>
                </div>
            </div>
        </Layout>
    );
}

export default App;
