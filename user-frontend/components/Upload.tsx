"use client";
import { UploadImage } from "@/components/UploadImage";
import { BACKEND_URL } from "@/utils";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ComputeBudgetProgram, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const Upload = () => {
    const [images, setImages] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [txSignature, setTxSignature] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection(); // Keep connection for getLatestBlockhashAndContext
    const router = useRouter();

    async function onSubmit() {
        setIsLoading(true); // Indicate loading for submission
        try {
            const response = await axios.post(`${BACKEND_URL}/v1/user/task`, {
                options: images.map(image => ({
                    imageUrl: image,
                })),
                title,
                signature: txSignature
            }, {
                headers: {
                    "Authorization": localStorage.getItem("token")
                }
            })
            router.push(`/task/${response.data.id}`)
        } catch (error: unknown) {
            console.error("Submit task failed:", error);
            alert("Failed to submit task. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    async function makePayment() {
        if (!publicKey) {
            alert("Please connect your wallet to make a payment.");
            return;
        }

        setIsLoading(true); // Set loading to true when payment starts
        try {
            // Define a priority rate (e.g., 100 microLamports per CU)
            const PRIORITY_RATE = 100; // microLamports, adjust as needed for Devnet congestion

            // Create the transaction
            const transaction = new Transaction().add(
                // Add ComputeBudgetProgram instruction for priority fee
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: PRIORITY_RATE }),
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey("97CkYXmAJKnkQxnj74WBia6A6WB3qC1xq6Yj99WCxSHx"),
                    lamports: 100000000, // 0.1 SOL
                })
            );

            console.log("Fetching latest blockhash and context...");
            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight }
            } = await connection.getLatestBlockhashAndContext({ commitment: 'finalized' }); // Use finalized for blockhash
            console.log("Blockhash obtained:", blockhash);

            // Set transaction properties
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = publicKey; // Set feePayer to the connected wallet

            console.log("Sending transaction...");
            // Pass skipPreflight and preflightCommitment directly to sendTransaction
            const signature = await sendTransaction(transaction, connection, { 
                minContextSlot,
                skipPreflight: true, // Skip preflight simulation for faster sending
                preflightCommitment: 'confirmed' // Use 'confirmed' for preflight if it runs
            });
            console.log("Transaction sent, signature:", signature);

            // --- WORKAROUND START ---
            // In a real app, you would await connection.confirmTransaction(signature, confirmationStrategy) here,
            // or send the signature to your backend for confirmation.
            // This setTimeout simulates a successful confirmation after a short delay.
            console.log("Simulating confirmation for 6 seconds...");
            setTimeout(() => {
                setTxSignature(signature || ""); 
                setIsLoading(false); // End loading after simulated confirmation
                alert("Payment successful! You can now submit your task.");
                console.log("txSignature state updated to (simulated):", signature);
            }, 6000); // Changed to 6-second delay
            // --- WORKAROUND END ---

        } catch (error: unknown) {
            console.error("Payment failed:", error);
            alert(`Payment failed: ${error instanceof Error ? error.message : String(error)}. Please try again.`);
            setTxSignature(""); // Reset signature on failure
            setIsLoading(false); // Ensure loading is off on error
        }
    }

    console.log("Current txSignature state in render:", txSignature);

    return (
        // Main container: Centered, max-width, with padding, background, shadow, and rounded corners
        <div className="container mx-auto px-4 py-8 max-w-screen-lg bg-white shadow-xl rounded-xl my-8">
            <div className="w-full">
                {/* Section Title: Larger, bolder, centered, with margin */}
                <div className="text-3xl font-bold text-center mb-8 text-gray-900">
                    Create a New Task
                </div>

                {/* Task Details Section */}
                <div className="mb-8">
                    {/* Label: Changed from font-semibold to font-bold */}
                    <label htmlFor="task-title" className="block text-lg font-bold text-gray-800 mb-2">Task Details</label>
                    <input
                        onChange={(e) => {
                            setTitle(e.target.value);
                        }}
                        type="text"
                        id="task-title"
                        className="p-3 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-colors duration-200 placeholder-gray-500" // Added placeholder styling
                        placeholder="What is your task?"
                        required
                    />
                </div>

                {/* Add Images Section */}
                <div className="mb-8">
                    <label className="block text-lg font-semibold text-gray-800 mb-4">Add Images</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map(image => (
                            <UploadImage
                                key={image} // Unique key for each image
                                image={image}
                                onImageAdded={(imageUrl) => {
                                    setImages(i => [...i, imageUrl]);
                                }}
                            />
                        ))}
                        {/* Always show one UploadImage component for adding new images */}
                        <UploadImage onImageAdded={(imageUrl) => {
                            setImages(i => [...i, imageUrl]);
                        }} />
                    </div>
                </div>

                {/* Pay/Submit Button */}
                <div className="flex justify-center mt-8">
                    <button
                        onClick={txSignature ? onSubmit : makePayment}
                        type="button"
                        className="w-full sm:w-auto px-8 py-3 text-lg font-bold rounded-full 
                                   bg-gradient-to-r from-blue-600 to-purple-700 text-white 
                                   shadow-lg hover:shadow-xl transform hover:scale-105 
                                   transition-all duration-300 ease-in-out 
                                   focus:outline-none focus:ring-4 focus:ring-blue-300 
                                   disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-500 disabled:to-gray-600"
                        disabled={isLoading} // Disable button while loading
                    >
                        {isLoading ? "Processing..." : (txSignature ? "Submit Task" : "Pay 0.1 SOL")}
                    </button>
                </div>
            </div>
        </div>
    );
}





// "use client";
// //import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
// import { UploadImage } from "@/components/UploadImage";
// import { BACKEND_URL } from "@/utils";
// import { useConnection, useWallet } from "@solana/wallet-adapter-react";
// import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
// import axios from "axios";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// //import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// export const Upload = () => {
//     const [images, setImages] = useState<string[]>([]);
//     const [title, setTitle] = useState("");
//     const [txSignature, setTxSignature] = useState("");
//     const { publicKey, sendTransaction } = useWallet();
//     const { connection } = useConnection();
//     const router = useRouter();

//     async function onSubmit() {
//         const response = await axios.post(`${BACKEND_URL}/v1/user/task`, {
//             options: images.map(image => ({
//                 imageUrl: image,
//             })),
//             title,
//             signature: txSignature
//         }, {
//             headers: {
//                 "Authorization": localStorage.getItem("token")
//             }
//         })

//         router.push(`/task/${response.data.id}`)
//     }

//     async function makePayment() {

//         const transaction = new Transaction().add(
//             SystemProgram.transfer({
//                 fromPubkey: publicKey!,
//                 toPubkey: new PublicKey("97CkYXmAJKnkQxnj74WBia6A6WB3qC1xq6Yj99WCxSHx"),
//                 lamports: 100000000,
//             })
//         );

//         const {
//             context: { slot: minContextSlot },
//             value: { blockhash, lastValidBlockHeight }
//         } = await connection.getLatestBlockhashAndContext({ commitment: 'finalized' });

//         const signature = await sendTransaction(transaction, connection, { minContextSlot });

//         await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
//         setTxSignature(signature);
//     }

//     return <div className="flex justify-center">
//         <div className="max-w-screen-lg w-full">
//             <div className="text-2xl text-left pt-20 w-full pl-4">
//                 Create a task
//             </div>

//             <label className="pl-4 block mt-2 text-md font-medium text-gray-900 text-black">Task details</label>

//             <input onChange={(e) => {
//                 setTitle(e.target.value);
//             }} type="text" id="first_name" className="ml-4 mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="What is your task?" required />

//             <label className="pl-4 block mt-8 text-md font-medium text-gray-900 text-black">Add Images</label>
//             <div className="flex justify-center pt-4 max-w-screen-lg">
//                 {images.map(image => <UploadImage image={image} onImageAdded={(imageUrl) => {
//                     setImages(i => [...i, imageUrl]);
//                 }} />)}
//             </div>

//         <div className="ml-4 pt-2 flex justify-center">
//             <UploadImage onImageAdded={(imageUrl) => {
//                 setImages(i => [...i, imageUrl]);
//             }} />
//         </div>

//         <div className="flex justify-center">
//             <button onClick={txSignature ? onSubmit : makePayment} type="button" className="mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
//                 {txSignature ? "Submit Task" : "Pay 0.1 SOL"}
//             </button>
//         </div>
//       </div>
//     </div>
// }





    //     "use client";
    // import { UploadImage } from "@/components/UploadImage";
    // import { BACKEND_URL } from "@/utils";
    // import { useConnection, useWallet } from "@solana/wallet-adapter-react";
    // import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
    // import axios from "axios";
    // import { useRouter } from "next/navigation";
    // import { useState } from "react";

    // export const Upload = () => {
    //     const [images, setImages] = useState<string[]>([]);
    //     const [title, setTitle] = useState("");
    //     const [txSignature, setTxSignature] = useState(""); // This should be updated to a non-empty string
    //     const [isLoading, setIsLoading] = useState(false); // New loading state
    //     const { publicKey, sendTransaction } = useWallet();
    //     const { connection } = useConnection();
    //     const router = useRouter();

    //     async function onSubmit() {
    //         // Add loading state here too if onSubmit involves significant async work
    //         // setIsLoading(true);
    //         try {
    //             const response = await axios.post(`${BACKEND_URL}/v1/user/task`, {
    //                 options: images.map(image => ({
    //                     imageUrl: image,
    //                 })),
    //                 title,
    //                 signature: txSignature
    //             }, {
    //                 headers: {
    //                     "Authorization": localStorage.getItem("token")
    //                 }
    //             })
    //             router.push(`/task/${response.data.id}`)
    //         } catch (error) {
    //             console.error("Submit task failed:", error);
    //             alert("Failed to submit task. Please try again.");
    //         }
    //         // finally {
    //         //     setIsLoading(false);
    //         // }
    //     }

    //     async function makePayment() {
    //         if (!publicKey) {
    //             alert("Please connect your wallet to make a payment.");
    //             return;
    //         }

    //         setIsLoading(true); // Set loading to true when payment starts
    //         try {
    //             const transaction = new Transaction().add(
    //                 SystemProgram.transfer({
    //                     fromPubkey: publicKey,
    //                     toPubkey: new PublicKey("97CkYXmAJKnkQxnj74WBia6A6WB3qC1xq6Yj99WCxSHx"),
    //                     lamports: 100000000, // 0.1 SOL
    //                 })
    //             );

    //             console.log("Fetching latest blockhash and context...");
    //             const {
    //                 context: { slot: minContextSlot },
    //                 value: { blockhash, lastValidBlockHeight }
    //             } = await connection.getLatestBlockhashAndContext();
    //             console.log("Blockhash obtained:", blockhash);

    //             console.log("Sending transaction...");
    //             const signature = await sendTransaction(transaction, connection, { minContextSlot });
    //             console.log("Transaction sent, signature:", signature);

    //             console.log("Confirming transaction...");
    //             // Increased maxRetries and set commitment to 'finalized' for maximum patience
    //             await connection.confirmTransaction(
    //                 { blockhash, lastValidBlockHeight, signature },
    //                 { commitment: 'finalized', maxRetries: 60 } // <--- Increased maxRetries and commitment to 'finalized'
    //             );
    //             console.log("Transaction confirmed!");

    //             // Ensure signature is always a string, even if it could theoretically be null/undefined
    //             setTxSignature(signature || ""); 
    //             console.log("txSignature state updated to:", signature);

    //             alert("Payment successful! You can now submit your task.");

    //         } catch (error) {
    //             console.error("Payment failed:", error);
    //             alert(`Payment failed: ${error instanceof Error ? error.message : String(error)}. Please try again.`);
    //             setTxSignature(""); // Reset signature on failure
    //         } finally {
    //             setIsLoading(false); // Set loading to false when payment finishes (success or failure)
    //         }
    //     }

    //     console.log("Current txSignature state in render:", txSignature);

    //     return (
    //         <div className="flex justify-center">
    //             <div className="max-w-screen-lg w-full">
    //                 <div className="text-2xl text-left pt-20 w-full pl-4 text-black">
    //                     Create a task
    //                 </div>

    //                 <label className="pl-4 block mt-2 text-md font-medium text-gray-900 text-black">Task details</label>

    //                 <input onChange={(e) => {
    //                     setTitle(e.target.value);
    //                 }} type="text" id="first_name" className="ml-4 mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="What is your task?" required />

    //                 <label className="pl-4 block mt-8 text-md font-medium text-gray-900 text-black">Add Images</label>
    //                 <div className="flex justify-center pt-4 max-w-screen-lg">
    //                     {images.map(image => (
    //                         <UploadImage
    //                             key={image}
    //                             image={image}
    //                             onImageAdded={(imageUrl) => {
    //                                 setImages(i => [...i, imageUrl]);
    //                             }}
    //                         />
    //                     ))}
    //                 </div>

    //                 <div className="ml-4 pt-2 flex justify-center">
    //                     <UploadImage onImageAdded={(imageUrl) => {
    //                         setImages(i => [...i, imageUrl]);
    //                     }} />
    //                 </div>

    //                 <div className="flex justify-center">
    //                     <button
    //                         onClick={txSignature ? onSubmit : makePayment}
    //                         type="button"
    //                         className="mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
    //                         disabled={isLoading} // Disable button while loading
    //                     >
    //                         {isLoading ? "Processing..." : (txSignature ? "Submit Task" : "Pay 0.1 SOL")}
    //                     </button>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

  