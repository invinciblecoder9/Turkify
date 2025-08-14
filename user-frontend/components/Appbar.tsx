// "use client";
// import {
//     WalletDisconnectButton,
//     WalletMultiButton
// } from '@solana/wallet-adapter-react-ui';
// import { useWallet } from '@solana/wallet-adapter-react';
// import { useEffect } from 'react';
// import axios from 'axios';
// import { BACKEND_URL } from '@/utils';

// export const Appbar = () => {
//     const { publicKey , signMessage} = useWallet();

//     async function signAndSend() {
//         if (!publicKey) {
//             return;
//         }
//         const message = new TextEncoder().encode("Sign into mechanical turks");
//         const signature = await signMessage?.(message);
//         console.log(signature)
//         console.log(publicKey)
//         const response = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
//             signature,
//             publicKey: publicKey?.toString()
//         });

//         localStorage.setItem("token", response.data.token);
//     }

//     useEffect(() => {
//         signAndSend()
//     }, [publicKey]);

//     return <div className="flex justify-between border-b pb-2 pt-2 bg-white text-black">
//         <div className="text-2xl pl-4 flex justify-center pt-3">
//             Turkify
//         </div>
//         <div className="text-xl pr-4 pb-2">
//             {publicKey  ? <WalletDisconnectButton /> : <WalletMultiButton />}
//         </div>
//     </div>
// }


"use client";
import {
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react'; // Keep useState if you plan to re-introduce balance
import axios from 'axios';
import { BACKEND_URL } from '@/utils';

export const Appbar = () => {
    const { publicKey, signMessage } = useWallet();
    // const [balance, setBalance] = useState(0); // Uncomment if you re-introduce balance display

   async function signAndSend() {
    if (!publicKey) return;
    try {
        const message = new TextEncoder().encode("Sign into mechanical turks");
        const signature = await signMessage?.(message);
        const response = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
            signature,
            publicKey: publicKey?.toString()
        });
        localStorage.setItem("token", response.data.token);
    } catch (err) {
        console.error("Sign-in failed:", err);
        // Optionally set an error state or notify the user
    }
}
    useEffect(() => {
        // Only attempt to sign and send if publicKey is available (wallet connected)
        // and if you want auto-signin on connect.
        // If you prefer a manual "Sign In" button, remove this useEffect.
        if (publicKey) {
            signAndSend();
        }
    }, [publicKey]);

    const handleWorkerLogin = () => {
        window.location.href = process.env.NEXT_PUBLIC_WORKER_FRONTEND_URL || "http://localhost:3002/"; // Redirect to worker frontend
    };

    return (
        // Main container: elevated, rounded, with a subtle gradient background and transition
        <div className="flex justify-between items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg rounded-b-xl 
                    transition-all duration-700 ease-in-out hover:from-purple-700 hover:to-blue-600"> {/* Added transition and hover effect */}
            {/* Logo/Title: larger, bolder, with a slight hover effect */}
            <div className="text-3xl font-extrabold tracking-tight cursor-pointer hover:text-blue-200 transition-colors duration-300">
                Turkify
            </div>

            {/* Wallet Buttons Container: flex for alignment, space between items */}
            <div className="flex items-center space-x-4">
                {/* Optional: Add a balance display here if needed
                {publicKey && (
                    <span className="text-lg font-medium">Balance: {balance.toFixed(4)} SOL</span>
                )}
                */}

                {/* New "Login as Worker" button */}
                <button 
                    onClick={handleWorkerLogin}
                    className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200"
                >
                    Login as Worker
                </button>

                {/* Wallet buttons: The WalletMultiButton handles its own styling and responsiveness */}
                {/* It intelligently switches between "Connect Wallet", "Select Wallet", and "Disconnect" */}
                {publicKey ? (
                    <WalletDisconnectButton className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200" />
                ) : (
                    <WalletMultiButton className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200" />
                )}
            </div>
        </div>
    );
};
