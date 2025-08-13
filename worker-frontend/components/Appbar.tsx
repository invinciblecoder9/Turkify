// "use client";
// import {
//     WalletDisconnectButton,
//     WalletMultiButton
// } from '@solana/wallet-adapter-react-ui';
// import { useWallet } from '@solana/wallet-adapter-react';
// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { BACKEND_URL } from '@/utils';

// export const Appbar = () => {
//     const { publicKey, signMessage} = useWallet();
//     const [balance, setBalance] = useState(0);

//     async function signAndSend() {
//         if (!publicKey) {
//             return;
//         }
//         const message = new TextEncoder().encode("Sign into mechanical turks as a worker");
//         const signature = await signMessage?.(message);
//         console.log(signature)
//         console.log(publicKey)
//         const response = await axios.post(`${BACKEND_URL}/v1/worker/signin`, {
//             signature,
//             publicKey: publicKey?.toString()
//         });

//         setBalance(response.data.amount)

//         localStorage.setItem("token", response.data.token);
//     }

//     useEffect(() => {
//         signAndSend()
//     }, [publicKey]);

//     return <div className="flex justify-between border-b pb-2 pt-2">
//         <div className="text-2xl pl-4 flex justify-center pt-2">
//             Turkify
//         </div>
//         <div className="text-xl pr-4 flex" >
//             <button onClick={() => {
//                 axios.post(`${BACKEND_URL}/v1/worker/payout`, {
//                 }, {
//                     headers: {
//                         "Authorization": localStorage.getItem("token")
//                     }
//                 })
//             }} className="m-2 mr-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">Pay me out ({balance}) SOL</button>
//             {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
//         </div>
//     </div>
// }

"use client";
import {
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '@/utils';

export const Appbar = () => {
    const { publicKey, signMessage } = useWallet();
    const [balance, setBalance] = useState(0);

    async function signAndSend() {
        if (!publicKey) {
            return;
        }
        const message = new TextEncoder().encode("Sign into mechanical turks as a worker");
        const signature = await signMessage?.(message);
        console.log(signature);
        console.log(publicKey);
        try {
            const response = await axios.post(`${BACKEND_URL}/v1/worker/signin`, {
                signature,
                publicKey: publicKey?.toString()
            });

            setBalance(response.data.amount);
            localStorage.setItem("token", response.data.token);
        } catch (error) {
            console.error("Worker sign-in failed:", error);
            // Optionally alert user or handle UI feedback for failed sign-in
        }
    }

    useEffect(() => {
        if (publicKey) {
            signAndSend();
        }
    }, [publicKey]);

    const handlePayout = async () => {
        try {
            // Add a loading state for the payout button if desired
            // setIsPayoutLoading(true);
            const response = await axios.post(`${BACKEND_URL}/v1/worker/payout`, {}, {
                headers: {
                    "Authorization": localStorage.getItem("token")
                }
            });
            alert(response.data.message); // Show success message
            // Optionally update balance after successful payout
            // setBalance(0); 
        } catch (error: any) {
            console.error("Payout failed:", error);
            alert(`Payout failed: ${error.response?.data?.message || error.message}`);
        } finally {
            // setIsPayoutLoading(false);
        }
    };

    return (
        // Main container: dark elevated, rounded, with a subtle gradient background and transition
        <div className="flex justify-between items-center px-6 py-3 bg-gradient-to-r from-gray-900 to-black text-white shadow-lg rounded-b-xl 
                    transition-all duration-700 ease-in-out hover:from-black hover:to-gray-900"> {/* Dark gradient and hover effect */}
            {/* Logo/Title: larger, bolder, with a slight hover effect */}
            <div className="text-3xl font-extrabold tracking-tight cursor-pointer hover:text-gray-400 transition-colors duration-300"> {/* Lighter hover text */}
                Turkify (Worker)
            </div>

            {/* Wallet & Payout Buttons Container: flex for alignment, space between items */}
            <div className="flex items-center space-x-4">
                {/* Pay me out button */}
                <button 
                    onClick={handlePayout}
                    className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-full shadow-md 
                               transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-600"
                >
                    Pay me out ({balance.toFixed(4)} SOL)
                </button>

                {/* Wallet buttons */}
                {publicKey ? (
                    <WalletDisconnectButton className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200" />
                ) : (
                    <WalletMultiButton className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200" /> 
                )}
            </div>
        </div>
    );
};

