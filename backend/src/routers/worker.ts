import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { authMiddleware, workerMiddleware } from "../middleware";
import { TOTAL_DECIMALS } from "../config";
import { getNextTask } from "../db";
import { ComputeBudgetProgram, Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import bs58 from 'bs58';
//import { privateKey } from "../privateKey";
import nacl from "tweetnacl";
import { createSubmissionInput } from "../types/types";

const connection = new Connection('https://solana-devnet.g.alchemy.com/v2/vY6QqmImyweRBYMpQ2PU0');
const WORKER_JWT_SECRET=process.env.WORKER_JWT_SECRET as string;
const TOTAL_SUBMISSIONS = 100;
const router = Router();
const prismaClient = new PrismaClient();


prismaClient.$transaction(
    async (prisma) => {
      // Code running in a transaction...
    },
    {
      maxWait: 5000, // default: 2000
      timeout: 10000, // default: 5000
    }
)


const PAYOUT_WALLET_PRIVATE_KEY = process.env.PAYOUT_WALLET_PRIVATE_KEY; 
const LAMPORTS_PER_SOL = 1_000_000_000; // 1 SOL = 10^9 lamports
const PRIORITY_RATE = 100;

let payoutKeypair: Keypair;
try {
    if (!PAYOUT_WALLET_PRIVATE_KEY) {
        throw new Error("PAYOUT_WALLET_PRIVATE_KEY environment variable is not set.");
    }
    payoutKeypair = Keypair.fromSecretKey(bs58.decode(PAYOUT_WALLET_PRIVATE_KEY));
    console.log("Payout wallet public key loaded:", payoutKeypair.publicKey.toBase58());
} catch (e) {
    console.error("CRITICAL ERROR: Failed to load payout wallet keypair. Check PAYOUT_WALLET_PRIVATE_KEY env var.", e);
    // Exit the process if the payout wallet cannot be loaded, as it's a critical dependency
    process.exit(1); 
}

// router.post("/payout", workerMiddleware, async(req, res) => {
//     // @ts-ignore
//     const userId: string = req.userId;
//     const worker = await prismaClient.worker.findFirst({
//         where: {id: Number(userId)}
//     })

//     if(!worker) {
//         return res.status(403).json({
//             message: "User not Found"
//         })
//     }
//     //const address = worker.address;
//     // logic here to create txns

//      const transaction = new Transaction().add(
//             SystemProgram.transfer({
//                 fromPubkey: new PublicKey("97CkYXmAJKnkQxnj74WBia6A6WB3qC1xq6Yj99WCxSHx"),  // give private key of this
//                 toPubkey: new PublicKey(worker.address),
//                 lamports: 1000_000_000 * worker.pending_amount / TOTAL_DECIMALS ,
//             })
//         );
// // @ts-ignore
//        const keypair = Keypair.fromSecretKey(bs58.decode(PAYOUT_WALLET_PRIVATE_KEY));

//        // There is double spending problem 
//        let signature = ""
//        try{
//        signature = await sendAndConfirmTransaction(
//          connection,
//          transaction,
//          [keypair],
//        )
//     }catch(e) {
//         return res.json({
//             message: "Transaction failed"
//         })
//     }

//     // should add a lock here
//     await prismaClient.$transaction(async tx => {
//         await tx.worker.update({
//             where:{
//                 id: Number(userId)
//             },
//             data: {
//                 pending_amount: {
//                     decrement: worker.pending_amount
//                 },
//                 locked_amount: {
//                     increment: worker.pending_amount
//                 }
//             }
//         })

//         await tx.payouts.create({
//             data: {
//                 user_id: Number(userId),
//                 amount: worker.pending_amount,
//                 status: "Processing",
//                 signature: signature
//             }
//         })
//     })

//     // send txn to the solana blockchain
//     res.json({
//         message: "Processing payout",
//         amount: worker.pending_amount
//     })
// })


// Assuming all necessary imports are at the top of your worker.ts file, like:
// import { PrismaClient } from "@prisma/client";
// import { Router, Request, Response, NextFunction } from "express";
// import { Connection, PublicKey, SystemProgram, Transaction, Keypair, sendAndConfirmTransaction, ComputeBudgetProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
// import * as bs58 from "bs58";
// import { workerMiddleware } from "../middleware"; // Assuming workerMiddleware is correct
// import { TOTAL_DECIMALS } from "../config"; // Assuming TOTAL_DECIMALS is defined (1_000_000_000)

// --- GLOBAL/SINGLETON INITIALIZATIONS (ensure these are done once in your app) ---
// const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com", { commitment: 'confirmed' });
// const prismaClient = new PrismaClient();

// --- SECURITY: LOAD PAYOUT WALLET PRIVATE KEY FROM ENV (CRITICAL) ---
// This block MUST be at the top level of your worker.ts file, outside any route handlers.
// const PAYOUT_WALLET_PRIVATE_KEY = process.env.PAYOUT_WALLET_PRIVATE_KEY;
// let payoutKeypair: Keypair;
// try {
//     if (!PAYOUT_WALLET_PRIVATE_KEY) {
//         throw new Error("PAYOUT_WALLET_PRIVATE_KEY environment variable is not set.");
//     }
//     payoutKeypair = Keypair.fromSecretKey(bs58.decode(PAYOUT_WALLET_PRIVATE_KEY));
//     console.log("Payout wallet public key loaded:", payoutKeypair.publicKey.toBase58());
// } catch (e) {
//     console.error("CRITICAL ERROR: Failed to load payout wallet keypair. Check PAYOUT_WALLET_PRIVATE_KEY env var.", e);
//     process.exit(1);
// }

// --- CONSTANTS (ensure these are defined or imported from config) ---
// const PARENT_WALLET_ADDRESS = "97CkYXmAJKnkQxnj74WBia6A6WB3qC1xq6Yj99WCxSHx";
// const PRIORITY_RATE = 100; // MicroLamports per Compute Unit

// --- EXTEND EXPRESS REQUEST INTERFACE (for TypeScript) ---
// declare global { namespace Express { interface Request { userId?: string; } } }

// --- EXPRESS ROUTER ---
// const router = Router();

router.post("/payout", workerMiddleware, async(req, res) => {
    //@ts-ignore
    const workerId = req.userId as string; // Correctly typed now, assuming workerMiddleware sets userId

    if (!workerId) {
        return res.status(401).json({ message: "Unauthorized: Worker ID not found." });
    }

    let worker;
    try {
        // CRITICAL FIX: Remove Number() conversion assuming worker.id is a STRING UUID
        worker = await prismaClient.worker.findFirst({
            where: { id: Number(workerId) } // Use workerId directly as string
        });
    } catch (dbError) {
        console.error("Database error fetching worker:", dbError);
        return res.status(500).json({ message: "Internal server error fetching worker data." });
    }

    if (!worker) {
        return res.status(404).json({ // 404 Not Found is more appropriate
            message: "Worker not found."
        });
    }

    // Ensure worker has a pending amount to payout
    if (worker.pending_amount <= 0) {
        return res.status(400).json({ message: "No pending amount to payout." });
    }

    // --- CRITICAL FIX: Database Lock for Double Spending Prevention ---
    // This transaction attempts to move the pending_amount to locked_amount.
    // If a concurrent request already processed this, this transaction will fail,
    // preventing double-spending.
    let amountToPayout = worker.pending_amount; // Store the amount to be paid out
    try {
        await prismaClient.$transaction(async tx => {
            // Re-fetch the worker within the transaction to ensure we're working with the latest state
            // CRITICAL FIX: Remove Number() conversion here as well
            const currentWorker = await tx.worker.findUnique({
                where: { id: Number(workerId) }, // Use workerId directly as string
                select: { pending_amount: true, locked_amount: true }
            });

            if (!currentWorker || currentWorker.pending_amount < amountToPayout) {
                // This means another concurrent request already processed part/all of the amount,
                // or the worker was not found. Abort this transaction.
                throw new Error("Concurrent payout detected or insufficient pending amount.");
            }

            // Update the worker's balance: decrement pending and increment locked
            // CRITICAL FIX: Remove Number() conversion here as well
            await tx.worker.update({
                where: { id: Number(workerId) }, // Use workerId directly as string
                data: {
                    pending_amount: { decrement: amountToPayout },
                    locked_amount: { increment: amountToPayout }
                }
            });
            // The amount is now "locked" in the database.
        });
    } catch (dbError) {
        console.error("Database transaction for locking amount failed:", dbError);
        // Return a 409 Conflict if a concurrent request likely processed it
        return res.status(409).json({ message: "Payout already in progress or no pending amount available." });
    }
    // --- END CRITICAL FIX: Database Lock ---

    let signature = "";
    try {
        // Create the Solana transaction
        const transaction = new Transaction().add(
            // Add ComputeBudgetProgram instruction for priority fee (assuming PRIORITY_RATE is defined)
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: PRIORITY_RATE }),
            SystemProgram.transfer({
                fromPubkey: payoutKeypair.publicKey, // Funds come from the backend's payout wallet
                toPubkey: new PublicKey(worker.address), // Funds go to the worker's address
                lamports: amountToPayout * LAMPORTS_PER_SOL // Use the locked amount, convert to lamports
            })
        );

        // Get recent blockhash and set fee payer
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = payoutKeypair.publicKey; 

        // Sign and send the transaction from the backend's keypair
        signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [payoutKeypair], // Sign with the backend's payout keypair
            {
                commitment: 'finalized', 
                skipPreflight: true, 
                maxRetries: 60 
            }
        );

        console.log(`Payout transaction sent: ${signature}`);

        // Update payout status in database AFTER successful on-chain transaction
        await prismaClient.payouts.create({
            data: {
                user_id: Number(workerId), // Assuming worker_id is STRING UUID
                amount: amountToPayout, // Use the amount that was locked
                status: "Success", // Set status to Completed on successful on-chain transfer
                signature: signature
            }
        });

        // Final database update: Decrement locked_amount after successful transfer
        // CRITICAL FIX: Remove Number() conversion here as well
        await prismaClient.worker.update({
            where: { id: Number(workerId) }, // Use workerId directly as string
            data: {
                locked_amount: { decrement: amountToPayout }
            }
        });

        res.json({
            message: "Payout successful!",
            amount: amountToPayout,
            signature: signature
        });

    } catch (e) {
        console.error("Payout transaction failed:", e);

        // --- Rollback locked amount if Solana transaction fails ---
        try {
            // CRITICAL FIX: Remove Number() conversion here as well
            await prismaClient.worker.update({
                where: { id: Number(workerId) }, // Use workerId directly as string
                data: {
                    pending_amount: { increment: amountToPayout },
                    locked_amount: { decrement: amountToPayout }
                }
            });
            console.log(`Rolled back locked amount for worker ${workerId}`);
        } catch (rollbackError) {
            console.error(`CRITICAL: Failed to rollback locked amount for worker ${workerId}:`, rollbackError);
        }

        res.status(500).json({ 
            message: `Payout transaction failed: ${e instanceof Error ? e.message : String(e)}`
        });
    }
});

router.get("/balance", workerMiddleware, async(req, res) => {
    // @ts-ignore
    const userId: string = req.userId;

    const worker = await prismaClient.worker.findFirst({
        where: {
            id: Number(userId)
        }
    })
    res.json({
        pendingAmount: worker?.pending_amount,
        lockedAmount: worker?.pending_amount,
    })
})

router.post("/submission", workerMiddleware, async(req, res) => {
    // @ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedBody = createSubmissionInput.safeParse(body);

    if(parsedBody.success){
        const task = await getNextTask(Number(userId));
        if(!task || task?.id !== Number(parsedBody.data.taskId)) {
            return res.status(411).json({
                message: "Incorrect task id"
            })
        }

        const amount = (Number(task.amount) / TOTAL_SUBMISSIONS).toString();

        const submission = await prismaClient.$transaction(async tx => {
            const submission = await tx.submission.create({
                data: {
                    option_id: Number(parsedBody.data.selection),
                    worker_id: userId,
                    task_id: Number(parsedBody.data.taskId),
                    amount: Number(amount)
                }
            })
            
            await tx.worker.update({
                where:{
                     id: userId,
                },
                data: {
                    pending_amount: {
                        increment: Number(amount)
                    }
                }
            })
            return submission;
        })

        
        const nextTask = await getNextTask(Number(userId));
        res.json({
            nextTask,
            amount
        })
    }else{
        res.status(411).json({
            message: "Incorrect Inputs"
        })
    }
})

router.get("/nextTask", workerMiddleware, async(req, res) => {
    // @ts-ignore
    const userId : string = req.userId;

    const task = await getNextTask(Number(userId));
    if(!task)
    {
        res.status(411).json({
            message: "No more tasks for you to review"
        })
    }else{
        res.json({
            task
        })
    }
})

router.post("/signin", async(req, res) => {
     const { publicKey, signature } = req.body;
    const message = new TextEncoder().encode("Sign into mechanical turks as a worker");

    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
    );

     if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        })
    }

    const existingUser = await prismaClient.worker.findFirst({
        where: {
            address: publicKey
        }
    })

    if(existingUser) {
        const token = jwt.sign({
            userId: existingUser.id
        }, WORKER_JWT_SECRET)
        res.json({
            token,
            amount: existingUser.pending_amount / TOTAL_DECIMALS
        })
    }else{
        const user = await prismaClient.worker.create({
            data: {
                address: publicKey,
                pending_amount: 0,
                locked_amount: 0
            }
        })

         const token = jwt.sign({
            userId: user.id
        }, WORKER_JWT_SECRET)

        res.json({
            token, 
            amount: 0
        })
    }
});

export default router;


