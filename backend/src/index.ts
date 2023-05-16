import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { admin, database } from './firebase';
import formatDistanceStrict from 'date-fns/formatDistanceStrict';

interface RequestWithUser extends Request {
    user?: any; // or the actual type of your user object
}

// Order from highest to lowest
const streakToBonus = {
    30: 300,
    7: 50,
};
const initialCoins = 0;
const claimIntervalMs = 86400000; // 24h

const main = async () => {
    const PORT = process.env.PORT || 3001;

    // TODO
    // Middleware to authenticate users
    const authenticate = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        next();
        // const token = req.headers.authorization?.split(' ')[1];
        // console.log(req.headers);
        // if (!token) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        // try {
        //     const decodedToken = await admin.auth().verifyIdToken(token);
        //     req.user = decodedToken;
        //     next();
        // } catch (error) {
        //     console.error('Error verifying token:', error);
        //     res.status(401).json({ status: 'error', message: 'Unauthorized' });
        // }
    };

    process.on('uncaughtException', function (err) {
        console.error('uncaughtException handler -', err);
        process.exit(1);
    });

    const app = express();
    app.use(
        cors({
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
        })
    );
    app.use(express.json({ limit: '50mb' }));

    // Health check endpoint
    app.get('/', (_, res) => {
        res.send({ status: 'up' });
    });

    // Endpoint to claim streak reward
    app.post('/claim/:id', authenticate, async (req: RequestWithUser, res) => {
        const id = req.params.id;

        try {
            const userDoc = database.collection('users').doc(id);
            const userSnapshot = await userDoc.get();

            const now = Date.now();

            if (!userSnapshot.exists) {
                // Create new user if not exist
                const result = {
                    lastClaimDate: now,
                    streak: 1,
                    coins: initialCoins,
                };
                await userDoc.set(result);

                return res.status(201).json({ data: result, status: 'success' });
            }

            const userData = userSnapshot.data();

            if (!userData) throw new Error('User data is undefined');

            const lastClaimDate = userData.lastClaimDate;

            // Check if between 24h and 48h have passed since last claim
            if (
                now - lastClaimDate >= claimIntervalMs &&
                now - lastClaimDate < claimIntervalMs * 2
            ) {
                const streak = userData.streak + 1;
                let coins = userData.coins; // Daily reward is 10 coins
                let bonusClaimed = userData.bonusClaimed;

                Object.entries(streakToBonus).forEach(([key, value]) => {
                    if (!bonusClaimed && streak % parseInt(key) === 0) {
                        coins += value;
                        bonusClaimed = true;
                    }
                });

                const result = {
                    lastClaimDate: Date.now(),
                    streak: streak,
                    coins: coins,
                };

                // Update user data
                await userDoc.update(result);

                return res.status(200).json({ data: result, status: 'success' });
            } else if (now - lastClaimDate < claimIntervalMs && now - lastClaimDate > 0) {
                return res.status(409).json({
                    status: 'error',
                    message: `Already claimed. Please try again in ${formatDistanceStrict(
                        new Date(lastClaimDate + claimIntervalMs),
                        new Date(now)
                    )}.`,
                });
            } else {
                // Reset streak if the user missed a day
                const result = {
                    lastClaimDate: now,
                    streak: 1,
                    coins: userData.coins,
                };
                await userDoc.update(result);

                return res.status(200).json({ data: result, status: 'success' });
            }
        } catch (error) {
            console.error('Error claiming streak:', error);
            res.status(500).send({ status: 'error', message: 'Internal server error.' });
        }
    });

    // Endpoint to get user streak data
    app.get('/streakData/:id', authenticate, async (req: RequestWithUser, res: Response) => {
        const id = req.params.id;

        try {
            const userSnapshot = await database.collection('users').doc(id).get();
            if (userSnapshot.exists) {
                const userData = userSnapshot.data();
                if (!userData) throw new Error('User data is undefined');

                res.status(200).json({
                    lastClaimDate: userData.lastClaimDate,
                    streak: userData.streak,
                    coins: userData.coins,
                });
            } else {
                res.status(404).json({ status: 'error', message: 'User not found' });
            }
        } catch (error) {
            console.error('Error getting streak data:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error.' });
        }
    });

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

main();
